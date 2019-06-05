/**
 * Unified reporting of scrape results
 */

import { Log } from './index';
import {
    ApiService,
    ScrapingSite,
} from '../types';

/**
 * Result for a single scraped page
 */
export class ScrapeResult {
    public success: boolean;

    public scrapingSite: ScrapingSite;

    public url: string;

    public pageDescription: string;

    public error: string | Error;

    /**
     * @param url attemped scraping url
     */
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
    public success: boolean;

    public apiService: ApiService;

    public route: string;

    public paramDescription: string;

    public error: string | Error;

    public constructor(
        success: boolean,
        apiService: ApiService,
        route: string,
        paramDescription: string,
        error?: string | Error,
    ) {
        this.success = success;
        this.apiService = apiService;
        this.route = route;
        this.paramDescription = paramDescription;
        this.error = error;
    }

    public logError(): void {
        if(this.success) return;
        Log.err(
            `Api error:\nAPI: ${this.apiService}\nRoute: ${this.route}\nParams: ${this.paramDescription}\nError: ${this.error}`,
        );
    }
}

/**
 * Result for a batch of scraped pages
 */
export class ResultBatch {
    public scrapeResults: ScrapeResult[];

    public apiResults: ApiResult[];

    public constructor() {
        this.scrapeResults = [];
        this.apiResults = [];
    }

    /**
     * Add single scraping result into this one
     *
     * @param result single scraping result
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
     * Add entire batch of scraping results into this one
     *
     * @param moreResults batch of results
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

    /**
     * Determine if every scrape in batch succeeded
     *
     * @return boolean, if every scrape in batch succeeded
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

    /**
     * Log every nonsucessful result in the batch
     */
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
}
