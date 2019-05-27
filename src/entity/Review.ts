/**
 * @fileOverview ORM description of "album" database table
 *
 * @author  Michael Darr
 */

// library dependencies
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
} from 'typeorm';

// other database model dependencies
import Album from './Album';
import Profile from './Profile';

// table description
@Entity()
export default class Review {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column({
        type: 'float',
    })
    public score: number;

    @Column()
    public year: number;

    @Column()
    public month: number;

    @Column()
    public day: number;

    @Column()
    public identifierRYM: string;

    @ManyToOne(type => Album, (album): Review[] => album.reviews)
    public album: Album;

    @ManyToOne(type => Profile, (profile): Review[] => profile.reviews)
    public profile: Profile;
}
