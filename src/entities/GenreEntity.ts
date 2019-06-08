import {
    Column,
    Entity,
    ManyToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { AlbumEntity } from './AlbumEntity';
import { ArtistEntity } from './ArtistEntity';

/**
 * Describes layout and relationships for "genre" database table, containing genre information
 * scraped from [Rate Your Music](https://rateyourmusic.com/).
 */
@Entity({ name: 'genre' })
export class GenreEntity {
    /**
     * @remarks
     * Primary Key
     */
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    @ManyToMany((): typeof AlbumEntity => AlbumEntity, (album): GenreEntity[] => album.genres)
    public albums: AlbumEntity[];

    @ManyToMany((): typeof ArtistEntity => ArtistEntity, (artist): GenreEntity[] => artist.genres)
    public artists: ArtistEntity[];
}
