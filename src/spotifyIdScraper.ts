/**
 * @fileOverview Spotify ID Scraper. Adds ID values to artists and albums
 *
 * @author  Michael Darr
 */

// external dependencies
import * as dontenv from 'dotenv';
import { resolve } from 'path';
import { getConnection } from 'typeorm';

// helpers
import { connectToDatabase } from './helpers/functions/database';
import { attatchIdsToEntries } from './helpers/functions/spotifyId';
import Log from './helpers/classes/logger';
import { ResultBatch } from './helpers/classes/result';
import SpotifyApi from './helpers/classes/spotifyApi';

// database entities
import AlbumEntity from './entities/Album';
import ArtistEntity from './entities/Artist';

// environment variables
dontenv.config({ path: resolve(__dirname, '../.env') });

// CLI header
Log.notify('\nMuCritic Spotify ID Scraper\n\n');

// await/async wrap
(async (): Promise<void> => {
    await connectToDatabase();
    const connection = getConnection();

    // spotify API gateway setup, handles access key generation
    const spotifyApi = new SpotifyApi(
        process.env.SPOTIFY_CLIENT_ID,
        process.env.SPOTIFY_CLIENT_SECRET,
    );

    // scrape and store Spotify album ids
    const albumRepository = connection.getRepository(AlbumEntity);
    const albums = await albumRepository.find({ relations: ['artist'] });
    const albumIdScrape: ResultBatch = (
        await attatchIdsToEntries(albumRepository, albums, spotifyApi)
    );
    albumIdScrape.logErrors();

    // scrape and store Spotify artist ids
    const artistRepository = connection.getRepository(ArtistEntity);
    const artists = await artistRepository.find();
    const artistIdScrape: ResultBatch = (
        await attatchIdsToEntries(artistRepository, artists, spotifyApi)
    );
    artistIdScrape.logErrors();

    Log.success('Scrape Complete');
})();
