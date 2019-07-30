import { createArrayCsvWriter } from 'csv-writer';

import * as Spotify from 'spotify';

import { TrackAggregator } from '../../../data/aggregators/trackAggregator';
import {
    AlbumEntity,
    ArtistEntity,
} from '../../../entities/entities';
import { SpotifyScraper } from '../spotifyScraper';
import {
    Aggregator,
    EncodedTrack,
    TrackAggregation,
} from '../../../data/aggregators/aggregator';

/**
 * Spotify Track Scraper implementing a CSV writer and optional encoding via tensorflow models
 */
export abstract class SpotifyEntityTracksScraper<
    T1 extends ArtistEntity | AlbumEntity
> extends SpotifyScraper<Spotify.TracksBatchResponse> {
    public encodedTracks: EncodedTrack[];

    public encode: boolean;

    public spotifyId: string;

    public normalize: boolean;

    protected saveDirectory: string;

    protected spotifyFeaturesResponse: Spotify.AudioFeatureBatchResponse;

    public trackAggregations: TrackAggregation[];

    protected trackCount: number;

    public constructor(
        description: string,
        spotifyId: string,
        saveDirectory: string = null,
        encode = true,
        normalize = true,
        verbose = false,
    ) {
        super(`Top Spotify tracks for ${description}`, verbose);

        this.encode = encode;
        this.spotifyId = spotifyId;
        this.normalize = normalize;
        this.saveDirectory = saveDirectory;
        this.trackAggregations = [];
    }

    protected async saveToLocal(): Promise<void> {
        if(this.saveDirectory != null) {
            if(this.encodedTracks) {
                const csvWriter = createArrayCsvWriter({
                    path: this.saveDirectory,
                });
                await csvWriter.writeRecords(this.encodedTracks);
            } else {
                await Aggregator.writeToCsv(
                    this.trackAggregations,
                    TrackAggregator,
                    `${this.description}`,
                    this.saveDirectory,
                );
            }
        }
    }

    public async scrapeDependencies(): Promise<void> {
        this.trackAggregations = await Promise.all(
            this.spotifyResponse.tracks.map(async (track: Spotify.Track, index: number) => {
                const aggregator = new Aggregator(
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
        if(this.encode) {
            this.encodedTracks = await Promise.all(
                this.trackAggregations.map(async (track) => {
                    const flattened = await TrackAggregator.flatten(track);
                    return TrackAggregator.encode(flattened);
                }),
            );
        }
    }
}
