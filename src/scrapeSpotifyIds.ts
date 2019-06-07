/**
 * Spotify ID scraper entry point
 */

import * as dontenv from 'dotenv';
import { resolve } from 'path';
import { getConnection } from 'typeorm';

import { AlbumEntity } from './entities/entities';
import { connectToDatabase } from './helpers/functions/database';
import { Log } from './helpers/classes/log';
import { SpotifyApi } from './helpers/classes/spotifyApi';
import { SpotifyIdScraper } from './scrapers/spotify/spotifyIdScraper';

// environment variables
dontenv.config({ path: resolve(__dirname, '../.env') });

/**
 * Uses the Spotify API to search for all albums and artists in database. For found records,
 * populates the 'SpotifyId' column for both albums and artists
 *
 * @remarks
 * npm call: ```npm run spotifyIdScrape```
 */
export async function scrapeSpotifyIds(): Promise<void> {
    try {
        Log.notify('\nMuCritic Spotify ID Scraper\n\n');

        await connectToDatabase();
        const connection = getConnection();

        // spotify API gateway setup, handles access key generation
        const spotifyApi = new SpotifyApi(
            process.env.SPOTIFY_CLIENT_ID,
            process.env.SPOTIFY_CLIENT_SECRET,
        );

        // scrape and store Spotify album ids
        const albumRepository = connection.getRepository(AlbumEntity);
        const albums = await albumRepository.find({ relations: ['artist'] });
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
        Log.err(`\n\nmuCritic ID Scraper Failed!\n\nError:\n${err.message}`);
    }
}

scrapeSpotifyIds();
