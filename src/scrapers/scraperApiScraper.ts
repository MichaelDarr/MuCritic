import { JSDOM } from 'jsdom';

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
     * Stores the DOM retrieved by [scraperapi](https://www.scraperapi.com/)
     */
    protected scrapeRoot: ParseElement;

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
                throw new Error(`Giving up: request failed ${attempts} times:\n${this.url}.`);
            }
        }
    }
}
