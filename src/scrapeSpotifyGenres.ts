/**
 * Spotify genre scraper entry point
 */

import * as dontenv from 'dotenv';
import { resolve } from 'path';

import { connectToDatabase } from './helpers/functions/database';
import { Log } from './helpers/classes/log';
import { SpotifyApi } from './helpers/classes/spotifyApi';
import { SpotifyGenreScraper } from './scrapers/spotify/spotifyGenreScraper';

dontenv.config({ path: resolve(__dirname, '../.env') });

/**
 * Uses the Spotify API to populate the spotifyGenres table
 *
 * @remarks
 * - npm call: ```npm run spotifyGenreScrape```
 */
export async function scrapeSpotifyIds(): Promise<void> {
    try {
        Log.notify('\nTypeScrape Spotify Genre Scraper\n\n');

        await connectToDatabase();
        const spotifyApi = new SpotifyApi(
            process.env.SPOTIFY_CLIENT_ID,
            process.env.SPOTIFY_CLIENT_SECRET,
        );
        try {
            const genreScraper = new SpotifyGenreScraper(spotifyApi);
            await genreScraper.scrape();
        } catch(err) {
            Log.err(err.message);
        }
        Log.success('Scrape Complete');
    } catch(err) {
        Log.err(`\n\nTypeScrape Spotify ID Scraper Failed!\n\nError:\n${err.message}`);
    }
}

scrapeSpotifyIds();
