/**
 * Machine learning entry point.
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';
import * as tf from '@tensorflow/tfjs';
import { getRepository } from 'typeorm';

import { Log } from './helpers/classes/log';
import { connectToDatabase } from './helpers/functions/database';
import {
    AlbumAggregator,
} from './ml/aggregators/albumAggregator';
import { AlbumEntity } from './entities/entities';

require('@tensorflow/tfjs-node-gpu');

dotenv.config({ path: resolve(__dirname, '../.env') });

/**
 * Currently, just a sandbox for data aggregation
 */
export async function learn(): Promise<void> {
    try {
        Log.notify('\nMuCritic Data Normalization\n\n');

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
    } catch(err) {
        Log.err(`\nNormalization Failed!\n\nError:\n${err.message}`);
    }
}

learn();
