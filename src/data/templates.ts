import {
    AlbumAggregation,
    ReviewAggregation,
    Track,
} from './types';

/**
 * Creates blank templates for some select types used for data aggregation/machine learning
 */
export class TemplateGenerator {
    public static album(defaultVal = 0): AlbumAggregation {
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
            active: defaultVal,
            discographySize: defaultVal,
            artistLists: defaultVal,
            members: defaultVal,
            shows: defaultVal,
            soloPerformer: defaultVal,
            artistPopularity: defaultVal,
        };
    }

    public static review(defaultVal = 0): ReviewAggregation {
        const blankAlbumAggregation = TemplateGenerator.album();
        return {
            userDisagreement: defaultVal,
            ...blankAlbumAggregation,
        };
    }

    public static track(defaultVal = 0): Track {
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
            timeSignatureVariation: defaultVal,
            valence: defaultVal,
        };
    }
}
