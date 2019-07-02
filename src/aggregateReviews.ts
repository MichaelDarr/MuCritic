/**
 * Aggregation entry point
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';
import { getRepository } from 'typeorm';

import {
    Aggregator,
    ReviewAggregation,
} from './data/aggregators/aggregator';
import { ReviewAggregator } from './data/aggregators/reviewAggregator';
import { ReviewEntity } from './entities/entities';
import { Log } from './helpers/classes/log';
import { RedisHelper } from './helpers/classes/redis';
import { SpotifyApi } from './helpers/classes/spotifyApi';
import { connectToDatabase } from './helpers/functions/database';

dotenv.config({ path: resolve(__dirname, '../.env') });

/**
 * aggregate all reviews into CSV files
 */
export async function aggregateReviews(): Promise<void> {
    try {
        Log.notify('\nMuCritic Data Aggregator\n\n');
        await connectToDatabase();
        await RedisHelper.connect(6379, '127.0.0.1', 5);
        await SpotifyApi.connect(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);

        const savePath = './resources/data/review';
        const reviews = await getRepository(ReviewEntity)
            .createQueryBuilder('review')
            .leftJoin('review.album', 'album')
            .leftJoinAndSelect('review.profile', 'profile')
            .where('album.spotifyId is not null')
            .andWhere('album.spotifyAlbumType = :type', { type: 'album' })
            .andWhere('profile.age is not null')
            .andWhere('profile.age < 100')
            .getMany();

        for await(const review of reviews) {
            const aggregator = new Aggregator<ReviewEntity, ReviewAggregation>(
                review,
                ReviewAggregator,
            );
            const aggregation = await aggregator.aggregate();
            const objbuilder = {
                score: aggregation.score,
                userAge: review.profile.age,
                userGender: review.profile.gender ? 1 : 0,
                albumAvailableMarkets: aggregation.album.availableMarkets,
                albumCopyrights: aggregation.album.copyrights,
                albumPopularity: aggregation.album.popularity,
                albumReleaseYear: aggregation.album.releaseYear,
                albumIssues: aggregation.album.issues,
                albumLists: aggregation.album.lists,
                albumOverallRank: aggregation.album.overallRank,
                albumRating: aggregation.album.rating,
                albumRatings: aggregation.album.ratings,
                albumReviews: aggregation.album.reviews,
                albumYearRank: aggregation.album.yearRank,
                artistIsActive: aggregation.album.artist.active,
                artistDiscographySize: aggregation.album.artist.discographySize,
                artistListCount: aggregation.album.artist.lists,
                artistMemberCount: aggregation.album.artist.members,
                artistShowCount: aggregation.album.artist.shows,
                artistIsSoloPerformer: aggregation.album.artist.soloPerformer,
                artistPopularity: aggregation.album.artist.popularity,
            };
            console.log(objbuilder);
        }
        process.exit(0);
    } catch(err) {
        Log.err(`\nData Aggregation Failed!\n\nError:\n${err.message}`);
        process.exit(1);
    }
}

aggregateReviews();
