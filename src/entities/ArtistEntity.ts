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

import {
    AlbumEntity,
    GenreEntity,
    ProfileEntity,
} from './index';

/**
 * Describes layout and relationships for "artist" database table, containing artist information
 * from [Rate Your Music](https://rateyourmusic.com/).
 */
@Entity({ name: 'artist' })
export class ArtistEntity {
    /**
     * Primary Key
     */
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    /**
     * Count of members in a given group
     */
    @Column()
    public memberCount: number;

    /**
     * Whether the group is still active (or solo performer is alive)
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
