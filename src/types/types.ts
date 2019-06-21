/**
 * master file for all types in project
 */

import {
    AlbumEntity,
    ArtistEntity,
    ProfileEntity,
    ReviewEntity,
    SpotifyGenreEntity,
    TrackEntity,
} from '../entities/entities';
import { Scraper } from '../scrapers/scraper';
import { ResultBatch } from '../helpers/classes/result';
import { AlbumType as SpotifyAlbumType } from './spotify';

export enum Gender {
    Male,
    Female
}

export enum ApiService {
    Spotify,
}

export type RymDatabaseEntities =
    | AlbumEntity
    | ArtistEntity
    | ProfileEntity
    | ReviewEntity;

export type SpotifyDatabaseEntities =
    | AlbumEntity
    | ArtistEntity
    | SpotifyGenreEntity
    | TrackEntity;

export type SpotifyBatchEntities =
    | AlbumEntity
    | ArtistEntity;

export interface ScrapersWithResults<T extends Scraper> {
    results: ResultBatch;
    scrapers: T[];
}

export interface ProfileInfo {
    gender: Gender;
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

export interface AlbumInfoRYM {
    issues: number;
    albumLists: number;
    overallRank: number;
    rating: number;
    ratings: number;
    reviews: number;
    yearRank: number;
}

export interface AlbumInfoSpotify {
    availableMarkets: number;
    copyrights: number;
    albumPopularity: number;
    releaseYear: number;
}

export interface TrackInfo {
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
    timeSignature: number;
    timeSignatureVariation: number;
    valence: number;
}

export interface ReviewAggregation extends AlbumInfoRYM, AlbumInfoSpotify, ArtistInfo, TrackInfo {
    userRating: number;
    userDisagreement: number;
}
