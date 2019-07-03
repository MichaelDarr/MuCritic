import { getRepository } from 'typeorm';

import {
    AggregationGenerator,
    AlbumAggregation,
} from './aggregator';
import { ArtistAggregator } from './artistAggregator';
import { TrackAggregator } from './trackAggregator';
import { AlbumEntity } from '../../entities/entities';

/**
 * [[AlbumAggregation]] generator class for [[AlbumEntity]]
 */
export const AlbumAggregator: AggregationGenerator<AlbumEntity, AlbumAggregation> = {
    aggregationType: 'album',
    convertFromRaw: (album: AlbumEntity): AlbumAggregation => ({
        availableMarkets: album.spotifyAvailableMarketCount,
        copyrights: album.spotifyCopyRightCount,
        popularity: album.spotifyPopularity,
        releaseYear: album.releaseYear,
        issues: album.issueCountRYM,
        lists: album.listCountRYM,
        overallRank: album.overallRankRYM,
        rating: album.ratingRYM,
        ratings: album.ratingCountRYM,
        reviews: album.reviewCountRYM,
        yearRank: album.yearRankRYM,
        artist: null,
        tracks: null,
    }),
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

        const aggregation = AlbumAggregator.convertFromRaw(album);
        aggregation.tracks = await Promise.all(
            album.tracks.map(track => TrackAggregator.generateFromEntity(
                track,
                normalized,
            )),
        );
        aggregation.artist = await ArtistAggregator.generateFromEntity(
            album.artist,
            normalized,
        );

        if(normalized) return AlbumAggregator.normalize(aggregation);
        return aggregation;
    },
    normalize: (raw: AlbumAggregation): AlbumAggregation => ({
        ...raw,
        availableMarkets: raw.availableMarkets / 80,
        copyrights: raw.copyrights / 2,
        popularity: raw.popularity / 100,
        releaseYear: Math.sqrt(2020 - raw.releaseYear) / 11,
        issues: Math.cbrt(raw.issues) / 6,
        lists: Math.cbrt(raw.lists) / 17,
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
            popularity: defaultVal,
            releaseYear: defaultVal,
            issues: defaultVal,
            lists: defaultVal,
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
