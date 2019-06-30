/**
 * Data aggregation entry point.
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';
import {
    getRepository,
    IsNull,
    Not,
} from 'typeorm';

import { Aggregator, AlbumAggregation } from './data/aggregators/aggregator';
import { AlbumAggregator } from './data/aggregators/albumAggregator';
import {
    AlbumEntity,
} from './entities/entities';
import { Log } from './helpers/classes/log';
import { RedisHelper } from './helpers/classes/redis';
import { connectToDatabase } from './helpers/functions/database';

dotenv.config({ path: resolve(__dirname, '../.env') });

/**
 * Data aggregation
 */
export async function aggregate(): Promise<void> {
    try {
        Log.notify('\nMuCritic Data Aggregator\n\n');
        await connectToDatabase();
        await RedisHelper.connect(6379, '127.0.0.1', 3);

        const albums = await getRepository(AlbumEntity).find({
            spotifyId: Not(IsNull()),
            spotifyAlbumType: 'album',
        });
        await Promise.all(
            albums.map(async (album) => {
                const aggregator = new Aggregator<AlbumEntity, AlbumAggregation>(
                    album,
                    AlbumAggregator,
                );
                const aggregation = await aggregator.aggregate();
            }),
        );
        Log.success('\nData Aggregation Successful!\n');
        process.exit(0);
    } catch(err) {
        Log.err(`\nData Aggregation Failed!\n\nError:\n${err.message}`);
        process.exit(1);
    }
}

aggregate();
