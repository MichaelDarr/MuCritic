import { getRepository } from 'typeorm';

import { Aggregator } from './aggregator';
import { ReviewEntity } from '../../entities/entities';
import { ReviewAggregation } from '../types';
import { AlbumReviewAggregator } from './albumAggregator';

export class ReviewAggregator extends Aggregator<ReviewEntity, ReviewAggregation> {
    protected async generateAggregate(normalized: boolean): Promise<ReviewAggregation> {
        if(this.entity.album == null) {
            this.entity = await getRepository(ReviewEntity)
                .createQueryBuilder('review')
                .where('review.id = :id', { id: this.entity.id })
                .leftJoinAndSelect('review.album', 'album')
                .andWhere('album.spotifyId is not null')
                .andWhere('album.spotifyAlbumType = :type', { type: 'album' })
                .leftJoinAndSelect('album.artist', 'artist')
                .leftJoinAndSelect('album.tracks', 'tracks')
                .getOne();
        }
        const albumAggregator = new AlbumReviewAggregator(this.entity.album);
        const albumAggregation = await albumAggregator.aggregate(normalized);
        return {
            ...albumAggregation,
            userRating: this.entity.score,
            userDisagreement: this.entity.score - this.entity.album.ratingRYM,
        };
    }

    protected normalize(raw: ReviewAggregation): ReviewAggregation {
        return {
            ...raw,
            userRating: (raw.userRating - 0.5) / 4.5,
            userDisagreement: (raw.userDisagreement + 3.5) / 5.5,
        };
    }
}
