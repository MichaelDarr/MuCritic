/**
 * Aggregation entry point
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';
import { createObjectCsvWriter } from 'csv-writer';
import { getRepository } from 'typeorm';

import {
    Aggregator,
    FlattenedReviewAggregation,
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
    Log.notify('\nMuCritic Data Aggregator\n\n');
    await connectToDatabase();
    await RedisHelper.connect(6379, '127.0.0.1', 5);
    await SpotifyApi.connect(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);

    const reviews = await getRepository(ReviewEntity)
        .createQueryBuilder('review')
        .leftJoinAndSelect('review.album', 'album')
        .leftJoin('review.profile', 'profile')
        .where('album.spotifyId is not null')
        .andWhere('album.spotifyAlbumType = :type', { type: 'album' })
        .andWhere('profile.age is not null')
        .andWhere('profile.age < 100')
        .getMany();

    const allReviewData: FlattenedReviewAggregation[] = [];
    for await(const review of reviews) {
        const aggregator = new Aggregator<ReviewEntity, ReviewAggregation>(
            review,
            ReviewAggregator,
        );

        const aggregation = await aggregator.aggregate();
        const flattenedAggregation = await ReviewAggregator.flatten(review, aggregation);
        allReviewData.push(flattenedAggregation);
        console.log(flattenedAggregation);
        process.exit(0);
    }

    const header = Aggregator.csvHeaderFromArray(ReviewAggregator.flatFields);
    const csvWriter = createObjectCsvWriter({
        path: './resources/data/review/all.csv',
        header,
    });
    await csvWriter.writeRecords(allReviewData);
}

aggregateReviews();
