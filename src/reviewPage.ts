/**
 * @fileOverview Manages scraping of a user's review pages
 *
 * @author  Michael Darr
 */

// library dependencies
import { getManager, EntityManager } from 'typeorm';

// internal class dependencies
import { ScrapingResult, ScrapingResultBatch } from './scrapingResult';
import Review from './review';
import Album from './album';
import Date from './date';
import Profile from './profile';
import Log from './logger';

// other internal dependencies
import ScraperInterface from './interface';
import { requestScrape } from './connectionHelpers';

// database dependencies
import ReviewEntity from './entity/Review';

export default class ReviewPage implements ScraperInterface {
    public databaseID: number;

    public urlRYM: string;

    public urlUserameRYM: string;

    public currentPage: number;

    public reviews: Review[];

    public profile: Profile;

    public constructor(urlUserameRYM: string, profile: Profile) {
        this.urlUserameRYM = urlUserameRYM;
        this.urlRYM = `https://rateyourmusic.com/collection/${urlUserameRYM}/r0.0-5.0`;
        this.currentPage = 1;
        this.reviews = [];
        this.profile = profile;
    }

    public async scrape(): Promise<ScrapingResultBatch> {
        const results = new ScrapingResultBatch();
        const entityManager = getManager();
        try {
            let moreRecordsExist = true;
            while(moreRecordsExist) {
                const root: HTMLElement = await requestScrape(`${this.urlRYM}/${this.currentPage}`);
                const reviewScrapeResult: ScrapingResultBatch = await this.extractAllReviews(root);
                if(reviewScrapeResult.success()) {
                    Log.success(`Successfully scraped review page ${this.currentPage}, user ${this.urlUserameRYM}`);
                } else {
                    Log.err(`Scraping errors for review page ${this.currentPage}, user ${this.urlUserameRYM}`);
                    reviewScrapeResult.logErrors();
                }
                if(reviewScrapeResult.scrapingResults.length > 0) {
                    const dbSaveResults = await this.saveToDB(entityManager);
                    if(dbSaveResults.success()) {
                        Log.success(`Successfully saved review page ${this.currentPage}, user ${this.urlUserameRYM}`);
                    } else {
                        Log.err(`Save errors for review page ${this.currentPage}, user ${this.urlUserameRYM}`);
                        dbSaveResults.logErrors();
                    }
                    this.reviews = [];
                    this.currentPage += 1;
                } else {
                    moreRecordsExist = false;
                }
            }
        } catch(e) {
            this.currentPage = 0;
            Log.err(`Failed review scrape: ${this.urlRYM}`);
            return results.push(new ScrapingResult(false, this.urlRYM, `${e.name}: ${e.message}`));
        }
        this.currentPage = 0;
        return results.push(new ScrapingResult(true, this.urlRYM));
    }

    public async saveToDB(entityManager: EntityManager): Promise<ScrapingResultBatch> {
        const results = new ScrapingResultBatch();
        for await(const review of this.reviews) {
            try {
                let reviewEntity = await entityManager.findOne(ReviewEntity, {
                    identifierRYM: review.identifierRYM,
                });
                if(reviewEntity !== null && reviewEntity !== undefined) {
                    continue;
                }
                reviewEntity = new ReviewEntity();
                reviewEntity.album = await review.album.getEntity();
                reviewEntity.profile = await this.profile.getEntity();
                reviewEntity.score = review.score;
                reviewEntity.year = review.date.year;
                reviewEntity.month = review.date.month;
                reviewEntity.day = review.date.day;
                reviewEntity.identifierRYM = review.identifierRYM;
                reviewEntity = await entityManager.save(reviewEntity);
            } catch(e) {
                Log.err(`Failed to save album review: ${review.identifierRYM}`);
                results.push(new ScrapingResult(false, this.urlRYM, `${e.name}: ${e.message}`));
            }
        }
        return results;
    }

    /**
     * Find the database entity of a given artist
     *
     * @param entityManager database connection manager, typeORM
     * @returns an ArtistEntity, the saved database record for an artist
     */
    public async getEntity(): Promise<ReviewEntity[]> {
        const entityManager = getManager();
        const reviewEntities: ReviewEntity[] = [];
        for await(const review of this.reviews) {
            const reviewEntity = await entityManager.findOne(ReviewEntity, {
                identifierRYM: review.identifierRYM,
            });
            if(reviewEntity !== null && reviewEntity !== undefined) {
                reviewEntities.push(reviewEntity);
            }
        }
        return reviewEntities;
    }

    private async extractAllReviews(root: HTMLElement): Promise<ScrapingResultBatch> {
        const results = new ScrapingResultBatch();
        const parsedReviewArr: string[][] = [];
        const reviewElementArr = root.querySelectorAll('table.mbgen > tbody > tr');
        let isHeading = true;
        reviewElementArr.forEach((reviewElement): void => {
            if(isHeading) {
                isHeading = false;
                return;
            }

            const dateElement = reviewElement.querySelector('td.or_q_rating_date_d');
            let month = '';
            let day = '0';
            let year = '0';
            if(dateElement !== null) {
                const monthElement: HTMLElement = dateElement.querySelector('div.date_element_month');
                if(monthElement !== null) month = monthElement.innerHTML;
                const dayElement: HTMLElement = dateElement.querySelector('div.date_element_day');
                if(dayElement !== null) day = dayElement.innerHTML;
                const yearElement: HTMLElement = dateElement.querySelector('div.date_element_year');
                if(yearElement !== null) year = yearElement.innerHTML;
            } else {
                return;
            }

            const starsElement: HTMLElement = reviewElement.querySelector('td.or_q_rating_date_s > img');
            if(starsElement === null) return;
            const starsText: string = starsElement.title;
            const starsTextArr: string[] = starsText.split(' ');
            const starsCount: string = starsTextArr[0];

            const idElement: HTMLElement = reviewElement.querySelector('td.or_q_rating_date_s > span');
            if(idElement === null) return;
            const identifierRYM = idElement.innerHTML;

            const albumLinkElement: HTMLElement = reviewElement.querySelector('td.or_q_albumartist_td > div.or_q_albumartist > i > a.album');
            if(albumLinkElement == null) return;
            const albumLinkPartial: string = (albumLinkElement as any).href;
            parsedReviewArr.push([
                month,
                day,
                year,
                starsCount,
                `https://rateyourmusic.com${encodeURI(albumLinkPartial)}`,
                identifierRYM,
            ]);
        });

        for await(const singleReview of parsedReviewArr) {
            const reviewDate = new Date(
                singleReview[0],
                Number(singleReview[1]),
                Number(singleReview[2]),
            );
            const reviewScore = Number(singleReview[3]);
            const album = new Album(singleReview[4]);
            const identifierRYM = singleReview[5];
            const albumScrapeResults: ScrapingResultBatch = await album.scrape();
            results.concat(albumScrapeResults);
            if(albumScrapeResults.success()) {
                const newReview = new Review(
                    album,
                    this.profile,
                    reviewScore,
                    identifierRYM,
                    reviewDate,
                );
                this.reviews.push(newReview);
            } else {
                albumScrapeResults.logErrors();
            }
        }

        return results;
    }

    public printSuccess(): void {
        Log.success(`Successfully scraped ${this.profile.name}'s reviews`);
    }

    public printInfo(): void {
        Log.log(`Profile: ${this.profile.name}`);
        Log.log(`Pages: ${this.currentPage}`);
    }
}
