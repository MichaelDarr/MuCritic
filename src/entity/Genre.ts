/**
 * @fileOverview ORM description of "genre" database table
 *
 * @author  Michael Darr
 */

// library dependencies
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToMany,
} from 'typeorm';

// other database model dependencies
import Artist from './Artist';
import Album from './Album';

// table description
@Entity()
export default class Genre {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    // artist/genre pivot table
    @ManyToMany(type => Artist, (artist): Genre[] => artist.genres)
    public artists: Artist[];

    // album/genre pivot table
    @ManyToMany(type => Album, (album): Genre[] => album.genres)
    public albums: Album[];
}
