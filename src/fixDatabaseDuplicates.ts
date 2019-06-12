import * as dontenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';

import { getRepository } from 'typeorm';
import { RymGenreEntity } from './entities/RymGenreEntity';

import { Log } from './helpers/classes/log';
import { connectToDatabase } from './helpers/functions/database';

dontenv.config({ path: resolve(__dirname, '../.env') });

/**
 * When first scraping this data, unique keys were enforced only in the scraping logic, and not in
 * the database rules. Therefore, a few hundred duplicates for various records sneaked into the
 * table. This function removes those duplicates in a safe manner.
 */
export async function scrapeRateYourMusic(): Promise<void> {
    try {
        Log.notify('\nmuCritic Database de-duplicator\n\n');
        await connectToDatabase();

        /**
         * RYM Genre Duplicate removal, by [[RymGenreEntity.name]]
         */
        const results = await getRepository(RymGenreEntity)
            .createQueryBuilder('genre')
            .select('genre.name', 'name')
            .addSelect('COUNT(*)', 'count')
            .groupBy('name')
            .having('COUNT(*) > 1')
            .getRawMany();
        
        console.log(results);

        const duplicateNames: string[] = results.map(result => result.name);

        for await(let name of duplicateNames) {
            const dupeGenres = await getRepository(RymGenreEntity).find({
                relations: [
                    'artists',
                    'albums',
                ],
                where: {
                    name,
                }
            });
            for await(let genre of dupeGenres) {
                if(genre.artists.length === 0 && genre.albums.length === 0) {
                    await getRepository(RymGenreEntity).remove(genre);
                }
            }
        }
        
        Log.success('Duplicates Removed');
        process.exit(0);
    } catch(err) {
        Log.err(`\n\nmuCritic RYM Scraper Failed!\n\nError:\n${err.message}`);
    }
}

scrapeRateYourMusic();
