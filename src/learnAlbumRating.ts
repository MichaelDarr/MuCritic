import * as dotenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';
import * as tf from '@tensorflow/tfjs';
import { getRepository } from 'typeorm';

import { Log } from './helpers/classes/log';
import { connectToDatabase } from './helpers/functions/database';
import {
    ProfileAggregator,
} from './ml/aggregators';
import { aggregateDistribution } from './ml/stats';
import { ProfileEntity } from './entities/entities';

require('@tensorflow/tfjs-node-gpu');

dotenv.config({ path: resolve(__dirname, '../.env') });

export async function learn(): Promise<void> {
    try {
        Log.notify('\nMuCritic Data Normalization\n\n');

        await connectToDatabase();

        const profiles = await getRepository(ProfileEntity).find();
        const profileAggregator = new ProfileAggregator(profiles[0]);
        const aggregations = await profileAggregator.normalize();
        aggregateDistribution(aggregations);
    } catch(err) {
        Log.err(`\nNormalization Failed!\n\nError:\n${err.message}`);
    }
}

learn();
