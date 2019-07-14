/**
 * Aggregation entry point
 */
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';
import 'reflect-metadata';
import { createArrayCsvWriter } from 'csv-writer';
import { getRepository } from 'typeorm';

import { ProfileEntity } from './entities/entities';
import { Log } from './helpers/classes/log';
import { SpotifyApi } from './helpers/classes/spotifyApi';
import { connectToDatabase } from './helpers/functions/database';
import { Aggregator, EncodedArtist } from './data/aggregators/aggregator';
import { ArtistAggregator } from './data/aggregators/artistAggregator';

dotenv.config({ path: resolve(__dirname, '../.env') });

/**
 * aggregate all profile favorite artists into CSV files
 */
export async function aggregateProfileArtists(): Promise<void> {
    Log.notify('\nMuCritic Data Aggregator\n\n');
    await connectToDatabase();
    await SpotifyApi.connect(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);

    const profiles = await getRepository(ProfileEntity).find({
        relations: ['favoriteArtists'],
    });

    const minArtists = 5;
    for await(const profile of profiles) {
        const validArtists = profile.favoriteArtists.filter(artist => artist.spotifyId != null);
        if(
            validArtists.length < minArtists
            || !existsSync(`./resources/data/profile/taste/${profile.id}.csv`)
        ) continue;
        const encodedArtists: EncodedArtist[] = [];
        for await(const artist of validArtists) {
            try {
                const aggregator = new Aggregator(
                    artist,
                    ArtistAggregator,
                );
                const aggregation = await aggregator.aggregate();
                const flattenedAggregation = await ArtistAggregator.flatten(aggregation, artist);
                const encodedAggregation = await ArtistAggregator.encode(flattenedAggregation);
                encodedArtists.push(encodedAggregation);
            } catch(err) {
                Log.err(`\nNon-terminal Artist Aggregation Failure:\n${err.message}\n`);
            }
        }
        const csvWriter = createArrayCsvWriter({
            path: `./resources/data/profile/artists/${profile.id}.csv`,
        });
        await csvWriter.writeRecords(encodedArtists);
        Log.notify('\nData Aggregation Successful\n\n');
    }
    Log.notify('\nData Aggregation Successful\n\n');
    process.exit(0);
}

aggregateProfileArtists();
