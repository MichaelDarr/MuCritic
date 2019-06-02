/**
 * TypeORM description of "album" table
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

// database entities
import { GenreEntity } from './GenreEntity';
import { ArtistEntity } from './ArtistEntity';
import { ReviewEntity } from './ReviewEntity';

// table description
@Entity({ name: 'album' })
export class AlbumEntity {
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

    @ManyToOne(type => ArtistEntity, (artist): AlbumEntity[] => artist.albums)
    public artist: ArtistEntity;

    @OneToMany(type => ReviewEntity, (review): AlbumEntity => review.album)
    public reviews: ReviewEntity[];

    @ManyToMany(type => GenreEntity, (genre): AlbumEntity[] => genre.albums)
    @JoinTable()
    public genres: GenreEntity[];
}
