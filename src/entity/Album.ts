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
    ManyToMany,
    ManyToOne,
    OneToMany,
    JoinTable,
} from 'typeorm';

// other database model dependencies
import Genre from './Genre';
import Artist from './Artist';
import Review from './Review';

// table description
@Entity()
export default class Album {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    @Column()
    public urlRYM: string;

    @Column({
        type: 'float',
    })
    public ratingRYM: number;

    @Column({
        nullable: true,
    })
    public yearRankRYM: number;

    @Column({
        nullable: true,
    })
    public overallRankRYM: number;

    @Column()
    public reviewCountRYM: number;

    @Column()
    public listCountRYM: number;

    @Column()
    public issueCountRYM: number;

    @ManyToOne(type => Artist, (artist): Album[] => artist.albums)
    public artist: Artist;

    @OneToMany(type => Review, (review): Album => review.album)
    public reviews: Review[];

    // artist/genre pivot table
    @ManyToMany(type => Genre, (genre): Album[] => genre.albums)
    @JoinTable()
    public genres: Genre[];
}
