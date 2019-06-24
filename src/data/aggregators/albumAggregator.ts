import { getRepository } from 'typeorm';

import { Aggregator } from './aggregator';
import { AlbumEntity } from '../../entities/entities';
import { TemplateGenerator } from '../templates';
import { AlbumAggregation, CsvHeaders } from '../types';

/**
 * [[AlbumAggregation]] generator class for [[AlbumEntity]]
 */
export class AlbumAggregator extends Aggregator<AlbumEntity, AlbumAggregation> {
    public static fields(): string[] {
        const blankAlbum = TemplateGenerator.album();
        const fields: string[] = [];
        for(const prop in blankAlbum) {
            if(prop in blankAlbum) {
                fields.push(prop);
            }
        }
        return fields;
    }

    public static csvHeaders(): CsvHeaders {
        const fields = AlbumAggregator.fields();
        const headers: CsvHeaders = [];
        for(const field of fields) {
            headers.push({
                id: field,
                title: field,
            });
        }
        return headers;
    }

    protected async generateAggregate(): Promise<AlbumAggregation> {
        if(this.entity == null
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

        if(this.entity == null
            || this.entity.artist == null
            || this.entity.tracks == null
        ) {
            throw new Error(`some data cannot be found for album aggregation: ${this.entity.id}`);
        }

        const trackCount = this.entity.tracks.length;
        const trackAggregation = TemplateGenerator.track();
        this.entity.tracks.forEach((track) => {
            for(const trackProp in track) {
                if(trackProp === 'duration') {
                    trackAggregation[trackProp] += track[trackProp];
                } else if(trackProp === 'timeSignature') {
                    trackAggregation.timeSignatureVariation += (
                        ((4 - track.timeSignature) ** 2) / trackCount
                    );
                } else {
                    trackAggregation[trackProp] += (
                        track[trackProp] / trackCount
                    );
                }
            }
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
        normalized.loudness = Math.sqrt(raw.loudness + 40) / 6;
        normalized.mode = raw.mode;
        normalized.speechiness = Math.sqrt(raw.speechiness);
        normalized.tempo = Math.sqrt(190 - raw.tempo) / 2.25;
        normalized.timeSignatureVariation = Math.cbrt(raw.timeSignatureVariation) / 2.4;
        normalized.valence = raw.valence;

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
}
