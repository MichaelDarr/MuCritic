/**
 * TypeORM description of "artist" table
 */

// decorators
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToMany,
    OneToMany,
    JoinTable,
} from 'typeorm';

// database entities
import { ProfileEntity } from './ProfileEntity';
import { AlbumEntity } from './AlbumEntity';
import { GenreEntity } from './GenreEntity';

// table description
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

    @OneToMany(type => AlbumEntity, (album): ArtistEntity => album.artist)
    public albums: AlbumEntity[];

    @ManyToMany(type => ProfileEntity, (profile): ArtistEntity[] => profile.favoriteArtists)
    public profiles: ProfileEntity[];

    @ManyToMany(type => GenreEntity, (genre): ArtistEntity[] => genre.artists)
    @JoinTable()
    public genres: GenreEntity[];
}
