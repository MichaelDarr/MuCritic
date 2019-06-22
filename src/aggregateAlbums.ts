/**
 * Data aggregation entry point.
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';
import { createObjectCsvWriter } from 'csv-writer';
import { getRepository } from 'typeorm';

import { Log } from './helpers/classes/log';
import { connectToDatabase } from './helpers/functions/database';
import {
    AlbumAggregator,
} from './data/aggregators/albumAggregator';
import { AlbumEntity } from './entities/entities';

require('@tensorflow/tfjs-node-gpu');

dotenv.config({ path: resolve(__dirname, '../.env') });

/**
 * Currently, just a sandbox for data aggregation
 */
export async function learn(): Promise<void> {
    try {
        Log.notify('\nMuCritic Data Aggregator\n\n');

        // create aggegation of all albums from database
        await connectToDatabase();
        const albums = await getRepository(AlbumEntity)
            .createQueryBuilder('album')
            .where('album.spotifyId is not null')
            .andWhere('album.spotifyAlbumType = :type', { type: 'album' })
            .getMany();
        const aggregations = await Promise.all(albums.map((album) => {
            const albumAggregator = new AlbumAggregator(album);
            return albumAggregator.aggregate();
        }));
        Log.success('\nData Retreival Successful!\n');

        // write aggregation to csv
        const csvWriter = createObjectCsvWriter({
            path: './resources/data/albums-normalized.csv',
            header: AlbumAggregator.csvHeaders(),
        });

        await csvWriter.writeRecords(aggregations);
        Log.success('\nData Aggregation Successful!\n');
    } catch(err) {
        Log.err(`\nData Aggregation Failed!\n\nError:\n${err.message}`);
    }
}

learn();
