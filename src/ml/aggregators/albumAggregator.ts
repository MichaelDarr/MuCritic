import { getRepository } from 'typeorm';

import { Aggregator } from './aggregator';
import { AlbumEntity } from '../../entities/entities';
import { TemplateGenerator } from '../templates';
import { AlbumAggregation } from '../types';

/**
 * [[AlbumAggregation]] generator class for [[AlbumEntity]]
 */
export class AlbumReviewAggregator extends Aggregator<AlbumEntity, AlbumAggregation> {
    protected async generateAggregate(): Promise<AlbumAggregation> {
        if(
            this.entity == null
            || this.entity.artist == null
            || this.entity.tracks == null
        ) {
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

        const trackCount = this.entity.tracks.length;
        const trackAggregation = TemplateGenerator.track();
        this.entity.tracks.forEach((track) => {
            for(const trackProp in track) {
                if(trackProp === 'duration') {
                    trackAggregation[trackProp] += track[trackProp];
                } else {
                    trackAggregation[trackProp] += (
                        track[trackProp] / trackCount
                    );
                }
            }
        });

        this.entity.tracks.forEach((track) => {
            trackAggregation.timeSignatureVariation += (
                ((trackAggregation.timeSignature - track.timeSignature) ** 2) / trackCount
            );
        });

        return {
            availableMarkets: this.entity.spotifyAvailableMarketCount,
            copyrights: this.entity.spotifyCopyRightCount,
            albumPopularity: this.entity.spotifyPopularity,
            releaseYear: this.entity.releaseYear,
            issues: this.entity.issueCountRYM,
            albumLists: this.entity.listCountRYM,
            overallRank: this.entity.overallRankRYM,
            rating: this.entity.ratingRYM,
            ratings: this.entity.ratingCountRYM,
            reviews: this.entity.reviewCountRYM,
            yearRank: this.entity.yearRankRYM,
            active: this.entity.artist.active ? 1 : 0,
            discographySize: this.entity.artist.discographyCountRYM,
            artistLists: this.entity.artist.listCountRYM,
            members: this.entity.artist.memberCount,
            shows: this.entity.artist.showCountRYM,
            soloPerformer: this.entity.artist.soloPerformer ? 1 : 0,
            artistPopularity: this.entity.artist.spotifyPopularity,
            ...trackAggregation,
        };
    }

    protected normalize(raw: AlbumAggregation): AlbumAggregation {
        const normalized = TemplateGenerator.album();

        // Track Info
        normalized.acousticness = raw.acousticness;
        normalized.danceability = raw.danceability;
        normalized.duration = Math.sqrt(raw.duration) / 7000;
        normalized.energy = raw.energy;
        normalized.instrumentalness = raw.instrumentalness;
        normalized.liveness = raw.liveness;
        normalized.loudness = Math.abs(raw.loudness / 40);
        normalized.mode = raw.mode;
        normalized.speechiness = Math.sqrt(raw.speechiness);
        normalized.tempo = Math.abs(raw.tempo - 20) / 155;
        normalized.timeSignature = Math.abs(raw.timeSignature - 0.75) / 4;
        normalized.timeSignatureVariation = Math.sqrt(raw.timeSignatureVariation) / 2;
        normalized.valence = raw.valence;

        // Spotify Album Info
        normalized.availableMarkets = raw.availableMarkets / 80;
        normalized.copyrights = raw.copyrights / 2;
        normalized.albumPopularity = raw.albumPopularity / 100;
        normalized.releaseYear = Math.abs(raw.releaseYear - 1935) / 85;

        // RYM Album Info
        normalized.issues = Math.min(raw.issues, 100) / 100;
        normalized.albumLists = Math.sqrt(raw.albumLists) / 75;
        normalized.overallRank = raw.overallRank === 0
            ? 0
            : 1 - (Math.sqrt(raw.overallRank) / 150);
        normalized.rating = (raw.rating - 1) / 3.5;
        normalized.ratings = Math.sqrt(raw.ratings - 1) / 225;
        normalized.reviews = Math.sqrt(raw.reviews) / 40;
        normalized.yearRank = raw.yearRank === 0
            ? 0
            : 1 - (Math.sqrt(raw.yearRank) / 150);

        // Artist Info
        normalized.active = raw.active;
        normalized.discographySize = Math.sqrt(raw.discographySize) / 50;
        normalized.artistLists = Math.sqrt(raw.artistLists) / 45;
        normalized.members = Math.sqrt(raw.members - 1) / 7;
        normalized.shows = Math.sqrt(raw.shows) / 26;
        normalized.soloPerformer = raw.soloPerformer;
        normalized.artistPopularity = raw.artistPopularity / 100;

        return normalized;
    }
}
