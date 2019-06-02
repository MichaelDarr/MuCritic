/**
 * @fileOverview TypeORM description of "album" table
 *
 * @author  Michael Darr
 */

// decorators
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToMany,
    ManyToOne,
    OneToMany,
    JoinTable,
} from 'typeorm';

// entities
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

    @Column()
    public yearRankRYM: number;

    @Column()
    public overallRankRYM: number;

    @Column()
    public reviewCountRYM: number;

    @Column()
    public listCountRYM: number;

    @Column()
    public issueCountRYM: number;

    @Column({
        nullable: true,
    })
    public spotifyId: string;

    @ManyToOne(type => Artist, (artist): Album[] => artist.albums)
    public artist: Artist;

    @OneToMany(type => Review, (review): Album => review.album)
    public reviews: Review[];

    @ManyToMany(type => Genre, (genre): Album[] => genre.albums)
    @JoinTable()
    public genres: Genre[];
}
