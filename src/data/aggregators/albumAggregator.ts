import { getRepository } from 'typeorm';

import {
    AggregationGenerator,
    AlbumAggregation,
} from './aggregator';
import { ArtistAggregator } from './artistAggregator';
import { TrackAggregator } from './trackAggregator';
import { AlbumEntity } from '../../entities/entities';
import { TrackEntity } from '../../entities/TrackEntity';

/**
 * [[AlbumAggregation]] generator class for [[AlbumEntity]]
 */
export const AlbumAggregator: AggregationGenerator<AlbumEntity, AlbumAggregation> = {
    aggregationType: 'album',
    generateFromEntity: async (
        requestedAlbum: AlbumEntity,
        normalized: boolean,
    ): Promise<AlbumAggregation> => {
        let album = requestedAlbum;
        if(album == null) throw new Error('Cannot aggregate null album');
        if(album.artist == null || album.tracks == null) {
            album = await getRepository(AlbumEntity).findOne({
                relations: [
                    'artist',
                    'tracks',
                ],
                where: {
                    id: album.id,
                },
            });
        }

        if(album.artist == null) throw new Error(`Aggregated album has no artist: ${album.name}`);
        if(album.tracks == null) throw new Error(`Aggregated album has no tracks: ${album.name} by ${album.artist.name}`);

        const trackAggregations = await Promise.all(
            album.tracks.map(
                (track: TrackEntity) => TrackAggregator.generateFromEntity(track, normalized),
            ),
        );
        const artistAggregation = await ArtistAggregator.generateFromEntity(
            album.artist,
            normalized,
        );

        return {
            availableMarkets: album.spotifyAvailableMarketCount,
            copyrights: album.spotifyCopyRightCount,
            albumPopularity: album.spotifyPopularity,
            releaseYear: album.releaseYear,
            issues: album.issueCountRYM,
            albumLists: album.listCountRYM,
            overallRank: album.overallRankRYM,
            rating: album.ratingRYM,
            ratings: album.ratingCountRYM,
            reviews: album.reviewCountRYM,
            yearRank: album.yearRankRYM,
            tracks: trackAggregations,
            artist: artistAggregation,
        };
    },
    normalize: (raw: AlbumAggregation): AlbumAggregation => ({
        ...raw,
        availableMarkets: raw.availableMarkets / 80,
        copyrights: raw.copyrights / 2,
        albumPopularity: Math.sqrt(raw.albumPopularity) / 10,
        releaseYear: Math.sqrt(2020 - raw.releaseYear) / 11,
        issues: Math.cbrt(raw.issues) / 6,
        albumLists: Math.cbrt(raw.albumLists) / 17,
        overallRank: raw.overallRank === 0
            ? 0
            : 1 - (Math.cbrt(raw.overallRank) / 30),
        rating: (raw.rating - 0.5) / 4.5,
        ratings: Math.cbrt(raw.ratings - 1) / 36,
        reviews: Math.cbrt(raw.reviews) / 11,
        yearRank: raw.yearRank === 0
            ? 0
            : 1 - (Math.cbrt(raw.overallRank) / 30),
    }),
    template(defaultVal: number): AlbumAggregation {
        return {
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
            artist: ArtistAggregator.template(defaultVal),
            tracks: [],
        };
    },
};
