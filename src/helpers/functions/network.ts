import * as request from 'request';

/**
 * Retrieve the body of a GET request for a given url
 */
export async function getRequestBody(url: string): Promise<string> {
    return new Promise((resolve, reject): void => {
        request(
            url,
            { timeout: Number(process.env.SCRAPER_API_REQUEST_TIMEOUT) },
            (error, _, body): void => {
                if(error) {
                    reject(new Error(`request failed for ${url}`));
                }
                resolve(body);
            },
        );
    });
}
