import { requestRawScrape } from '../helpers/functions/request';
import { ParseElement } from '../helpers/parsing/parseElement';
import { Scraper } from './scraper';

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
