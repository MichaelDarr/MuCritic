/**
 * Aggregation entry point
 */
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';
import * as tf from '@tensorflow/tfjs';
import { getRepository, IsNull, Not } from 'typeorm';

import {
    Aggregator,
    EncodedAlbum,
    EncodedArtist,
} from './data/aggregators/aggregator';
import { AlbumAggregator } from './data/aggregators/albumAggregator';
import { ArtistAggregator } from './data/aggregators/artistAggregator';
import {
    AlbumEntity,
    ArtistEntity,
} from './entities/entities';
import { Log } from './helpers/classes/log';
import { SpotifyApi } from './helpers/classes/spotifyApi';
import { connectToDatabase } from './helpers/functions/database';

require('@tensorflow/tfjs-node');

dotenv.config({ path: resolve(__dirname, '../.env') });

export async function recommend(artistIds: string[]): Promise<void> {
    Log.notify('\nMuCritic Album Recommender\n\n');
    await connectToDatabase();
    await SpotifyApi.connect(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);

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
    let tasteTensor = tasteMapper.predict(encodedAlbumTensor) as tf.Tensor;
    tasteTensor = tasteTensor.reshape([16, 1]);

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
    for await(const album of albums) {
        try {
            const aggregator = new Aggregator(
                album,
                AlbumAggregator,
            );

            const aggregation = await aggregator.aggregate();
            const flatAggregation = await AlbumAggregator.flatten(aggregation, album);
            const encodedData = await AlbumAggregator.encode(flatAggregation);
            const dataTensor = tf.tensor2d(encodedData, [1, 16]);
            const scoreTensor = model.predict(dataTensor) as tf.Tensor;
            const score = scoreTensor.arraySync()[0][0];
            results.push({
                label: `${album.name} by ${album.artist.name}`,
                score,
            });
        } catch(err) {
            Log.err(`\nNon-terminal Album Aggregation Failure:\n${err.message}\n`);
        }
    }
    results.sort((a, b) => b.score - a.score);
    results.slice(0, 5).forEach(result => console.log(result.label));
    console.log();
    results.slice(50, 55).forEach(result => console.log(result.label));
    console.log();
    results.slice(100, 105).forEach(result => console.log(result.label));
    console.log();
    results.slice(500, 505).forEach(result => console.log(result.label));
    console.log();
    results.slice(1000, 1005).forEach(result => console.log(result.label));

    process.exit(0);
}

recommend([
    '6qyi8X6MdP1lu6B1K6yh3h',
    '1G5v3lpMz7TeoW0yGpRQHr',
    '72X6FHxaShda0XeQw3vbeF',
    '6kDMoHTcBICPILP2aclPWZ',
    '1oR9pQhucVTJyi5lH2Y2iT',
]);
