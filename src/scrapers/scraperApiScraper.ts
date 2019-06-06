import { requestRawScrape } from '../helpers/functions/index';
import { ParseElement } from '../helpers/parsing/index';
import { Scraper } from './index';

export abstract class ScraperApiScraper extends Scraper {
    /**
     * External url indicating the scraper's target resource.
     */
    public url: string;

    protected scrapeRoot: ParseElement;

    public async requestScrape(): Promise<void> {
        this.scrapeRoot = await requestRawScrape(this.url, this.description);
    }
}
