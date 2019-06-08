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
import { GenreEntity } from './GenreEntity';
import { ReviewEntity } from './ReviewEntity';

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
     */
    @Column({
        type: 'float',
    })
    public ratingCountRYM: number;

    /**
     * Number of written reviews for an album on RYM
     */
    @Column()
    public reviewCountRYM: number;

    /**
     * @remarks
     * nullable
     */
    @Column({
        nullable: true,
    })
    public spotifyId: string;

    @Column()
    public urlRYM: string;

    /**
     * Album ranking in comparison to others released the same year, by overall rating
     * ([[AlbumEntity.ratingRYM]]). Defaults to 0.
     */
    @Column()
    public yearRankRYM: number;

    @ManyToOne((): typeof ArtistEntity => ArtistEntity, (artist): AlbumEntity[] => artist.albums)
    public artist: ArtistEntity;

    @ManyToMany((): typeof GenreEntity => GenreEntity, (genre): AlbumEntity[] => genre.albums)
    @JoinTable()
    public genres: GenreEntity[];

    @OneToMany((): typeof ReviewEntity => ReviewEntity, (review): AlbumEntity => review.album)
    public reviews: ReviewEntity[];
}
