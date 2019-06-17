import * as assert from 'assert';

import { AlbumEntity } from '../../entities/entities';
import { SimpleDate } from '../../helpers/classes/simpleDate';
import { SpotifyApi } from '../../helpers/classes/spotifyApi';
import * as Spotify from '../../types/spotify';
import { SpotifyBatchScraper } from './spotifyBatchScraper';

/**
 * Spotify Album Batch Scraper
 *
 * Scrapes 20 Albums at a time via Spotify's
 * [[Get Several Albums]](https://developer.spotify.com/documentation/web-api/reference/albums/get-several-albums/)
 * endpoint.
 */
export class SpotifyAlbumBatchScraper
    extends SpotifyBatchScraper<AlbumEntity, Spotify.AlbumBatchResponse> {
    public constructor(
        spotifyApi: SpotifyApi,
        albums: AlbumEntity[],
        verbose = false,
    ) {
        super(spotifyApi, albums, 'albums', verbose);
    }

    protected extractInfo(): void {
        this.spotifyResponse.albums.forEach((album: Spotify.Album, i: number) => {
            assert(album.id === this.entities[i].spotifyId);
            const releaseDate = SimpleDate.parseSpotifyDate(album.release_date);

            this.entities[i].spotifyAlbumType = album.album_type;
            this.entities[i].spotifyAvailableMarketCount = album.available_markets.length;
            this.entities[i].spotifyCopyRightCount = album.copyrights.length;
            this.entities[i].upcIdentifier = album.external_ids.upc;
            this.entities[i].spotifyLabel = album.label;
            this.entities[i].spotifyPopularity = album.popularity;
            this.entities[i].releaseYear = releaseDate.year;
            this.entities[i].releaseMonth = releaseDate.month;
            this.entities[i].releaseDay = releaseDate.day;
        });
    }
}
