import { JSDOM } from 'jsdom';

import { RedisHelper } from '../helpers/classes/redis';
import { ParseElement } from '../helpers/parsing/parseElement';
import { Log } from '../helpers/classes/log';
import { getRequestBody } from '../helpers/functions/network';
import { Scraper } from './scraper';

/**
 * Superclass for all "scrapers" leveraging [scraperapi](https://www.scraperapi.com/)
 */
export abstract class ScraperApiScraper extends Scraper {
    /**
     * External url indicating the scraper's target resource.
     */
    public url: string;

    /**
     * used for caching failed results, to blacklist further calls
     */
    public redis: RedisHelper;

    /**
     * Stores the DOM retrieved by [scraperapi](https://www.scraperapi.com/)
     */
    protected scrapeRoot: ParseElement;

    public constructor(
        url: string,
        description: string,
        verbose?: boolean,
    ) {
        super(description, verbose);
        this.url = url;
        this.redis = RedisHelper.getConnection();
    }

    /**
     * Queries [scraperapi](https://www.scraperapi.com/) for [[ScraperApiScraper.url]]
     *
     * Required ```.env``` variables:
     * - **```SCRAPER_API_KEY```**: [scraperapi dashboard](https://www.scraperapi.com/dashboard)
     * - **```SCRAPER_API_REQUEST_ATTEMPTS```**: Times a request is allowed to fail before error
     * is thrown
     *
     * @param attempts Tracks the number of times a given request has failed, used to track
     * recurring calls to this function. Should never be set if called externally.
     */
    public async requestScrape(attempts = 0): Promise<void> {
        Log.log(`Checking url blacklist for ${this.url}`);
        const inBlacklist = await this.redis.get(this.url);
        if(inBlacklist != null) {
            throw new Error('URL Blacklisted\n');
        }
        try {
            Log.log(`Requesting ${this.url}`);
            const bodyString: string = await getRequestBody(
                `http://api.scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=${this.url}`,
            );
            Log.success(`Loaded ${this.url}`);
            const { body } = (new JSDOM(bodyString)).window.document;
            this.scrapeRoot = new ParseElement(body, this.description, true);
            return;
        } catch(e) {
            if(attempts <= Number(process.env.SCRAPER_API_REQUEST_ATTEMPTS)) {
                Log.notify(`Retrying request\nURL: ${this.url}\nAttempt: ${attempts + 1}`);
                await this.requestScrape(attempts + 1);
            } else {
                await this.redis.set(this.url, 'blacklisted');
                throw new Error(`Request failed ${attempts} times ${this.description}:\n${this.url} added to blacklist\n`);
            }
        }
    }

    protected async scrapeErrorHandler(error: Error): Promise<void> {
        await this.redis.set(this.url, 'blacklisted');
        Log.err(`Scrape of ${this.description} failed.\nError: ${error.message}\n${this.url} added to blacklist\n`);
        throw error;
    }
}
