/**
 * Aggregation entry point
 */
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';
import 'reflect-metadata';
import * as tf from '@tensorflow/tfjs';
import { createArrayCsvWriter } from 'csv-writer';
import { getRepository } from 'typeorm';

import { ProfileEntity } from './entities/entities';
import { Log } from './helpers/classes/log';
import { SpotifyApi } from './helpers/classes/spotifyApi';
import { connectToDatabase } from './helpers/functions/database';
import { Aggregator, EncodedArtist } from './data/aggregators/aggregator';
import { ArtistAggregator } from './data/aggregators/artistAggregator';

require('@tensorflow/tfjs-node');

dotenv.config({ path: resolve(__dirname, '../.env') });

export async function aggregateFavoriteArtists(): Promise<void> {
    Log.notify('\nMuCritic Data Aggregator\n\n');
    await connectToDatabase();
    await SpotifyApi.connect(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);
    const multiArtistEncoder = await tf.loadLayersModel(`${process.env.MODEL_LOCATION_MULTI_ARTIST}/encoder/model.json`);

    const profiles = await getRepository(ProfileEntity).find({
        relations: ['favoriteArtists'],
    });

    const artistCount = 5;
    for await(const profile of profiles) {
        const validArtists = profile.favoriteArtists.filter(artist => artist.spotifyId != null);
        if(
            validArtists.length < artistCount
            || !existsSync(`./resources/data/profile/taste/${profile.id}.csv`)
        ) continue;
        const encodedArtistArray: EncodedArtist[] = [];
        for await(const artist of validArtists) {
            try {
                const aggregator = new Aggregator(
                    artist,
                    ArtistAggregator,
                );
                const aggregation = await aggregator.aggregate();
                const flattenedAggregation = await ArtistAggregator.flatten(aggregation, artist);
                const encodedAggregation = await ArtistAggregator.encode(flattenedAggregation);
                encodedArtistArray.push(encodedAggregation);
            } catch(err) {
                Log.err(`\nNon-terminal Artist Aggregation Failure:\n${err.message}\n`);
            }
        }
        const topArtists = encodedArtistArray.slice(0, artistCount);
        const aggregationTensor = tf
            .tensor(topArtists)
            .as3D(1, topArtists.length, topArtists[0].length);
        const encodedTensor = multiArtistEncoder.predict(aggregationTensor) as tf.Tensor;
        const encodedArtists = await encodedTensor.array() as [];
        const csvWriter = createArrayCsvWriter({
            path: `./resources/data/profile/artists/encoded/${profile.id}.csv`,
        });
        await csvWriter.writeRecords(encodedArtists);
    }
    Log.notify('\nData Aggregation Successful\n\n');
    process.exit(0);
}

aggregateFavoriteArtists();
