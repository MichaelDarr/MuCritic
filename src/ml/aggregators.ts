import { getRepository } from 'typeorm';

import {
    AlbumEntity,
    ProfileEntity,
    ReviewEntity,
    RymDatabaseEntities,
} from '../entities/entities';
import { TemplateGenerator } from './templates';
import {
    Aggregation,
    AlbumAggregation,
    ProfileAggregation,
    ReviewAggregation,
} from './types';

export abstract class Aggregator<T1 extends RymDatabaseEntities, T2 extends Aggregation | null> {
    public entity: T1;

    public constructor(entity: T1) {
        this.entity = entity;
    }

    public abstract async retrieve(): Promise<void>;

    public abstract async aggregate(): Promise<T2>;

    public abstract async normalize(): Promise<T2>;
}

export class AlbumReviewAggregator extends Aggregator<AlbumEntity, AlbumAggregation> {
    public aggregation: AlbumAggregation;

    public async retrieve(): Promise<void> {
        if(this.aggregation != null) return;
        if(this.entity != null && this.entity.artist != null && this.entity.tracks != null) return;
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

    public async aggregate(): Promise<AlbumAggregation> {
        if(this.aggregation != null) return this.aggregation;
        if(
            this.entity == null
            || this.entity.artist == null
            || this.entity.tracks == null
        ) await this.retrieve();

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

        this.aggregation = {
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
        this.entity = null;
        return this.aggregation;
    }

    public async normalize(): Promise<AlbumAggregation> {
        const raw = await this.aggregate();
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
        if(normalized.overallRank !== 0) {
            normalized.overallRank = 1 - (Math.sqrt(raw.overallRank) / 150);
        }
        normalized.rating = (raw.rating - 1) / 3.5;
        normalized.ratings = Math.sqrt(raw.ratings - 1) / 225;
        normalized.reviews = Math.sqrt(raw.reviews) / 40;
        if(normalized.yearRank !== 0) {
            normalized.yearRank = 1 - (Math.sqrt(raw.yearRank) / 150);
        }

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

export class ReviewAggregator extends Aggregator<ReviewEntity, ReviewAggregation> {
    public albumAggregator: AlbumReviewAggregator;

    public constructor(review: ReviewEntity) {
        super(review);
        this.albumAggregator = new AlbumReviewAggregator(review.album);
    }

    public async retrieve(): Promise<void> {
        await this.albumAggregator.retrieve();
    }

    public async aggregate(): Promise<ReviewAggregation> {
        const albumAggregation = await this.albumAggregator.aggregate();
        return {
            userRating: this.entity.score,
            userDisagreement: this.entity.score - albumAggregation.rating,
            ...albumAggregation,
        };
    }

    public async normalize(): Promise<ReviewAggregation> {
        const normalized = await this.albumAggregator.normalize();
        const raw = this.albumAggregator.aggregation;

        return {
            userRating: (this.entity.score - 0.5) / 4.5,
            userDisagreement: (this.entity.score - raw.rating + 3.5) / 5.5,
            ...normalized,
        };
    }
}

export class ProfileAggregator extends Aggregator<ProfileEntity, ProfileAggregation> {
    public reviewAggregators: ReviewAggregator[];

    public async retrieve(): Promise<void> {
        if(this.entity.reviews == null) {
            this.entity = await getRepository(ProfileEntity)
                .createQueryBuilder('profile')
                .where('profile.id = :id', { id: this.entity.id })
                .leftJoinAndSelect('profile.reviews', 'reviews')
                .leftJoinAndSelect('reviews.album', 'album')
                .andWhere('album.spotifyId is not null')
                .andWhere('album.spotifyAlbumType = :type', { type: 'album' })
                .getOne();
        }
        this.reviewAggregators = this.entity.reviews.map(review => new ReviewAggregator(review));
    }

    public async aggregate(): Promise<ProfileAggregation> {
        if(this.reviewAggregators == null) await this.retrieve();
        return Promise.all(
            this.reviewAggregators.map(reviewAggregator => reviewAggregator.aggregate()),
        );
    }

    public async normalize(): Promise<ProfileAggregation> {
        if(this.reviewAggregators == null) await this.retrieve();
        return Promise.all(
            this.reviewAggregators.map(reviewAggregator => reviewAggregator.normalize()),
        );
    }
}
