import { DatabaseEntities } from '../../entities/entities';

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
export abstract class Aggregator<T1 extends DatabaseEntities, T2 extends Aggregation> {
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
     * Generate CSV Header objects in accordance with the
     * [CSV Writer npm package](https://www.npmjs.com/package/csv-writer)
     */
    public csvHeaders(): CsvHeaders {
        const fields = this.fields();
        const headers: CsvHeaders = [];
        for(const field of fields) {
            headers.push({
                id: field,
                title: field,
            });
        }
        return headers;
    }

    /**
     * Get a list of all fields belonging to an aggreation
     */
    public fields(): string[] {
        const blankAggregation = this.template(null);
        const fields: string[] = [];
        for(const prop in blankAggregation) {
            if(prop in blankAggregation) {
                fields.push(prop);
            }
        }
        return fields;
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
     * Normalizes [[Aggregation]] data. This should be a static abstract, but this is
     * [not yet implemented in typescript](https://github.com/microsoft/TypeScript/issues/14600).
     */
    protected abstract normalize(aggregation: T2): T2;

    /**
     * Creates blank aggregation templates. Similarly to [[Aggregator.normalize]], this should be a
     * static abstract, but this is
     * [not yet implemented in typescript](https://github.com/microsoft/TypeScript/issues/14600).
     */
    public abstract template(defaultVal: number): T2;
}

/**
 * Typings for data aggregation
 */

export interface ProfileInfo {
    gender: number;
    age: number;
}

export interface ArtistInfo {
    active: number;
    discographySize: number;
    artistLists: number;
    members: number;
    shows: number;
    soloPerformer: number;
    artistPopularity: number;
}

export interface AlbumRYM {
    issues: number;
    albumLists: number;
    overallRank: number;
    rating: number;
    ratings: number;
    reviews: number;
    yearRank: number;
}

export interface AlbumSpotify {
    availableMarkets: number;
    copyrights: number;
    albumPopularity: number;
    releaseYear: number;
}

export interface TrackAggregation {
    acousticness: number;
    danceability: number;
    duration: number;
    energy: number;
    explicit: number;
    instrumentalness: number;
    liveness: number;
    loudness: number;
    mode: number;
    speechiness: number;
    tempo: number;
    timeSignatureVariation: number;
    valence: number;
}

export interface AlbumAggregation extends AlbumRYM, AlbumSpotify, ArtistInfo, TrackAggregation {}

export interface ReviewAggregation extends AlbumAggregation {
    userDisagreement: number;
}

export interface ArtistsAggregation extends TrackAggregation {
    averagePopularity: number;
    highestPopularity: number;
    lowestPopularity: number;
}

export type ProfileAggregation = ReviewAggregation[];

export type Aggregation =
    | AlbumAggregation
    | ArtistsAggregation
    | ReviewAggregation
    | ProfileAggregation
    | TrackAggregation;

export interface CsvHeader {
    id: string;
    title: string;
}

export type CsvHeaders = CsvHeader[];
