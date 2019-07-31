import * as dotenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';
import {
    getRepository,
    IsNull,
    Not,
} from 'typeorm';
import { createArrayCsvWriter } from 'csv-writer';

import { Aggregator } from './data/aggregator';
import { AlbumAggregator } from './data/albumAggregator';
import { AlbumEntity } from './entities/entities';
import { Log } from './helpers/classes/log';
import { SpotifyApi } from './helpers/classes/spotifyApi';
import { connectToDatabase } from './helpers/functions/database';
import { RedisHelper } from './helpers/classes/redis';

dotenv.config({ path: resolve(__dirname, '../.env') });

/**
 * Generates a CSV file of processed, encoded albums for web consumption
 */
export async function aggregateWebAlbums(): Promise<void> {
    Log.notify('\nMuCritic Album Recommender\n\n');
    await connectToDatabase();
    const spotifyApi = await SpotifyApi.connect(
        process.env.SPOTIFY_CLIENT_ID,
        process.env.SPOTIFY_CLIENT_SECRET,
    );

    const redisClient = RedisHelper.getConnection();

    const albums = await getRepository(AlbumEntity).find({
        relations: ['artist'],
        where: {
            spotifyAlbumType: 'album',
            spotifyId: Not(IsNull()),
        },
    });

    const csvHeaders = [
        'spotifyId',
        'popularity',
        'rymOverallRank',
        'rymRating',
        'rymRatingCount',
        'releaseYear',
        'artistActive',
        'artistDiscographySize',
        'artistMemberCount',
        'artistPopularity',
        'encoded_0',
        'encoded_1',
        'encoded_2',
        'encoded_3',
        'encoded_4',
        'encoded_5',
        'encoded_6',
        'encoded_7',
        'encoded_8',
        'encoded_9',
        'encoded_10',
        'encoded_11',
        'encoded_12',
        'encoded_13',
        'encoded_14',
        'encoded_15',
    ];
    const results = [];
    const resultsNoMetal = [];
    for await(const album of albums) {
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
            const artistData = await spotifyApi.getArtist(album.artist.spotifyId);
            let metalFlag = false;
            if(artistData.genres != null && artistData.genres.length > 0) {
                artistData.genres.forEach((genre): void => {
                    if(genre.includes('metal')) metalFlag = true;
                });
            }
            const newAggregation = [
                album.spotifyId,
                album.spotifyPopularity,
                album.overallRankRYM,
                album.ratingRYM,
                album.ratingCountRYM,
                album.releaseYear,
                album.artist.active ? 1 : 0,
                album.artist.discographyCountRYM,
                album.artist.memberCount,
                album.artist.spotifyPopularity,
            ].concat(encodedData);
            let nullFlag = false;
            newAggregation.forEach((prop) => {
                if(prop == null) nullFlag = true;
            });
            if(!nullFlag) {
                let isDuplicate = false;
                results.forEach((result, index) => {
                    if(result[0] === album.spotifyId) {
                        isDuplicate = true;
                        if(album.ratingCountRYM > result[4]) {
                            results[index] = newAggregation;
                        }
                    }
                });
                if(
                    !isDuplicate
                    && album.artist.discographyCountRYM < 100
                ) {
                    results.push(newAggregation);
                    if(!metalFlag) resultsNoMetal.push(newAggregation);
                }
            }
        } catch(err) {
            Log.err(`\nNon-terminal Album Aggregation Failure:\n${err.message}\n`);
        }
    }

    const csvWriter = createArrayCsvWriter({
        path: './resources/album_data.csv',
        header: csvHeaders,
    });
    await csvWriter.writeRecords(results);


    const csvWriterNoMetal = createArrayCsvWriter({
        path: './resources/album_data_no_metal.csv',
        header: csvHeaders,
    });
    await csvWriterNoMetal.writeRecords(resultsNoMetal);

    process.exit(0);
}

aggregateWebAlbums();
