/**
 * "Favorite Artist" profile aggregation entry point.
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';
import { createObjectCsvWriter } from 'csv-writer';
import { getRepository } from 'typeorm';

import { Log } from './helpers/classes/log';
import { connectToDatabase } from './helpers/functions/database';
import {
    ProfileAggregator,
} from './data/aggregators/profileAggregator';
import { ProfileEntity } from './entities/entities';
import { ReviewAggregator } from './data/aggregators/reviewAggregator';

dotenv.config({ path: resolve(__dirname, '../.env') });

/**
 * Profile Review aggregation
 */
export async function aggregateProfiles(): Promise<void> {
    try {
        Log.notify('\nMuCritic Data Aggregator\n\n');

        // create aggegation of all albums from database
        await connectToDatabase();

        const profiles = await getRepository(ProfileEntity).find();
        await Promise.all(profiles.map(async (profile) => {
            const profileAggregator = new ProfileAggregator(profile);
            const csvWriter = createObjectCsvWriter({
                path: `./resources/data/profiles/reviews/${profile.name}.csv`,
                header: ReviewAggregator.csvHeaders(),
            });
        }));
        Log.success('\nData Aggregation Successful!\n');
    } catch(err) {
        Log.err(`\nData Aggregation Failed!\n\nError:\n${err.message}`);
    }
}

aggregateProfiles();
