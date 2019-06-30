import { getRepository } from 'typeorm';

import {
    AggregationGenerator,
    ProfileAggregation,
} from './aggregator';
import { ProfileEntity } from '../../entities/entities';
import { ArtistAggregator } from './artistAggregator';
import { ReviewAggregator } from './reviewAggregator';

/**
 * multi-[[ReviewAggregation]] generator class for [[ProfileEntity]]
 */
export const ProfileAggregator: AggregationGenerator<ProfileEntity, ProfileAggregation> = {
    aggregationType: 'profile',
    generateFromEntity: async (
        requestedProfile: ProfileEntity,
        normalized: boolean,
    ): Promise<ProfileAggregation> => {
        let profile = requestedProfile;
        if(profile == null) throw new Error('Cannot aggregate null profile');
        if(profile.reviews == null) {
            profile = await getRepository(ProfileEntity)
                .createQueryBuilder('profile')
                .where('profile.id = :id', { id: profile.id })
                .leftJoinAndSelect('profile.reviews', 'reviews')
                .leftJoinAndSelect('reviews.album', 'album')
                .andWhere('album.spotifyId is not null')
                .andWhere('album.spotifyAlbumType = :type', { type: 'album' })
                .getOne();
        }

        const favoriteArtistAggregations = await Promise.all(
            profile.favoriteArtists.map(
                artist => ArtistAggregator.generateFromEntity(artist, normalized),
            ),
        );
        const reviewAggregations = await Promise.all(
            profile.reviews.map(review => ReviewAggregator.generateFromEntity(review, normalized)),
        );

        return {
            age: profile.age,
            gender: profile.gender ? 1 : 0,
            favoriteArtists: favoriteArtistAggregations,
            reviews: reviewAggregations,
        };
    },
    normalize: (raw: ProfileAggregation): ProfileAggregation => ({
        ...raw,
        age: Math.sqrt(raw.age) / 8,
        gender: raw.gender,
    }),
    template: (defaultVal: number): ProfileAggregation => ({
        age: defaultVal,
        gender: defaultVal,
        favoriteArtists: [],
        reviews: [],
    }),
};
