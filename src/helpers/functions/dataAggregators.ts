import { getRepository } from 'typeorm';

import {
    ProfileEntity,
    ReviewEntity,
} from '../../entities/entities';
import { ReviewAggregation, TrackInfo } from '../../types/types';

function getBlankAggregation(defaultVal = 0): ReviewAggregation {
    return {
        acousticness: defaultVal,
        danceability: defaultVal,
        duration: defaultVal,
        energy: defaultVal,
        instrumentalness: defaultVal,
        liveness: defaultVal,
        loudness: defaultVal,
        mode: defaultVal,
        speechiness: defaultVal,
        tempo: defaultVal,
        timeSignature: defaultVal,
        timeSignatureVariation: defaultVal,
        valence: defaultVal,
        availableMarkets: defaultVal,
        copyrights: defaultVal,
        albumPopularity: defaultVal,
        releaseYear: defaultVal,
        issues: defaultVal,
        albumLists: defaultVal,
        overallRank: defaultVal,
        rating: defaultVal,
        ratings: defaultVal,
        reviews: defaultVal,
        yearRank: defaultVal,
        userRating: defaultVal,
        userDisagreement: defaultVal,
        active: defaultVal,
        discographySize: defaultVal,
        artistLists: defaultVal,
        members: defaultVal,
        shows: defaultVal,
        soloPerformer: defaultVal,
        artistPopularity: defaultVal,
    };
}

function normalizeAggregation(rawAggregation: ReviewAggregation): ReviewAggregation {
    const normalized: ReviewAggregation = Object.assign({}, rawAggregation);

    normalized.duration = Math.sqrt(normalized.duration) / 7000;
    normalized.loudness = Math.abs(normalized.loudness / 40);
    normalized.speechiness = Math.sqrt(normalized.speechiness);
    normalized.tempo = Math.abs(normalized.tempo - 20) / 155;
    normalized.timeSignature = Math.abs(normalized.timeSignature - 0.75) / 4;
    normalized.timeSignatureVariation = Math.sqrt(normalized.timeSignatureVariation) / 2;
    normalized.availableMarkets /= 80;
    normalized.copyrights /= 2;
    normalized.albumPopularity /= 100;
    normalized.releaseYear = Math.abs(normalized.releaseYear - 1935) / 85;
    normalized.issues = Math.min(normalized.issues, 100) / 100;
    normalized.albumLists = Math.sqrt(normalized.albumLists) / 75;
    if(normalized.overallRank !== 0) {
        normalized.overallRank = 1 - (Math.sqrt(normalized.overallRank) / 150);
    }
    normalized.rating = (normalized.rating - 1) / 3.5;
    normalized.ratings = Math.sqrt(normalized.ratings - 1) / 225;
    normalized.reviews = Math.sqrt(normalized.reviews) / 40;
    if(normalized.yearRank !== 0) {
        normalized.yearRank = 1 - (Math.sqrt(normalized.yearRank) / 150);
    }
    normalized.userRating = (normalized.userRating - 0.5) / 4.5;
    normalized.userDisagreement = (normalized.userDisagreement + 3.5) / 5.5;
    normalized.discographySize = Math.sqrt(normalized.discographySize) / 50;
    normalized.artistLists = Math.sqrt(normalized.artistLists) / 45;
    normalized.members = Math.sqrt(normalized.members - 1) / 7;
    normalized.shows = Math.sqrt(normalized.shows) / 26;
    normalized.artistPopularity /= 100;

    return normalized;
}

export function calculateAggregationDistribution(reviews: ReviewAggregation[]): void {
    const average = getBlankAggregation(0);
    const min = getBlankAggregation(null);
    const max = getBlankAggregation(null);

    reviews.forEach((review) => {
        for(const reviewProp in review) {
            if(reviewProp in average) {
                average[reviewProp] += (review[reviewProp] / reviews.length);
                if(min[reviewProp] == null || min[reviewProp] > review[reviewProp]) {
                    min[reviewProp] = review[reviewProp];
                }
                if(max[reviewProp] == null || max[reviewProp] < review[reviewProp]) {
                    max[reviewProp] = review[reviewProp];
                }
            }
        }
    });

    console.log('Review data distributions:');
    for(const reviewProp in average) {
        if(reviewProp in average) {
            console.log(`${reviewProp}:\n  avg: ${average[reviewProp]}\n  min: ${min[reviewProp]}\n  max: ${max[reviewProp]}`);
        }
    }
}

export async function getProfiles(): Promise<ProfileEntity[]> {
    return getRepository(ProfileEntity).find();
}

export async function getProfileWithSpotifyAlbums(profile: ProfileEntity): Promise<ProfileEntity> {
    return getRepository(ProfileEntity)
        .createQueryBuilder('profile')
        .where('profile.id = :id', { id: profile.id })
        .leftJoinAndSelect('profile.reviews', 'reviews')
        .leftJoin('reviews.album', 'album')
        .andWhere('album.spotifyId is not null')
        .andWhere('album.spotifyAlbumType = :type', { type: 'album' })
        .getOne();
}

export async function getReviewAggregation(
    review: ReviewEntity,
    normalize = true,
): Promise<ReviewAggregation> {
    const fullReview = await getRepository(ReviewEntity).findOne({
        relations: [
            'album',
            'album.artist',
            'album.tracks',
        ],
        where: {
            id: review.id,
        },
    });

    const trackCount = fullReview.album.tracks.length;

    const trackAggregation: TrackInfo = {
        acousticness: 0,
        danceability: 0,
        duration: 0,
        energy: 0,
        instrumentalness: 0,
        liveness: 0,
        loudness: 0,
        mode: 0,
        speechiness: 0,
        tempo: 0,
        timeSignature: 0,
        timeSignatureVariation: 0,
        valence: 0,
    };

    fullReview.album.tracks.forEach((track) => {
        for(const trackProp in track) {
            if(trackProp in trackAggregation) {
                if(trackProp === 'duration') {
                    trackAggregation[trackProp] += track[trackProp];
                } else {
                    trackAggregation[trackProp] += (
                        track[trackProp] / trackCount
                    );
                }
            }
        }
    });

    fullReview.album.tracks.forEach((track) => {
        trackAggregation.timeSignatureVariation += (
            ((trackAggregation.timeSignature - track.timeSignature) ** 2) / trackCount
        );
    });

    const rawAggregation = {
        availableMarkets: fullReview.album.spotifyAvailableMarketCount,
        copyrights: fullReview.album.spotifyCopyRightCount,
        albumPopularity: fullReview.album.spotifyPopularity,
        releaseYear: fullReview.album.releaseYear,
        issues: fullReview.album.issueCountRYM,
        albumLists: fullReview.album.listCountRYM,
        overallRank: fullReview.album.overallRankRYM,
        rating: fullReview.album.ratingRYM,
        ratings: fullReview.album.ratingCountRYM,
        reviews: fullReview.album.reviewCountRYM,
        yearRank: fullReview.album.yearRankRYM,
        userRating: fullReview.score,
        userDisagreement: fullReview.score - fullReview.album.ratingRYM,
        active: fullReview.album.artist.active ? 1 : 0,
        discographySize: fullReview.album.artist.discographyCountRYM,
        artistLists: fullReview.album.artist.listCountRYM,
        members: fullReview.album.artist.memberCount,
        shows: fullReview.album.artist.showCountRYM,
        soloPerformer: fullReview.album.artist.soloPerformer ? 1 : 0,
        artistPopularity: fullReview.album.artist.spotifyPopularity,
        ...trackAggregation,
    };
    if(!normalize) return rawAggregation;
    return normalizeAggregation(rawAggregation);
}
