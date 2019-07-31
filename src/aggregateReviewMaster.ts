import * as dotenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';
import { createArrayCsvWriter } from 'csv-writer';
import { getRepository } from 'typeorm';

import {
    Aggregator,
    FlatReviewAggregation,
} from './data/aggregator';
import { ReviewAggregator } from './data/reviewAggregator';
import { ReviewEntity } from './entities/entities';
import { Log } from './helpers/classes/log';
import { SpotifyApi } from './helpers/classes/spotifyApi';
import { connectToDatabase } from './helpers/functions/database';

require('@tensorflow/tfjs-node');

dotenv.config({ path: resolve(__dirname, '../.env') });

/**
 * aggregate all reviews into a CSV file, using the RYM average as the reviewer
 */
export async function aggregateReviewsMaster(): Promise<void> {
    Log.notify('\nMuCritic Data Aggregator\n\n');
    await connectToDatabase();
    await SpotifyApi.connect(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);

    const reviewEntities: ReviewEntity[] = await getRepository(ReviewEntity)
        .createQueryBuilder('review')
        .leftJoinAndSelect('review.album', 'album')
        .where('album.spotifyId is not null')
        .andWhere('album.spotifyAlbumType = :type', { type: 'album' })
        .getMany();
    const allIds: number[] = [];
    const allReviews: FlatReviewAggregation[] = [];
    for await(const review of reviewEntities) {
        if(allIds.indexOf(review.album.id) !== -1) continue;
        try {
            const aggregator = new Aggregator(
                review,
                ReviewAggregator,
            );
            const aggregation = await aggregator.aggregate();
            aggregation.score = (review.album.ratingRYM / 5);
            const final = await ReviewAggregator.flatten(aggregation);
            allReviews.push(final);
            allIds.push(review.album.id);
        } catch(err) {
            Log.err(err);
        }
    }

    const csvWriter = createArrayCsvWriter({
        path: './resources/data/profile/reviews/rym.csv',
    });
    await csvWriter.writeRecords(allReviews);

    Log.success('\nReview Aggregation Successful!\n');
    process.exit(0);
}

aggregateReviewsMaster();
