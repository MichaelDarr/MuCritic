/**
 * @fileOverview ORM description of "artist" database table
 *
 * @author  Michael Darr
 */

// library dependencies
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToMany,
    OneToMany,
    JoinTable,
} from 'typeorm';

// other database model dependencies
import Profile from './Profile';
import Album from './Album';
import Genre from './Genre';

// table description
@Entity()
export default class Artist {
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

    @OneToMany(type => Album, (album): Artist => album.artist)
    public albums: Album[];

    // profile/favorite artist pivot table
    @ManyToMany(type => Profile, (profile): Artist[] => profile.favoriteArtists)
    public profiles: Profile[];

    // artist/genre pivot table
    @ManyToMany(type => Genre, (genre): Artist[] => genre.artists)
    @JoinTable()
    public genres: Genre[];
}
