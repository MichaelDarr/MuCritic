import * as dotenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';
import { createArrayCsvWriter } from 'csv-writer';
import { getRepository } from 'typeorm';

import {
    Aggregator,
    FlatReviewAggregation,
} from './data/aggregators/aggregator';
import { ReviewAggregator } from './data/aggregators/reviewAggregator';
import {
    ProfileEntity,
    ReviewEntity,
} from './entities/entities';
import { Log } from './helpers/classes/log';
import { SpotifyApi } from './helpers/classes/spotifyApi';
import { connectToDatabase } from './helpers/functions/database';

require('@tensorflow/tfjs-node');

dotenv.config({ path: resolve(__dirname, '../.env') });

/**
 * aggregate all reviews into CSV files
 */
export async function aggregateReviews(): Promise<void> {
    Log.notify('\nMuCritic Data Aggregator\n\n');
    await connectToDatabase();
    await SpotifyApi.connect(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);

    const profiles = await getRepository(ProfileEntity).find();

    let allReviewData: FlatReviewAggregation[];
    let reviewEntities: ReviewEntity[];

    for await(const profile of profiles) {
        allReviewData = [];
        reviewEntities = await getRepository(ReviewEntity)
            .createQueryBuilder('review')
            .where('review.profile = :profile', { profile: profile.id })
            .leftJoinAndSelect('review.album', 'album')
            .andWhere('album.spotifyId is not null')
            .andWhere('album.spotifyAlbumType = :type', { type: 'album' })
            .getMany();
        for await(const review of reviewEntities) {
            try {
                const aggregator = new Aggregator(
                    review,
                    ReviewAggregator,
                );
                const aggregation = await aggregator.aggregate();
                const final = await ReviewAggregator.flatten(aggregation);
                allReviewData.push(final);
            } catch(err) {
                Log.err(err);
            }
        }

        if(allReviewData.length > 10) {
            const csvWriter = createArrayCsvWriter({
                path: `./resources/data/profile/reviews/${profile.id}.csv`,
            });
            await csvWriter.writeRecords(allReviewData);
            Log.success(`finished ${profile.name}`);
        } else {
            Log.err(`Not enough reviews: skipping ${profile.name}`);
        }
    }
    Log.success('\nReview Aggregation Successful!\n');
    process.exit(0);
}

aggregateReviews();
