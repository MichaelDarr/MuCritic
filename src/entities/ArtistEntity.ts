/**
 * TypeORM description of "artist" table
 */

import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToMany,
    OneToMany,
    JoinTable,
} from 'typeorm';

import { AlbumEntity } from './AlbumEntity';
import { GenreEntity } from './GenreEntity';
import { ProfileEntity } from './ProfileEntity';

/**
 * Describes layout and relationships for "artist" database table, containing artist information
 * from [Rate Your Music](https://rateyourmusic.com/).
 */
@Entity({ name: 'artist' })
export class ArtistEntity {
    /**
     * @remarks
     * Primary Key
     */
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    @Column()
    public memberCount: number;

    /**
     * If group is still active/solo performer is alive
     */
    @Column()
    public active: boolean;

    @Column()
    public soloPerformer: boolean;

    @Column()
    public urlRYM: string;

    @Column()
    public listCountRYM: number;

    @Column()
    public discographyCountRYM: number;

    @Column()
    public showCountRYM: number;

    /**
     * @remarks
     * nullable
     */
    @Column({
        nullable: true,
    })
    public spotifyId: string;

    @OneToMany((): typeof AlbumEntity => AlbumEntity, (album): ArtistEntity => album.artist)
    public albums: AlbumEntity[];

    @ManyToMany(
        (): typeof ProfileEntity => ProfileEntity,
        (profile): ArtistEntity[] => profile.favoriteArtists,
    )
    public profiles: ProfileEntity[];

    @ManyToMany((): typeof GenreEntity => GenreEntity, (genre): ArtistEntity[] => genre.artists)
    @JoinTable()
    public genres: GenreEntity[];
}
