/**
 * Spotify album track data scraper entry point
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import {
    getConnection,
    IsNull,
    Not,
} from 'typeorm';

import { AlbumEntity } from './entities/entities';
import { connectToDatabase } from './helpers/functions/database';
import { Log } from './helpers/classes/log';
import { SpotifyApi } from './helpers/classes/spotifyApi';
import { SpotifyTrackScraper } from './scrapers/spotify/spotifyTrackScraper';

dotenv.config({ path: resolve(__dirname, '../.env') });

/**
 * Scrapes the Spotify API for all tracks of all albums in the database with a Spotify ID
 *
 * @remarks
 * - npm call: ```npm run spotifyTrackScrape```
 * - A single instance of this function will never make more than one request at a time
 */
export async function scrapeSpotifyData(): Promise<void> {
    try {
        Log.notify('\nTypeScrape Spotify Track Scraper\n\n');

        await connectToDatabase();
        await SpotifyApi.connect(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);
        const connection = getConnection();
        const albums = await connection.getRepository(AlbumEntity).find({
            spotifyId: Not(IsNull()),
        });

        for await(const album of albums) {
            try {
                const dataScraper = new SpotifyTrackScraper(album);
                await dataScraper.scrape();
            } catch(err) {
                Log.err(err.message);
            }
        }

        Log.success('Scrape Complete');
        process.exit(0);
    } catch(err) {
        Log.err(`\nTypeScrape Spotify Data Scraper Failed!\n\nError:\n${err.message}`);
    }
}

scrapeSpotifyData();
