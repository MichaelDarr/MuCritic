/**
 * Unified reporting of scrape results
 */

import { Log } from './log';

/**
 * Result for a single scraped page
 */
export class ScrapeResult {
    public readonly success: boolean;

    public readonly url: string;

    public readonly error: string | Error;

    public constructor(
        success: boolean,
        url: string,
        error?: string | Error,
    ) {
        this.success = success;
        this.url = url;
        this.error = error;
    }

    public logError(): void {
        if(this.success) return;
        Log.err(
            `Scrape error:\nURL: ${this.url}\nError: ${this.error}`,
        );
    }
}

/**
 * Result for a single api request
 */
export class ApiResult {
    public readonly success: boolean;

    public readonly route: string;

    public readonly description: string;

    public readonly error: string | Error;

    public constructor(
        success: boolean,
        route: string,
        description: string,
        error?: string | Error,
    ) {
        this.success = success;
        this.route = route;
        this.description = description;
        this.error = error;
    }

    public logError(): void {
        if(this.success) return;
        Log.err(
            `Api error:\nRoute: ${this.route}\nCall: ${this.description}\nError: ${this.error}`,
        );
    }
}

/**
 * Collection of scrape/api results
 */
export class ResultBatch {
    public readonly scrapeResults: ScrapeResult[];

    public readonly apiResults: ApiResult[];

    public constructor() {
        this.scrapeResults = [];
        this.apiResults = [];
    }

    /**
     * Add collection of results (mutatates)
     *
     * @param moreResults batch of results
     * @returns mutated results
     */
    public concat(moreResults: ResultBatch): ResultBatch {
        moreResults.scrapeResults.forEach((result): void => {
            this.push(result);
        });
        moreResults.apiResults.forEach((result): void => {
            this.push(result);
        });
        return this;
    }

    public logErrors(): void {
        this.scrapeResults.forEach((scrapeResult): void => {
            if(!scrapeResult.success) {
                scrapeResult.logError();
            }
        });
        this.apiResults.forEach((apiResult): void => {
            if(!apiResult.success) {
                apiResult.logError();
            }
        });
    }

    /**
     * Add single result (mutates)
     *
     * @param result single scraping result
     * @returns mutated results
     */
    public push(result: ScrapeResult | ApiResult): ResultBatch {
        if(result instanceof ScrapeResult) {
            this.scrapeResults.push(result);
        } if(result instanceof ApiResult) {
            this.apiResults.push(result);
        }
        return this;
    }

    /**
     * @returns true if every scrape in batch succeeded
     */
    public success(): boolean {
        let requestsSuccessful = true;
        this.scrapeResults.forEach((scrapingResult): void => {
            if(!scrapingResult.success) requestsSuccessful = false;
        });
        this.apiResults.forEach((apiResult): void => {
            if(!apiResult.success) requestsSuccessful = false;
        });
        return requestsSuccessful;
    }
}
