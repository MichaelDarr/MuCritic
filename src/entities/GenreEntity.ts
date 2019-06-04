/**
 * TypeORM description of "genre" table
 */

import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToMany,
} from 'typeorm';

import {
    AlbumEntity,
    ArtistEntity,
} from './index';

/**
 * Describes layout and relationships for "genre" database table
 */
@Entity({ name: 'genre' })
export class GenreEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    @ManyToMany(() => ArtistEntity, (artist): GenreEntity[] => artist.genres)
    public artists: ArtistEntity[];

    @ManyToMany(() => AlbumEntity, (album): GenreEntity[] => album.genres)
    public albums: AlbumEntity[];
}
