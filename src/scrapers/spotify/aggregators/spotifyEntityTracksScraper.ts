import * as tf from '@tensorflow/tfjs';
import * as Spotify from 'spotify';

import { Log } from '../../../helpers/classes/log';
import { TrackAggregator } from '../../../data/aggregators/trackAggregator';
import {
    AlbumEntity,
    ArtistEntity,
} from '../../../entities/entities';
import { SpotifyScraper } from '../spotifyScraper';
import {
    Aggregator,
    SpotifyTrackFromApi,
    TrackAggregation,
} from '../../../data/aggregators/aggregator';

require('@tensorflow/tfjs-node');

/**
 * Spotify Track Scraper implementing a CSV writer and optional encoding via tensorflow models
 */
export abstract class SpotifyEntityTracksScraper<
    T1 extends ArtistEntity | AlbumEntity
> extends SpotifyScraper<Spotify.TracksBatchResponse> {
    public encodedTracks: number[];

    public encodeTracks: boolean;

    public entity: T1;

    public normalize: boolean;

    public measureMae: boolean;

    protected modelPath: string;

    public reconstructionMae: number;

    protected saveDirectory: string;

    protected spotifyFeaturesResponse: Spotify.AudioFeatureBatchResponse;

    public trackAggregations: TrackAggregation[];

    protected trackCount: number;

    public constructor(
        description: string,
        entity: T1,
        saveDirectory: string = null,
        encodeTracks = false,
        normalize = true,
        measureMae = false,
        verbose = false,
    ) {
        super(`Top Spotify tracks for ${description}`, verbose);

        this.encodeTracks = encodeTracks;
        this.entity = entity;
        this.measureMae = measureMae;
        this.normalize = normalize;
        this.saveDirectory = saveDirectory;
        this.reconstructionMae = 0;
        this.trackAggregations = [];
    }

    protected async saveToLocal(): Promise<void> {
        if(this.modelPath != null) {
            const strippedAggregations = this.trackAggregations.map(t => Aggregator.stripLabels(t));
            const trackFeatureCount = strippedAggregations[0].length;

            const albumEncoder = await tf.loadLayersModel(`${this.modelPath}/encoder/model.json`);
            const aggregationTensor = tf
                .tensor(strippedAggregations)
                .as3D(1, this.trackCount, trackFeatureCount);
            const encodedTensor = albumEncoder.predict(aggregationTensor) as tf.Tensor;
            [this.encodedTracks] = await encodedTensor.array() as number[][];

            if(this.measureMae) {
                const albumDecoder = await tf.loadLayersModel(`${this.modelPath}/decoder/model.json`);
                const reconstructedTensor = albumDecoder.predict(encodedTensor) as tf.Tensor;
                const reconstructedTracks = await reconstructedTensor.array();
                for(let i = 0; i < this.trackCount; i += 1) {
                    let trackErr = 0;
                    for(let j = 0; j < trackFeatureCount; j += 1) {
                        trackErr += Math.abs(
                            reconstructedTracks[0][i][j] - strippedAggregations[i][j],
                        ) / trackFeatureCount;
                    }
                    this.reconstructionMae += trackErr / this.trackCount;
                }
                Log.notify(`Mean Absolute Reconstruction Error for ${this.entity.name}: ${this.reconstructionMae}`);
            }
        }
        if(this.saveDirectory != null) {
            await Aggregator.writeToCsv(
                this.trackAggregations,
                TrackAggregator,
                `${this.entity.id}`,
                this.saveDirectory,
            );
        }
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
}
