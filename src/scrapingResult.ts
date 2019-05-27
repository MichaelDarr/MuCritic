/**
 * @fileOverview Unified reporting of scrape results
 *
 * @author  Michael Darr
 */

// internal dependencies
import Log from './logger';

/**
 * Result for a single scraped page
 */
export class ScrapingResult {
    public success: boolean;

    public scrapingURL: string;

    public error: string;

    /**
     *
     * @param urlRYM link to artist profile on Rate Your Music
     */
    public constructor(success: boolean, scrapingURL: string, error?: string) {
        this.success = success;
        this.scrapingURL = scrapingURL;
        this.error = error;
    }
}

/**
 * Result for a batch of scraped pages
 */
export class ScrapingResultBatch {
    public scrapingResults: ScrapingResult[];

    public constructor() {
        this.scrapingResults = [];
    }

    /**
     * Add single scraping result into this one
     *
     * @param scrapingResult single scraping result
     */
    public push(scrapingResult: ScrapingResult): ScrapingResultBatch {
        this.scrapingResults.push(scrapingResult);
        return this;
    }

    /**
     * Add entire batch of scraping results into this one
     *
     * @param moreResults batch of results
     */
    public concat(moreResults: ScrapingResultBatch): ScrapingResultBatch {
        for(const result of moreResults.scrapingResults) {
            this.push(result);
        }
        return this;
    }

    /**
     * Determine if every scrape in batch succeeded
     *
     * @return boolean, if every scrape in batch succeeded
     */
    public success(): boolean {
        let scrapeSuccessful = true;
        this.scrapingResults.forEach((scrapingResult): void => {
            if(!scrapingResult.success) scrapeSuccessful = false;
        });
        return scrapeSuccessful;
    }

    /**
     * Determine if every scrape in batch succeeded
     *
     * @return boolean, if every scrape in batch succeeded
     */
    public logErrors(): void {
        this.scrapingResults.forEach((scrapingResult): void => {
            if(!scrapingResult.success) {
                Log.err(scrapingResult.error);
            }
        });
    }
}
