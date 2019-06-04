/**
 * TypeORM description of "genre" table
 */

// decorators
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToMany,
} from 'typeorm';

// database entities
import { ArtistEntity } from './ArtistEntity';
import { AlbumEntity } from './AlbumEntity';

// table description
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
