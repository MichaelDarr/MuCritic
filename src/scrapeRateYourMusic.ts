/**
 * Rate Your Music scraper entry point
 */

import * as dontenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';

import { Log } from './helpers/classes/index';
import {
    connectToDatabase,
    readFileToArray,
} from './helpers/functions/index';
import {
    ProfileScraper,
    ReviewPageScraper,
} from './scrapers/index';

// environment variables
dontenv.config({ path: resolve(__dirname, '../.env') });

/**
 * Scrapes information from [Rate Your Music] directly into a local Postgres database.
 *
 * @remarks
 * - Top-level function generally called directly by npm: ```npm run rymScrape```
 * - A single instance of this function will never make more than one request at a time.
 * - "Root" of the scraper is an array of RYM usernames. This is read from a file - first, the
 * program tries to read a filename from the first additional CLI argument, i.e.
 * ```npm run rymScrape ./path/to/FILENAME.txt```. If this is not supplied or the file cannot be
 * found, it looks for a file at the location indicated by the ```DEFAULT_PROFILE_URI```
 * environment variable.
 */
export async function scrapeRateYourMusic(): Promise<void> {
    try {
        Log.notify('\nmuCritic RYM Scraper\n\n');
        await connectToDatabase();

        const profileURLList: string[] = await readFileToArray(
            process.argv[2] || process.env.DEFAULT_PROFILE_URI,
        );
        Log.log('Beginning scrape...');

        for await(const profileURL of profileURLList) {
            if(profileURL != null && profileURL !== '') {
                const profileScraper = new ProfileScraper(profileURL);
                await profileScraper.scrape();
                const reviewPageScraper = new ReviewPageScraper(profileScraper);
                while(
                    reviewPageScraper.pageReviewCount > 0
                    && reviewPageScraper.sequentialFailureCount < 3
                ) {
                    await reviewPageScraper.scrapePage();
                }
            }
        }
        Log.success('Scrape Complete');
        process.exit(0);
    } catch(err) {
        Log.err(`\n\nmuCritic RYM Scraper Failed!\n\nError:\n${err.message}`);
    }
}

scrapeRateYourMusic();
