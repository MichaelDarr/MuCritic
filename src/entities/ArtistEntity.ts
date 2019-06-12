import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToMany,
    OneToMany,
    JoinTable,
} from 'typeorm';

import { AlbumEntity } from './AlbumEntity';
import { RymGenreEntity } from './RymGenreEntity';
import { ProfileEntity } from './ProfileEntity';
import { SpotifyGenreEntity } from './SpotifyGenreEntity';

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

    /**
     * If group is still active/solo performer is alive
     */
    @Column()
    public active: boolean;

    @Column()
    public discographyCountRYM: number;

    @Column()
    public listCountRYM: number;

    @Column()
    public memberCount: number;

    @Column()
    public name: string;

    @Column()
    public showCountRYM: number;

    @Column()
    public soloPerformer: boolean;

    @Column()
    public urlRYM: string;

    /**
     * @remarks
     * nullable
     */
    @Column({
        nullable: true,
    })
    public spotifyId: string;

    /**
     * @remarks
     * nullable
     */
    @Column({
        nullable: true,
    })
    public spotifyPopularity: number;

    @OneToMany((): typeof AlbumEntity => AlbumEntity, (album): ArtistEntity => album.artist)
    public albums: AlbumEntity[];

    @ManyToMany((): typeof RymGenreEntity => RymGenreEntity, (genre): ArtistEntity[] => genre.artists)
    @JoinTable()
    public rymGenres: RymGenreEntity[];

    @ManyToMany(
        (): typeof ProfileEntity => ProfileEntity,
        (profile): ArtistEntity[] => profile.favoriteArtists,
    )
    public profiles: ProfileEntity[];

    @ManyToMany(
        (): typeof SpotifyGenreEntity => SpotifyGenreEntity,
        (spotifyGenre): ArtistEntity[] => spotifyGenre.artists,
    )
    @JoinTable()
    public spotifyGenres: SpotifyGenreEntity[];
}
