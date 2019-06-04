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

import {
    ArtistEntity,
    ReviewEntity,
} from './index';

/**
 * Describes layout and relationships for "profile" database table
 */
@Entity({ name: 'profile' })
export class ProfileEntity {
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

    @OneToMany(() => ReviewEntity, (review): ProfileEntity => review.profile)
    public reviews: ReviewEntity[];

    @ManyToMany(() => ArtistEntity, (artist): ProfileEntity[] => artist.profiles)
    @JoinTable()
    public favoriteArtists: ArtistEntity[];
}
