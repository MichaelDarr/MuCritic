/**
 * Manages the scraping and storage of a user's review pages from
 * [Rate Your Music](https://rateyourmusic.com/). See [[Scraper]] for more details.
 */

import { getConnection, Repository } from 'typeorm';

import { AlbumScraper } from './albumScraper';
import { ReviewEntity } from '../../entities/entities';
import { Log } from '../../helpers/classes/log';
import { ScrapeResult } from '../../helpers/classes/result';
import { Review } from '../../helpers/classes/review';
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
    public reviews: Review[];

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
        this.reviews = [];
        this.profile = profile;
        this.pageReviewCount = 25;
        this.sequentialFailureCount = 0;
        this.repository = getConnection().getRepository(ReviewEntity);
    }

    public async scrapePage(): Promise<void> {
        Log.notify(`Scraping page ${this.currentPage} for user ${this.profile.name}`);
        try {
            this.url = `${this.urlBase}${this.currentPage}`;
            this.reviews = [];
            await this.scrape(true);
            this.currentPage += 1;
            this.sequentialFailureCount = 0;
            Log.notify(`\nReview page scrape Successful!\nPage: ${this.currentPage}\nUser: ${this.profile.name}\n`);
        } catch(e) {
            this.sequentialFailureCount += 1;
        }
    }

    public async getAllReviews(): Promise<ReviewEntity[]> {
        const reviewEntities: ReviewEntity[] = [];
        for await(const review of this.reviews) {
            const entity = await this.repository.findOne(
                { identifierRYM: review.identifierRYM },
            );
            if(entity) reviewEntities.push(entity);
        }
        return reviewEntities;
    }

    protected async scrapeDependencies(): Promise<void> {
        const successfullyScrapedReviews: Review[] = [];
        for await(const review of this.reviews) {
            try {
                await review.album.scrape();
                successfullyScrapedReviews.push(review);
                this.results.concat(review.album.results);
            } catch(e) {
                Log.err(`ERROR SCRAPING REVIEW: ${e.message}`)
                this.results.push(
                    new ScrapeResult(false, this.url, e.message),
                );
            }
        }
        this.reviews = successfullyScrapedReviews;
    }

    protected async saveToLocal(): Promise<void> {
        for await(const review of this.reviews) {
            try {
                let reviewEntity = await this.repository.findOne(
                    { identifierRYM: review.identifierRYM },
                );
                if(reviewEntity == null) {
                    reviewEntity = new ReviewEntity();
                    reviewEntity.album = await review.album.getEntity();
                    reviewEntity.profile = await this.profile.getEntity();
                    reviewEntity.score = review.score;
                    reviewEntity.year = review.date.year;
                    reviewEntity.month = review.date.month;
                    reviewEntity.day = review.date.day;
                    reviewEntity.identifierRYM = review.identifierRYM;
                    if(!reviewEntity.album) {
                        throw new Error(`Album not found for review: ${this.name}`);
                    }
                    if(!reviewEntity.profile) {
                        throw new Error(`Profile not found for album: ${this.name}`);
                    }
                    reviewEntity = await this.repository.save(reviewEntity);
                }
            } catch(e) {
                this.results.push(new ScrapeResult(false, this.url, `${e.name}: ${e.message}`));
            }
        }
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

                const newReview = new Review(
                    album,
                    this.profile,
                    reviewScore,
                    identifierRYM,
                    reviewDate,
                );
                this.pageReviewCount += 1;
                this.reviews.push(newReview);
            } catch(e) {
                Log.err(`Failed to extract data from review element.\n${e}`);
            }
        });
    }

    public printInfo(): void {
        Log.log(`Profile: ${this.profile.name}`);
        Log.log(`Pages: ${this.currentPage}`);
    }
}
