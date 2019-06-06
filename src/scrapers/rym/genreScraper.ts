/**
 * Manages the scraping and storage of a genre from [Rate Your Music](https://rateyourmusic.com/).
 * See [[Scraper]] for more details.
 */

import {
    getConnection,
    Repository,
} from 'typeorm';

import { Scraper } from '../index';
import { GenreEntity } from '../../entities/index';
import { Log } from '../../helpers/classes/index';

export class GenreScraper extends Scraper {
    public name: string;

    private repository: Repository<GenreEntity>;

    public constructor(
        name: string,
        verbose = false,
    ) {
        super(`RYM genre: ${name}`, verbose);
        this.name = name;
        this.repository = getConnection().getRepository(GenreEntity);
    }

    /**
     *  Either find this genre in DB or create it, then return the entity
     *
     * @return Genre Database Entity
     */
    public async checkForLocalRecord(): Promise<boolean> {
        const genreRecord = await this.getEntity();
        return (genreRecord != null);
    }

    protected extractInfo(): void {
    }

    protected async scrapeDependencies(): Promise<void> {
        return Promise.resolve();
    }

    protected async saveToDB(): Promise<void> {
        let genre = new GenreEntity();
        genre.name = this.name;
        genre = await this.repository.save(genre);
    }

    public async getEntity(): Promise<GenreEntity> {
        return this.repository.findOne({ name: this.name });
    }

    public static createScrapers(genres: string[]): GenreScraper[] {
        const genreArr: GenreScraper[] = [];
        genres.forEach((genre): void => {
            const genreEntity = new GenreScraper(genre);
            genreArr.push(genreEntity);
        });
        return genreArr;
    }

    public requestScrape(): Promise<void> {
        return Promise.resolve();
    }

    public printInfo(): void {
        if(this.dataReadFromDB) {
            this.printResult();
            return;
        }
        Log.log(`Genre: ${this.name}`);
    }
}
