/**
 * @fileOverview Manages scraping of a user's review pages
 *
 * @author  Michael Darr
 */

// library dependencies
import { getManager } from 'typeorm';

// helpers
import Date from '../helpers/classes/date';
import Log from '../helpers/classes/logger';
import Review from '../helpers/classes/review';
import { ScrapeResult } from '../helpers/classes/result';

// scrapers
import AbstractScraper from './abstractScraper';
import AlbumScraper from './albumScraper';
import ProfileScraper from './profileScraper';

// database dependencies
import ProfileEntity from '../entities/Profile';
import ReviewEntity from '../entities/Review';

export default class ReviewPageScraper extends AbstractScraper {
    public name: string;

    public currentPage: number;

    public reviews: Review[];

    public profile: ProfileScraper;

    public constructor(
        profile: ProfileScraper,
        verbose = false,
    ) {
        super(
            `https://rateyourmusic.com/collection/${profile.name}/r0.0-5.0`,
            'RYM Review Page',
            verbose,
        );
        this.currentPage = 1;
        this.reviews = [];
        this.profile = profile;
    }

    public async getAllReviews(): Promise<ReviewEntity[]> {
        const entityManager = getManager();
        const reviewEntities: ReviewEntity[] = [];
        for await(const review of this.reviews) {
            const entity = await entityManager.findOne(
                ReviewEntity,
                { identifierRYM: review.identifierRYM },
            );
            if(entity) reviewEntities.push(entity);
        }
        return reviewEntities;
    }

    public async getEntity(): Promise<ProfileEntity> {
        return this.profile.getEntity();
    }

    protected async scrapeDependencies(): Promise<void> {
        for await(const review of this.reviews) {
            try {
                await review.album.scrape();
                this.results.concat(review.album.results);
            } catch(e) {
                const failedReviewIndex = this.reviews.indexOf(review);
                if(failedReviewIndex > -1) this.reviews.splice(failedReviewIndex, 1);
                this.results.push(
                    new ScrapeResult(false, this.url, e.message)
                );
            }
        }
    }

    protected async saveToDB(): Promise<ProfileEntity> {
        const entityManager = getManager();
        for await(const review of this.reviews) {
            try {
                let reviewEntity = await entityManager.findOne(
                    ReviewEntity,
                    { identifierRYM: review.identifierRYM }
                );
                if(reviewEntity) continue;
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
                this.results.push(new ScrapeResult(false, this.url, `${e.name}: ${e.message}`));
            }
        }
        return this.profile.getEntity();
    }

    protected extractInfo(root: HTMLElement): void {
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

        for (const singleReview of parsedReviewArr) {
            const reviewDate = new Date(
                singleReview[0],
                Number(singleReview[1]),
                Number(singleReview[2]),
            );
            const reviewScore = Number(singleReview[3]);
            const album = new AlbumScraper(singleReview[4]);
            const identifierRYM = singleReview[5];
            const newReview = new Review(
                album,
                this.profile,
                reviewScore,
                identifierRYM,
                reviewDate,
            );
            this.reviews.push(newReview);
        }
    }

    public printInfo(): void {
        Log.log(`Profile: ${this.profile.name}`);
        Log.log(`Pages: ${this.currentPage}`);
    }
}
