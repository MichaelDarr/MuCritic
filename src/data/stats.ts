import { Aggregation } from './types';
import { TemplateGenerator } from './templates';

/**
 * Reports the average, min, and max for all properties from an array of aggregations. Useful for
 * data normalization/analysis
 */
export function aggregateDistribution(aggregations: Aggregation[]): void {
    let average: Aggregation;
    let min: Aggregation;
    let max: Aggregation;
    if('userRating' in aggregations[0]) {
        average = TemplateGenerator.review();
        min = TemplateGenerator.review(null);
        max = TemplateGenerator.review(null);
    } else {
        average = TemplateGenerator.album();
        min = TemplateGenerator.album(null);
        max = TemplateGenerator.album(null);
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
