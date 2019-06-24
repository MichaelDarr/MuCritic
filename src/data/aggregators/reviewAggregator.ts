import { getRepository } from 'typeorm';

import { Aggregator } from './aggregator';
import { ReviewEntity } from '../../entities/entities';
import { ReviewAggregation, CsvHeaders } from '../types';
import { AlbumAggregator } from './albumAggregator';

/**
 * [[ReviewAggregation]] generator class for [[ReviewEntity]]
 */
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
        const albumAggregator = new AlbumAggregator(this.entity.album);
        const albumAggregation = await albumAggregator.aggregate(normalized);
        return {
            ...albumAggregation,
            userDisagreement: this.entity.score - this.entity.album.ratingRYM,
        };
    }

    protected normalize(raw: ReviewAggregation): ReviewAggregation {
        return {
            ...raw,
            userDisagreement: (raw.userDisagreement + 3.5) / 5.5,
        };
    }

    public static csvHeaders(): CsvHeaders {
        const fields = AlbumAggregator.fields();
        const headers: CsvHeaders = [{ id: 'userDisagreement', title: 'userDisagreement' }];
        for(const field of fields) {
            headers.push({
                id: field,
                title: field,
            });
        }
        return headers;
    }
}
