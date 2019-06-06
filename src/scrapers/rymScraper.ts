import { Repository } from 'typeorm';

import { ScraperApiScraper } from './index';
import { RymDatabaseEntities } from '../helpers/types';

export abstract class RymScraper<T extends RymDatabaseEntities> extends ScraperApiScraper {
    public databaseId: number;

    protected repository: Repository<T>;

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
