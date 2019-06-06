/**
 * Abstract superclass for all "scrapers"
 */

import {
    Log,
    ResultBatch,
    ScrapeResult,
} from '../helpers/classes/index';

/**
 * Abstract superclass for all "scrapers"
 *
 * @remarks
 * This abstract class describes a standardized method of scraping web pages and saving the
 * results. Its structure is specifically engineered to support complex, relational data stored
 * in a RDBMS such as Postgres. An subclass of AbstractScraper generally describes the process of
 * scraping one type of webpage into one database table. Each instance of a class extending
 * AbstractScraper corresponds to the scrape of one specific URL. The general use pattern for an
 * instance of such as class is to first call the constructor, then [[Scraper.scrape]].
 */
export abstract class Scraper {
    /**
     * Scrapers always check for a local copy of the target resource (using
     * [[Scraper.getEntity]]) before executing a scrape from an external resource. If the
     * resource was found (and therefore no external calls made), this flag is set to true.
     */
    public dataReadFromDB: boolean;

    /**
     * Contains all results generated by [[Scraper.scrape]], including recursive calls.
     */
    public results: ResultBatch;

    /**
     * A simple, human-readble description of *what* is being scraped. Used for logging.
     */
    public description: string;

    /**
     * Used to override .env settings and force-log the output of a given scraper.
     */
    public verbose: boolean;

    /**
     * Flag indicating a sucessful scrape, set to true after non-error-throwing call to
     * [[Scraper.scrape]].
     */
    public scrapeSucceeded: boolean;

    /**
     * @param url see [[Scraper.url]]
     * @param description see [[Scraper.description]]
     * @param verbose see [[Scraper.verbose]]
     */
    public constructor(
        description: string,
        verbose?: boolean,
    ) {
        this.verbose = verbose || false;
        this.description = description;
        this.results = new ResultBatch();
        this.dataReadFromDB = false;
        this.scrapeSucceeded = false;
    }

    /**
     * Entry point for initiating an asset scrape. General scrape outline/method order:
     *
     * 1. [[Scraper.getEntity]]
     * 2. If local entity was found, update class props and return.
     * 3. [[Scraper.requestScrape]]
     * 4. [[Scraper.extractInfo]]
     * 5. [[Scraper.scrapeDependencies]]
     * 6. [[Scraper.saveToDB]]
     * 7. Update class props and return
     *
     * @remarks
     * This method should be considered **unsafe** - there are several points where this can throw
     * errors. This is intentional, and allows easier support for **relational data storage**.
     * Scraped assets may have a mixture of required and non-required dependencies (scraped in
     * [[Scraper.scrapeDependencies]]). For example, when [[AlbumScraper.scrape]] is
     * called, it must find an artist, but not necessarily a genre. In this case,
     * [[AlbumScraper]]'s execution of [[ArtistScraper.scrape]] **should not** be wrapped in a
     * try/catch block - an error thrown by [[ArtistScraper.scrape]] should propogate through the
     * [[AlbumScraper]], resulting in the original call to [[AlbumScraper.scrape]] throwing an
     * error. However, [[AlbumScraper]]'s the execution of [[GenreScraper.scrape]] **should** be
     * wrapped in a try/catch block, as the entirety of [[AlbumScraper.scrape]] shouldn't fail
     * because of one unsuccessful genre scrape.
     *
     * @param forceScrape If set to true, scrapes the external resource regardless of any existing
     * local records
     */
    public async scrape(forceScrape = false): Promise<void> {
        Log.notify(`Beginning Scrape of ${this.description}`);
        const recordExists = await this.checkForLocalRecord();
        if(recordExists && !forceScrape) {
            this.dataReadFromDB = true;
            this.results.push(new ScrapeResult(true, this.description));
            this.scrapeSucceeded = true;
            Log.success(`Local Record Found for ${this.description}`);
            return;
        }
        await this.requestScrape();
        this.extractInfo();
        await this.scrapeDependencies();
        await this.saveToDB();
        this.results.push(new ScrapeResult(true, this.description));
        this.scrapeSucceeded = true;
        Log.success(`Finished Scrape of ${this.description}`);
    }

    /**
     * Simple CLI reporting tool for debugging unsuccessful scrapes
     */
    public printResult(): void {
        if(this.scrapeSucceeded === false) {
            Log.err(`Scrape failed for album url:\n${this.description}`);
        } else if(this.dataReadFromDB) {
            Log.success(
                `Scrape unnecessary, record exists in database: ${this.description}`,
            );
        } else {
            Log.success(
                `Scrape successful\nURL: ${this.description}`,
            );
        }
    }

    /**
     * Extracts information from a scraped resource **synchronously**
     *
     * @remarks
     * Must be called after [[Scraper.requestScrape]].
     *
     * Extracted info should be stored into class properties, to be
     * saved later by [[Scraper.saveToDB]]. Stores constructed (**but not .scrape()'ed**)
     * instances of any more recursive scrapes extracted from this one, to later be scraped by
     * [[Scraper.scrapeDependencies]].
     */
    protected abstract extractInfo(): void;

    /**
     * Gets the local stored record corresponding to a given scraper. Should return null if no
     * local record is found
     */
    public abstract checkForLocalRecord(): Promise<boolean>;

    /**
     * Requests and stores an external resource, to be parsed later by
     * [[Scraper.extractInfo]].
     */
    public abstract requestScrape(): Promise<void>;

    /**
     * Prints a detailed report of local properties for a scraper, used for debugging
     */
    public abstract printInfo(): void;

    /**
     * Saves scraped, extracted, and parsed information into a local record, which can be retrieved
     * later by [[Scraper.getEntity]]
     *
     * @remarks
     * This method must be called after [[Scraper.requestScrape]],
     * [[Scraper.extractInfo]], and [[Scraper.scrapeDependencies]]
     *
     * @returns the entity that was saved
     */
    protected abstract async saveToDB(): Promise<void>;

    /**
     * Executes [[Scraper.scrape]] on any recursive scrapes found in the initial scrape.
     * See [[Scraper.scrape]] for more information on implementation.
     *
     * @remarks
     * This method must be called after [[Scraper.requestScrape]] and
     * [[Scraper.extractInfo]]
     *
     * @returns the entity that was saved
     */
    protected abstract async scrapeDependencies(): Promise<void>;
}
