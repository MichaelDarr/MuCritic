import * as assert from 'assert';
import { getRepository } from 'typeorm';

import * as Spotify from 'spotify';

import {
    ArtistEntity,
    SpotifyGenreEntity,
} from '../../entities/entities';
import { SpotifyBatchScraper } from './spotifyBatchScraper';

/**
 * Spotify Artist Batch Scraper
 *
 * Scrapes 20 Artists at a time via Spotify's
 * [Get Several Artists](https://developer.spotify.com/documentation/web-api/reference/artists/get-several-artists/)
 * endpoint.
 */
export class SpotifyArtistBatchScraper
    extends SpotifyBatchScraper<ArtistEntity, Spotify.ArtistBatchResponse> {
    public constructor(
        artists: ArtistEntity[],
        verbose = false,
    ) {
        super(artists, 'artists', verbose);
    }

    protected extractInfo(): void {
        this.spotifyResponse.artists.forEach((artist: Spotify.Artist, i: number) => {
            assert(artist.id === this.entities[i].spotifyId);
            this.entities[i].spotifyGenres = artist.genres.map((
                genre: string,
            ): SpotifyGenreEntity => {
                const newGenreEntity = new SpotifyGenreEntity();
                newGenreEntity.name = genre;
                return newGenreEntity;
            });

            this.entities[i].spotifyPopularity = artist.popularity;
        });
    }

    protected async scrapeDependencies(): Promise<void> {
        for await(const artist of this.entities) {
            const savedGenres: SpotifyGenreEntity[] = [];
            for await(const genre of artist.spotifyGenres) {
                let savedGenre = await getRepository(SpotifyGenreEntity).findOne(
                    { name: genre.name },
                );
                if(savedGenre == null) {
                    savedGenre = await getRepository(SpotifyGenreEntity).save(genre);
                }
                savedGenres.push(savedGenre);
            }
            artist.spotifyGenres = savedGenres;
        }
    }
}
