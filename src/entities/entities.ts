/**
 * Exports all database entities
 */

import { AlbumEntity } from './AlbumEntity';
import { ArtistEntity } from './ArtistEntity';
import { ProfileEntity } from './ProfileEntity';
import { ReviewEntity } from './ReviewEntity';
import { RymGenreEntity } from './RymGenreEntity';
import { SpotifyGenreEntity } from './SpotifyGenreEntity';
import { TrackEntity } from './TrackEntity';

export * from './AlbumEntity';
export * from './ArtistEntity';
export * from './ProfileEntity';
export * from './ReviewEntity';
export * from './RymGenreEntity';
export * from './SpotifyGenreEntity';
export * from './TrackEntity';

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

export type DatabaseEntities =
    | AlbumEntity
    | ArtistEntity
    | ProfileEntity
    | ReviewEntity
    | RymGenreEntity
    | SpotifyGenreEntity
    | TrackEntity;
