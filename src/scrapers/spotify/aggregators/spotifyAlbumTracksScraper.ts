import * as Spotify from 'spotify';

import { AlbumEntity } from '../../../entities/entities';
import { SpotifyEntityTracksScraper } from './spotifyEntityTracksScraper';
import { AudioFeatureBatchResponse, TracksBatchResponse } from '../../../@types/spotify';

/**
 * Scrapes first 6 tracks for a given album
 */
export class SpotifyAlbumTracksScraper extends SpotifyEntityTracksScraper<AlbumEntity> {
    public constructor(
        entity: AlbumEntity,
        saveDirectory: string = null,
        encodeTracks = false,
        trackCount = 6,
        normalize = true,
        measureMae = false,
        verbose = false,
    ) {
        super(`album: ${entity.name}`, entity, saveDirectory, encodeTracks, normalize, measureMae, verbose);

        this.modelPath = process.env.MODEL_LOCATION_ALBUM_TRACK_ENCODER;
        this.trackCount = trackCount;
    }

    public async requestScrape(): Promise<void> {
        const simplifiedTracks = await this.spotifyApi.getAlbumTracks(this.entity.spotifyId);
        let trackIds;
        if(this.trackCount != null) {
            if(simplifiedTracks.items.length < this.trackCount) throw new Error(`Album scraper found less than ${this.trackCount} tracks: ${this.entity.name}`);
            trackIds = simplifiedTracks.items.slice(0, this.trackCount).map(track => track.id);
        } else {
            if(simplifiedTracks.items.length === 0) throw new Error(`Album scraper found no tracks: ${this.entity.name}`);
            trackIds = simplifiedTracks.items.map(track => track.id);
        }
        this.spotifyResponse = await this.spotifyApi.getBatch<Spotify.TracksBatchResponse>(trackIds, 'tracks');
        this.spotifyFeaturesResponse = await this.spotifyApi.getBatch<Spotify.AudioFeatureBatchResponse>(trackIds, 'audio-features');
    }
}
