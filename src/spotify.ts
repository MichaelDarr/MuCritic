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
import Log from './logger';
import SpotifyHelper from './spotifyHelper';
import { ResultBatch } from './result';

// database dependencies
import ProfileEntity from './entity/Profile';
import ReviewEntity from './entity/Review';
import ArtistEntity from './entity/Artist';
import AlbumEntity from './entity/Album';
import GenreEntity from './entity/Genre';

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

    const spotifyHelper = new SpotifyHelper(
        process.env.SPOTIFY_CLIENT_ID,
        process.env.SPOTIFY_CLIENT_SECRET,
    );

    const connection = getConnection();
    /*
    const albumRepository = connection.getRepository(AlbumEntity);
    const albums = await albumRepository.find({ relations: ['artist'] });
    const albumIdScrape: ResultBatch = (
        await spotifyHelper.attatchIdsToAllEntries(albumRepository, albums)
    );
    albumIdScrape.logErrors();
    */

    const artistRepository = connection.getRepository(ArtistEntity);
    const artists = await artistRepository.find();
    const artistIdScrape: ResultBatch = (
        await spotifyHelper.attatchIdsToAllEntries(artistRepository, artists)
    );
    artistIdScrape.logErrors();

    Log.success('Scrape Complete');
})();
