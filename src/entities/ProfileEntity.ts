/**
 * TypeORM description of "profile" table
 */

import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToMany,
    OneToMany,
    JoinTable,
} from 'typeorm';

import { ArtistEntity } from './ArtistEntity';
import { ReviewEntity } from './ReviewEntity';

/**
 * Describes layout and relationships for "profile" database table, containing profile information
 * scraped from [Rate Your Music](https://rateyourmusic.com/).
 */
@Entity({ name: 'profile' })
export class ProfileEntity {
    /**
     * Primary Key
     */
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    @Column()
    public age: number;

    /**
     * True for male, false for female
     */
    @Column()
    public gender: boolean;

    @Column()
    public urlRYM: string;

    @OneToMany((): typeof ReviewEntity => ReviewEntity, (review): ProfileEntity => review.profile)
    public reviews: ReviewEntity[];

    @ManyToMany(
        (): typeof ArtistEntity => ArtistEntity,
        (artist): ProfileEntity[] => artist.profiles,
    )
    @JoinTable()
    public favoriteArtists: ArtistEntity[];
}
