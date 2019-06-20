import { Repository } from 'typeorm';

import { RymDatabaseEntities } from '../../types/types';
import { ScraperApiScraper } from '../scraperApiScraper';

/**
 * Superclass for [Rate Your Music](https://rateyourmusic.com/) scrapers, reading one page's data
 * into one database record
 *
 * @typeparam T describes the database table which stores this scraper's information
 */
export abstract class RymScraper<T extends RymDatabaseEntities> extends ScraperApiScraper {
    /**
     * Id of the local database record associated with this page scrape
     */
    public databaseId: number;

    /**
     * TypeORM repository handling all data flow in/out of database table
     */
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
     * Find the database entity corresponding to a specific page scape
     */
    public abstract getEntity(): Promise<T>;

    /**
     * Save all scraped information into a Postgres database
     */
    protected abstract saveToLocal(): Promise<void>;
}
