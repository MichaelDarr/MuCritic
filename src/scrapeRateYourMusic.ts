/**
 * Rate Your Music scraper entry point
 */

// external
import * as dontenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';

// helpers
import { connectToDatabase } from './helpers/functions/database';
import { readFileToArray } from './helpers/functions/fileSystem';
import { Log } from './helpers/classes/log';

// scrapers
import { ProfileScraper } from './scrapers/profileScraper';
import { ReviewPageScraper } from './scrapers/reviewPageScraper';

// environment variables
dontenv.config({ path: resolve(__dirname, '../.env') });

/**
 * Scrapes information from Rate Your Music directly into a local Postgres database
 *
 * @remarks
 * This is a top-level function, mean to be run directly in the command line:
 * ```
 * npm run rymScrape
 * ```
 */
export async function scrapeRateYourMusic(): Promise<void> {
    try {
        Log.notify('\nmuCritic RYM Scraper\n\n');
        await connectToDatabase();

        const profileURLList: string[] = await readFileToArray(
            process.argv[2],
            process.env.DEFAULT_PROFILE_URI,
        );
        Log.log('Beginning scrape...');

        // iterate through all profile URLs
        for await(const profileURL of profileURLList) {
            if(!profileURL) continue;
            // create and scrape user
            const profileScraper = new ProfileScraper(profileURL);
            await profileScraper.scrape();

            // scrape all review pages for a user
            const reviewPageScraper = new ReviewPageScraper(profileScraper);
            while(
                reviewPageScraper.pageReviewCount > 0
                && reviewPageScraper.sequentialFailureCount < 3
            ) {
                await reviewPageScraper.scrapePage();
            }
        }

        Log.success('Scrape Complete');
    } catch(err) {
        Log.err(`\n\nmuCritic RYM Scraper Failed!\n\nError:\n${err.message}`);
    }
}

scrapeRateYourMusic();
