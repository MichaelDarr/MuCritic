import * as assert from 'assert';

import {
    ArtistEntity,
    SpotifyGenreEntity,
} from '../../entities/entities';
import { SpotifyApi } from '../../helpers/classes/spotifyApi';
import * as Spotify from '../../types/spotify';
import { SpotifyBatchScraper } from './spotifyBatchScraper';

/**
 * Spotify Artist Batch Scraper
 *
 * Scrapes 20 Artists at a time via Spotify's
 * [[Get Several Artists]](https://developer.spotify.com/documentation/web-api/reference/artists/get-several-artists/)
 * endpoint.
 */
export class SpotifyArtistBatchScraper
    extends SpotifyBatchScraper<ArtistEntity, Spotify.ArtistBatchResponse> {
    public constructor(
        spotifyApi: SpotifyApi,
        artists: ArtistEntity[],
        verbose = false,
    ) {
        super(spotifyApi, artists, 'artists', verbose);
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
}
