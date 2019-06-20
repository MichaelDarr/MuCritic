import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    Unique,
} from 'typeorm';

import { AlbumEntity } from './AlbumEntity';
import { ProfileEntity } from './ProfileEntity';

/**
 * Describes layout and relationships for "review" database table, containing review information
 * scraped from [Rate Your Music](https://rateyourmusic.com/).
 */
@Entity({ name: 'review' })
@Unique(['identifierRYM'])
export class ReviewEntity {
    /**
     * Primary Key
     */
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public day: number;

    @Column()
    public identifierRYM: string;

    @Column()
    public month: number;

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

    @ManyToOne((): typeof AlbumEntity => AlbumEntity, (album): ReviewEntity[] => album.reviews)
    public album: AlbumEntity;

    @ManyToOne(
        (): typeof ProfileEntity => ProfileEntity,
        (profile): ReviewEntity[] => profile.reviews,
    )
    public profile: ProfileEntity;
}
