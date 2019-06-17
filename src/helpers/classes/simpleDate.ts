import * as Spotify from '../../types/spotify';
import { stringToNum } from '../functions/typeManips';

/**
 * Simplified date management with only month, year, and day
 */
export class SimpleDate {
    public month: number;

    public day: number;

    public year: number;

    public constructor(
        month: number | string,
        day: number,
        year: number,
    ) {
        if(typeof month === 'string') {
            this.month = SimpleDate.monthToNum(month);
        } else {
            this.month = month;
        }
        this.day = day;
        this.year = year;
    }

    /**
     * Converts a 3 letteer text month abbreviation to a numeric representation
     *
     * @param monthStr month abbreviation
     */
    public static monthToNum(monthStr: string): number {
        switch(monthStr) {
            case 'Jan':
                return 1;
            case 'Feb':
                return 2;
            case 'Mar':
                return 3;
            case 'Apr':
                return 4;
            case 'May':
                return 5;
            case 'Jun':
                return 6;
            case 'Jul':
                return 7;
            case 'Aug':
                return 8;
            case 'Sep':
                return 9;
            case 'Oct':
                return 10;
            case 'Nov':
                return 11;
            case 'Dec':
                return 12;
            default:
                return null;
        }
    }

    /**
     * Parse a date object from Spotify's date API into a new [[SimpleDate]]
     *
     * See [[ReleaseDate]] and [[ReleaseDatePrecision]]
     */
    public static parseSpotifyDate(
        releaseDate: Spotify.ReleaseDate,
    ): SimpleDate {
        const separatedDate = releaseDate.split('-');
        const year = stringToNum(separatedDate[0], true);
        const month = stringToNum(separatedDate[1], false, null);
        const day = stringToNum(separatedDate[2], false, null);
        return new SimpleDate(month, day, year);
    }
}
