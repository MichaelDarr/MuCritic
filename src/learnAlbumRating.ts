import * as dotenv from 'dotenv';
import { resolve } from 'path';
import 'reflect-metadata';
import * as tf from '@tensorflow/tfjs';

import { Log } from './helpers/classes/log';
import { connectToDatabase } from './helpers/functions/database';

require('@tensorflow/tfjs-node-gpu');

dotenv.config({ path: resolve(__dirname, '../.env') });

export async function learn(): Promise<void> {
    try {
        Log.notify('\nTypeScrape MuCritic Prototype\n\n');

        await connectToDatabase();
    } catch(err) {
        Log.err(`\nMuCritic Learning Failed!\n\nError:\n${err.message}`);
    }
}

learn();
