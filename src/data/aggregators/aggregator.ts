import { createObjectCsvWriter } from 'csv-writer';

import * as Spotify from 'spotify';

import { RedisHelper } from '../../helpers/classes/redis';
import {
    DatabaseEntities,
    TrackEntity,
} from '../../entities/entities';

/**
 * Superclass for all data aggregators. Creates a structured method for pulling and normalizing
 * data from the database into usable [[Aggregation]] objects.
 *
 * @typeparam T1 entity used to create an [[Aggregation]]
 * @typeparam T2 [[Aggregation]] format to be created
 */
export class Aggregator<T1 extends AggregatableEntities, T2 extends Aggregation> {
    /**
     * Database entity that serves as the "base" of the aggregation. For example, this would be an
     * instance of [[ProfileEntity]] for an aggregation of all reviews by a profile
     */
    public entity: T1;

    public aggregationGenerator: AggregationGenerator<T1, T2>;

    public redisClient: RedisHelper;

    public constructor(entity: T1, aggregationGenerator: AggregationGenerator<T1, T2>) {
        this.entity = entity;
        this.aggregationGenerator = aggregationGenerator;
        this.redisClient = RedisHelper.getConnection();
    }

    /**
     * @param normalized if data in returned aggregation should be normalized using
     * [[EntityAggregator.normalize]]
     */
    public async aggregate(normalized = true): Promise<T2> {
        const redisKey = this.redisKey(normalized);
        if(redisKey != null) {
            const cachedAggregation = await this.redisClient.getObject<T2>(redisKey);
            if(cachedAggregation != null) return cachedAggregation;
        }
        const aggregation = await this.aggregationGenerator.generateFromEntity(
            this.entity,
            normalized,
        );
        if(redisKey != null) {
            await this.redisClient.setObject(redisKey, aggregation);
        }
        return aggregation;
    }

    public static stripLabels(aggregation: Aggregation): number[] {
        const aggregationArr: number[] = [];
        for(const key in aggregation) {
            if(key in aggregation) {
                aggregationArr.push(aggregation[key]);
            }
        }
        return aggregationArr;
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

    public async writeAggregationToCsv(
        aggregation: T2 | T2[],
        fileName: string,
        baseDir: string,
    ): Promise<void> {
        const csvWriter = createObjectCsvWriter({
            path: `${baseDir}/${fileName}.csv`,
            header: this.csvHeaders(),
        });
        if(Array.isArray(aggregation)) {
            await csvWriter.writeRecords(aggregation);
        } else {
            await csvWriter.writeRecords([aggregation]);
        }
    }

    /**
     * Get a list of all fields belonging to an aggreation
     */
    public fields(): string[] {
        const blankAggregation = this.aggregationGenerator.template(null);
        const fields: string[] = [];
        for(const prop in blankAggregation) {
            if(typeof blankAggregation[prop] === 'number') {
                fields.push(prop);
            }
        }
        return fields;
    }

    public redisKey(normalized: boolean): string {
        if(this.entity != null && this.entity.id != null) {
            const keyString = `${this.aggregationGenerator.aggregationType}_${this.entity.id}`;
            if(normalized) return `${keyString}_normalized`;
            return keyString;
        }
        return null;
    }
}

/**
 * Defines how [[Aggregator]] will aggregate information from a resource.
 *
 * @typeparam T1 entity used to create an [[Aggregation]]
 * @typeparam T2 [[Aggregation]] format to be created
 *
 * @remarks
 * See [[AlbumAggregator]] for an example implementations of this interface. It must be exported as
 * a simple object instead of a class, so its methods can be called staticly (static interface
 * methods are not supported by typescript). This needs to be the case so normalization/aggregation
 * calls to methods can be called without instantiating a new class instance, which is very useful.
 */
export interface AggregationGenerator<T1 extends AggregatableEntities, T2 extends Aggregation> {
    aggregationType: AggregationType;
    convertFromRaw(entity: T1): T2;
    /**
     * Aggregates data for an [[Aggregation]]. Implementations consist of two steps
     * 1. Ensure all necessary aggregation data is contained in [[Aggregator.entity]], fetching it
     * if not found.
     * 2. Load all of this data into appropriate [[Aggregation]] (to be returned)
     *
     * @param normalized if data in returned aggregation should be normalized using
     * [[Aggregator.normalize]]
     */
    generateFromEntity(entity: T1, normalized: boolean): Promise<T2>;
    normalize(aggregation: T2): T2;
    template(defaultVal: number): T2;
}

/**
 * Typings for data aggregation
 */
export type AggregatableEntities =
    | DatabaseEntities
    | SpotifyTrackFull;

export interface SpotifyTrackFromApi {
    id: null;
    info: Spotify.Track;
    features: Spotify.AudioFeature;
}

export type SpotifyTrackFull =
    | TrackEntity
    | SpotifyTrackFromApi;

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
    timeSignature: number;
    valence: number;
}

export interface AlbumAggregation {
    availableMarkets: number;
    copyrights: number;
    albumPopularity: number;
    releaseYear: number;
    issues: number;
    albumLists: number;
    overallRank: number;
    rating: number;
    ratings: number;
    reviews: number;
    yearRank: number;
    artist: ArtistAggregation;
    tracks: TrackAggregation[];
}

export interface ReviewAggregation {
    score: number;
    album: AlbumAggregation;
}

export interface ArtistAggregation {
    active: number;
    discographySize: number;
    artistLists: number;
    members: number;
    shows: number;
    soloPerformer: number;
    artistPopularity: number;
}

export interface ProfileAggregation {
    age: number;
    gender: number;
    favoriteArtists: ArtistAggregation[];
    reviews: ReviewAggregation[];
}

export type Aggregation =
    | AlbumAggregation
    | ArtistAggregation
    | ReviewAggregation
    | ProfileAggregation
    | TrackAggregation;

export type AggregationType =
    | 'album'
    | 'artist'
    | 'artists'
    | 'review'
    | 'profile'
    | 'track';

export interface CsvHeader {
    id: string;
    title: string;
}

export type CsvHeaders = CsvHeader[];
