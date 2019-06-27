import * as dotenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';

import { getRepository } from 'typeorm';
import {
    AlbumEntity,
    ArtistEntity,
    ProfileEntity,
    ReviewEntity,
    RymGenreEntity,
} from '../../entities/entities';

import { Log } from '../classes/log';
import { connectToDatabase } from './database';

dotenv.config({ path: resolve(__dirname, '../../../.env') });

/**
 * When first scraping this data, unique keys were enforced only in the scraping logic, and not in
 * the database rules. Therefore, a few hundred duplicates for various records sneaked into the
 * table. This function removes those duplicates in a safe manner. However, since it was only
 * intended to fix a specific problem one time, it is somewhat sloppy and should not be trusted.
 */
export async function scrapeRateYourMusic(): Promise<void> {
    try {
        Log.notify('\nmuCritic Database de-duplicator\n\n');
        await connectToDatabase();

        const albumRepo = getRepository(AlbumEntity);
        const artistRepo = getRepository(ArtistEntity);
        const profileRepo = getRepository(ProfileEntity);
        const reviewRepo = getRepository(ReviewEntity);
        const rymGenreRepo = getRepository(RymGenreEntity);

        /**
         * RYM Genre Duplicate removal, by [[RymGenreEntity.name]]
         */
        const rymGenres = await rymGenreRepo
            .createQueryBuilder('genre')
            .select('genre.name', 'name')
            .addSelect('COUNT(*)', 'count')
            .groupBy('name')
            .having('COUNT(*) > 1')
            .getRawMany();

        const rymGenreNames: string[] = rymGenres.map(rymGenre => rymGenre.name);

        for await(const rymGenreName of rymGenreNames) {
            const dupeEntities = await rymGenreRepo.find({
                relations: [
                    'artists',
                    'albums',
                ],
                where: {
                    name: rymGenreName,
                },
            });
            for await(const entity of dupeEntities) {
                if(entity.artists.length === 0 && entity.albums.length === 0) {
                    await rymGenreRepo.remove(entity);
                }
            }
        }

        /**
         * RYM Album Duplicate removal, by [[AlbumEntity.urlRYM]]
         */
        const albums = await albumRepo
            .createQueryBuilder('album')
            .select('album.urlRYM', 'url')
            .addSelect('COUNT(*)', 'count')
            .groupBy('url')
            .having('COUNT(*) > 1')
            .getRawMany();

        const albumUrls = albums.map(album => album.url);

        for await(const albumUrl of albumUrls) {
            const dupeEntities = await albumRepo.find({
                relations: [
                    'reviews',
                ],
                where: {
                    urlRYM: albumUrl,
                },
            });
            for await(const entity of dupeEntities) {
                if(entity.reviews.length === 0) {
                    await albumRepo.remove(entity);
                }
            }
        }

        /**
         * RYM Artist Duplicate removal, by [[ArtistEntity.urlRYM]]
         */
        const artists = await artistRepo
            .createQueryBuilder('artist')
            .select('artist.urlRYM', 'url')
            .addSelect('COUNT(*)', 'count')
            .groupBy('url')
            .having('COUNT(*) > 1')
            .getRawMany();

        const artistUrls = artists.map(artist => artist.url);

        for await(const artistUrl of artistUrls) {
            const dupeArtists = await artistRepo.find({
                relations: [
                    'albums',
                    'profiles',
                ],
                where: {
                    urlRYM: artistUrl,
                },
            });

            const aggregateArtist = dupeArtists.shift();

            let allGenreNames: string[];
            let allGenreEntities: RymGenreEntity[];

            if(aggregateArtist.rymGenres) {
                aggregateArtist.rymGenres.forEach((genre: RymGenreEntity): void => {
                    if(allGenreNames.indexOf(genre.name) === -1) {
                        allGenreEntities.push(genre);
                        allGenreNames.push(genre.name);
                    }
                });
            }

            for await(const dupeArtist of dupeArtists) {
                for await (const album of dupeArtist.albums) {
                    album.artist = aggregateArtist;
                    await albumRepo.save(album);
                }
                for await (let profile of dupeArtist.profiles) {
                    const newFavoriteArtists: ArtistEntity[] = [aggregateArtist];
                    profile = await profileRepo.findOne({
                        relations: [
                            'favoriteArtists',
                        ],
                        where: {
                            id: profile.id,
                        },
                    });
                    profile.favoriteArtists.forEach((artist: ArtistEntity) => {
                        if(artist.id !== dupeArtist.id) {
                            newFavoriteArtists.push(artist);
                        }
                    });
                    profile.favoriteArtists = newFavoriteArtists;
                    await profileRepo.save(profile);
                }
                if(dupeArtist.rymGenres) {
                    dupeArtist.rymGenres.forEach((genre: RymGenreEntity): void => {
                        if(allGenreNames.indexOf(genre.name) === -1) {
                            allGenreEntities.push(genre);
                            allGenreNames.push(genre.name);
                        }
                    });
                }
                await artistRepo.remove(dupeArtist);
            }
            aggregateArtist.rymGenres = allGenreEntities;
            await artistRepo.save(aggregateArtist);
        }

        /**
         * RYM Review Duplicate removal, by [[ReviewEntity.identifierRYM]]
         */
        const reviews = await reviewRepo
            .createQueryBuilder('review')
            .select('review.identifierRYM', 'identifier')
            .addSelect('COUNT(*)', 'count')
            .groupBy('identifier')
            .having('COUNT(*) > 1')
            .getRawMany();

        for await(const dupeReviews of reviews) {
            const reviewEntities = await reviewRepo.find({ identifierRYM: dupeReviews.identifier });
            reviewEntities.shift();
            for await(const dupeEntity of reviewEntities) {
                await reviewRepo.remove(dupeEntity);
            }
        }

        Log.success('Duplicates Removed');
        process.exit(0);
    } catch(err) {
        Log.err(`\n\nmuCritic dupe remover failed!\n\nError:\n${err.message}`);
    }
}

scrapeRateYourMusic();
