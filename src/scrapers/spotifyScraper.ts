/**
 * Manages scraping and storage from the Spotify API. See [[Scraper]] for more details.
 */

import { Repository } from 'typeorm';

import { SpotifyDatabaseEntities } from '../helpers/types';
import { Scraper } from './index';
import { SpotifyApi } from '../helpers/classes/spotifyApi';

export abstract class SpotifyScraper<T extends SpotifyDatabaseEntities> extends Scraper {
    protected spotifyResponse: any;

    protected spotifyApi: SpotifyApi;

    protected record: T;

    protected repository: Repository<T>;

    public constructor(
        spotifyApi: SpotifyApi,
        record: T,
        verbose = false,
    ) {
        super(`Spotify ID Request: ${record.name}`, verbose);
        this.spotifyApi = spotifyApi;
        this.record = record;
    }

    /**
     *  Either find this genre in DB or create it, then return the entity
     *
     * @return Genre Database Entity
     */
    public async checkForLocalRecord(): Promise<boolean> {
        if(this.record.spotifyId != null) return true;
        return false;
    }

    protected async scrapeDependencies(): Promise<void> {
        return Promise.resolve();
    }
}
