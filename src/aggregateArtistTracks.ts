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
import { RedisHelper } from './helpers/classes/redis';
import { SpotifyApi } from './helpers/classes/spotifyApi';
import { connectToDatabase } from './helpers/functions/database';
import { SpotifyArtistTrackScraper } from './scrapers/spotify/spotifyArtistTracksScraper';

dotenv.config({ path: resolve(__dirname, '../.env') });

/**
 * top 10 tracks/artist aggregation
 */
export async function aggregateArtistTracks(): Promise<void> {
    try {
        Log.notify('\nMuCritic Data Aggregator\n\n');
        await connectToDatabase();
        await RedisHelper.connect(6379, '127.0.0.1', 5);
        await SpotifyApi.connect(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);

        const artists = await getRepository(ArtistEntity).find({
            where: { spotifyId: Not(IsNull()) },
        });
        let totalError: number = null;
        let artistCount = 0;
        for await(const artist of artists) {
            const scraper = new SpotifyArtistTrackScraper(artist, './resources/data/artist');
            try {
                await scraper.scrape();
                const artistError = scraper.mae();
                if(artistError != null) {
                    if(totalError == null) {
                        totalError = artistError;
                    } else {
                        totalError += artistError;
                    }
                    artistCount += 1;
                }
            } catch (err) {
                Log.err(`\n${err.message}`);
            }
        }
        const mae = totalError / artistCount;
        Log.success(`FINAL MAE: ${mae}`);
        Log.success('\nData Aggregation Successful!\n');
        process.exit(0);
    } catch(err) {
        Log.err(`\nData Aggregation Failed!\n\nError:\n${err.message}`);
        process.exit(1);
    }
}

aggregateArtistTracks();
