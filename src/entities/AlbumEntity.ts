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
 * Describes layout and relationships for "album" database table
 */
@Entity({ name: 'album' })
export class AlbumEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    @Column()
    public urlRYM: string;

    @Column({
        type: 'float',
    })
    public ratingRYM: number;

    @Column()
    public yearRankRYM: number;

    @Column()
    public overallRankRYM: number;

    @Column()
    public reviewCountRYM: number;

    @Column()
    public listCountRYM: number;

    @Column()
    public issueCountRYM: number;

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
