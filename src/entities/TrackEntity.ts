import {
    Column,
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

    @Column()
    public spotifyId: string;

    @Column({
        type: 'float',
    })
    public acousticness: number;

    @Column({
        type: 'float',
    })
    public danceability: number;

    @Column()
    public duration: number;

    @Column({
        type: 'float',
    })
    public energy: number;

    @Column()
    public explicit: boolean;

    @Column({
        type: 'float',
    })
    public instrumentalness: number;

    @Column()
    public key: number;

    @Column({
        type: 'float',
    })
    public liveness: number;

    @Column({
        type: 'float',
    })
    public loudness: number;

    @Column()
    public mode: number;

    @Column({
        type: 'float',
    })
    public speechiness: number;

    @Column({
        type: 'float',
    })
    public tempo: number;

    @Column()
    public timeSignature: number;

    @Column({
        type: 'float',
    })
    public valence: number;

    @ManyToOne((): typeof AlbumEntity => AlbumEntity, (album): TrackEntity[] => album.tracks)
    public album: AlbumEntity;
}
