/**
 * Aggregation entry point
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';
import {
    getRepository,
    IsNull,
    Not,
} from 'typeorm';

import {
    ArtistEntity,
} from './entities/entities';
import { Log } from './helpers/classes/log';
import { SpotifyApi } from './helpers/classes/spotifyApi';
import { connectToDatabase } from './helpers/functions/database';

dotenv.config({ path: resolve(__dirname, '../.env') });

/**
 * top 10 tracks/artist aggregation
 */
export async function aggregateArtistTracks(): Promise<void> {
    try {
        Log.notify('\nMuCritic Data Aggregator\n\n');
        await connectToDatabase();
        await SpotifyApi.connect(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);
        const spotifyClient = SpotifyApi.getConnection();

        const artists = await getRepository(ArtistEntity).find({
            spotifyId: Not(IsNull()),
        });
        await Promise.all(
            artists.map(async (artist) => {
                const topTracks = spotifyClient.getArtistTopTracks(artist.spotifyId);
                // topTracks.map(track => {})
            }),
        );
        Log.success('\nData Aggregation Successful!\n');
        process.exit(0);
    } catch(err) {
        Log.err(`\nData Aggregation Failed!\n\nError:\n${err.message}`);
        process.exit(1);
    }
}

aggregateArtistTracks();
