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
export class Aggregator<
    T1 extends AggregatableEntities,
    T2 extends Aggregation,
    T3 extends FlattenedAggregations = FlattenedReviewAggregation,
> {
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

    public redisKey(normalized: boolean): string {
        if(this.entity != null && this.entity.id != null) {
            const keyString = `${this.aggregationGenerator.aggregationType}_${this.entity.id}`;
            if(normalized) return `${keyString}_normalized`;
            return keyString;
        }
        return null;
    }

    /**
     * Generate CSV Header objects in accordance with the
     * [CSV Writer npm package](https://www.npmjs.com/package/csv-writer)
     */
    public static csvHeader<A1 extends AggregatableEntities, A2 extends Aggregation>(
        aggregationGenerator: AggregationGenerator<A1, A2>,
    ): CsvHeaders {
        const fields = Aggregator.fields(aggregationGenerator);
        return Aggregator.csvHeaderFromArray(fields);
    }

    public static csvHeaderFromArray(fields: string[]): CsvHeaders {
        fields.sort();
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
    public static fields<A1 extends AggregatableEntities, A2 extends Aggregation>(
        aggregationGenerator: AggregationGenerator<A1, A2>,
    ): string[] {
        const blankAggregation = aggregationGenerator.template(0);
        const fields: string[] = [];
        for(const prop in blankAggregation) {
            if(typeof blankAggregation[prop] === 'number') {
                fields.push(prop);
            }
        }
        return fields;
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

    public static async writeToCsv<A1 extends AggregatableEntities, A2 extends Aggregation>(
        aggregation: A2 | A2[],
        aggregationGenerator: AggregationGenerator<A1, A2>,
        fileName: string,
        baseDir: string,
    ): Promise<void> {
        const csvWriter = createObjectCsvWriter({
            path: `${baseDir}/${fileName}.csv`,
            header: Aggregator.csvHeader(aggregationGenerator),
        });
        if(Array.isArray(aggregation)) {
            await csvWriter.writeRecords(aggregation);
        } else {
            await csvWriter.writeRecords([aggregation]);
        }
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
export interface AggregationGenerator<
    T1 extends AggregatableEntities,
    T2 extends Aggregation,
    T3 extends FlattenedAggregations = FlattenedReviewAggregation,
> {
    aggregationType: AggregationType;
    flatFields?: string[];
    /**
     * Converts data from a raw format into an [[Aggregation]]
     */
    convertFromRaw(entity: T1): T2;
    flatten?(entity: T1, aggregation: T2): Promise<T3>;
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
    popularity: number;
    speechiness: number;
    tempo: number;
    timeSignature: number;
    trackNumber: number;
    valence: number;
}

export interface AlbumAggregation {
    availableMarkets: number;
    copyrights: number;
    popularity: number;
    releaseYear: number;
    issues: number;
    lists: number;
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
    lists: number;
    members: number;
    shows: number;
    soloPerformer: number;
    popularity: number;
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

export interface FlattenedReviewAggregation {
    albumAvailableMarkets: number;
    albumCopyrights: number;
    albumPopularity: number;
    albumReleaseYear: number;
    albumIssues: number;
    albumLists: number;
    albumOverallRank: number;
    albumRating: number;
    albumRatings: number;
    albumReviews: number;
    albumYearRank: number;
    artistIsActive: number;
    artistDiscographySize: number;
    artistListCount: number;
    artistMemberCount: number;
    artistShowCount: number;
    artistIsSoloPerformer: number;
    artistPopularity: number;
    albumEncoding0: number;
    albumEncoding1: number;
    albumEncoding2: number;
    albumEncoding3: number;
    albumEncoding4: number;
    albumEncoding5: number;
    albumEncoding6: number;
    albumEncoding8: number;
    albumEncoding9: number;
    albumEncoding10: number;
    albumEncoding11: number;
    albumEncoding12: number;
    albumEncoding13: number;
    albumEncoding14: number;
    albumEncoding15: number;
    albumEncoding16: number;
    albumEncoding18: number;
    albumEncoding19: number;
    albumEncoding20: number;
    albumEncoding21: number;
    albumEncoding22: number;
    albumEncoding23: number;
    albumEncoding24: number;
    albumEncoding25: number;
    albumEncoding26: number;
    albumEncoding28: number;
    albumEncoding29: number;
    albumEncoding30: number;
    albumEncoding31: number;
}

export type FlattenedAggregations =
    | FlattenedReviewAggregation;

export interface CsvHeader {
    id: string;
    title: string;
}

export type CsvHeaders = CsvHeader[];
