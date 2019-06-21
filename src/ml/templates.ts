import {
    AlbumAggregation,
    ReviewAggregation,
    Track,
} from './types';


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
            userRating: defaultVal,
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
            timeSignature: defaultVal,
            timeSignatureVariation: defaultVal,
            valence: defaultVal,
        };
    }
}