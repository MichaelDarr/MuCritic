import {
    Aggregator,
    TrackAggregation,
} from './aggregator';
import { TrackEntity } from '../../entities/entities';

/**
 * [[TrackAggregation]] generator class for [[TrackEntity]] database entries
 */
export class TrackAggregator extends Aggregator<TrackEntity, TrackAggregation> {
    protected async generateAggregate(): Promise<TrackAggregation> {
        if(this.entity == null) throw new Error('tried to aggregate null track');

        const aggregation = this.template(0);
        for(const trackProp in this.entity) {
            if(trackProp in aggregation) {
                let trackVal = this.entity[trackProp];
                if(trackVal == null) {
                    trackVal = 0;
                } else if(typeof trackVal === 'boolean') {
                    trackVal = trackVal ? 1 : 0;
                } if(trackProp === 'timeSignature') {
                    aggregation.timeSignatureVariation = (4 - trackVal) ** 2;
                }
                aggregation[trackProp] = trackVal;
            }
        }

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
        normalized.loudness = Math.sqrt(raw.loudness + 40) / 6;
        normalized.mode = raw.mode;
        normalized.speechiness = Math.sqrt(raw.speechiness);
        normalized.tempo = Math.sqrt(190 - raw.tempo) / 2.25;
        normalized.timeSignatureVariation = Math.cbrt(raw.timeSignatureVariation) / 2.4;
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
