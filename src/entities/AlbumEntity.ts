/**
 * TypeORM description of "album" table
 */

import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToMany,
    ManyToOne,
    OneToMany,
    JoinTable,
} from 'typeorm';

import {
    ArtistEntity,
    ReviewEntity,
    GenreEntity,
} from './index';

/**
 * Describes layout and relationships for "album" database table, containing album information
 * scraped from [Rate Your Music](https://rateyourmusic.com/).
 */
@Entity({ name: 'album' })
export class AlbumEntity {
    /**
     * Primary Key
     */
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    @Column()
    public urlRYM: string;

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
     * Album ranking in comparison to others released the same year, by overall rating
     * ([[AlbumEntity.ratingRYM]]). If year ranking has not been assigned by RYM, defaults to 0.
     */
    @Column()
    public yearRankRYM: number;

    /**
     * Album ranking in comparison to all other albums, by overall rating
     * ([[AlbumEntity.ratingRYM]]). If overall ranking has not been assigned by RYM, defaults to 0.
     */
    @Column()
    public overallRankRYM: number;

    /**
     * Number of written reviews for a given album on RYM
     */
    @Column()
    public reviewCountRYM: number;

    @Column()
    public listCountRYM: number;

    @Column()
    public issueCountRYM: number;

    /**
     * @remarks
     * nullable
     */
    @Column({
        nullable: true,
    })
    public spotifyId: string;

    @ManyToOne(() => ArtistEntity, (artist): AlbumEntity[] => artist.albums)
    public artist: ArtistEntity;

    @OneToMany(() => ReviewEntity, (review): AlbumEntity => review.album)
    public reviews: ReviewEntity[];

    @ManyToMany(() => GenreEntity, (genre): AlbumEntity[] => genre.albums)
    @JoinTable()
    public genres: GenreEntity[];
}
