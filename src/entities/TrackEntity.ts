import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    Unique,
} from 'typeorm';

import { AlbumEntity } from './AlbumEntity';

/**
 * Describes layout and relationships for "track" database table, containing information from the
 * Spotify API for a single track
 */
@Entity({ name: 'track' })
@Unique(['spotifyId'])
export class TrackEntity {
    /**
     * @remarks
     * Primary Key
     */
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public spotifyId: string;

    @ManyToOne((): typeof AlbumEntity => AlbumEntity, (album): TrackEntity[] => album.tracks)
    public album: AlbumEntity;
}
