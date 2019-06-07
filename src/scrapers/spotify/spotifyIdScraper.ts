/**
 * Manages the scraping and storage of a genre from [Rate Your Music](https://rateyourmusic.com/).
 * See [[Scraper]] for more details.
 */

import {
    Repository,
    getConnection,
} from 'typeorm';

import { SpotifyScraper } from './spotifyScraper';
import {
    AlbumEntity,
    ArtistEntity,
} from '../../entities/entities';
import { Log } from '../../helpers/classes/log';
import { SpotifyApi } from '../../helpers/classes/spotifyApi';
import {
    SpotifyAlbumArtistPairSimplified,
    SpotifyAlbumSimplified,
    SpotifySearchResponse,
    SpotifySearchAlbum,
} from '../../helpers/types';

export class SpotifyIdScraper extends SpotifyScraper {
    protected spotifyResponse: SpotifySearchAlbum;

    private album: AlbumEntity;

    private artist: ArtistEntity;

    private albumRepository: Repository<AlbumEntity>;

    private artistRepository: Repository<ArtistEntity>;

    public constructor(
        spotifyApi: SpotifyApi,
        album: AlbumEntity,
        verbose = false,
    ) {
        super(spotifyApi, `Spotify ID scrape: ${album.name} by ${album.artist.name}`, verbose);
        this.album = album;
        this.artist = album.artist;
        this.albumRepository = getConnection().getRepository(AlbumEntity);
        this.artistRepository = getConnection().getRepository(ArtistEntity);
    }

    /**
     *  Either find this genre in DB or create it, then return the entity
     *
     * @return true if the stored record already has a spotify id
     */
    public async checkForLocalRecord(): Promise<boolean> {
        if(this.album.spotifyId != null && this.artist.spotifyId != null) return true;
        return false;
    }

    public async requestScrape(): Promise<void> {
        let queryString = `album:${this.album.name} artist:${this.artist.name}`;
        queryString = encodeURIComponent(queryString);
        const spotifyResponse: SpotifySearchResponse = await this.spotifyApi.searchRequest(queryString, 'album', 3);
        const albumResponse = spotifyResponse as SpotifySearchAlbum;
        if(albumResponse.albums.items.length === 0) {
            throw new Error(`No results for album: ${this.album.name} by ${this.artist.name}`);
        }
        this.spotifyResponse = albumResponse;
    }

    protected extractInfo(): void {
        const matchedInfo = this.extractCorrectItem();
        this.album.spotifyId = matchedInfo.album.id;
        this.artist.spotifyId = matchedInfo.artist.id;
    }

    public printInfo(): void {
        let finalString = '';
        finalString += (this.album.spotifyId != null)
            ? `Spotify ID for album ${this.album.name}: ${this.album.spotifyId}\n`
            : `Spotify ID for album ${this.album.name} unknown\n`;
        finalString += (this.artist.spotifyId != null)
            ? `Spotify ID for artist  ${this.artist.name}: ${this.artist.spotifyId}\n`
            : `Spotify ID for artsit ${this.artist.name} unknown\n`;
        Log.log(finalString);
    }

    protected async saveToDB(): Promise<void> {
        await this.albumRepository.save(this.album);
        await this.artistRepository.save(this.artist);
    }

    private extractMatchingRecord(strict = false): SpotifyAlbumArtistPairSimplified {
        const response: SpotifyAlbumArtistPairSimplified = { artist: null, album: null };
        const albums = this.spotifyResponse.albums.items;
        const albumName = SpotifyIdScraper.sanitize(this.album.name);
        const artistName = SpotifyIdScraper.sanitize(this.artist.name);
        const artistId = this.artist.spotifyId;
        albums.forEach((album): void => {
            const albumNameTest = SpotifyIdScraper.sanitize(album.name);
            let albumNameMatches = false;
            if(strict && albumName === albumNameTest) {
                albumNameMatches = true;
            } else if(!strict && albumNameTest.indexOf(albumName) !== -1) {
                albumNameMatches = true;
            }
            if(albumNameMatches) {
                album.artists.forEach((spotifyArtist): void => {
                    const artistNameTest = SpotifyIdScraper.sanitize(spotifyArtist.name);
                    if(artistId == null && artistName === artistNameTest) {
                        if(response.album == null || response.artist == null) {
                            response.album = album;
                            response.artist = spotifyArtist;
                        }
                    } else if(artistId != null && artistId === spotifyArtist.id) {
                        if(response.album == null || response.artist == null) {
                            response.album = album;
                            response.artist = spotifyArtist;
                        }
                    }
                });
            }
        });
        return response;
    }

    private static sanitize(raw: string): string {
        return raw.toLowerCase().replace(/ /g, '');
    }

    private extractCorrectItem(): SpotifyAlbumArtistPairSimplified {
        let response = this.extractMatchingRecord(true);
        if(response.artist == null || response.album == null) {
            response = this.extractMatchingRecord(false);
        }
        if(response.artist == null || response.album == null) {
            throw new Error(
                `Unable to find Spotify match for ${this.album.name} by ${this.artist.name}`,
            );
        }
        return response;
    }
}
