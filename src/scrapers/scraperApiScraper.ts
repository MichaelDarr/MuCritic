import * as request from 'request';
import { JSDOM } from 'jsdom';

import { ParseElement } from '../helpers/parsing/parseElement';
import { Log } from '../helpers/classes/log';
import { Scraper } from './scraper';

export abstract class ScraperApiScraper extends Scraper {
    /**
     * External url indicating the scraper's target resource.
     */
    public url: string;

    protected scrapeRoot: ParseElement;

    public async requestScrape(attempts = 0): Promise<void> {
        try {
            Log.log(`Requesting ${this.url}`);
            const bodyString: string = await ScraperApiScraper.getRequestBody(`http://api.scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=${this.url}`);
            Log.success(`Loaded ${this.url}`);
            const { body } = (new JSDOM(bodyString)).window.document;
            this.scrapeRoot = new ParseElement(body, this.description, true);
            return;
        } catch(e) {
            Log.err(`Attempt ${attempts}: page load failed: ${e}`);
        }

        if(attempts <= Number(process.env.MAX_REQUEST_ATTEMPTS)) {
            await this.requestScrape(attempts + 1);
            return;
        }
        throw new Error(`Page load for ${this.url} failed ${attempts} times`);
    }

    private static async getRequestBody(url: string): Promise<string> {
        return new Promise((resolve, reject): void => {
            request(
                url,
                { timeout: 10000 },
                (error, _, body): void => {
                    if(error) {
                        reject(new Error(`request failed for ${url}`));
                    }
                    resolve(body);
                },
            );
        });
    }
}
