import * as request from 'request';
import * as jsdom from 'jsdom';
import Log from '../classes/logger';

const { JSDOM } = jsdom;

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
): Promise<any> {
    try {
        Log.log(`Request: ${url}`);
        Log.log('Requesting...');
        const body: string = await getRequestBody(`http://api.scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=${url}`);
        Log.success('Loaded!');
        const { document } = (new JSDOM(body)).window;
        return document;
    } catch(e) {
        Log.err(`Attempt ${attempts}: page load failed: ${e}`);
    }

    if(attempts <= 3) {
        Log.log('Retrying...');
        return requestRawScrape(url, attempts + 1);
    }
    return false;
}
