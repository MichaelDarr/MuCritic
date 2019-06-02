/**
 * ORM description of "review" database table
 */

// decorators
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
} from 'typeorm';

// database entities
import { AlbumEntity } from './AlbumEntity';
import { ProfileEntity } from './ProfileEntity';

/**
 * Class describing layout and relationships for "review" database table
 */
@Entity({ name: 'review' })
export class ReviewEntity {
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

    @ManyToOne(type => AlbumEntity, (album): ReviewEntity[] => album.reviews)
    public album: AlbumEntity;

    @ManyToOne(type => ProfileEntity, (profile): ReviewEntity[] => profile.reviews)
    public profile: ProfileEntity;
}
