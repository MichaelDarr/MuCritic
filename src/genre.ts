/**
 * @fileOverview Manages storage of a single genre string
 *
 * @author  Michael Darr
 */

// library dependencies
import { getManager } from 'typeorm';

// internal class dependencies
import GenreEntity from './entity/Genre';

export default class Genre {
    public name: string;

    public constructor(name: string) {
        this.name = name;
    }

    /**
     *  Either find this genre in DB or create it, then return the entity
     *
     * @return Genre Database Entity
     */
    public async getEntity(): Promise<GenreEntity> {
        const entityManager = getManager();
        let savedGenre: GenreEntity = await entityManager.findOne(GenreEntity, { name: this.name });
        if(savedGenre !== undefined && savedGenre !== null) {
            return savedGenre;
        }

        savedGenre = new GenreEntity();
        savedGenre.name = this.name;
        savedGenre = await entityManager.save(savedGenre);
        return savedGenre;
    }

    /**
     * Extract genre info from a comma-separated string
     *
     * @param genres genre info string. ex: Film Score, Horror Synth, Halloween Music...
     */
    public static parse(genres: string): Genre[] {
        const genreArr: Genre[] = [];
        if(genres !== null && genres !== undefined) {
            const genreStringArr = genres.split(', ');
            genreStringArr.forEach((genre): void => {
                const genreEntity = new Genre(genre);
                genreArr.push(genreEntity);
            });
        }
        return genreArr;
    }

    public static createGenres(genres: string[]): Genre[] {
        const genreArr: Genre[] = [];
        genres.forEach((genre): void => {
            const genreEntity = new Genre(genre);
            genreArr.push(genreEntity);
        });
        return genreArr;
    }

    // TODO: Possibly scrape genres? RYM Genre heirarchy
}
