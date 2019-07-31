import { Aggregation } from './aggregator';
import { AlbumAggregator } from './albumAggregator';
import { ReviewAggregator } from './reviewAggregator';

/**
 * Reports the average, min, and max for all properties from an array of aggregations. Useful for
 * data normalization/analysis
 */
export function aggregateDistribution(aggregations: Aggregation[]): void {
    let average: Aggregation;
    let min: Aggregation;
    let max: Aggregation;
    if('userDisagreement' in aggregations[0]) {
        average = ReviewAggregator.template(0);
        min = ReviewAggregator.template(null);
        max = ReviewAggregator.template(null);
    } else {
        average = AlbumAggregator.template(0);
        min = AlbumAggregator.template(null);
        max = AlbumAggregator.template(null);
    }

    aggregations.forEach((review) => {
        for(const reviewProp in review) {
            if(reviewProp in average) {
                average[reviewProp] += (review[reviewProp] / aggregations.length);
                if(min[reviewProp] == null || min[reviewProp] > review[reviewProp]) {
                    min[reviewProp] = review[reviewProp];
                }
                if(max[reviewProp] == null || max[reviewProp] < review[reviewProp]) {
                    max[reviewProp] = review[reviewProp];
                }
            }
        }
    });

    for(const reviewProp in average) {
        if(reviewProp in average) {
            console.log(`${reviewProp}:\n  avg: ${average[reviewProp]}\n  min: ${min[reviewProp]}\n  max: ${max[reviewProp]}`);
        }
    }
}
