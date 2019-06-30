import {
    AggregationGenerator,
    ArtistAggregation,
} from './aggregator';
import { ArtistEntity } from '../../entities/entities';

/**
 * [[ArtistAggregator]] generator class for [[ArtistEntity]]
 */
export const ArtistAggregator: AggregationGenerator<ArtistEntity, ArtistAggregation> = {
    aggregationType: 'artist',
    generateFromEntity: async (artist: ArtistEntity): Promise<ArtistAggregation> => {
        if(artist == null) throw new Error('Cannot aggregate null artist');

        return {
            active: artist.active ? 1 : 0,
            discographySize: artist.discographyCountRYM,
            artistLists: artist.listCountRYM,
            members: artist.memberCount,
            shows: artist.showCountRYM,
            soloPerformer: artist.soloPerformer ? 1 : 0,
            artistPopularity: artist.spotifyPopularity,
        };
    },
    normalize: (raw: ArtistAggregation): ArtistAggregation => ({
        ...raw,
        active: raw.active,
        discographySize: Math.sqrt(raw.discographySize - 1) / 50,
        artistLists: Math.sqrt(raw.artistLists) / 45,
        members: Math.cbrt(raw.members - 1) / 5,
        shows: Math.cbrt(raw.shows) / 9,
        soloPerformer: raw.soloPerformer,
        artistPopularity: raw.artistPopularity / 100,
    }),
    template: (defaultVal: number): ArtistAggregation => ({
        active: defaultVal,
        discographySize: defaultVal,
        artistLists: defaultVal,
        members: defaultVal,
        shows: defaultVal,
        soloPerformer: defaultVal,
        artistPopularity: defaultVal,
    }),
};
