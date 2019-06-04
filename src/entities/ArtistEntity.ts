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
 * Describes layout and relationships for "artist" database table
 */
@Entity({ name: 'artist' })
export class ArtistEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    @Column()
    public memberCount: number;

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

    @Column({
        nullable: true,
    })
    public spotifyId: string;

    @OneToMany(() => AlbumEntity, (album): ArtistEntity => album.artist)
    public albums: AlbumEntity[];

    @ManyToMany(() => ProfileEntity, (profile): ArtistEntity[] => profile.favoriteArtists)
    public profiles: ProfileEntity[];

    @ManyToMany(() => GenreEntity, (genre): ArtistEntity[] => genre.artists)
    @JoinTable()
    public genres: GenreEntity[];
}
