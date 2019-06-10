import * as assert from 'assert';

import {
    Repository,
    getConnection,
} from 'typeorm';

import {
    SpotifyGenreEntity,
} from '../../entities/entities';
import { SimpleDate } from '../../helpers/classes/simpleDate';
import { Log } from '../../helpers/classes/log';
import { SpotifyApi } from '../../helpers/classes/spotifyApi';
import * as Spotify from '../../types/spotify';
import { SpotifyScraper } from './spotifyScraper';

/**
 * Spotify Album Batch Scraper
 *
 * Scrapes 20 Albums at a time via Spotify's
 * [[Get Several Albums]](https://developer.spotify.com/documentation/web-api/reference/albums/get-several-albums/)
 * endpoint.
 */
export class SpotifyGenreScraper extends SpotifyScraper<Spotify.GenreSeedsResponse> {
    /**
     * up to 20 artist entities with information to be requested from Spotify
     */
    private genres: SpotifyGenreEntity[];

    /**
     * TypeORM repository handling all data flow in/out of album table
     */
    private spotifyGenreRepository: Repository<SpotifyGenreEntity>;

    public constructor(
        spotifyApi: SpotifyApi,
        verbose = false,
    ) {
        super(spotifyApi, 'Spotify genre scrape', verbose);
        this.spotifyGenreRepository = getConnection().getRepository(SpotifyGenreEntity);
    }

    protected extractInfo(): void {
        this.genres = this.spotifyResponse.genres.map((genre: string): SpotifyGenreEntity => {
            const newGenreEntity = new SpotifyGenreEntity();
            newGenreEntity.name = genre;
            return newGenreEntity;
        });
    }

    public async requestScrape(): Promise<void> {
        this.spotifyResponse = await this.spotifyApi.genreSeedsRequest();
    }

    protected async saveToLocal(): Promise<void> {
        await Promise.all(this.genres.map(async (genre: SpotifyGenreEntity) => {
            const foundGenre = await this.spotifyGenreRepository.findOne({name: genre.name});
            if(foundGenre != null) {
                genre = foundGenre;
            } else {
                await this.spotifyGenreRepository.save(genre);
            }
        }));
    }
}
