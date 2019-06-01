/**
 * @fileOverview Main Spotify Scrape File
 *
 * @author  Michael Darr
 */

// external dependencies
import * as dontenv from 'dotenv';
import { createConnection, getConnection } from 'typeorm';
import { resolve } from 'path';

// internal class dependencies
import Log from './helpers/classes/logger';
import { attatchIdsToEntries } from './helpers/functions/spotifyId';
import SpotifyApi from './helpers/classes/spotifyApi';
import { ResultBatch } from './helpers/classes/result';

// database dependencies
import ProfileEntity from './entities/Profile';
import ReviewEntity from './entities/Review';
import ArtistEntity from './entities/Artist';
import AlbumEntity from './entities/Album';
import GenreEntity from './entities/Genre';

// set up environment variables
dontenv.config({ path: resolve(__dirname, '../.env') });

// CLI header
Log.notify('\nmuCritic spotify scraper\n\n');

// program wrapped in this method to use await/async structure
(async (): Promise<void> => {
    Log.log('Connecting to database...');
    // create database connection
    await createConnection({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'muCritic',
        password: '',
        database: 'muCriticData',
        entities: [
            ProfileEntity,
            ReviewEntity,
            ArtistEntity,
            AlbumEntity,
            GenreEntity,
        ],
        synchronize: true,
        logging: false,
    });
    Log.success('Database Connection Successful');

    const spotifyApi = new SpotifyApi(
        process.env.SPOTIFY_CLIENT_ID,
        process.env.SPOTIFY_CLIENT_SECRET,
    );

    const connection = getConnection();

    const albumRepository = connection.getRepository(AlbumEntity);
    const albums = await albumRepository.find({ relations: ['artist'] });
    const albumIdScrape: ResultBatch = (
        await attatchIdsToEntries(albumRepository, albums, spotifyApi)
    );
    albumIdScrape.logErrors();

    const artistRepository = connection.getRepository(ArtistEntity);
    const artists = await artistRepository.find();
    const artistIdScrape: ResultBatch = (
        await attatchIdsToEntries(artistRepository, artists, spotifyApi)
    );
    artistIdScrape.logErrors();

    Log.success('Scrape Complete');
})();
