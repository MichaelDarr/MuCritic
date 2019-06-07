/**
 * helper functions related to the host file system
 */

import { readFile } from 'fs';

import { Log } from '../classes/log';

/**
 * @remarks
 * This helper is essentially a beefed up, promisified fs.readFile
 *
 * @param fileName file to read, relative to base directory
 * @returns an array of file lines
 */
export function readFileToArray(
    fileName: string,
): Promise<string[]> {
    Log.notify(`Attempting to read ${fileName}`);
    return new Promise((resolve, reject): void => {
        readFile(fileName, (err, data): void => {
            if (err) {
                if (err.code === 'ENOENT') {
                    Log.err(`${fileName} does not exist`);
                    reject(new Error(`${fileName} does not exist`));
                    return;
                }

                Log.err(`Failed to read ${fileName}`);
                reject(err);
                return;
            }

            Log.success(`File read successful: ${fileName}`);
            resolve(data.toString().split('\n'));
        });
    });
}
