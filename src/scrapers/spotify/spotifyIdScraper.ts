/**
 * Manages the scraping and storage of a genre from [Rate Your Music](https://rateyourmusic.com/).
 * See [[Scraper]] for more details.
 */

import {
    Repository,
    getConnection,
} from 'typeorm';

import { SpotifyScraper } from '../index';
import { AlbumEntity } from '../../entities/index';
import {
    Log,
    SpotifyApi,
} from '../../helpers/classes/index';
import {
    SpotifyAlbumArtistPairSimplified,
    SpotifyAlbumSimplified,
    SpotifyArtistSimplified,
    SpotifySearchAlbum,
} from '../../helpers/types';

export class SpotifyIdScraper extends SpotifyScraper {
    protected spotifyResponse: SpotifySearchAlbum;

    private album: AlbumEntity;

    private repository: Repository<AlbumEntity>;

    public constructor(
        spotifyApi: SpotifyApi,
        album: AlbumEntity,
        verbose = false,
    ) {
        if(!album.artist) throw new Error('Tried to initialize Spotify ID scrape for album without artist');
        super(spotifyApi, `Spotify ID scrape for album : ${album.name}`, verbose);
        this.album = album;
        this.repository = getConnection().getRepository(AlbumEntity);
    }

    /**
     *  Either find this genre in DB or create it, then return the entity
     *
     * @return true if the stored record already has a spotify id
     */
    public async checkForLocalRecord(): Promise<boolean> {
        if(this.album.spotifyId != null && this.album.artist.spotifyId != null) return true;
        return false;
    }

    public async requestScrape(): Promise<void> {
        let queryString = `album:${this.album.name} artist:${this.album.artist.name}`;
        queryString = encodeURIComponent(queryString);
        this.spotifyResponse = await this.spotifyApi.searchRequest(queryString, 'album', 3);
    }

    protected extractInfo(): void {
        const matchedInfo = this.extractCorrectItem();
        this.album.spotifyId = matchedInfo.album.id;
        this.album.artist.spotifyId = matchedInfo.artist.id;
    }

    public printInfo(): void {
        let finalString = '';
        finalString += (this.album.spotifyId != null)
            ? `Spotify ID for album ${this.album.name}: ${this.album.spotifyId}\n`
            : `Spotify ID for album ${this.album.name} unknown\n`;
        finalString += (this.album.spotifyId != null)
            ? `Spotify ID for artist  ${this.album.artist.name}: ${this.album.artist.spotifyId}\n`
            : `Spotify ID for artsit ${this.album.artist.name} unknown\n`;
        Log.log(finalString);
    }

    protected async saveToDB(): Promise<void> {
        await this.repository.save(this.album);
    }

    public extractCorrectItem(artistId?: string): SpotifyAlbumArtistPairSimplified {
        let response: SpotifyAlbumArtistPairSimplified;
        this.spotifyResponse.albums.items.forEach((spotifyAlbum: SpotifyAlbumSimplified): void => {
            if(this.album.name === spotifyAlbum.name) {
                spotifyAlbum.artists.forEach((spotifyArtist: SpotifyArtistSimplified): void => {
                    if(artistId != null && artistId === spotifyArtist.id) {
                        response.album = spotifyAlbum;
                        response.artist = spotifyArtist;
                    } else if(artistId == null && this.album.artist.name === spotifyArtist.name) {
                        response.album = spotifyAlbum;
                        response.artist = spotifyArtist;
                    }
                });
            }
        });
        if(response.artist == null || response.album == null) {
            throw new Error(
                `Unable to find a perfect Spotify match for ${this.album.name} by ${this.album.artist.name}`,
            );
        }
        return response;
    }
}
