import * as assert from 'assert';
import { getRepository } from 'typeorm';

import * as Spotify from 'spotify';

import { TrackAggregation } from '../../data/aggregators/aggregator';
import {
    ArtistEntity,
    TrackEntity,
} from '../../entities/entities';
import { SpotifyScraper } from './spotifyScraper';
import { TrackAggregator } from '../../data/aggregators/trackAggregator';

/**
 * Spotify Artist Track Scraper *-> CSV FILE* (not database)
 *
 * Scrapes all tracks for a given artist using the Spotify's
 * [Get an Artist's Top Tracks](https://developer.spotify.com/documentation/web-api/reference/artists/get-artists-top-tracks/)
 * endpoint.
 */
export class SpotifyArtistTrackScraper extends SpotifyScraper<Spotify.TopTracksResponse> {
    /**
     * Artist tracks to request
     */
    protected artist: ArtistEntity;

    /**
     * 0-10 tracks
     */
    protected trackAggregations: TrackAggregation[];

    /**
     * track spotify ids, in same order as [[SpotifyArtistTrackScraper.trackAggregations]]
     */
    protected trackIds: string[];

    public constructor(
        artist: ArtistEntity,
        verbose = false,
    ) {
        super(`Top Spotify tracks for artist: ${artist.name}`, verbose);
        this.artist = artist;
        this.trackAggregations = [];
    }

    public extractInfo(): void {
        this.spotifyResponse.tracks.forEach((track: Spotify.Track) => {
            const newTrackAggregation = TrackAggregator.template(0);
            newTrackAggregation.explicit = track.explicit ? 1 : 0;
            this.trackAggregations.push(newTrackAggregation);
            this.trackIds.push(track.id);
        });
    }

    /**
     * Request audio features for the retrieved track IDs and add the data to each record
     */
    public async scrapeDependencies(): Promise<void> {
        const trackFeatures = await this.spotifyApi.getBatch<Spotify.AudioFeatureBatchResponse>(
            this.trackIds.join(),
            'audio-features',
        );
        trackFeatures.audio_features.forEach((features: Spotify.AudioFeature, i: number) => {
            this.trackAggregations[i].acousticness = features.acousticness;
            this.trackAggregations[i].danceability = features.danceability;
            this.trackAggregations[i].duration = features.duration_ms;
            this.trackAggregations[i].energy = features.energy;
            this.trackAggregations[i].instrumentalness = features.instrumentalness;
            this.trackAggregations[i].liveness = features.liveness;
            this.trackAggregations[i].loudness = features.loudness;
            this.trackAggregations[i].mode = features.mode;
            this.trackAggregations[i].speechiness = features.speechiness;
            this.trackAggregations[i].tempo = features.tempo;
            this.trackAggregations[i].timeSignature = features.time_signature;
            this.trackAggregations[i].valence = features.valence;

            this.trackAggregations[i] = (
                TrackAggregator.normalize(this.trackAggregations[i])
            );
        });
    }

    public async requestScrape(): Promise<void> {
        this.spotifyResponse = await this.spotifyApi.getArtistTopTracks(this.artist.spotifyId);
    }
}
