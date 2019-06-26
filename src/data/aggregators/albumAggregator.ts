import { getRepository } from 'typeorm';

import {
    Aggregator,
    AlbumAggregation,
} from './aggregator';
import { TrackAggregator } from './trackAggregator';
import { AlbumEntity } from '../../entities/entities';

/**
 * [[AlbumAggregation]] generator class for [[AlbumEntity]]
 */
export class AlbumAggregator extends Aggregator<AlbumEntity, AlbumAggregation> {
    protected async generateAggregate(normalized: boolean): Promise<AlbumAggregation> {
        if(this.entity == null) throw new Error('Cannot aggregate null album');
        if(this.entity.artist == null || this.entity.tracks == null) {
            this.entity = await getRepository(AlbumEntity).findOne({
                relations: [
                    'artist',
                    'tracks',
                ],
                where: {
                    id: this.entity.id,
                },
            });
        }

        if(this.entity.artist == null) throw new Error(`Aggregated album has no artist: ${this.entity.name}`);
        if(this.entity.tracks == null) throw new Error(`Aggregated album has no tracks: ${this.entity.name} by ${this.entity.artist.name}`);

        const aggregation = this.template(0);

        const trackAggregators = this.entity.tracks.map(track => new TrackAggregator(track));
        const trackAggregations = trackAggregators.map(track => track.aggregate(normalized));
        const trackCount = trackAggregators.length;

        trackAggregations.forEach((track) => {
            for(const trackProp in track) {
                if(trackProp in aggregation) {
                    if(trackProp === 'duration') {
                        aggregation[trackProp] += track[trackProp];
                    } else {
                        aggregation[trackProp] += track[trackProp] / trackCount;
                    }
                }
            }
        });

        aggregation.availableMarkets = this.entity.spotifyAvailableMarketCount;
        aggregation.copyrights = this.entity.spotifyCopyRightCount;
        aggregation.albumPopularity = this.entity.spotifyPopularity;
        aggregation.releaseYear = this.entity.releaseYear;
        aggregation.issues = this.entity.issueCountRYM;
        aggregation.albumLists = this.entity.listCountRYM;
        aggregation.overallRank = this.entity.overallRankRYM;
        aggregation.rating = this.entity.ratingRYM;
        aggregation.ratings = this.entity.ratingCountRYM;
        aggregation.reviews = this.entity.reviewCountRYM;
        aggregation.yearRank = this.entity.yearRankRYM;
        aggregation.active = this.entity.artist.active ? 1 : 0;
        aggregation.discographySize = this.entity.artist.discographyCountRYM;
        aggregation.artistLists = this.entity.artist.listCountRYM;
        aggregation.members = this.entity.artist.memberCount;
        aggregation.shows = this.entity.artist.showCountRYM;
        aggregation.soloPerformer = this.entity.artist.soloPerformer ? 1 : 0;
        aggregation.artistPopularity = this.entity.artist.spotifyPopularity;

        return aggregation;
    }

    protected normalize(raw: AlbumAggregation): AlbumAggregation {
        const normalized = this.template(0);

        // Track Info (only for aggregations)
        normalized.duration = Math.sqrt(raw.duration) / 7000;

        // Spotify Album Info
        normalized.availableMarkets = raw.availableMarkets / 80;
        normalized.copyrights = raw.copyrights / 2;
        normalized.albumPopularity = Math.sqrt(raw.albumPopularity) / 10;
        normalized.releaseYear = Math.sqrt(2020 - raw.releaseYear) / 11;

        // RYM Album Info
        normalized.issues = Math.cbrt(raw.issues) / 6;
        normalized.albumLists = Math.cbrt(raw.albumLists) / 17;
        normalized.overallRank = raw.overallRank === 0
            ? 0
            : 1 - (Math.cbrt(raw.overallRank) / 30);
        normalized.rating = (raw.rating - 0.5) / 4.5;
        normalized.ratings = Math.cbrt(raw.ratings - 1) / 36;
        normalized.reviews = Math.cbrt(raw.reviews) / 11;
        normalized.yearRank = raw.yearRank === 0
            ? 0
            : 1 - (Math.cbrt(raw.overallRank) / 30);

        // Artist Info
        normalized.active = raw.active;
        normalized.discographySize = Math.sqrt(raw.discographySize - 1) / 50;
        normalized.artistLists = Math.sqrt(raw.artistLists) / 45;
        normalized.members = Math.cbrt(raw.members - 1) / 5;
        normalized.shows = Math.cbrt(raw.shows) / 9;
        normalized.soloPerformer = raw.soloPerformer;
        normalized.artistPopularity = raw.artistPopularity / 100;

        return normalized;
    }

    public template(defaultVal: number): AlbumAggregation {
        const track = new TrackAggregator(null).template(defaultVal);
        return {
            ...track,
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
}
