/**
 * @fileOverview Describes various interfaces for use elsewhere
 *
 * @author  Michael Darr
 */

// library dependencies
import { EntityManager } from 'typeorm';

// internal class dependencies
import { ResultBatch } from './result';

export default interface ScraperInterface {
    /**
     *  Scrape a RYM page, return a formatted result
     *
     * @param page puppeteer profile page
     * @return ScrapingResult
     */
    scrape(): Promise<ResultBatch>;

    /**
     * Find the saved database entity for an object
     # NOTE: this MUST be called after the entity has already been inserted -
     *       usually, this is done via the "scrape" method. Finds entry based on
     *       "databaseID" property
     *
     * @param entityManager database connection manager, typeORM
     * @returns a ____Entity, the saved database record for a given class
     */
    getEntity(): Promise<any>;

    /**
     * Used to insert a ____ into the database
     *
     * @param entityManager database connection manager, typeORM
     * @returns a ____Entity, the saved database record for a given class
     */
    saveToDB(entityManager: EntityManager): Promise<any>;

    /**
     * One-line success CLI log, indicates scrape vs DB read
     */
    printSuccess(): void;

    /**
     * In-depth CLI log of retrieved information
     */
    printInfo(): void;
}
