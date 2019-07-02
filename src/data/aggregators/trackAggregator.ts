import {
    AggregationGenerator,
    SpotifyTrackFull,
    TrackAggregation,
} from './aggregator';
import { TrackEntity } from '../../entities/entities';

/**
 * [[TrackAggregation]] generator class for [[TrackEntity]] database entries
 */
export const TrackAggregator:
AggregationGenerator<SpotifyTrackFull, TrackAggregation> = {
    aggregationType: 'track',
    convertFromRaw: (track: SpotifyTrackFull): TrackAggregation => {
        const aggregation = TrackAggregator.template(0);

        let unfilteredAggregation: TrackAggregation;
        if('features' in track) {
            unfilteredAggregation = {
                ...track.features,
                timeSignature: track.features.time_signature,
                duration: track.info.duration_ms,
                explicit: track.info.explicit ? 1 : 0,
                trackNumber: track.info.track_number,
                popularity: track.info.popularity,
            };
        } else {
            unfilteredAggregation = {
                ...track,
                explicit: track.explicit ? 1 : 0,
            };
        }

        for(const prop in unfilteredAggregation) {
            if(prop in aggregation) {
                aggregation[prop] = unfilteredAggregation[prop];
            }
        }

        return aggregation;
    },
    generateFromEntity: async (
        track: TrackEntity,
        normalized: boolean,
    ): Promise<TrackAggregation> => {
        if(track == null) throw new Error('tried to aggregate null track');

        const aggregation = TrackAggregator.convertFromRaw(track);
        if(normalized) return TrackAggregator.normalize(aggregation);
        return aggregation;
    },
    normalize: (raw: TrackAggregation): TrackAggregation => {
        const normalized = TrackAggregator.template(0);

        normalized.acousticness = raw.acousticness;
        normalized.danceability = raw.danceability;
        normalized.energy = raw.energy;
        normalized.explicit = raw.explicit;
        normalized.instrumentalness = raw.instrumentalness;
        normalized.liveness = raw.liveness;
        normalized.loudness = Math.max((-1 * raw.loudness) + 10, 0) / 70;
        normalized.mode = raw.mode;
        normalized.popularity = raw.popularity / 100;
        normalized.speechiness = raw.speechiness;
        normalized.tempo = raw.tempo / 200;
        normalized.timeSignature = raw.timeSignature / 8;
        normalized.trackNumber = raw.trackNumber / 10;
        normalized.duration = raw.duration / 600000;
        normalized.valence = raw.valence;

        return normalized;
    },
    template: (defaultVal: number): TrackAggregation => ({
        acousticness: defaultVal,
        danceability: defaultVal,
        duration: defaultVal,
        energy: defaultVal,
        explicit: defaultVal,
        instrumentalness: defaultVal,
        liveness: defaultVal,
        loudness: defaultVal,
        mode: defaultVal,
        popularity: defaultVal,
        speechiness: defaultVal,
        tempo: defaultVal,
        timeSignature: defaultVal,
        trackNumber: defaultVal,
        valence: defaultVal,
    }),
};