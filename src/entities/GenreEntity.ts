/**
 * TypeORM description of "genre" table
 */

import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToMany,
} from 'typeorm';

import {
    AlbumEntity,
    ArtistEntity,
} from './index';

/**
 * Describes layout and relationships for "genre" database table, containing genre information
 * scraped from [Rate Your Music](https://rateyourmusic.com/).
 */
@Entity({ name: 'genre' })
export class GenreEntity {
    /**
     * Primary Key
     */
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    @ManyToMany((): typeof ArtistEntity => ArtistEntity, (artist): GenreEntity[] => artist.genres)
    public artists: ArtistEntity[];

    @ManyToMany((): typeof AlbumEntity => AlbumEntity, (album): GenreEntity[] => album.genres)
    public albums: AlbumEntity[];
}
