import * as Spotify from 'spotify';

import { AlbumEntity } from '../../../entities/entities';
import { SpotifyEntityTracksScraper } from './spotifyEntityTracksScraper';

/**
 * Scrapes first 6 tracks for a given album
 */
export class SpotifyAlbumTracksScraper extends SpotifyEntityTracksScraper<AlbumEntity> {
    public constructor(
        spotifyId: string,
        saveDirectory: string = null,
        trackCount = 6,
        encode = true,
        normalize = true,
        verbose = false,
    ) {
        super('album', spotifyId, saveDirectory, encode, normalize, verbose);
        this.trackCount = trackCount;
    }

    public async requestScrape(): Promise<void> {
        const simplifiedTracks = await this.spotifyApi.getAlbumTracks(this.spotifyId);
        let trackIds: string[];
        if(this.trackCount != null) {
            if(simplifiedTracks.items.length < this.trackCount) throw new Error(`Album scraper found less than ${this.trackCount} tracks`);
            trackIds = simplifiedTracks.items.slice(0, this.trackCount).map(track => track.id);
        } else {
            if(simplifiedTracks.items.length === 0) throw new Error('Album scraper found no tracks');
            trackIds = simplifiedTracks.items.map(track => track.id);
        }
        this.spotifyResponse = await this.spotifyApi.getBatch<Spotify.TracksBatchResponse>(trackIds, 'tracks');
        this.spotifyFeaturesResponse = await this.spotifyApi.getBatch<Spotify.AudioFeatureBatchResponse>(trackIds, 'audio-features');
    }
}
