/**
 * Manages the scraping and storage of a user's review pages from
 * [Rate Your Music](https://rateyourmusic.com/). See [[Scraper]] for more details.
 */

import { getConnection, Repository } from 'typeorm';

import { AlbumScraper } from './albumScraper';
import { ReviewEntity } from '../../entities/entities';
import { Log } from '../../helpers/classes/log';
import { ReviewScraper } from './reviewScraper';
import { SimpleDate } from '../../helpers/classes/simpleDate';
import { stringToNum } from '../../helpers/functions/typeManips';
import { ParseElement } from '../../helpers/parsing/parseElement';
import { ProfileScraper } from './profileScraper';
import { ScraperApiScraper } from '../scraperApiScraper';

/**
 * Manages the scraping and storage of all review pages for a single
 * [Rate Your Music](https://rateyourmusic.com/) user.
 *
 * This class utilize the
 * [scraperapi](https://www.scraperapi.com/), but unlike other RYM scrapers, has no one-to-one
 * relationship to a single database entity. [[RymScraper]]'s data flow necessitates this
 * relationship, so [[ReviewPageScraper]] extends [[ScraperApiScraper]] instead of [[RymScraper]].
 */
export class ReviewPageScraper extends ScraperApiScraper {
    public currentPage: number;

    public name: string;

    public pageReviewCount: number;

    public profile: ProfileScraper;

    public repository: Repository<ReviewEntity>;

    /**
     * Array of 0 and 25 of [[Review]] instances per page
     */
    public reviewScrapers: ReviewScraper[];

    /**
     * Review page URL, without a page number. Example:
     *
     * ```https://rateyourmusic.com/collection/frenchie/r0.0-5.0/```
     */
    public urlBase: string;

    /**
     * Number of times [[ReviewPage.scrapePage]] has failed for current [[ReviewPage.currentPage]]
     */
    public sequentialFailureCount: number;

    public constructor(
        profile: ProfileScraper,
        verbose = false,
    ) {
        const urlBase = `https://rateyourmusic.com/collection/${profile.name}/r0.0-5.0/`;
        super(
            `RYM Review Page: ${profile.name}`,
            verbose,
        );
        this.urlBase = urlBase;
        this.url = `${urlBase}1`;
        this.currentPage = 1;
        this.reviewScrapers = [];
        this.profile = profile;
        this.pageReviewCount = 25;
        this.sequentialFailureCount = 0;
        this.repository = getConnection().getRepository(ReviewEntity);
    }

    /**
     * Scrapes the review page for a user.
     * - On success: Iterates [[ReviewPageScraper.currentPage]], sets
     * [[ReviewPageScraper.sequentialFailureCount]] to 0
     * - On failure: Iterates [[ReviewPageScraper.sequentialFailureCount]]
     */
    public async scrapePage(): Promise<void> {
        Log.notify(`Scraping page ${this.currentPage} for user ${this.profile.name}`);
        try {
            this.url = `${this.urlBase}${this.currentPage}`;
            this.reviewScrapers = [];
            await this.scrape(true);
            this.currentPage += 1;
            this.sequentialFailureCount = 0;
            Log.notify(`\nReview page scrape Successful!\nPage: ${this.currentPage}\nUser: ${this.profile.name}\n`);
        } catch(e) {
            this.sequentialFailureCount += 1;
        }
    }

    protected async scrapeDependencies(): Promise<void> {
        const res = await ReviewPageScraper.scrapeDependencyArr<ReviewScraper>(this.reviewScrapers);
        this.reviewScrapers = res.scrapers;
        this.results.concat(res.results);
    }

    protected extractInfo(): void {
        const reviewParsers = this.scrapeRoot
            .list('table.mbgen > tbody > tr', 'review blocks', false)
            .allElements();

        this.pageReviewCount = 0;
        reviewParsers.forEach((reviewParser: ParseElement, i): void => {
            if(i === 0) return;

            try {
                const albumLinkPartial = reviewParser
                    .element(
                        'td.or_q_albumartist_td > div.or_q_albumartist > i > a.album',
                        'album link',
                        true,
                    ).href();
                const album = new AlbumScraper(
                    `https://rateyourmusic.com${encodeURI(albumLinkPartial)}`,
                );

                const starsText = reviewParser
                    .element('td.or_q_rating_date_s > img', 'star image', true)
                    .prop('title');
                const starsNumberText: string = starsText.split(' ')[0];
                const reviewScore = stringToNum(starsNumberText);

                const identifierRYM = reviewParser
                    .element('td.or_q_rating_date_s > span', 'identifier')
                    .textContent();

                const dateParse = reviewParser.element(
                    'td.or_q_rating_date_d',
                    'date element',
                    true,
                );
                const month = dateParse.element('div.date_element_month', 'month').textContent();
                const day = dateParse.element('div.date_element_day', 'day').number();
                const year = dateParse.element('div.date_element_year', 'year').number();
                const reviewDate = new SimpleDate(month, day, year);

                const newReview = new ReviewScraper(
                    album,
                    this.profile,
                    reviewScore,
                    identifierRYM,
                    reviewDate,
                );
                this.pageReviewCount += 1;
                this.reviewScrapers.push(newReview);
            } catch(e) {
                Log.err(`Failed to extract data from review element.\n${e}`);
            }
        });
    }

    public printInfo(): void {
        Log.log(`Profile: ${this.profile.name}`);
        Log.log(`Pages: ${this.currentPage}`);
        Log.log(`Current Page Failures: ${this.sequentialFailureCount}`);
    }
}
