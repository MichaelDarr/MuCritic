import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToMany,
    OneToMany,
    JoinTable,
    Unique,
} from 'typeorm';

import { ArtistEntity } from './ArtistEntity';
import { ReviewEntity } from './ReviewEntity';

/**
 * Describes layout and relationships for "profile" database table, containing profile information
 * scraped from [Rate Your Music](https://rateyourmusic.com/).
 */
@Entity({ name: 'profile' })
@Unique(['urlRYM'])
export class ProfileEntity {
    /**
     * @remarks
     * Primary Key
     */
    @PrimaryGeneratedColumn()
    public id: number;

    @Column({
        nullable: true,
    })
    public age: number;

    /**
     * @remarks
     * True for male, false for female
     */
    @Column({
        nullable: true,
    })
    public gender: boolean;

    @Column()
    public name: string;

    @Column()
    public urlRYM: string;

    @ManyToMany(
        (): typeof ArtistEntity => ArtistEntity,
        (artist): ProfileEntity[] => artist.profiles,
    )
    @JoinTable()
    public favoriteArtists: ArtistEntity[];

    @OneToMany((): typeof ReviewEntity => ReviewEntity, (review): ProfileEntity => review.profile)
    public reviews: ReviewEntity[];
}
