import { getRepository } from 'typeorm';

import {
    AlbumEntity,
    TrackEntity,
} from '../../entities/entities';
import * as Spotify from '../../types/spotify';
import { SpotifyScraper } from './spotifyScraper';

/**
 * Spotify Track Scraper
 *
 * Scrapes all tracks for a given album using the Spotify's
 * [Get an Album's Tracks](https://developer.spotify.com/documentation/web-api/reference/albums/get-albums-tracks/)
 * endpoint.
 */
export class SpotifyTrackScraper extends SpotifyScraper<Spotify.AlbumTracksResponse> {
    /**
     * Album who's tracks are requested
     */
    protected album: AlbumEntity;

    /**
     * 0-50 tracks
     */
    protected tracks: TrackEntity[];

    public constructor(
        album: AlbumEntity,
        verbose = false,
    ) {
        super(`Spotify tracks for album: ${album.name}`, verbose);
        this.album = album;
        this.tracks = [];
    }

    public extractInfo(): void {
        this.spotifyResponse.items.forEach((track: Spotify.Track) => {
            const newTrack = new TrackEntity();
            newTrack.id = track.id;
            newTrack.album = this.album;
            this.tracks.push(newTrack);
        });
    }

    public async scrapeDependencies(): Promise<void> {
        console.log(this.tracks);
        process.exit(0);
    }

    /**
     * pull spotify info using a comma-separated string concatination of every
     * [[SpotifyBatchScraper.entities]].spotifyId
     */
    public async requestScrape(): Promise<void> {
        this.spotifyResponse = await this.spotifyApi.albumTracksRequest(this.album.spotifyId);
    }

    protected async saveToLocal(): Promise<void> {
        await Promise.all(this.tracks.map(async (track: TrackEntity) => {
            await getRepository(TrackEntity).save(track);
        }));
    }
}
