import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToMany,
    ManyToOne,
    OneToMany,
    JoinTable,
} from 'typeorm';

import { ArtistEntity } from './ArtistEntity';
import { RymGenreEntity } from './RymGenreEntity';
import { ReviewEntity } from './ReviewEntity';
import { TrackEntity } from './TrackEntity';

/**
 * Describes layout and relationships for "album" database table, containing album information
 * scraped from [Rate Your Music](https://rateyourmusic.com/).
 */
@Entity({ name: 'album' })
export class AlbumEntity {
    /**
     * @remarks
     * Primary Key
     */
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public issueCountRYM: number;

    @Column()
    public listCountRYM: number;

    @Column()
    public name: string;

    /**
     * Album ranking in comparison to all other albums, by overall rating
     * ([[AlbumEntity.ratingRYM]]). Defaults to 0.
     */
    @Column()
    public overallRankRYM: number;

    /**
     * Average of all ratings given by all users of RYM
     *
     * @remarks
     * float
     */
    @Column({
        type: 'float',
    })
    public ratingRYM: number;

    /**
     * Total reviews for an album on RYM, including strictly numeric
     *
     * @remarks
     * nullable for backwards compatibility, as this was not tracked in earlier versions and would
     * error the DB sync if not nullable
     */
    @Column({
        nullable: true,
        type: 'float',
    })
    public ratingCountRYM: number;

    /**
     * Number of written reviews for an album on RYM
     */
    @Column()
    public reviewCountRYM: number;

    @Column()
    public urlRYM: string;

    /**
     * @remarks
     * nullable
     */
    @Column({
        nullable: true,
    })
    public spotifyId: string;

    /**
     * @remarks
     * nullable
     */
    @Column({
        nullable: true,
    })
    public spotifyAlbumType: string;

    /**
     * @remarks
     * nullable
     */
    @Column({
        nullable: true,
    })
    public spotifyAvailableMarketCount: number;

    /**
     * @remarks
     * nullable
     */
    @Column({
        nullable: true,
    })
    public spotifyCopyRightCount: number;

    /**
     * @remarks
     * nullable
     */
    @Column({
        nullable: true,
        type: 'bigint',
    })
    public upcIdentifier: number;

    /**
     * @remarks
     * nullable
     */
    @Column({
        nullable: true,
    })
    public spotifyLabel: string;

    /**
     * @remarks
     * nullable
     */
    @Column({
        nullable: true,
    })
    public spotifyPopularity: number;

    /**
     * @remarks
     * nullable
     */
    @Column({
        nullable: true,
    })
    public releaseYear: number;

    /**
     * @remarks
     * nullable
     */
    @Column({
        nullable: true,
    })
    public releaseMonth: number;

    /**
     * @remarks
     * nullable
     */
    @Column({
        nullable: true,
    })
    public releaseDay: number;

    /**
     * Album ranking in comparison to others released the same year, by overall rating
     * ([[AlbumEntity.ratingRYM]]). Defaults to 0.
     */
    @Column()
    public yearRankRYM: number;

    @ManyToOne((): typeof ArtistEntity => ArtistEntity, (artist): AlbumEntity[] => artist.albums)
    public artist: ArtistEntity;

    @ManyToMany((): typeof RymGenreEntity => RymGenreEntity, (genre): AlbumEntity[] => genre.albums)
    @JoinTable()
    public rymGenres: RymGenreEntity[];

    @OneToMany((): typeof ReviewEntity => ReviewEntity, (review): AlbumEntity => review.album)
    public reviews: ReviewEntity[];

    @OneToMany((): typeof TrackEntity => TrackEntity, (track): AlbumEntity => track.album)
    public tracks: TrackEntity[];
}
