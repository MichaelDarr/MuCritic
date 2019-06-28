/**
 * Data aggregation entry point.
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';
import * as tf from '@tensorflow/tfjs';
import {
    getRepository,
    IsNull,
    Not,
} from 'typeorm';
import { Aggregator } from './data/aggregators/aggregator';
import { AlbumAggregator } from './data/aggregators/albumAggregator';
import { AlbumEntity } from './entities/entities';
import { ArtistsAggregator } from './data/aggregators/artistsAggregator';
import { Log } from './helpers/classes/log';
import { SpotifyApi } from './helpers/classes/spotifyApi';
import { connectToDatabase } from './helpers/functions/database';

require('@tensorflow/tfjs-node');

dotenv.config({ path: resolve(__dirname, '../.env') });

/**
 * Album aggregation
 */
export async function recommendAlbums(): Promise<void> {
    try {
        Log.notify('\nMuCritic Album Recommendation\n\n');
        await connectToDatabase();
        await SpotifyApi.connect(
            process.env.SPOTIFY_CLIENT_ID,
            process.env.SPOTIFY_CLIENT_SECRET,
        );

        const encodeAlbumModel = await tf.loadLayersModel('file:///home/michael/Projects/TypeScrape/resources/models/album/encoder/model.json');
        const learnTasteModel = await tf.loadLayersModel('file:///home/michael/Projects/TypeScrape/resources/models/taste/model.json');

        const artistIds = [
            '1G5v3lpMz7TeoW0yGpRQHr',
            '6eDKMXn3OBIkI8jcY7JtlI',
            '6qyi8X6MdP1lu6B1K6yh3h',
            '72X6FHxaShda0XeQw3vbeF',
            '63MQldklfxkjYDoUE4Tppz',
        ];
        const artistsAggregator = new ArtistsAggregator(null, artistIds);
        const aggregation = await artistsAggregator.aggregate(true);
        if(aggregation == null) throw new Error('no artists read for album recommendation');
        const aggregationArr: number[] = Aggregator.stripLabels(aggregation);
        const aggregationTensor = tf.tensor(aggregationArr).as2D(1, 16);
        const tasteRaw = learnTasteModel.predict(aggregationTensor);
        const taste = (Array.isArray(tasteRaw)) ? tasteRaw[0] : tasteRaw;
        const albumEntities = await getRepository(AlbumEntity).find({
            where: {
                spotifyId: Not(IsNull()),
                spotifyAlbumType: 'album',
            },
        });
        const albumAggregations = await Promise.all(
            albumEntities.map(album => new AlbumAggregator(album).aggregate()),
        );
        const albumAggregationArrs = albumAggregations.map(agg => Aggregator.stripLabels(agg));
        const albums = albumAggregationArrs.map((albumArr) => {
            const tensor = tf.tensor(albumArr).as2D(1, 31);
            const encoded = encodeAlbumModel.predict(tensor);
            return (Array.isArray(encoded)) ? encoded[0] : encoded;
        });
        const scores = albums.map((album, i): AlbumScorePair => {
            const executedPerceptron = album.mul(taste);
            return {
                score: executedPerceptron.sum().dataSync()[0],
                albumId: albumEntities[i].id,
            };
        });
        scores.sort(scorePair => scorePair.score);
        const top = scores.slice(0, 100);
        let position = 1;
        for await(const scorePair of top) {
            const albumEntity = await getRepository(AlbumEntity).findOne({
                relations: [
                    'artist',
                ],
                where: {
                    id: scorePair.albumId,
                },
            });
            Log.success(`${position}: ${albumEntity.name} by ${albumEntity.artist.name}`);
            position += 1;
        }
        Log.success('\nData Aggregation Successful!\n');
        process.exit(0);
    } catch(err) {
        Log.err(`\nData Aggregation Failed!\n\nError:\n${err.message}`);
        process.exit(1);
    }
}

interface AlbumScorePair {
    score: number;
    albumId: number;
}

recommendAlbums();
