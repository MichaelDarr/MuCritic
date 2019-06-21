import { getRepository } from 'typeorm';

import { Aggregator } from './aggregator';
import { ProfileEntity } from '../../entities/entities';
import { ProfileAggregation } from '../types';
import { ReviewAggregator } from './reviewAggregator';

export class ProfileAggregator extends Aggregator<ProfileEntity, ProfileAggregation> {
    protected async generateAggregate(normalized: boolean): Promise<ProfileAggregation> {
        if(this.entity.reviews == null) {
            this.entity = await getRepository(ProfileEntity)
                .createQueryBuilder('profile')
                .where('profile.id = :id', { id: this.entity.id })
                .leftJoinAndSelect('profile.reviews', 'reviews')
                .leftJoinAndSelect('reviews.album', 'album')
                .andWhere('album.spotifyId is not null')
                .andWhere('album.spotifyAlbumType = :type', { type: 'album' })
                .getOne();
        }

        return Promise.all(
            this.entity.reviews.map((review) => {
                const reviewAggregator = new ReviewAggregator(review);
                return reviewAggregator.aggregate(normalized);
            }),
        );
    }

    protected normalize(raw: ProfileAggregation): ProfileAggregation {
        return raw;
    }
}
