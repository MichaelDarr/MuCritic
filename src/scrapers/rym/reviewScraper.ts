import { getConnection } from 'typeorm';

import { AlbumScraper } from './albumScraper';
import { ReviewEntity } from '../../entities/entities';
import { SimpleDate } from '../../helpers/classes/simpleDate';
import { ProfileScraper } from './profileScraper';
import { Scraper } from '../scraper';

/**
 * Scrapes review information. Behavior for scraping reviews albumost entirely handled by
 * [[ReviewPageScraper]].
 */
export class ReviewScraper extends Scraper {
    public album: AlbumScraper;

    public score: number;

    public date: SimpleDate;

    public identifierRYM: string;

    public profile: ProfileScraper;

    public constructor(
        album: AlbumScraper,
        profile: ProfileScraper,
        score: number,
        identifierRYM: string,
        date: SimpleDate,
    ) {
        super(`Review of ${album.url} by user ${profile.name}`);
        this.album = album;
        this.profile = profile;
        this.score = score;
        this.identifierRYM = identifierRYM;
        this.date = date;
    }

    protected async saveToLocal(): Promise<void> {
        let reviewEntity = await getConnection().manager.findOne(
            ReviewEntity,
            { identifierRYM: this.identifierRYM },
        );
        if(reviewEntity == null) {
            reviewEntity = new ReviewEntity();
            reviewEntity.album = await this.album.getEntity();
            reviewEntity.profile = await this.profile.getEntity();
            reviewEntity.score = this.score;
            reviewEntity.year = this.date.year;
            reviewEntity.month = this.date.month;
            reviewEntity.day = this.date.day;
            reviewEntity.identifierRYM = this.identifierRYM;
            if(!reviewEntity.album) {
                throw new Error(`Album not found for review by user ${this.profile.name}`);
            }
            if(!reviewEntity.profile) {
                throw new Error(`Profile not found for album: ${this.album.name}`);
            }
            reviewEntity = await getConnection().manager.save(reviewEntity);
        }
    }

    protected async scrapeDependencies(): Promise<void> {
        await this.album.scrape();
        this.results.concat(this.album.results);
    }
}
