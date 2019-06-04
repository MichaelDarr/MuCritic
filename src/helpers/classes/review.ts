/**
 * Holds review information for [[ReviewPageScraper]]
 */

import { Date } from './index';
import {
    AlbumScraper,
    ProfileScraper,
} from '../../scrapers/index';

export class Review {
    public album: AlbumScraper;

    public score: number;

    public date: Date;

    public identifierRYM: string;

    public profile: ProfileScraper;

    /**
     * @param album album which the review refers to
     * @param score numeric representation of user score
     * @param date date when the album was reviewed
     */
    public constructor(
        album: AlbumScraper,
        profile: ProfileScraper,
        score: number,
        identifierRYM: string,
        date: Date,
    ) {
        this.album = album;
        this.profile = profile;
        this.score = score;
        this.identifierRYM = identifierRYM;
        this.date = date;
    }
}
