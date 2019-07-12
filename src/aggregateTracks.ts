/**
 * Aggregation entry point
 */
/* eslint no-fallthrough: "off" */
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';
import {
    getRepository,
    IsNull,
    Not,
} from 'typeorm';

import {
    AlbumEntity,
    ArtistEntity,
} from './entities/entities';
import { Log } from './helpers/classes/log';
import { SpotifyApi } from './helpers/classes/spotifyApi';
import { connectToDatabase } from './helpers/functions/database';
import { SpotifyEntityTracksScraper } from './scrapers/spotify/aggregators/spotifyEntityTracksScraper';
import { SpotifyAlbumTracksScraper } from './scrapers/spotify/aggregators/spotifyAlbumTracksScraper';
import { SpotifyArtistTracksScraper } from './scrapers/spotify/aggregators/spotifyArtistTracksScraper';
import { TrackAggregation, Aggregator } from './data/aggregators/aggregator';
import { TrackAggregator } from './data/aggregators/trackAggregator';

dotenv.config({ path: resolve(__dirname, '../.env') });

export async function aggregateTracks(): Promise<void> {
    try {
        Log.notify('\nMuCritic Data Aggregator\n\n');
        await connectToDatabase();
        await SpotifyApi.connect(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);

        let entities: AlbumEntity[] | ArtistEntity[];
        let savePath = './resources/data';
        let tracksFlag = false;
        switch(process.argv[2]) {
            case 'tracks':
                tracksFlag = true;
            case 'albums': {
                entities = await getRepository(AlbumEntity).find({
                    spotifyAlbumType: 'album',
                    spotifyId: Not(IsNull()),
                });
                savePath += '/album';
                break;
            } case 'artists': {
                entities = await getRepository(ArtistEntity).find({
                    spotifyId: Not(IsNull()),
                });
                savePath += '/artist';
                break;
            } default: {
                throw new Error('must pass a type argument via the CLI to aggregate tracks');
            }
        }

        let trackAggregations: TrackAggregation[] = [];
        for await(const entity of entities) {
            let scraper: SpotifyEntityTracksScraper<typeof entity>;
            if(entity instanceof AlbumEntity) {
                if(tracksFlag) {
                    savePath = null;
                    scraper = new SpotifyAlbumTracksScraper(entity, null, null, false);
                } else {
                    scraper = new SpotifyAlbumTracksScraper(entity, `${savePath}/${entity.id}.csv`);
                }
            } else if(entity instanceof ArtistEntity) {
                scraper = new SpotifyArtistTracksScraper(entity, savePath);
            }

            try {
                await scraper.scrape();
            } catch (err) {
                Log.err(`\n${err.message}`);
            }

            if(tracksFlag) trackAggregations = trackAggregations.concat(scraper.trackAggregations);
        }
        if(tracksFlag) {
            await Aggregator.writeToCsv(
                trackAggregations,
                TrackAggregator,
                'all',
                './resources/data/track/',
            );
        }
        Log.success('\nData Aggregation Successful!\n');
        process.exit(0);
    } catch(err) {
        Log.err(`\nData Aggregation Failed!\n\nError:\n${err.message}`);
        process.exit(1);
    }
}

aggregateTracks();
