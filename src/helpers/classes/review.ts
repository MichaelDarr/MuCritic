/**
 * @fileOverview Manages a single user review on RYM. Used by Profile class
 *
 * @author  Michael Darr
 */

// library internal class dependencies
import { Date } from './date';
import { AlbumScraper } from '../../scrapers/albumScraper';
import { ProfileScraper } from '../../scrapers/profileScraper';

export class Review {
    public album: AlbumScraper;

    public score: number;

    public date: Date;

    public identifierRYM: string;

    public profile: ProfileScraper;

    /**
     *
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
