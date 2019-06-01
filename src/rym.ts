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
import ProfileScraper from './scrapers/profileScraper';
import ReviewPageScraper from './scrapers/reviewPageScraper';

// database dependencies
import ProfileEntity from './entities/Profile';
import ReviewEntity from './entities/Review';
import ArtistEntity from './entities/Artist';
import AlbumEntity from './entities/Album';
import GenreEntity from './entities/Genre';

// set up environment variables
dontenv.config({ path: resolve(__dirname, '../.env') });

// CLI header
Log.notify('\nmuCritic RYM Scraper\n\n');

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
        database: 'muCriticDataTest',
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
        let profileScraper: ProfileScraper;
        let reviewPageScraper: ReviewPageScraper;
        try {
            profileScraper = new ProfileScraper(profileURL);
            await profileScraper.scrape();
        } catch(e) {
            Log.err(`Error scraping user: ${e}`);
        }

        try {
            reviewPageScraper = new ReviewPageScraper(profileScraper);
        } catch(e) {
            Log.err('error initializing ');
        }

        while(
            reviewPageScraper.pageReviewCount > 0
            && reviewPageScraper.sequentialFailureCount < 3
        ) {
            await reviewPageScraper.scrapePage();
        }
    }

    Log.success('Scrape Complete');
})();
