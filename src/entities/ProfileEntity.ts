/**
 * TypeORM description of "profile" table
 */

// decorators
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToMany,
    OneToMany,
    JoinTable,
} from 'typeorm';

// database entities
import { ArtistEntity } from './ArtistEntity';
import { ReviewEntity } from './ReviewEntity';

// table description
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
