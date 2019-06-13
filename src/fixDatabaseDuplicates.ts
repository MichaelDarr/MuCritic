import * as dontenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';

import { getRepository } from 'typeorm';
import {
    AlbumEntity,
    ArtistEntity,
    RymGenreEntity,
} from './entities/entities';

import { Log } from './helpers/classes/log';
import { connectToDatabase } from './helpers/functions/database';

dontenv.config({ path: resolve(__dirname, '../.env') });

/**
 * When first scraping this data, unique keys were enforced only in the scraping logic, and not in
 * the database rules. Therefore, a few hundred duplicates for various records sneaked into the
 * table. This function removes those duplicates in a safe manner.
 */
export async function scrapeRateYourMusic(): Promise<void> {
    try {
        Log.notify('\nmuCritic Database de-duplicator\n\n');
        await connectToDatabase();

        /**
         * RYM Genre Duplicate removal, by [[RymGenreEntity.name]]
         */
        const rymGenreRepo = getRepository(RymGenreEntity);
        let rymGenres = await rymGenreRepo
            .createQueryBuilder('genre')
            .select('genre.name', 'name')
            .addSelect('COUNT(*)', 'count')
            .groupBy('name')
            .having('COUNT(*) > 1')
            .getRawMany();

        let rymGenreNames: string[] = rymGenres.map(rymGenre => rymGenre.name);

        for await(let rymGenreName of rymGenreNames) {
            const dupeEntities = await rymGenreRepo.find({
                relations: [
                    'artists',
                    'albums',
                ],
                where: {
                    name: rymGenreName,
                }
            });
            for await(let entity of dupeEntities) {
                if(entity.artists.length === 0 && entity.albums.length === 0) {
                    await rymGenreRepo.remove(entity);
                }
            }
        }

        /**
         * RYM Album Duplicate removal, by [[AlbumEntity.urlRYM]]
         */
        const albumRepo = getRepository(AlbumEntity);
        let albums = await albumRepo
            .createQueryBuilder('album')
            .select('album.urlRYM', 'url')
            .addSelect('COUNT(*)', 'count')
            .groupBy('url')
            .having('COUNT(*) > 1')
            .getRawMany();

        let albumUrls = albums.map(album => album.url);

        for await(let albumUrl of albumUrls) {
            const dupeEntities = await albumRepo.find({
                relations: [
                    'reviews',
                ],
                where: {
                    urlRYM: albumUrl,
                }
            });
            for await(let entity of dupeEntities) {
                if(entity.reviews.length === 0) {
                    await albumRepo.remove(entity);
                }
            }
        }
        
        Log.success('Duplicates Removed');
        process.exit(0);
    } catch(err) {
        Log.err(`\n\nmuCritic dupe remover failed!\n\nError:\n${err.message}`);
    }
}

scrapeRateYourMusic();
