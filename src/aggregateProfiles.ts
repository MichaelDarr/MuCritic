/**
 * Aggregation entry point
 */
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';
import 'reflect-metadata';
import { getRepository, IsNull, Not } from 'typeorm';

import { ProfileEntity } from './entities/entities';
import { Log } from './helpers/classes/log';
import { SpotifyApi } from './helpers/classes/spotifyApi';
import { connectToDatabase } from './helpers/functions/database';

require('@tensorflow/tfjs-node');

dotenv.config({ path: resolve(__dirname, '../.env') });

/**
 * aggregate all profile favorite artists into CSV files
 */
export async function aggregateArtists(): Promise<void> {
    Log.notify('\nMuCritic Data Aggregator\n\n');
    await connectToDatabase();
    await SpotifyApi.connect(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);

    const profiles = await getRepository(ProfileEntity).find({
        relations: ['favoriteArtists'],
        where: {
            'favoriteArtists.spotifyId': Not(IsNull),
        },
    });

    const minFavoriteArtists = 5;
    let validProfiles = 0;
    for await(const profile of profiles) {
        const validArtists = profile.favoriteArtists.filter(artist => artist.spotifyId != null);
        if(
            validArtists.length >= minFavoriteArtists
            && existsSync(`./resources/data/profile/taste/${profile.id}.csv`)
        ) validProfiles += 1;
    }
    console.log(validProfiles);
    Log.notify('\nData Aggregation Successful\n\n');
    process.exit(0);
}

aggregateArtists();
