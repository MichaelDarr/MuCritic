import {
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { ArtistEntity } from './ArtistEntity';

/**
 * Describes layout and relationships for "genre" database table, containing genre information
 * scraped from [Rate Your Music](https://rateyourmusic.com/).
 */
@Entity({ name: 'spotify-genre' })
export class SpotifyGenreEntity {
    /**
     * @remarks
     * Primary Key
     */
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    @ManyToMany(
        (): typeof ArtistEntity => ArtistEntity,
        (artist): SpotifyGenreEntity[] => artist.spotifyGenres,
    )
    public artists: ArtistEntity[];
}
