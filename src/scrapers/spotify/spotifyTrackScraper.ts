import * as assert from 'assert';

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
            newTrack.spotifyId = track.id;
            newTrack.album = this.album;
            this.tracks.push(newTrack);
        });
    }

    /**
     * Request audio features for the retrieved track IDs and add the data to each record
     */
    public async scrapeDependencies(): Promise<void> {
        const idString = this.tracks.map(track => track.spotifyId).join();
        const trackFeatures = await this.spotifyApi.getBatch<Spotify.AudioFeatureBatchResponse>(
            idString,
            'audio-features',
        );
        trackFeatures.audio_features.forEach((features: Spotify.AudioFeature, i: number) => {
            assert(features.id === this.tracks[i].spotifyId);

            this.tracks[i].acousticness = features.acousticness;
            this.tracks[i].danceability = features.danceability;
            this.tracks[i].duration = features.duration_ms;
            this.tracks[i].energy = features.energy;
            this.tracks[i].instrumentalness = features.instrumentalness;
            this.tracks[i].key = features.key;
            this.tracks[i].liveness = features.liveness;
            this.tracks[i].loudness = features.loudness;
            this.tracks[i].mode = features.mode;
            this.tracks[i].speechiness = features.speechiness;
            this.tracks[i].tempo = features.tempo;
            this.tracks[i].timeSignature = features.time_signature;
            this.tracks[i].valence = features.valence;
        });
    }

    public async requestScrape(): Promise<void> {
        this.spotifyResponse = await this.spotifyApi.getAlbumTracks(this.album.spotifyId);
    }

    protected async saveToLocal(): Promise<void> {
        await Promise.all(this.tracks.map(async (track: TrackEntity) => {
            await getRepository(TrackEntity).save(track);
        }));
    }
}
