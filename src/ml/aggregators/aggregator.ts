import { RymDatabaseEntities } from '../../entities/entities';
import { Aggregation } from '../types';

/**
 * Superclass for all data aggregators. Creates a structured method for pulling and normalizing
 * data from the database into usable [[Aggregation]] objects.
 *
 * @typeparam T1 database entity used to create an [[Aggregation]]
 * @typeparam T2 type of [[Aggregation]] to be created
 *
 * @remarks
 * Try not to not keep too instances of these classes alive, or you are likely to run out of
 * memory. [[Aggregator.entity]] can be very large, especially if it contains many relations.
 */
export abstract class Aggregator<T1 extends RymDatabaseEntities, T2 extends Aggregation> {
    /**
     * Database entity that serves as the "base" of the aggregation. For example, this would be an
     * instance of [[ProfileEntity]] for an aggregation of all reviews by a profile
     */
    public entity: T1;

    public constructor(entity: T1) {
        this.entity = entity;
    }

    /**
     * High-level [[Aggregation]] creator used by all [[Aggregator]] subclasses
     *
     * @param normalized if data in returned aggregation should be normalized using
     * [[Aggregator.normalize]]
     */
    public async aggregate(normalized = true): Promise<T2> {
        let aggregation = await this.generateAggregate(normalized);
        if(normalized) aggregation = this.normalize(aggregation);
        return aggregation;
    }

    /**
     * Aggregates data for an [[Aggregation]]. Implementations consist of two steps
     * 1. Ensure all necessary aggregation data is contained in [[Aggregator.entity]], fetching it
     * if not found.
     * 2. Load all of this data into appropriate [[Aggregation]] (to be returned)
     *
     * @param normalized if data in returned aggregation should be normalized using
     * [[Aggregator.normalize]]
     */
    protected abstract async generateAggregate(normalized: boolean): Promise<T2>;

    /**
     * Normalizes [[Aggregation]] data. This really should be a static abstract, but this is
     * [not yet implemented in typescript](https://github.com/microsoft/TypeScript/issues/14600).
     */
    protected abstract normalize(aggregation: T2): T2;
}
