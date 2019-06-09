/**
 * Spotify ID scraper entry point
 */

import * as dontenv from 'dotenv';
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
import { SpotifyIdScraper } from './scrapers/spotify/spotifyIdScraper';

dontenv.config({ path: resolve(__dirname, '../.env') });

/**
 * Uses the spotifyId field for all album and artist records in database to read and store all
 * other Spotify data into the database
 *
 * @remarks
 * - npm call: ```npm run spotifyDataScrape```
 * - A single instance of this function will never make more than one request at a time
 */
export async function scrapeSpotifyData(): Promise<void> {
    try {
        Log.notify('\nTypeScrape Spotify Data Scraper\n\n');

        await connectToDatabase();
        const connection = getConnection();
        const spotifyApi = new SpotifyApi(
            process.env.SPOTIFY_CLIENT_ID,
            process.env.SPOTIFY_CLIENT_SECRET,
        );

        const albumRepository = connection.getRepository(AlbumEntity);
        const albums = await albumRepository.find({
            spotifyId: Not(IsNull()),
        });
        for await(const album of albums) {
            try {
                const idScraper = new SpotifyIdScraper(spotifyApi, album);
                await idScraper.scrape();
            } catch(err) {
                Log.err(err.message);
            }
        }

        Log.success('Scrape Complete');
    } catch(err) {
        Log.err(`\nTypeScrape Spotify Data Scraper Failed!\n\nError:\n${err.message}`);
    }
}

scrapeSpotifyData();
