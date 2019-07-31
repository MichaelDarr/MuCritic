import * as tf from '@tensorflow/tfjs';
import { getRepository } from 'typeorm';

import { SpotifyAlbumTracksScraper } from '../scrapers/spotify/aggregators/spotifyAlbumTracksScraper';
import {
    AggregationGenerator,
    AlbumAggregation,
    EncodedAlbumTracks,
    EncodedAlbum,
    FlatAlbumAggregation,
} from './aggregator';
import { ArtistAggregator } from './artistAggregator';
import { TrackAggregator } from './trackAggregator';
import { AlbumEntity } from '../entities/entities';

require('@tensorflow/tfjs-node');

let albumEncoder: tf.LayersModel = null;
let albumTrackEncoder: tf.LayersModel = null;

/**
 * [[AlbumAggregation]] generator class for [[AlbumEntity]]
 */
export const AlbumAggregator: AggregationGenerator<
AlbumEntity, AlbumAggregation, EncodedAlbum, FlatAlbumAggregation
> = {
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
    encode: async (
        flatAggregation: FlatAlbumAggregation,
    ): Promise<EncodedAlbum> => {
        if(albumEncoder == null) {
            albumEncoder = await tf.loadLayersModel(`${process.env.MODEL_LOCATION_ALBUM}/encoder/model.json`);
        }
        const aggregationTensor = tf
            .tensor(flatAggregation)
            .as2D(1, flatAggregation.length);
        const encodedTensor = albumEncoder.predict(aggregationTensor) as tf.Tensor;
        const encodedAlbum = await encodedTensor.array() as EncodedAlbum[];
        return encodedAlbum[0];
    },
    flatten: async (
        aggregation: AlbumAggregation,
        album: AlbumEntity,
    ): Promise<FlatAlbumAggregation> => {
        const albumTrackAggregator = new SpotifyAlbumTracksScraper(album.spotifyId, null, 6, true);
        await albumTrackAggregator.scrape();
        const { encodedTracks } = albumTrackAggregator;
        if(albumTrackEncoder == null) {
            albumTrackEncoder = await tf.loadLayersModel(`${process.env.MODEL_LOCATION_ALBUM_TRACKS}/encoder/model.json`);
        }
        const aggregationTensor = tf
            .tensor(encodedTracks)
            .as3D(1, encodedTracks.length, encodedTracks[0].length);
        const encodedTensor = albumTrackEncoder.predict(aggregationTensor) as tf.Tensor;
        const encodedAlbumTracks = await encodedTensor.array() as EncodedAlbumTracks[];

        return [
            aggregation.availableMarkets,
            aggregation.copyrights,
            aggregation.popularity,
            aggregation.releaseYear,
            aggregation.issues,
            aggregation.lists,
            aggregation.overallRank,
            aggregation.rating,
            aggregation.ratings,
            aggregation.reviews,
            aggregation.yearRank,
            aggregation.artist.active,
            aggregation.artist.discographySize,
            aggregation.artist.lists,
            aggregation.artist.members,
            aggregation.artist.shows,
            aggregation.artist.soloPerformer,
            aggregation.artist.popularity,
        ].concat(encodedAlbumTracks[0]) as FlatAlbumAggregation;
    },
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
            album.tracks.map(async (track) => {
                const trackRaw = await TrackAggregator.generateFromEntity(
                    track,
                    true,
                );
                const flatTrack = await TrackAggregator.flatten(trackRaw);
                return TrackAggregator.encode(flatTrack);
            }),
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
