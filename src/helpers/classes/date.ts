/**
 * @fileOverview Standardized, simplified date management
 *
 * @author  Michael Darr
 */

export class Date {
    public month: number;

    public day: number;

    public year: number;

    public constructor(monthString: string, day: number, year: number) {
        this.month = Date.monthToNum(monthString);
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
                return 0;
        }
    }
}
