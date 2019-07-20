import * as dotenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';

import { Log } from './helpers/classes/log';
import { RedisHelper } from './helpers/classes/redis';
import { readFileToArray } from './helpers/functions/fileSystem';
import { connectToDatabase } from './helpers/functions/database';
import { LatestReviewersScraper } from './scrapers/rym/latestReviewersScraper';
import { ProfileScraper } from './scrapers/rym/profileScraper';
import { ReviewPageScraper } from './scrapers/rym/reviewPageScraper';

dotenv.config({ path: resolve(__dirname, '../.env') });

/**
 * Scrapes information from [Rate Your Music] directly into a local Postgres database.
 *
 * @remarks
 * - npm call: ```npm run rymScrape```
 * - A single instance of this function will never make more than one request at a time.
 * - Ingests an array of RYM usernames read from a file. File location supplied by CLI argument,
 * ```npm run rymScrape ./rymResources/FILENAME.txt```. Defaults to ```DEFAULT_PROFILE_FILENAME```
 * from env
 */
export async function scrapeRateYourMusic(): Promise<void> {
    try {
        Log.notify('\nmuCritic RYM Scraper\n\n');
        await connectToDatabase();

        switch(process.argv[2]) {
            case 'file': {
                const profileURLList: string[] = await readFileToArray(
                    `./resources/${process.argv[3] || process.env.DEFAULT_PROFILE_FILENAME}`,
                );
                Log.log('Beginning profile scrape from file');

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
                break;
            }
            default: {
                Log.log('Beginning profile scrape from latest reviews');
                await RedisHelper.connect(6379, '127.0.0.1');
                const latestReviewScraper = new LatestReviewersScraper(0, 10);
                for await(const _ of Array(1000)) {
                    await latestReviewScraper.scrape();
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
