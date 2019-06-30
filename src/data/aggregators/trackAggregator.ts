import {
    AggregationGenerator,
    TrackAggregation,
} from './aggregator';
import { TrackEntity } from '../../entities/entities';

/**
 * [[TrackAggregation]] generator class for [[TrackEntity]] database entries
 */
export const TrackAggregator: AggregationGenerator<TrackEntity, TrackAggregation> = {
    aggregationType: 'track',
    generateFromEntity: async (track: TrackEntity): Promise<TrackAggregation> => {
        if(track == null) throw new Error('tried to aggregate null track');

        const aggregation = TrackAggregator.template(0);
        for(const prop in track) {
            if(prop in aggregation) {
                let trackVal: number;
                if(track[prop] == null) {
                    trackVal = 0;
                } else if(typeof track[prop] === 'boolean') {
                    trackVal = track[prop] ? 1 : 0;
                } else {
                    trackVal = track[prop];
                }
                aggregation[prop] = trackVal;
            }
        }
        return aggregation;
    },
    normalize: (raw: TrackAggregation): TrackAggregation => {
        const normalized = this.template(0);

        normalized.acousticness = raw.acousticness;
        normalized.danceability = raw.danceability;
        normalized.energy = raw.energy;
        normalized.explicit = raw.explicit;
        normalized.instrumentalness = raw.instrumentalness;
        normalized.liveness = raw.liveness;
        normalized.loudness = Math.max(raw.loudness + 40, 0) / 40;
        normalized.mode = raw.mode;
        normalized.speechiness = Math.sqrt(raw.speechiness);
        normalized.tempo = Math.sqrt(Math.max(185 - raw.tempo, 0)) / 13;
        normalized.timeSignature = Math.sqrt(raw.timeSignature) / 4;
        normalized.duration = Math.cbrt(raw.duration) / 85;
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
        speechiness: defaultVal,
        tempo: defaultVal,
        timeSignature: defaultVal,
        valence: defaultVal,
    }),
};
