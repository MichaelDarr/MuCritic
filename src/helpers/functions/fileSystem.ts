/**
 * helpers functions related to the host file system
 */

// external
import { readFile } from 'fs';

// helpers
import Log from '../classes/logger';

/**
 * Returns the contents of a file
 *
 * @remarks
 * This helper is essentially a beefed up, promisified fs.readFile
 *
 * @param fileName file to read, relative to base directory
 * @param defaultFile if the file read fails, read this file
 * @returns a promise resolving to an array of file lines
 */
export function readFileToArray(
    fileName: string,
    defaultFile?: string,
): Promise<string[]> {
    Log.notify(`Attempting to read ${fileName}`);
    return new Promise((resolve, reject): void => {
        readFile(fileName, (err, data): void => {
            if (err) {
                if (err.code === 'ENOENT') {
                    if(defaultFile) {
                        Log.err(`Failed to read ${fileName}. Trying ${defaultFile}`);
                        resolve(readFileToArray(defaultFile));
                        return;
                    }
                    Log.err(`Failed to read ${fileName}`);
                    reject(new Error(`${fileName} does not exist`));
                    return;
                }
                reject(err);
                return;
            }

            Log.success(`File read successful: ${fileName}`);
            resolve(data.toString().split('\n'));
        });
    });
}
