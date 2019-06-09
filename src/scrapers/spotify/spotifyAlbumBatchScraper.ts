import {
    Repository,
    getConnection,
} from 'typeorm';

import {
    AlbumEntity,
} from '../../entities/entities';
import { Log } from '../../helpers/classes/log';
import { SpotifyApi } from '../../helpers/classes/spotifyApi';
import {
    SpotifySearchResponse,
    SpotifySearchAlbum,
} from '../../helpers/types';
import { SpotifyScraper } from './spotifyScraper';

/**
 * Spotify Album Batch Scraper
 *
 * Scrapes 20 Albums at a time via Spotify's
 * [[Get Several Albums]](https://developer.spotify.com/documentation/web-api/reference/albums/get-several-albums/)
 * endpoint.
 */
export class SpotifyAlbumBatchScraper extends SpotifyScraper<SpotifySearchAlbum> {
    /**
     * up to 20 artist entities with information to be requested from Spotify
     */
    private albums: AlbumEntity[];

    /**
     * TypeORM repository handling all data flow in/out of album table
     */
    private albumRepository: Repository<AlbumEntity>;

    public constructor(
        spotifyApi: SpotifyApi,
        albums: AlbumEntity[],
        verbose = false,
    ) {
        super(spotifyApi, 'Spotify Multi-Album scrape', verbose);
        this.albums = albums;
        this.albumRepository = getConnection().getRepository(AlbumEntity);
    }

    public async checkForLocalRecord(): Promise<boolean> {
        return false;
    }

    protected extractInfo(): void {
    }

    public async requestScrape(): Promise<void> {
    }

    public printInfo(): void {
    }

    protected async saveToLocal(): Promise<void> {
    }
}
