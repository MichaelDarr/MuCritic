import * as Spotify from 'spotify';

import { TrackAggregator } from '../../data/aggregators/trackAggregator';
import {
    ArtistEntity,
} from '../../entities/entities';
import { SpotifyScraper } from './spotifyScraper';
import {
    Aggregator,
    SpotifyTrackFromApi,
    TrackAggregation,
} from '../../data/aggregators/aggregator';

/**
 * Spotify Artist Track Scraper *-> CSV FILE* (not database)
 *
 * Scrapes top 10 tracks for a given artist using the Spotify's
 * [Get an Artist's Top Tracks](https://developer.spotify.com/documentation/web-api/reference/artists/get-artists-top-tracks/)
 * endpoint.
 */
export class SpotifyArtistTrackScraper extends SpotifyScraper<Spotify.TopTracksResponse> {
    protected artist: ArtistEntity;

    public normalize: boolean;

    public saveDirectory: string;

    protected spotifyFeaturesResponse: Spotify.AudioFeatureBatchResponse;

    public trackAggregations: TrackAggregation[];

    public constructor(
        artist: ArtistEntity,
        saveDirectory = './resources/data/artist',
        normalize = true,
        verbose = false,
    ) {
        super(`Top Spotify tracks for artist: ${artist.name}`, verbose);
        this.artist = artist;
        this.normalize = normalize;
        this.saveDirectory = saveDirectory;
        this.trackAggregations = [];
    }

    public async requestScrape(): Promise<void> {
        this.spotifyResponse = await this.spotifyApi.getArtistTopTracks(this.artist.spotifyId);
        if(this.spotifyResponse.tracks.length < 10) throw new Error('Artist scraper found less than 10 top tracks');
        const trackIds = this.spotifyResponse.tracks.map(track => track.id);
        this.spotifyFeaturesResponse = await this.spotifyApi.getBatch<Spotify.AudioFeatureBatchResponse>(trackIds, 'audio-features');
    }

    protected async saveToLocal(): Promise<void> {
        await Aggregator.writeToCsv(
            this.trackAggregations,
            TrackAggregator,
            `${this.artist.id}`,
            this.saveDirectory,
        );
    }

    public async scrapeDependencies(): Promise<void> {
        this.trackAggregations = await Promise.all(
            this.spotifyResponse.tracks.map(async (track: Spotify.Track, index: number) => {
                const aggregator = new Aggregator<SpotifyTrackFromApi, TrackAggregation>(
                    {
                        id: null,
                        info: track,
                        features: this.spotifyFeaturesResponse.audio_features[index],
                    },
                    TrackAggregator,
                );
                return aggregator.aggregate(this.normalize);
            }),
        );
    }

    public mae(): number {
        const average = TrackAggregator.template(0);
        this.trackAggregations.forEach((track) => {
            for(const prop in track) {
                if(prop in average) {
                    average[prop] += (track[prop] / this.trackAggregations.length);
                }
            }
        });

        const errors = TrackAggregator.template(0);
        this.trackAggregations.forEach((track) => {
            for(const prop in track) {
                if(prop in average) {
                    errors[prop] += (
                        Math.abs(track[prop] - average[prop]) / this.trackAggregations.length
                    );
                }
            }
        });

        let totalError = 0;
        let propCount = 0;
        for(const prop in errors) {
            if(prop in average) {
                totalError += errors[prop];
                propCount += 1;
            }
        }

        return totalError / propCount;
    }
}
