import { SimpleDate } from './simpleDate';
import { AlbumScraper } from '../../scrapers/rym/albumScraper';
import { ProfileScraper } from '../../scrapers/rym/profileScraper';

/**
 * Holds review information for [[ReviewPageScraper]]
 */
export class Review {
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
        this.album = album;
        this.profile = profile;
        this.score = score;
        this.identifierRYM = identifierRYM;
        this.date = date;
    }
}
