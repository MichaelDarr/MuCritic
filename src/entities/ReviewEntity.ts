/**
 * ORM description of "review" database table
 */

import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
} from 'typeorm';

import {
    AlbumEntity,
    ProfileEntity,
} from './index';

/**
 * Describes layout and relationships for "review" database table
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

    @ManyToOne(() => AlbumEntity, (album): ReviewEntity[] => album.reviews)
    public album: AlbumEntity;

    @ManyToOne(() => ProfileEntity, (profile): ReviewEntity[] => profile.reviews)
    public profile: ProfileEntity;
}
