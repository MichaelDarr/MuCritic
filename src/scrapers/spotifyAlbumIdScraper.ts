/**
 * Manages the scraping and storage of a genre from [Rate Your Music](https://rateyourmusic.com/).
 * See [[Scraper]] for more details.
 */

import { getConnection } from 'typeorm';

import { SpotifyScraper } from './index';
import {
    AlbumEntity,
    ArtistEntity,
} from '../entities/index';
import {
    Log,
    SpotifyApi,
} from '../helpers/classes/index';
import { SpotifyDatabaseEntities } from '../helpers/types';

export class SpotifyAlbumIdScraper extends SpotifyScraper<AlbumEntity> {
    protected spotifyId: string;

    public constructor(
        spotifyApi: SpotifyApi,
        record: AlbumEntity,
        verbose = false,
    ) {
        super(spotifyApi, record, verbose);
        this.repository = getConnection().getRepository(AlbumEntity);
    }

    protected extractInfo(): void {
        this.spotifyId = this.extractCorrectItem();
        if(!this.spotifyId) {
            throw new Error(`Unable to extract Spotify ID for album: ${this.record.name}`);
        }
    }

    protected async saveToDB(): Promise<void> {
        this.record.spotifyId = this.spotifyId;
        await this.repository.save(this.record);
    }

    public async requestScrape(): Promise<void> {
        let queryString = `album:${this.record.name} artist:${this.record.artist.name}`;
        queryString = encodeURIComponent(queryString);
        this.spotifyResponse = await this.spotifyApi.searchRequest(queryString, 'album', 3);
    }

    public printInfo(): void {
        if(this.record.spotifyId) {
            Log.log(`Spotify ID for ${this.record.name}: ${this.record.spotifyId}`);
            return;
        }
        Log.log(`No Spotify ID recorded for ${this.record.name}`);
    }

    public extractCorrectItem(): string {
        for(const response of this.spotifyResponse.albums.items) {
            if(
                this.record instanceof AlbumEntity
                && this.record.name === response.name
                && this.record.artist.name === response.artists[0].name
            ) {
                return response.id;
            } if(
                this.record instanceof ArtistEntity
                && this.record.name === response.name
            ) {
                return response.id;
            }
        }
        return this.spotifyResponse.albums.items[0].id;
    }
}
