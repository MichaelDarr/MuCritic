import {
    Column,
    Entity,
    ManyToMany,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';

import { AlbumEntity } from './AlbumEntity';
import { ArtistEntity } from './ArtistEntity';

/**
 * Describes layout and relationships for "genre" database table, containing genre information
 * scraped from [Rate Your Music](https://rateyourmusic.com/).
 */
@Entity({ name: 'rym-genre' })
@Unique(['name'])
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
    public albums: AlbumEntity[];

    @ManyToMany(
        (): typeof ArtistEntity => ArtistEntity,
        (artist): RymGenreEntity[] => artist.rymGenres,
    )
    public artists: ArtistEntity[];
}
