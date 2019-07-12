import * as tf from '@tensorflow/tfjs';

import {
    AggregationGenerator,
    ArtistAggregation,
    EncodedAlbum,
    EncodedArtistTracks,
    FlatArtistAggregation,
} from './aggregator';
import { SpotifyArtistTracksScraper } from '../../scrapers/spotify/aggregators/spotifyArtistTracksScraper';
import { ArtistEntity } from '../../entities/entities';

require('@tensorflow/tfjs-node');

let artistTrackEncoder: tf.LayersModel = null;

/**
 * [[ArtistAggregator]] generator class for [[ArtistEntity]]
 */
export const ArtistAggregator:
AggregationGenerator<ArtistEntity, ArtistAggregation, EncodedAlbum, FlatArtistAggregation> = {
    aggregationType: 'artist',
    convertFromRaw: (artist: ArtistEntity): ArtistAggregation => ({
        active: artist.active ? 1 : 0,
        discographySize: artist.discographyCountRYM,
        lists: artist.listCountRYM,
        members: artist.memberCount,
        shows: artist.showCountRYM,
        soloPerformer: artist.soloPerformer ? 1 : 0,
        popularity: artist.spotifyPopularity,
    }),
    flatten: async (
        aggregation: ArtistAggregation,
        artist: ArtistEntity,
    ): Promise<FlatArtistAggregation> => {
        const artistTrackAggregator = new SpotifyArtistTracksScraper(artist, null, 5, true);
        await artistTrackAggregator.scrape();
        const { encodedTracks } = artistTrackAggregator;
        if(artistTrackEncoder == null) {
            artistTrackEncoder = await tf.loadLayersModel(`${process.env.MODEL_LOCATION_ARTIST_TRACKS}/encoder/model.json`);
        }
        const aggregationTensor = tf
            .tensor(encodedTracks)
            .as3D(1, encodedTracks.length, encodedTracks[0].length);
        const encodedTensor = artistTrackEncoder.predict(aggregationTensor) as tf.Tensor;
        const encodedArtistTracks = await encodedTensor.array() as EncodedArtistTracks[];

        return [
            aggregation.popularity,
        ].concat(encodedArtistTracks[0]) as FlatArtistAggregation;
    },
    generateFromEntity: async (
        artist: ArtistEntity,
        normalized: boolean,
    ): Promise<ArtistAggregation> => {
        if(artist == null) throw new Error('Cannot aggregate null artist');

        const aggregation = ArtistAggregator.convertFromRaw(artist);
        if(normalized) return ArtistAggregator.normalize(aggregation);
        return aggregation;
    },
    normalize: (raw: ArtistAggregation): ArtistAggregation => ({
        ...raw,
        active: raw.active,
        discographySize: Math.sqrt(raw.discographySize - 1) / 50,
        lists: Math.sqrt(raw.lists) / 45,
        members: Math.cbrt(raw.members - 1) / 5,
        shows: Math.cbrt(raw.shows) / 9,
        soloPerformer: raw.soloPerformer,
        popularity: raw.popularity / 100,
    }),
    template: (defaultVal: number): ArtistAggregation => ({
        active: defaultVal,
        discographySize: defaultVal,
        lists: defaultVal,
        members: defaultVal,
        shows: defaultVal,
        soloPerformer: defaultVal,
        popularity: defaultVal,
    }),
};
