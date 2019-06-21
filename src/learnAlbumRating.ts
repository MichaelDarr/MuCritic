import * as dotenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';
import * as tf from '@tensorflow/tfjs';

import { Log } from './helpers/classes/log';
import { connectToDatabase } from './helpers/functions/database';
import {
    calculateAggregationDistribution,
    getProfiles,
    getProfileWithSpotifyAlbums,
    getReviewAggregation,
} from './helpers/functions/dataAggregators';
import { ReviewAggregation } from './types/types';

require('@tensorflow/tfjs-node-gpu');

dotenv.config({ path: resolve(__dirname, '../.env') });

export async function learn(): Promise<void> {
    try {
        Log.notify('\nMuCritic Data Normalization\n\n');

        await connectToDatabase();

        const profiles = await getProfiles();
        const profile = await getProfileWithSpotifyAlbums(profiles[0]);
        const reviews: ReviewAggregation[] = [];

        await Promise.all(profile.reviews.map(async (reviewEntity) => {
            const review = await getReviewAggregation(reviewEntity);
            reviews.push(review);
        }));

        calculateAggregationDistribution(reviews);
    } catch(err) {
        Log.err(`\nNormalization Failed!\n\nError:\n${err.message}`);
    }
}

learn();
