import { getRepository } from 'typeorm';

import {
    AggregationGenerator,
    ReviewAggregation,
} from './aggregator';
import { ReviewEntity } from '../../entities/entities';
import { AlbumAggregator } from './albumAggregator';
import { SpotifyAlbumTracksScraper } from '../../scrapers/spotify/aggregators/spotifyAlbumTracksScraper';

/**
 * [[ReviewAggregation]] generator class for [[ReviewEntity]]
 */
export const ReviewAggregator: AggregationGenerator<ReviewEntity, ReviewAggregation> = {
    aggregationType: 'review',
    convertFromRaw: (review: ReviewEntity): ReviewAggregation => ({
        score: review.score,
        album: null,
    }),
    flatFields: [
        'albumAvailableMarkets',
        'albumCopyrights',
        'albumPopularity',
        'albumReleaseYear',
        'albumIssues',
        'albumLists',
        'albumOverallRank',
        'albumRating',
        'albumRatings',
        'albumReviews',
        'albumYearRank',
        'artistIsActive',
        'artistDiscographySize',
        'artistListCount',
        'artistMemberCount',
        'artistShowCount',
        'artistIsSoloPerformer',
        'artistPopularity',
        'albumEncoding0',
        'albumEncoding1',
        'albumEncoding2',
        'albumEncoding3',
        'albumEncoding4',
        'albumEncoding5',
        'albumEncoding6',
        'albumEncoding8',
        'albumEncoding9',
        'albumEncoding10',
        'albumEncoding11',
        'albumEncoding12',
        'albumEncoding13',
        'albumEncoding14',
        'albumEncoding15',
        'albumEncoding16',
        'albumEncoding18',
        'albumEncoding19',
        'albumEncoding20',
        'albumEncoding21',
        'albumEncoding22',
        'albumEncoding23',
        'albumEncoding24',
        'albumEncoding25',
        'albumEncoding26',
        'albumEncoding28',
        'albumEncoding29',
        'albumEncoding30',
        'albumEncoding31',
    ],
    // flatten: async (
    //     review: ReviewEntity,
    //     aggregation: ReviewAggregation,
    // ): Promise<FlattenedReviewAggregation> => {
    //     const scraper = new SpotifyAlbumTracksScraper(review.album);
    //     await scraper.scrape();
    //     const encoded = scraper.encodedTracks;

    //     return {
    //         albumAvailableMarkets: aggregation.album.availableMarkets,
    //         albumCopyrights: aggregation.album.copyrights,
    //         albumPopularity: aggregation.album.popularity,
    //         albumReleaseYear: aggregation.album.releaseYear,
    //         albumIssues: aggregation.album.issues,
    //         albumLists: aggregation.album.lists,
    //         albumOverallRank: aggregation.album.overallRank,
    //         albumRating: aggregation.album.rating,
    //         albumRatings: aggregation.album.ratings,
    //         albumReviews: aggregation.album.reviews,
    //         albumYearRank: aggregation.album.yearRank,
    //         artistIsActive: aggregation.album.artist.active,
    //         artistDiscographySize: aggregation.album.artist.discographySize,
    //         artistListCount: aggregation.album.artist.lists,
    //         artistMemberCount: aggregation.album.artist.members,
    //         artistShowCount: aggregation.album.artist.shows,
    //         artistIsSoloPerformer: aggregation.album.artist.soloPerformer,
    //         artistPopularity: aggregation.album.artist.popularity,
    //         albumEncoding0: encoded[0],
    //         albumEncoding1: encoded[1],
    //         albumEncoding2: encoded[2],
    //         albumEncoding3: encoded[3],
    //         albumEncoding4: encoded[4],
    //         albumEncoding5: encoded[5],
    //         albumEncoding6: encoded[6],
    //         albumEncoding8: encoded[8],
    //         albumEncoding9: encoded[9],
    //         albumEncoding10: encoded[10],
    //         albumEncoding11: encoded[11],
    //         albumEncoding12: encoded[12],
    //         albumEncoding13: encoded[13],
    //         albumEncoding14: encoded[14],
    //         albumEncoding15: encoded[15],
    //         albumEncoding16: encoded[16],
    //         albumEncoding18: encoded[18],
    //         albumEncoding19: encoded[19],
    //         albumEncoding20: encoded[20],
    //         albumEncoding21: encoded[21],
    //         albumEncoding22: encoded[22],
    //         albumEncoding23: encoded[23],
    //         albumEncoding24: encoded[24],
    //         albumEncoding25: encoded[25],
    //         albumEncoding26: encoded[26],
    //         albumEncoding28: encoded[28],
    //         albumEncoding29: encoded[29],
    //         albumEncoding30: encoded[30],
    //         albumEncoding31: encoded[31],
    //     };
    // },
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
        aggregation.album = await AlbumAggregator.generateFromEntity(
            review.album,
            normalized,
        );

        if(normalized) return ReviewAggregator.normalize(aggregation);
        return aggregation;
    },
    normalize: (raw: ReviewAggregation): ReviewAggregation => ({
        ...raw,
        score: raw.score / 5,
    }),
    template: (defaultVal = 0): ReviewAggregation => ({
        score: defaultVal,
        album: AlbumAggregator.template(defaultVal),
    }),
};
