/**
 * Aggregation entry point
 */

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
import { RedisHelper } from './helpers/classes/redis';
import { SpotifyApi } from './helpers/classes/spotifyApi';
import { connectToDatabase } from './helpers/functions/database';
import { SpotifyTracksToCsvScraper } from './scrapers/spotify/spotifyTracksToCsvScraper';

dotenv.config({ path: resolve(__dirname, '../.env') });

/**
 * first 6 album tracks aggregation
 */
export async function aggregateTracks(): Promise<void> {
    try {
        Log.notify('\nMuCritic Data Aggregator\n\n');
        await connectToDatabase();
        await RedisHelper.connect(6379, '127.0.0.1', 5);
        await SpotifyApi.connect(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);

        let entities: AlbumEntity[] | ArtistEntity[];
        let savePath = './resources/data';
        switch(process.argv[2]) {
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
        let totalError: number = null;
        let entityCount = 0;
        for await(const entity of entities) {
            const scraper = new SpotifyTracksToCsvScraper(entity, savePath);
            try {
                await scraper.scrape();
                const error = scraper.mae();
                if(error != null) {
                    if(totalError == null) {
                        totalError = error;
                    } else {
                        totalError += error;
                    }
                    entityCount += 1;
                }
            } catch (err) {
                Log.err(`\n${err.message}`);
            }
        }
        const mae = totalError / entityCount;
        Log.success(`FINAL MAE: ${mae}`);
        Log.success('\nData Aggregation Successful!\n');
        process.exit(0);
    } catch(err) {
        Log.err(`\nData Aggregation Failed!\n\nError:\n${err.message}`);
        process.exit(1);
    }
}

aggregateTracks();
