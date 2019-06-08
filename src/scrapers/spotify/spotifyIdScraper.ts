import {
    Repository,
    getConnection,
} from 'typeorm';

import {
    AlbumEntity,
    ArtistEntity,
} from '../../entities/entities';
import { Log } from '../../helpers/classes/log';
import { SpotifyApi } from '../../helpers/classes/spotifyApi';
import {
    SpotifyAlbumArtistPairSimplified,
    SpotifySearchResponse,
    SpotifySearchAlbum,
} from '../../helpers/types';
import { SpotifyScraper } from './spotifyScraper';

/**
 * Spotify Album/Artist ID Scraper
 *
 * This class attempts to find Spotify album/artist pair for an [[AlbumEntity]]. On a successful
 * match, the IDs are saved into [[AlbumEntity.spotifyId]] and [[ArtistEntity.spotifyId]].
 */
export class SpotifyIdScraper extends SpotifyScraper<SpotifySearchAlbum> {
    /**
     * artist entity used as the primary data source for album/artist ID scrape
     */
    private album: AlbumEntity;

    /**
     * TypeORM repository handling all data flow in/out of album table
     */
    private albumRepository: Repository<AlbumEntity>;

    /**
     * artist entity, derived from the album.artist relation
     */
    private artist: ArtistEntity;

    /**
     * TypeORM repository handling all data flow in/out of artist table
     */
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

    public async checkForLocalRecord(): Promise<boolean> {
        if(this.album.spotifyId != null && this.artist.spotifyId != null) return true;
        return false;
    }

    /**
     * Conditional method runner to set album/artist IDs
     *
     * First, looks for an exact album/artist match. If there is no exact match, looks for a
     * substring match. For example, a search for ```Master of Puppets``` will fail, as Spotify
     * only has the album ```Master of Puppets (Remastered)```. However, there are other instances
     * where both exist, such as ```Hurry Up, We're Dreaming``` and
     * ```Hurry Up, We're Dreaming (Commentary)```. This method prioritizes the perfect match, but
     * will settle for the substring if there is no other option.
     */
    private extractCorrectAlbumArtistPair(): void {
        this.extractMatchingAlbumArtistPair(true);
        if(this.artist == null || this.album == null) {
            this.extractMatchingAlbumArtistPair(false);
        }
        if(this.artist == null || this.album == null) {
            throw new Error(
                `Unable to find Spotify match for ${this.album.name} by ${this.artist.name}`,
            );
        }
    }

    protected extractInfo(): void {
        this.extractCorrectAlbumArtistPair();
    }

    /**
     * Implements the album/artist name/id matching discussed in the description of
     * [[SpotifyIdScraper.extractCorrectAlbumArtistPair]]. For all album/artist name comparisons,
     * names are preprocessed by [[SpotifyIdScraper.requestScrape]].
     *
     * * Extracts and stores
     * - [[SpotifyIdScraper.album.id]]
     * - [[SpotifyIdScraper.artist.id]]
     *
     * @param strict If false, a RYM album name that is a substring of the Spotify album name still
     * counts as a match. If true, only true equality matches.
     */
    private extractMatchingAlbumArtistPair(strict = false): void {
        const pair: SpotifyAlbumArtistPairSimplified = { artist: null, album: null };
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
                        if(pair.album == null || pair.artist == null) {
                            pair.album = album;
                            pair.artist = spotifyArtist;
                        }
                    } else if(artistId != null && artistId === spotifyArtist.id) {
                        if(pair.album == null || pair.artist == null) {
                            pair.album = album;
                            pair.artist = spotifyArtist;
                        }
                    }
                });
            }
        });
        this.album.spotifyId = pair.album.id;
        this.artist.spotifyId = pair.artist.id;
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

    /**
     * "sanitizes" a string by removal all spaces and transforming all letters to lowercase
     */
    private static sanitize(rawString: string): string {
        return rawString.toLowerCase().replace(/ /g, '');
    }

    protected async saveToLocal(): Promise<void> {
        await this.albumRepository.save(this.album);
        await this.artistRepository.save(this.artist);
    }
}
