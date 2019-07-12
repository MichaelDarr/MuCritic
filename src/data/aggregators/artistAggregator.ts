import {
    AggregationGenerator,
    ArtistAggregation,
    EncodedAlbum,
    FlatAlbumAggregation,
} from './aggregator';
import { ArtistEntity } from '../../entities/entities';

/**
 * [[ArtistAggregator]] generator class for [[ArtistEntity]]
 */
export const ArtistAggregator:
AggregationGenerator<ArtistEntity, ArtistAggregation, EncodedAlbum, FlatAlbumAggregation> = {
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
