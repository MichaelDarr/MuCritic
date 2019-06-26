import { getRepository } from 'typeorm';

import {
    Aggregator,
    ProfileAggregation,
} from './aggregator';
import { ProfileEntity } from '../../entities/entities';
import { ReviewAggregator } from './reviewAggregator';

/**
 * multi-[[ReviewAggregation]] generator class for [[ProfileEntity]]
 */
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

    /**
     * @remarks
     * This aggregator relies soley on [[ReviewAggregator]] for its data, so no additional
     * normalization is required. Returns the raw parameter.
     */
    protected normalize(raw: ProfileAggregation): ProfileAggregation {
        return raw;
    }

    public template(): ProfileAggregation {
        return [];
    }
}
