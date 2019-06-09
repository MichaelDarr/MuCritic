/**
 * master file for all types in project
 */

import {
    AlbumEntity,
    ArtistEntity,
    ProfileEntity,
    ReviewEntity,
} from '../entities/entities';

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
    | ArtistEntity;
