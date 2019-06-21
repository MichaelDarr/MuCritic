/**
 * Exports all database entities
 */

import { AlbumEntity } from './AlbumEntity';
import { ArtistEntity } from './ArtistEntity';
import { ProfileEntity } from './ProfileEntity';
import { ReviewEntity } from './ReviewEntity';
import { TrackEntity } from './TrackEntity';
import { SpotifyGenreEntity } from './SpotifyGenreEntity';

export * from './AlbumEntity';
export * from './ArtistEntity';
export * from './RymGenreEntity';
export * from './ProfileEntity';
export * from './ReviewEntity';
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
