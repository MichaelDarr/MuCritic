import * as dotenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';
import * as tf from '@tensorflow/tfjs';
import { getRepository, IsNull, Not } from 'typeorm';

import {
    Aggregator,
    EncodedArtist,
} from './data/aggregators/aggregator';
import { AlbumAggregator } from './data/aggregators/albumAggregator';
import { ArtistAggregator } from './data/aggregators/artistAggregator';
import { AlbumEntity } from './entities/entities';
import { Log } from './helpers/classes/log';
import { SpotifyApi } from './helpers/classes/spotifyApi';
import { connectToDatabase } from './helpers/functions/database';
import { RedisHelper } from './helpers/classes/redis';

require('@tensorflow/tfjs-node');

dotenv.config({ path: resolve(__dirname, '../.env') });

export async function recommend(artistIds: string[]): Promise<void> {
    Log.notify('\nMuCritic Album Recommender\n\n');
    await connectToDatabase();
    await SpotifyApi.connect(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);

    const redisClient = RedisHelper.getConnection();

    const artistData: EncodedArtist[] = [];
    for await(const artistId of artistIds) {
        const aggregation = ArtistAggregator.template(0);
        const flat = await ArtistAggregator.flatten(aggregation, null, artistId);
        artistData.push(await ArtistAggregator.encode(flat));
    }

    const artistEncoder = await tf.loadLayersModel(`${process.env.MODEL_LOCATION_MULTI_ARTIST}/encoder/model.json`);
    const artistTensor = tf
        .tensor(artistData)
        .as3D(1, artistData.length, artistData[0].length);
    const encodedAlbumTensor = artistEncoder.predict(artistTensor) as tf.Tensor;

    const tasteMapper = await tf.loadLayersModel(`${process.env.MODEL_LOCATION_TASTE}/model.json`);
    const rymTasteTensor = tf.tensor([
        -0.0054366281,
        -0.0115027968,
        -0.0042289789,
        0.0064023617,
        0.0159894247,
        -0.0089542195,
        -0.0339227095,
        -0.0067667011,
        0.0159843862,
        0.0272882357,
        0.0075859660,
        -0.0158114079,
        -0.0599396564,
        -0.0006291876,
        0.0214630514,
        0.0131756635,
    ]).reshape([16, 1]);
    let tasteTensor = tasteMapper.predict(encodedAlbumTensor) as tf.Tensor;
    console.log(tasteTensor.arraySync())
    tasteTensor = tasteTensor.reshape([16, 1]);
    tasteTensor = tasteTensor.add(tasteTensor).add(rymTasteTensor);

    const model = tf.sequential();
    model.add(tf.layers.dense({
        inputShape: [16],
        name: 'perceptron',
        units: 1,
        useBias: false,
        weights: [tasteTensor],
    }));

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
            const redisKey = `${album.name}.${album.artist.name}.aggregation.v1`;
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
    console.log('TOP');
    results.slice(0, 20).forEach(result => console.log(`${result.label}`));
    results.sort((a, b) => a.score - b.score);
    console.log('BOTTOM');
    results.slice(0, 20).forEach(result => console.log(`${result.label}`));

    process.exit(0);
}

recommend([
    '6sFIWsNpZYqfjUpaCgueju',
    '06HL4z0CvFAxyc27GXpf02',
    '3CjlHNtplJyTf9npxaPl5w',
    '66CXWjxzNUsdJxJ2JdwvnR',
    '1HY2Jd0NmPuamShAr6KMms',
]);
