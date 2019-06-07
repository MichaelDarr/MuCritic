import { createConnection } from 'typeorm';

import { Log } from '../classes/log';
import {
    AlbumEntity,
    ArtistEntity,
    GenreEntity,
    ProfileEntity,
    ReviewEntity,
} from '../../entities/entities';

/**
 * Initializes a database connection with params from .env
 */
export async function connectToDatabase(): Promise<void> {
    Log.notify('connecting to database');
    await createConnection({
        type: 'postgres',
        host: process.env.DATABASE_HOST,
        port: Number(process.env.DATABASE_PORT),
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        entities: [
            AlbumEntity,
            ArtistEntity,
            GenreEntity,
            ProfileEntity,
            ReviewEntity,
        ],
        synchronize: true,
        logging: false,
    });
    Log.success('database connection successful');
}
