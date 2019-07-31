import * as dotenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';
import * as tf from '@tensorflow/tfjs';
import {
    getRepository,
    IsNull,
    Not,
} from 'typeorm';

import * as Spotify from 'spotify';

import {
    Aggregator,
    EncodedArtist,
} from './data/aggregator';
import { AlbumAggregator } from './data/albumAggregator';
import { ArtistAggregator } from './data/artistAggregator';
import { AlbumEntity } from './entities/entities';
import { Log } from './helpers/classes/log';
import { SpotifyApi } from './helpers/classes/spotifyApi';
import { connectToDatabase } from './helpers/functions/database';
import { RedisHelper } from './helpers/classes/redis';

require('@tensorflow/tfjs-node');

dotenv.config({ path: resolve(__dirname, '../.env') });

/**
 * Run the model, generating album scores for all artists. All models must be generated & all
 * datasets must be present
 *
 * @param artistNames 5 artists from which to generate recommendations
 */
export async function recommend(artistNames: string[]): Promise<void> {
    Log.notify('\nMuCritic Album Recommender\n\n');

    await connectToDatabase();
    const spotifyHelper = await SpotifyApi.connect(
        process.env.SPOTIFY_CLIENT_ID,
        process.env.SPOTIFY_CLIENT_SECRET,
    );

    const redisClient = RedisHelper.getConnection();

    // search for artists using the Spotify API, then encode them
    const artistData: EncodedArtist[] = [];
    for await(const artistName of artistNames) {
        const spotifyArtist = await spotifyHelper.search<Spotify.ArtistSearchResponse>(artistName, 'artist', 10);
        let artistId: string;
        let artistPopularity: number;
        for(const artist of spotifyArtist.artists.items) {
            if(artist.name === artistName && artistId == null) artistId = artist.id;
            artistPopularity = artist.popularity / 100;
        }
        if(artistId == null) throw new Error(`Could not find Spotify artist ${artistName}`);
        const aggregation = ArtistAggregator.template(0);
        const flat = await ArtistAggregator.flatten(aggregation, null, artistId);
        flat[0] = artistPopularity;
        const encodedArtist = await ArtistAggregator.encode(flat);
        artistData.push(encodedArtist);
    }

    const artistEncoder = await tf.loadLayersModel(`${process.env.MODEL_LOCATION_MULTI_ARTIST}/encoder/model.json`);
    const artistTensor = tf
        .tensor(artistData)
        .as3D(1, artistData.length, artistData[0].length);
    const encodedArtistTensor = artistEncoder.predict(artistTensor) as tf.Tensor;

    // generate taste from the received artists
    const tasteMapper = await tf.loadLayersModel(`${process.env.MODEL_LOCATION_TASTE}/model.json`);
    let tasteTensor = tasteMapper.predict(encodedArtistTensor) as tf.Tensor;
    tasteTensor = tasteTensor.reshape([16, 1]);

    // remove the "average" taste from learned one
    const rymTaste = tf.tensor2d([
        [-0.2658042312],
        [-0.2918781042],
        [0.4476911426],
        [0.0354586020],
        [0.1686497927],
        [0.2152237296],
        [-0.4066027105],
        [0.1940803975],
        [0.0597865917],
        [0.4049637318],
        [-0.0558041073],
        [-0.2366468459],
        [0.0106893238],
        [-0.4115174115],
        [0.1501134783],
        [-0.2174658924],
    ]);
    tasteTensor = tf.sub(tasteTensor, rymTaste);

    const model = tf.sequential();
    model.add(tf.layers.dense({
        inputShape: [16],
        name: 'perceptron',
        units: 1,
        useBias: false,
        weights: [tasteTensor],
    }));

    // Get albums and generate scores
    const albums = await getRepository(AlbumEntity).find({
        relations: ['artist'],
        where: {
            spotifyAlbumType: 'album',
            spotifyId: Not(IsNull()),
        },
    });

    interface SingleResult {
        label: string;
        score: number;
    }
    const results: SingleResult[] = [];
    const usedIdList: string[] = [];
    for await(const album of albums) {
        if(usedIdList.indexOf(album.spotifyId) !== -1) continue;
        try {
            let encodedData: number[];
            const redisKey = `${album.name}.${album.artist.name}.aggregation.v2`;
            const cachedResponse = await redisClient.getObject(redisKey);
            if(cachedResponse != null) {
                encodedData = cachedResponse as number[];
            } else {
                const aggregator = new Aggregator(
                    album,
                    AlbumAggregator,
                );

                const aggregation = await aggregator.aggregate();
                const flatAggregation = await AlbumAggregator.flatten(aggregation, album);
                encodedData = await AlbumAggregator.encode(flatAggregation);
                await redisClient.setObject(redisKey, encodedData);
            }
            const dataTensor = tf.tensor2d(encodedData, [1, 16]);
            const scoreTensor = model.predict(dataTensor) as tf.Tensor;
            const score = scoreTensor.arraySync()[0][0];
            results.push({
                label: `${album.name} by ${album.artist.name}`,
                score,
            });
            usedIdList.push(album.spotifyId);
        } catch(err) {
            Log.err(`\nNon-terminal Album Aggregation Failure:\n${err.message}\n`);
        }
    }
    results.sort((a, b) => b.score - a.score);
    results.slice(0, 100).forEach((result, i) => console.log(`${i + 1}. ${result.label}`));

    process.exit(0);
}

recommend([
    'Carly Rae Jepsen',
    'Taylor Swift',
    'CHVRCHES',
    'Ariana Grande',
    'Lady Gaga',
]);
