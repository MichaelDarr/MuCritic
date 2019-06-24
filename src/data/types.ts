/**
 * Standardized typing for data aggregation/machine learning
 */

export interface ProfileInfo {
    gender: number;
    age: number;
}

export interface Artist {
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

export interface Track {
    acousticness: number;
    danceability: number;
    duration: number;
    energy: number;
    instrumentalness: number;
    liveness: number;
    loudness: number;
    mode: number;
    speechiness: number;
    tempo: number;
    timeSignatureVariation: number;
    valence: number;
}

export interface AlbumAggregation extends AlbumRYM, AlbumSpotify, Artist, Track {}

export interface ReviewAggregation extends AlbumAggregation {
    userRating: number;
    userDisagreement: number;
}

export type ProfileAggregation = ReviewAggregation[];

export type Aggregation =
    | AlbumAggregation
    | ReviewAggregation
    | ProfileAggregation;

export interface CsvHeader {
    id: string;
    title: string;
}

export type CsvHeaders = CsvHeader[];
