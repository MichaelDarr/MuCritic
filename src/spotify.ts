/**
 * @fileOverview Main File - lays out scraping workflow
 *
 * @author  Michael Darr
 */

// external dependencies
import * as dontenv from 'dotenv';
import { createConnection, getConnection } from 'typeorm';
import { resolve } from 'path';

// internal class dependencies
import Log from './logger';
import SpotifyHelper from './spotifyHelper';
import { ScrapingResultBatch } from './scrapingResult';

// database dependencies
import ProfileEntity from './entity/Profile';
import ReviewEntity from './entity/Review';
import ArtistEntity from './entity/Artist';
import AlbumEntity from './entity/Album';
import GenreEntity from './entity/Genre';

// set up environment variables
dontenv.config({ path: resolve(__dirname, '../.env') });

// CLI header
Log.notify('\nmuCritic spotify scraper\n\n');

// program wrapped in this method to use await/async structure
(async (): Promise<void> => {
    Log.log('Connecting to database...');
    // create database connection
    await createConnection({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'muCritic',
        password: '',
        database: 'muCriticData',
        entities: [
            ProfileEntity,
            ReviewEntity,
            ArtistEntity,
            AlbumEntity,
            GenreEntity,
        ],
        synchronize: true,
        logging: false,
    });
    Log.success('Database Connection Successful');

    const connection = getConnection();
    const albumRepository = connection.getRepository(AlbumEntity);
    const albums = await albumRepository.find({ relations: ['artist'] });

    const spotifyHelper = new SpotifyHelper(
        process.env.SPOTIFY_CLIENT_ID,
        process.env.SPOTIFY_CLIENT_SECRET,
    );

    for await(const album of albums) {
        const apiResult = await spotifyHelper.searchAlbum(
            album.name,
            album.artist.name,
        );
        console.log(apiResult);
    }

    Log.success('Scrape Complete');
})();
