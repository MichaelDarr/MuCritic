import * as request from 'request';
import { JSDOM } from 'jsdom';

import { Log } from '../classes/index';

export async function getRequestBody(url: string): Promise<string> {
    return new Promise((resolve, reject): void => {
        request(
            url,
            { timeout: 10000 },
            (error, _, body): void => {
                if(error) {
                    reject(new Error(`request failed for ${url}`));
                }
                resolve(body);
            },
        );
    });
}

export async function requestRawScrape(
    url: string,
    attempts = 1,
): Promise<HTMLElement> {
    try {
        Log.log(`Requesting ${url}`);
        const bodyString: string = await getRequestBody(`http://api.scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=${url}`);
        Log.success(`Loaded ${url}`);
        const { body } = (new JSDOM(bodyString)).window.document;
        return body;
    } catch(e) {
        Log.err(`Attempt ${attempts}: page load failed: ${e}`);
    }

    if(attempts <= Number(process.env.MAX_REQUEST_ATTEMPTS)) {
        return requestRawScrape(url, attempts + 1);
    }
    throw new Error(`Page load for ${url} failed ${attempts} times`);
}
