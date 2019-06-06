/**
 * Manages scraping and storage from the Spotify API. See [[Scraper]] for more details.
 */

import { SpotifyApiResponse } from '../../helpers/types';
import { Scraper } from '../scraper';
import { SpotifyApi } from '../../helpers/classes/spotifyApi';

export abstract class SpotifyScraper extends Scraper {
    protected spotifyResponse: SpotifyApiResponse;

    protected spotifyApi: SpotifyApi;

    public constructor(
        spotifyApi: SpotifyApi,
        description: string,
        verbose = false,
    ) {
        super(description, verbose);
        this.spotifyApi = spotifyApi;
    }

    protected async scrapeDependencies(): Promise<void> {
        return Promise.resolve();
    }
}
