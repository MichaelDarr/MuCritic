import * as dotenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';
import { createArrayCsvWriter } from 'csv-writer';
import { getRepository, IsNull, Not } from 'typeorm';

import {
    Aggregator,
    FlatAlbumAggregation,
} from './data/aggregator';
import { AlbumAggregator } from './data/albumAggregator';
import { AlbumEntity } from './entities/entities';
import { Log } from './helpers/classes/log';
import { SpotifyApi } from './helpers/classes/spotifyApi';
import { connectToDatabase } from './helpers/functions/database';

dotenv.config({ path: resolve(__dirname, '../.env') });

/**
 * aggregate all albums into a single CSV file
 */
export async function aggregateAlbums(): Promise<void> {
    Log.notify('\nMuCritic Data Aggregator\n\n');
    await connectToDatabase();
    await SpotifyApi.connect(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);

    const albums = await getRepository(AlbumEntity).find({
        spotifyAlbumType: 'album',
        spotifyId: Not(IsNull()),
    });

    const albumData: FlatAlbumAggregation[] = [];
    for await(const album of albums) {
        try {
            const aggregator = new Aggregator(
                album,
                AlbumAggregator,
            );

            const aggregation = await aggregator.aggregate();
            albumData.push(await AlbumAggregator.flatten(aggregation, album));
        } catch(err) {
            Log.err(`\nNon-terminal Album Aggregation Failure:\n${err.message}\n`);
        }
    }

    const csvWriter = createArrayCsvWriter({
        path: './resources/data/album/all/data.csv',
    });
    await csvWriter.writeRecords(albumData);
    Log.notify('\nData Aggregation Successful\n\n');
    process.exit(0);
}

aggregateAlbums();
