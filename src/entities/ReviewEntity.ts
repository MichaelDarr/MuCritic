/**
 * ORM description of "review" database table
 */

import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
} from 'typeorm';

import { AlbumEntity } from './AlbumEntity';
import { ProfileEntity } from './ProfileEntity';

/**
 * Describes layout and relationships for "review" database table, containing review information
 * scraped from [Rate Your Music](https://rateyourmusic.com/).
 */
@Entity({ name: 'review' })
export class ReviewEntity {
    /**
     * Primary Key
     */
    @PrimaryGeneratedColumn()
    public id: number;

    /**
     * @remarks
     * float
     */
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

    @ManyToOne((): typeof AlbumEntity => AlbumEntity, (album): ReviewEntity[] => album.reviews)
    public album: AlbumEntity;

    @ManyToOne(
        (): typeof ProfileEntity => ProfileEntity,
        (profile): ReviewEntity[] => profile.reviews,
    )
    public profile: ProfileEntity;
}
