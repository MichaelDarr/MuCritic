import * as dotenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';
import * as tf from '@tensorflow/tfjs';

import { Log } from './helpers/classes/log';
import { connectToDatabase } from './helpers/functions/database';
import {
    calculateAggregationDistribution,
    getAggregatedProfileReviews,
    getProfiles,
    getProfileWithSpotifyAlbums,
} from './helpers/functions/dataAggregators';

require('@tensorflow/tfjs-node-gpu');

dotenv.config({ path: resolve(__dirname, '../.env') });

export async function learn(): Promise<void> {
    try {
        Log.notify('\nMuCritic Data Normalization\n\n');

        await connectToDatabase();

        const profiles = await getProfiles();
        const singleProfile = await getProfileWithSpotifyAlbums(profiles[0]);
        const reviews = await getAggregatedProfileReviews(singleProfile);

        calculateAggregationDistribution(reviews);
    } catch(err) {
        Log.err(`\nNormalization Failed!\n\nError:\n${err.message}`);
    }
}

learn();
