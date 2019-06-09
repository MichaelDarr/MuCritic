import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
} from 'typeorm';

import { AlbumEntity } from './AlbumEntity';

/**
 * Describes layout and relationships for "track" database table, containing information from the
 * Spotify API for a single track
 */
@Entity({ name: 'track' })
export class TrackEntity {
    /**
     * @remarks
     * Primary Key
     */
    @PrimaryGeneratedColumn()
    public id: number;

    @ManyToOne((): typeof AlbumEntity => AlbumEntity, (album): TrackEntity[] => album.tracks)
    public album: AlbumEntity;
}
