/**
 * @fileOverview Manages storage of a single genre string
 *
 * @author  Michael Darr
 */

// library dependencies
import { getManager } from 'typeorm';

// internal class dependencies
import AbstractScraper from './abstractScraper';
import GenreEntity from '../entities/Genre';
import Log from '../helpers/classes/logger';

export default class GenreScraper extends AbstractScraper {
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

    protected extractInfo(root: HTMLElement): void {
        // TODO: extract genre info from page. As of now, does not seem necessary
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

    public printInfo(): void {
        if(this.dataReadFromDB) {
            this.printResult();
            return;
        }
        Log.log(`Genre: ${this.name}`);
    }
}
