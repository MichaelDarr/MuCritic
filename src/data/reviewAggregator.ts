import { getRepository } from 'typeorm';

import {
    AggregationGenerator,
    EncodedAlbum,
    FlatReviewAggregation,
    ReviewAggregation,
} from './aggregator';
import { ReviewEntity } from '../entities/entities';
import { AlbumAggregator } from './albumAggregator';

/**
 * [[ReviewAggregation]] generator class for [[ReviewEntity]]
 */
export const ReviewAggregator: AggregationGenerator<
ReviewEntity, ReviewAggregation, EncodedAlbum, FlatReviewAggregation> = {
    aggregationType: 'review',
    convertFromRaw: (review: ReviewEntity): ReviewAggregation => ({
        score: review.score,
        album: null,
    }),
    flatten: async (aggregation: ReviewAggregation): Promise<FlatReviewAggregation> => (
        [aggregation.score].concat(aggregation.album) as FlatReviewAggregation
    ),
    generateFromEntity: async (
        requestedReview: ReviewEntity,
        normalized: boolean,
    ): Promise<ReviewAggregation> => {
        let review = requestedReview;
        if(review == null) throw new Error('Cannot aggregate null review');
        if(review.album == null) {
            review = await getRepository(ReviewEntity)
                .createQueryBuilder('review')
                .where('review.id = :id', { id: review.id })
                .leftJoinAndSelect('review.album', 'album')
                .andWhere('album.spotifyId is not null')
                .andWhere('album.spotifyAlbumType = :type', { type: 'album' })
                .leftJoinAndSelect('album.artist', 'artist')
                .leftJoinAndSelect('album.tracks', 'tracks')
                .getOne();
        }

        if(review.album == null) throw new Error('No album for review aggregation');

        const aggregation = ReviewAggregator.convertFromRaw(review);
        const deepAlbum = await AlbumAggregator.generateFromEntity(
            review.album,
            normalized,
        );
        const flatAlbum = await AlbumAggregator.flatten(deepAlbum, requestedReview.album);
        aggregation.album = await AlbumAggregator.encode(flatAlbum);

        if(normalized) return ReviewAggregator.normalize(aggregation);
        return aggregation;
    },
    normalize: (raw: ReviewAggregation): ReviewAggregation => ({
        ...raw,
        score: raw.score / 5,
    }),
    template: (defaultVal = 0): ReviewAggregation => ({
        score: defaultVal,
        album: null,
    }),
};
