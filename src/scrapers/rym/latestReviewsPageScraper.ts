import { getConnection, Repository } from 'typeorm';

import { ProfileEntity } from '../../entities/entities';
import { Log } from '../../helpers/classes/log';
import { ParseElement } from '../../helpers/parsing/parseElement';
import { ProfileScraper } from './profileScraper';
import { ScraperApiScraper } from '../scraperApiScraper';
import { ReviewPageScraper } from './reviewPageScraper';

/**
 * Manages the scraping and storage of profiles taken from the "latest reviews" section of
 * [Rate Your Music](https://rateyourmusic.com/).
 */
export class LatestReviewsPageScraper extends ScraperApiScraper {
    public offset: number;

    public repository: Repository<ProfileEntity>;

    /**
     * Array of between 0 and 15 of [[ProfileScraper]] instances per page
     */
    public profileScrapers: ProfileScraper[];

    public constructor(
        offset,
        verbose = false,
    ) {
        super(
            `http://rateyourmusic.com/latest?offset=${offset}`,
            'RYM Lastest Review Profiles',
            verbose,
        );
        this.offset = offset;
        this.profileScrapers = [];
        this.repository = getConnection().getRepository(ProfileEntity);
    }

    protected async scrapeDependencies(forceScrape = false): Promise<void> {
        const res = await LatestReviewsPageScraper
            .scrapeDependencyArr<ProfileScraper>(this.profileScrapers, forceScrape);
        this.profileScrapers = res.scrapers;
        this.results.concat(res.results);
        for await(const scraper of this.profileScrapers) {
            const reviewPageScraper = new ReviewPageScraper(scraper);
            while(
                reviewPageScraper.pageReviewCount > 0
                && reviewPageScraper.sequentialFailureCount < 3
            ) {
                await reviewPageScraper.scrapePage();
            }
        }
    }

    protected extractInfo(): void {
        const reviewParsers = this.scrapeRoot
            .list('#content > table', 'review list', true)
            .allElements('single review');

        reviewParsers.forEach((reviewParser: ParseElement): void => {
            try {
                let profileName = reviewParser.element('b > a.usero', 'profile link', false).innerHTML();
                if(profileName == null || profileName === '') {
                    profileName = reviewParser.element('b > a.user', 'profile link', true).innerHTML();
                }
                const profileScraper = new ProfileScraper(profileName);
                this.profileScrapers.push(profileScraper);
            } catch(e) {
                Log.err(`Failed to extract profile link from review element.\n${e}`);
            }
        });
    }

    public printInfo(): void {
        Log.log(`Offset: ${this.offset}`);
    }
}
