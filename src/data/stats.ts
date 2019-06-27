import { Aggregation } from './aggregators/aggregator';
import { AlbumAggregator } from './aggregators/albumAggregator';
import { ReviewAggregator } from './aggregators/reviewAggregator';

/**
 * Reports the average, min, and max for all properties from an array of aggregations. Useful for
 * data normalization/analysis
 */
export function aggregateDistribution(aggregations: Aggregation[]): void {
    let average: Aggregation;
    let min: Aggregation;
    let max: Aggregation;
    const blankReviewAggragator = new ReviewAggregator(null);
    const blankAlbumAggragator = new AlbumAggregator(null);
    if('userDisagreement' in aggregations[0]) {
        average = blankReviewAggragator.template(0);
        min = blankReviewAggragator.template(null);
        max = blankReviewAggragator.template(null);
    } else {
        average = blankAlbumAggragator.template(0);
        min = blankAlbumAggragator.template(null);
        max = blankAlbumAggragator.template(null);
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
