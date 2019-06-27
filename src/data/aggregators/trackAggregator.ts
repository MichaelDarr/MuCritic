import {
    Aggregator,
    TrackAggregation,
} from './aggregator';
import { TrackEntity } from '../../entities/entities';

/**
 * [[TrackAggregation]] generator class for [[TrackEntity]] database entries
 */
export class TrackAggregator extends Aggregator<TrackEntity, TrackAggregation> {
    public constructor(track: TrackEntity) {
        super(track, 'track');
    }

    protected async generateAggregate(): Promise<TrackAggregation> {
        if(this.entity == null) throw new Error('tried to aggregate null track');

        const aggregation = this.template(0);
        for(const trackProp in this.entity) {
            if(trackProp in aggregation) {
                let trackVal: number;
                if(this.entity[trackProp] == null) {
                    trackVal = 0;
                } else if(typeof this.entity[trackProp] === 'boolean') {
                    trackVal = this.entity[trackProp] ? 1 : 0;
                } else {
                    trackVal = this.entity[trackProp];
                }
                aggregation[trackProp] = trackVal;
            }
        }
        aggregation.timeSignatureVariation = (4 - this.entity.timeSignature) ** 2;
        return aggregation;
    }

    public normalize(raw: TrackAggregation): TrackAggregation {
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
        normalized.timeSignatureVariation = Math.cbrt(raw.timeSignatureVariation) / 2.4;
        normalized.duration = raw.duration;
        normalized.valence = raw.valence;

        return normalized;
    }

    public template(defaultVal: number): TrackAggregation {
        return {
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
            timeSignatureVariation: defaultVal,
            valence: defaultVal,
        };
    }
}
