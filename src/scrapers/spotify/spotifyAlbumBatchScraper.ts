import * as assert from 'assert';

import {
    Repository,
    getConnection,
} from 'typeorm';

import {
    AlbumEntity,
    SpotifyGenreEntity,
    TrackEntity,
} from '../../entities/entities';
import { SimpleDate } from '../../helpers/classes/simpleDate';
import { Log } from '../../helpers/classes/log';
import { SpotifyApi } from '../../helpers/classes/spotifyApi';
import * as Spotify from '../../types/spotify';
import { SpotifyScraper } from './spotifyScraper';
import { ReleaseDate } from '../../types/spotify';

/**
 * Spotify Album Batch Scraper
 *
 * Scrapes 20 Albums at a time via Spotify's
 * [[Get Several Albums]](https://developer.spotify.com/documentation/web-api/reference/albums/get-several-albums/)
 * endpoint.
 */
export class SpotifyAlbumBatchScraper extends SpotifyScraper<Spotify.AlbumBatchResponse> {
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
        this.spotifyResponse.albums.forEach((album: Spotify.Album, i: number) => {
            assert(album.id === this.albums[i].spotifyId);
            const releaseDate = SimpleDate.parseSpotifyDate(album.release_date);
            /*this.albums[i].genres = album.genres.map((genre: string): SpotifyGenreEntity => {
                const newGenreEntity = new SpotifyGenreEntity();
                newGenreEntity.name = genre;
                return newGenreEntity;
            });*/

            this.albums[i].spotifyAlbumType = album.album_type;
            this.albums[i].spotifyAvailableMarketCount = album.available_markets.length;
            this.albums[i].spotifyCopyRightCount = album.copyrights.length;
            this.albums[i].upcIdentifier = album.external_ids.upc;
            this.albums[i].spotifyLabel = album.label;
            this.albums[i].spotifyPopularity = album.popularity;
            this.albums[i].releaseYear = releaseDate.year;
            this.albums[i].releaseMonth = releaseDate.month;
            this.albums[i].releaseDay = releaseDate.day;
        })
    }

    public async requestScrape(): Promise<void> {
        const idString = this.albums.map(album => album.spotifyId).join();
        this.spotifyResponse = await this.spotifyApi.albumBatchRequest(idString);
    }

    public printInfo(): void {
        Log.notify('print info not implemented');
    }

    protected async saveToLocal(): Promise<void> {
        await Promise.all(this.albums.map(async (album: AlbumEntity) => {
            await this.albumRepository.save(album);
        }));
    }

    protected async scrapeDependencies(): Promise<void> {
        /*
        await Promise.all(this.albums.map(async (album: AlbumEntity) => {
            await Promise.all(album.genres.map(async (genre: SpotifyGenreEntity) => {
                const foundGenre = await this.spotifyGenreRepository.findOne({name: genre.name});
                if(foundGenre != null) {
                    genre = foundGenre;
                } else {
                    await this.spotifyGenreRepository.save(genre);
                }
            }));
        }));*/
    }
}
