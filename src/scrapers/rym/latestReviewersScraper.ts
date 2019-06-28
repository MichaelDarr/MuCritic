import { Log } from '../../helpers/classes/log';
import { ProfileScraper } from './profileScraper';
import { LatestReviewsPageScraper } from './latestReviewsPageScraper';
import { Scraper } from '../scraper';

/**
 * Manages the scraping and storage of profiles taken from the "latest reviews" section of
 * [Rate Your Music](https://rateyourmusic.com/).
 */
export class LatestReviewersScraper extends Scraper {
    public concurrentScrapes: number;

    public offset: number;

    public static urlBase = 'http://rateyourmusic.com/latest?offset=';

    public constructor(
        initialOffset = 0,
        concurrentScrapes = 1,
        verbose = false,
    ) {
        super(
            'RYM Lastest Review Profiles',
            verbose,
        );
        this.concurrentScrapes = concurrentScrapes;
        this.offset = initialOffset;
    }

    /**
     * Scrapes the lastest review page
     * - On success: Iterates [[ReviewPageScraper.currentPage]], sets
     * [[ReviewPageScraper.sequentialFailureCount]] to 0
     * - On failure: Iterates [[ReviewPageScraper.sequentialFailureCount]]
     */
    public async requestScrape(): Promise<void> {
        try {
            const pageScrapers: LatestReviewsPageScraper[] = [];
            for(let i = 0; i < this.concurrentScrapes; i += 1) {
                pageScrapers.push(new LatestReviewsPageScraper(this.offset));
                this.offset += 15;
            }
            await Promise.all(pageScrapers.map(scraper => scraper.scrape(true)));
            Log.notify(`\nLastest review page scrape successful!\nNext review: #${this.offset}\n`);
        } catch(e) {
            Log.err(`\nError scraping review pages: #${this.offset}\n`);
        }
    }

    public printInfo(): void {
        Log.log(`Offset: ${this.offset}`);
    }
}
