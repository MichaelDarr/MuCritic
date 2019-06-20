/**
 * Spotify album data scraper entry point
 */

import * as dontenv from 'dotenv';
import { resolve } from 'path';
import {
    getConnection,
    IsNull,
    Not,
} from 'typeorm';

import {
    AlbumEntity,
    ArtistEntity,
} from './entities/entities';
import { connectToDatabase } from './helpers/functions/database';
import { Log } from './helpers/classes/log';
import { SpotifyApi } from './helpers/classes/spotifyApi';
import { SpotifyAlbumBatchScraper } from './scrapers/spotify/spotifyAlbumBatchScraper';
import { SpotifyArtistBatchScraper } from './scrapers/spotify/spotifyArtistBatchScraper';

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
        await SpotifyApi.connect(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);

        const connection = getConnection();
        const albums = await connection.getRepository(AlbumEntity).find({
            spotifyId: Not(IsNull()),
            spotifyAlbumType: IsNull(),
        });
        const artists = await connection.getRepository(ArtistEntity).find({
            spotifyId: Not(IsNull()),
            spotifyPopularity: IsNull(),
        });

        let cursor = 0;
        while(cursor < albums.length) {
            try {
                const nextCursor = cursor + 20;
                const dataScraper = new SpotifyAlbumBatchScraper(
                    albums.slice(cursor, nextCursor),
                );
                await dataScraper.scrape();
                cursor = nextCursor;
            } catch(err) {
                Log.err(err.message);
            }
        }

        cursor = 0;
        while(cursor < artists.length) {
            try {
                const nextCursor = cursor + 20;
                const dataScraper = new SpotifyArtistBatchScraper(
                    artists.slice(cursor, nextCursor),
                );
                await dataScraper.scrape();
                cursor = nextCursor;
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
