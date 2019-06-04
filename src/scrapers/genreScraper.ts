/**
 * Manages the scraping and storage of a genre from [Rate Your Music](https://rateyourmusic.com/).
 * See [[Scraper]] for more details.
 */

import { getManager } from 'typeorm';

import { Scraper } from './index';
import { GenreEntity } from '../entities/index';
import { Log } from '../helpers/classes/index';

export class GenreScraper extends Scraper {
    public name: string;

    public constructor(
        name: string,
        verbose = false,
    ) {
        const urlEncodedName = encodeURIComponent(name);
        const url = `https://rateyourmusic.com/genre/${urlEncodedName}`;
        super(url, 'RYM genre', verbose);
        this.name = name;
    }

    /**
     *  Either find this genre in DB or create it, then return the entity
     *
     * @return Genre Database Entity
     */
    public async getEntity(): Promise<GenreEntity> {
        return getManager().findOne(GenreEntity, { name: this.name });
    }

    protected extractInfo(): void {
    }

    protected async scrapeDependencies(): Promise<void> {
        return Promise.resolve();
    }

    protected async saveToDB(): Promise<GenreEntity> {
        let genre = new GenreEntity();
        genre.name = this.name;
        genre = await getManager().save(genre);
        this.databaseID = genre.id;
        return genre;
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
