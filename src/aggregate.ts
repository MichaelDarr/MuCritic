/**
 * Data aggregation entry point.
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';
import {
    getRepository,
    IsNull,
    Not,
} from 'typeorm';

import { AlbumAggregator } from './data/aggregators/albumAggregator';
import { ArtistsAggregator } from './data/aggregators/artistsAggregator';
import { ProfileAggregator } from './data/aggregators/profileAggregator';
import { aggregateDistribution } from './data/stats';
import {
    AlbumEntity,
    ProfileEntity,
} from './entities/entities';
import { Log } from './helpers/classes/log';
import { SpotifyApi } from './helpers/classes/spotifyApi';
import { connectToDatabase } from './helpers/functions/database';
import { ArtistsAggregation } from './data/aggregators/aggregator';

dotenv.config({ path: resolve(__dirname, '../.env') });

/**
 * Album aggregation
 */
export async function aggregateAlbums(): Promise<void> {
    try {
        Log.notify('\nMuCritic Data Aggregator\n\n');
        await connectToDatabase();
        switch(process.argv[2]) {
            case 'albums': {
                const albums = await getRepository(AlbumEntity).find({
                    spotifyId: Not(IsNull()),
                    spotifyAlbumType: 'album',
                });
                const aggregations = await Promise.all(
                    albums.map(album => new AlbumAggregator(album).aggregate()),
                );
                Log.success('\nData Retreival Successful!\n');
                await new AlbumAggregator(null).writeAggregationsToCsv(aggregations);
                aggregateDistribution(aggregations);
                break;
            } case 'artists': {
                await SpotifyApi.connect(
                    process.env.SPOTIFY_CLIENT_ID,
                    process.env.SPOTIFY_CLIENT_SECRET,
                );
                const profiles = await getRepository(ProfileEntity).find();
                const allAggregations = await Promise.all(
                    profiles.map(async (profile) => {
                        const artistsAggregator = new ArtistsAggregator(profile);
                        const aggregation = await artistsAggregator.aggregate();
                        if(aggregation != null) {
                            await artistsAggregator.writeAggregationsToCsv(
                                [aggregation],
                                profile.name,
                            );
                        }
                        return aggregation;
                    }),
                );
                aggregateDistribution(allAggregations);
                break;
            } case 'profiles': {
                const profiles = await getRepository(ProfileEntity).find();
                const perProfileAggregations = await Promise.all(
                    profiles.map(async (profile) => {
                        const profileAggregator = new ProfileAggregator(profile);
                        const aggregations = await profileAggregator.aggregate();
                        if(aggregations != null) {
                            await profileAggregator.writeAggregationsToCsv(aggregations, profile.name);
                        }
                        return aggregations;
                    }),
                );
                let allAggregations = [];
                perProfileAggregations.forEach((profileAggregations) => {
                    allAggregations = allAggregations.concat(profileAggregations);
                });
                aggregateDistribution(allAggregations);
                break;
            } default: {
                Log.err('No argument passed to aggregation function. Correct useage example:\nnode aggregate albums\n');
                process.exit(1);
            }
        }
        Log.success('\nData Aggregation Successful!\n');
        process.exit(0);
    } catch(err) {
        Log.err(`\nData Aggregation Failed!\n\nError:\n${err.message}`);
        process.exit(1);
    }
}

aggregateAlbums();
