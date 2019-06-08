import {
    getConnection,
    Repository,
} from 'typeorm';

import { GenreEntity } from '../../entities/entities';
import { Log } from '../../helpers/classes/log';
import { Scraper } from '../scraper';

/**
 * Manages the scraping and storage of a genre from [Rate Your Music](https://rateyourmusic.com/).
 *
 * Unlike other RYM scrapes, nothing is actually being pulled from a webpage. Therefore, extends
 * [[Scraper]], not [[RymScraper]] However, it is still convenient to use the scraper superclass to
 * keep everything consistent, without the unnecessary overhead of [[RymScraper]].
 */
export class GenreScraper extends Scraper {
    public name: string;

    /**
     * TypeORM repository handling all data flow in/out of genre table
     */
    private repository: Repository<GenreEntity>;

    /**
     * @param name Example: ```Psychedelic Rock```
     */
    public constructor(
        name: string,
        verbose = false,
    ) {
        super(`RYM genre: ${name}`, verbose);
        this.name = name;
        this.repository = getConnection().getRepository(GenreEntity);
    }

    public async checkForLocalRecord(): Promise<boolean> {
        const genreRecord = await this.getEntity();
        return (genreRecord != null);
    }

    /**
     * Generate a list of [[GenreScraper]]s from an array of genre names
     */
    public static createScrapers(genres: string[]): GenreScraper[] {
        const genreArr: GenreScraper[] = [];
        genres.forEach((genre): void => {
            const genreEntity = new GenreScraper(genre);
            genreArr.push(genreEntity);
        });
        return genreArr;
    }

    /**
     * Find this genre's database entity
     */
    public async getEntity(): Promise<GenreEntity> {
        return this.repository.findOne({ name: this.name });
    }

    public printInfo(): void {
        if(this.dataReadFromLocal) {
            this.printResult();
            return;
        }
        Log.log(`Genre: ${this.name}`);
    }

    protected async saveToLocal(): Promise<void> {
        let genre = new GenreEntity();
        genre.name = this.name;
        genre = await this.repository.save(genre);
    }
}
