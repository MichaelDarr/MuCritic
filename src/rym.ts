/**
 * @fileOverview Main File - lays out scraping workflow
 *
 * @author  Michael Darr
 */

// external dependencies
import * as dontenv from 'dotenv';
import 'reflect-metadata';
import { createConnection } from 'typeorm';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// internal class dependencies
import Log from './helpers/classes/logger';
import Profile from './scrapers/profileScraper';
import { ResultBatch } from './helpers/classes/result';

// database dependencies
import ProfileEntity from './entities/Profile';
import ReviewEntity from './entities/Review';
import ArtistEntity from './entities/Artist';
import AlbumEntity from './entities/Album';
import GenreEntity from './entities/Genre';

// set up environment variables
dontenv.config({ path: resolve(__dirname, '../.env') });

// CLI header
Log.notify('\nmuCritic data aggregator\n\n');

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

    let file = process.argv[2];
    if(file === null || file === undefined) {
        file = 'resources/default.txt';
    }

    Log.log(`Reading profile url's from ${file}`);

    // read pre-selected urls from a file into an array
    const profileURLList: string[] = readFileSync(file).toString().split('\n');
    Log.success('File read successful!');
    Log.log('Beginning scrape...');

    // iterate through all profile URLs - need for...of instead of forEach b/c async/await
    for await(const profileURL of profileURLList) {
        // Profile Scrape
        Log.log(`Scraping profile: ${profileURL}`);

        const user = new Profile(profileURL);
        await user.scrape();
    }

    Log.success('Scrape Complete');
})();
