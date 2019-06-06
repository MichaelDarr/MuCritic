import { Repository } from 'typeorm';

import {
    AlbumEntity,
    ArtistEntity,
    ProfileEntity,
} from '../entities/index';
import { ScraperApiScraper } from './scraperApiScraper';

type RymDatabaseEntities =
    | AlbumEntity
    | ArtistEntity
    | ProfileEntity;

export abstract class RymScraper<T extends RymDatabaseEntities> extends ScraperApiScraper {
    public databaseId: number;

    public repository: Repository<T>;

    public async checkForLocalRecord(): Promise<boolean> {
        const record = await this.getEntity();
        if(record == null) {
            this.databaseId = null;
            return false;
        }
        this.databaseId = record.id;
        return true;
    }

    /**
     * Find the database entity of a given album
     *
     * @param entityManager database connection manager, typeORM
     * @returns an AlbumEntity, the saved database record for an album
     */
    public abstract getEntity(): Promise<T>;
}
