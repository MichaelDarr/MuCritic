import * as Spotify from 'spotify';
import { Scraper } from '../scraper';
import { SpotifyApi } from '../../helpers/classes/spotifyApi';

/**
 * Manages scraping and storage from the Spotify API.
 *
 * @typeparam T describes the response to be retrieved by [[SpotifyScraper.requestScrape]] and
 * stored in [[SpotifyScraper.spotifyResponse]]
 */
export abstract class SpotifyScraper<T extends Spotify.Response> extends Scraper {
    /**
     * Spotify data populated by calls to [[SpotifyIdScraper.requestScrape]]
     */
    protected spotifyResponse: T;

    protected spotifyApi: SpotifyApi;

    public constructor(
        description: string,
        verbose = false,
    ) {
        super(description, verbose);
        this.spotifyApi = SpotifyApi.getConnection();
    }
}
