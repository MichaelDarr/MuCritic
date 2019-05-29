/**
 * @fileOverview Main File - lays out scraping workflow
 *
 * @author  Michael Darr
 */

// external dependencies
import * as dontenv from 'dotenv';
import { createConnection } from 'typeorm';
import { resolve } from 'path';
import { getConnection } from 'typeorm';

// internal class dependencies
import Log from './logger';
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
    let albumRepository = connection.getRepository(AlbumEntity);
    let albums = await albumRepository.find({ relations: ["artist"] });

    albums.forEach((album): void => {
        Log.success(`${album.name}: ${album.artist.name}`);
    })

    Log.success('Scrape Complete');
})();
