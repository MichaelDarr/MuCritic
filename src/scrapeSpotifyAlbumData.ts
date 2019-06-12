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

import { AlbumEntity } from './entities/entities';
import { connectToDatabase } from './helpers/functions/database';
import { Log } from './helpers/classes/log';
import { SpotifyApi } from './helpers/classes/spotifyApi';
import { SpotifyAlbumBatchScraper } from './scrapers/spotify/spotifyAlbumBatchScraper';

dontenv.config({ path: resolve(__dirname, '../.env') });

/**
 * Uses the spotifyId field for all album and artist records in database to read and store all
 * other Spotify data into the database
 *
 * @remarks
 * - npm call: ```npm run spotifyDataScrape```
 * - A single instance of this function will never make more than one request at a time
 */
export async function scrapeSpotifyAlbumData(): Promise<void> {
    try {
        Log.notify('\nTypeScrape Spotify Data Scraper\n\n');

        await connectToDatabase();
        const connection = getConnection();
        const spotifyApi = new SpotifyApi(
            process.env.SPOTIFY_CLIENT_ID,
            process.env.SPOTIFY_CLIENT_SECRET,
        );
        const albumRepository = connection.getRepository(AlbumEntity);
        let albums = await albumRepository.find({
            spotifyId: Not(IsNull()),
        });
        const albumsWithoutSpotifyData: AlbumEntity[] = [];
        albums.forEach((album: AlbumEntity): void => {
            if(!album.spotifyAlbumType) {
                albumsWithoutSpotifyData.push(album);
            }
        });
        albums = albumsWithoutSpotifyData;

        let albumCursor = 0;
        while(albumCursor < albums.length) {
            try {
                const nextAlbumCursor = albumCursor + 20;
                const dataScraper = new SpotifyAlbumBatchScraper(spotifyApi, albums.slice(albumCursor, albumCursor + nextAlbumCursor));
                await dataScraper.scrape();
                albumCursor = nextAlbumCursor;
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

scrapeSpotifyAlbumData();
