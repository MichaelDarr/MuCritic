import * as Spotify from 'spotify';

import { TrackAggregator } from '../../data/aggregators/trackAggregator';
import {
    AlbumEntity,
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
 * Scrapes top 10 tracks for a given artist or first 6 tracks for a given album
 */
export class SpotifyTracksToCsvScraper extends SpotifyScraper<Spotify.TracksBatchResponse> {
    protected entity: ArtistEntity | AlbumEntity;

    public minimumTracks: number;

    public normalize: boolean;

    public saveDirectory: string;

    protected spotifyFeaturesResponse: Spotify.AudioFeatureBatchResponse;

    public trackAggregations: TrackAggregation[];

    public constructor(
        entity: ArtistEntity | AlbumEntity,
        saveDirectory = './resources/data/artist',
        minimumTracks = 10,
        normalize = true,
        verbose = false,
    ) {
        super(`Top Spotify tracks for ${entity.name}`, verbose);
        this.entity = entity;
        this.minimumTracks = minimumTracks;
        this.normalize = normalize;
        this.saveDirectory = saveDirectory;
        this.trackAggregations = [];
    }

    public async requestScrape(): Promise<void> {
        let trackIds: string[];
        if(this.entity instanceof ArtistEntity) {
            this.spotifyResponse = await this.spotifyApi.getArtistTopTracks(this.entity.spotifyId);
            if(this.spotifyResponse.tracks.length < 10) throw new Error('Artist scraper found less than 10 top tracks');
            trackIds = this.spotifyResponse.tracks.map(track => track.id);
        } else if(this.entity instanceof AlbumEntity) {
            const simplifiedTracks = await this.spotifyApi.getAlbumTracks(this.entity.spotifyId);
            if(simplifiedTracks.items.length < 6) throw new Error(`Album scraper found less than 6 tracks: ${this.entity.name}`);
            trackIds = simplifiedTracks.items.slice(0, 6).map(track => track.id);
            this.spotifyResponse = await this.spotifyApi.getBatch<Spotify.TracksBatchResponse>(trackIds, 'tracks');
        } else {
            throw new Error('Unexpected entity passed to Spotify CSV Scraper');
        }
        this.spotifyFeaturesResponse = await this.spotifyApi.getBatch<Spotify.AudioFeatureBatchResponse>(trackIds, 'audio-features');
    }

    protected async saveToLocal(): Promise<void> {
        await Aggregator.writeToCsv(
            this.trackAggregations,
            TrackAggregator,
            `${this.entity.id}`,
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
