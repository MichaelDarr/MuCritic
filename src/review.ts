/**
 * @fileOverview Manages a single user review on RYM. Used by Profile class
 *
 * @author  Michael Darr
 */

// library internal class dependencies
import Date from './date';
import Album from './scrapers/albumScraper';
import Profile from './profile';

export default class Review {
    public album: Album;

    public score: number;

    public date: Date;

    public identifierRYM: string;

    public profile: Profile;

    /**
     *
     * @param album album which the review refers to
     * @param score numeric representation of user score
     * @param date date when the album was reviewed
     */
    public constructor(
        album: Album,
        profile: Profile,
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
