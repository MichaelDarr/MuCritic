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
import Artist from './Artist';
import Review from './Review';

// table description
@Entity()
export default class Profile {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    @Column()
    public age: number;

    @Column()
    public gender: boolean;

    @Column()
    public urlRYM: string;

    @OneToMany(type => Review, (review): Profile => review.profile)
    public reviews: Review[];

    // artist/genre pivot table
    @ManyToMany(type => Artist, (artist): Profile[] => artist.profiles)
    @JoinTable()
    public favoriteArtists: Artist[];
}
