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

export enum Gender {
    Male,
    Female
}

export enum ApiService {
    Spotify
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
