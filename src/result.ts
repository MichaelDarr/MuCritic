/**
 * @fileOverview Unified reporting of scrape results
 *
 * @author  Michael Darr
 */

// internal dependencies
import Log from './logger';
import { Api } from './enums';

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
    public constructor(
        success: boolean,
        scrapingURL: string,
        error?: string,
    ) {
        this.success = success;
        this.scrapingURL = scrapingURL;
        this.error = error;
    }

    public logError(): void {
        Log.err(this.error);
    }
}

/**
 * Result for a single api request
 */
export class ApiResult {
    public success: boolean;

    public api: Api;

    public route: string;

    public paramDescription: string;

    public error: string;

    /**
     *
     * @param urlRYM link to artist profile on Rate Your Music
     */
    public constructor(
        success: boolean,
        api: Api,
        route: string,
        paramDescription: string,
        error?: string,
    ) {
        this.success = success;
        this.api = api;
        this.route = route;
        this.paramDescription = paramDescription;
        this.error = error;
    }

    public logError(): void {
        Log.err(
            `Scrape error:\nAPI: ${this.api}\nRoute: ${this.route}\nParams: ${this.paramDescription}\nError: ${this.error}`,
        );
    }
}

/**
 * Result for a batch of scraped pages
 */
export class ResultBatch {
    public scrapingResults: ScrapingResult[];

    public apiResults: ApiResult[];

    public constructor() {
        this.scrapingResults = [];
        this.apiResults = [];
    }

    /**
     * Add single scraping result into this one
     *
     * @param scrapingResult single scraping result
     */
    public push(result: ScrapingResult | ApiResult): ResultBatch {
        if(result instanceof ScrapingResult) {
            this.scrapingResults.push(result);
        } if(result instanceof ApiResult) {
            this.apiResults.push(result);
        }
        return this;
    }

    /**
     * Add entire batch of scraping results into this one
     *
     * @param moreResults batch of results
     */
    public concat(moreResults: ResultBatch): ResultBatch {
        moreResults.scrapingResults.forEach((result): void => {
            this.push(result);
        });
        moreResults.apiResults.forEach((result): void => {
            this.push(result);
        });
        return this;
    }

    /**
     * Determine if every scrape in batch succeeded
     *
     * @return boolean, if every scrape in batch succeeded
     */
    public success(): boolean {
        let requestsSuccessful = true;
        this.scrapingResults.forEach((scrapingResult): void => {
            if(!scrapingResult.success) requestsSuccessful = false;
        });
        this.apiResults.forEach((apiResult): void => {
            if(!apiResult.success) requestsSuccessful = false;
        });
        return requestsSuccessful;
    }

    /**
     * Determine if every scrape in batch succeeded
     *
     * @return boolean, if every scrape in batch succeeded
     */
    public logErrors(): void {
        this.scrapingResults.forEach((scrapingResult): void => {
            if(!scrapingResult.success) {
                scrapingResult.logError();
            }
        });
        this.apiResults.forEach((apiResult): void => {
            if(!apiResult.success) {
                apiResult.logError();
            }
        });
    }
}
