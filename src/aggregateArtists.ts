import * as dotenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';
import { createArrayCsvWriter } from 'csv-writer';
import { getRepository, IsNull, Not } from 'typeorm';

import {
    Aggregator,
    FlatArtistAggregation,
} from './data/aggregators/aggregator';
import { ArtistAggregator } from './data/aggregators/artistAggregator';
import { ArtistEntity } from './entities/entities';
import { Log } from './helpers/classes/log';
import { SpotifyApi } from './helpers/classes/spotifyApi';
import { connectToDatabase } from './helpers/functions/database';

require('@tensorflow/tfjs-node');

dotenv.config({ path: resolve(__dirname, '../.env') });

/**
 * aggregate all artists into a single CSV file
 */
export async function aggregateArtists(): Promise<void> {
    Log.notify('\nMuCritic Data Aggregator\n\n');
    await connectToDatabase();
    await SpotifyApi.connect(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);

    const artists = await getRepository(ArtistEntity).find({
        spotifyId: Not(IsNull()),
    });

    const artistData: FlatArtistAggregation[] = [];
    for await(const artist of artists) {
        try {
            const aggregator = new Aggregator(
                artist,
                ArtistAggregator,
            );

            const aggregation = await aggregator.aggregate();
            artistData.push(await ArtistAggregator.flatten(aggregation, artist));
        } catch(err) {
            Log.err(`\nNon-terminal Artist Aggregation Failure:\n${err.message}\n`);
        }
    }

    const csvWriter = createArrayCsvWriter({
        path: './resources/data/artist/all/data.csv',
    });
    await csvWriter.writeRecords(artistData);
    Log.notify('\nData Aggregation Successful\n\n');
    process.exit(0);
}

aggregateArtists();
