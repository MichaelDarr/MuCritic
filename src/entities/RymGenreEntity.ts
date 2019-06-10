import {
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { AlbumEntity } from './AlbumEntity';
import { ArtistEntity } from './ArtistEntity';

/**
 * Describes layout and relationships for "genre" database table, containing genre information
 * scraped from [Rate Your Music](https://rateyourmusic.com/).
 */
@Entity({ name: 'rym-genre' })
export class RymGenreEntity {
    /**
     * @remarks
     * Primary Key
     */
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    @ManyToMany((): typeof AlbumEntity => AlbumEntity, (album): RymGenreEntity[] => album.rymGenres)
    @JoinTable()
    public albums: AlbumEntity[];

    @ManyToMany((): typeof ArtistEntity => ArtistEntity, (artist): RymGenreEntity[] => artist.rymGenres)
    @JoinTable()
    public artists: ArtistEntity[];
}
