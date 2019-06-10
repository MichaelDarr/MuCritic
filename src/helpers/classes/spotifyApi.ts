import { Base64 } from 'js-base64';
import * as request from 'request';

import * as Spotify from '../../types/spotify';

/**
 * Interface for all interaction with Spotify API using the
 * [Implicit Grant Flow](https://developer.spotify.com/documentation/general/guides/authorization-guide/)
 */
export class SpotifyApi {
    private client: Spotify.ClientCredentials;

    private accessToken: string;

    private tokenExpiration: Date;

    public constructor(clientId: string, clientSecret: string) {
        this.client = {
            id: clientId,
            secret: clientSecret
        }
    }

    /**
     * @param query [spotify docs](https://developer.spotify.com/documentation/web-api/reference/search/search/)
     */
    public async searchRequest<T extends Spotify.SearchResponse>(
        query: string,
        type: Spotify.SearchType,
        limit: number,
    ): Promise<T> {
        const url = `https://api.spotify.com/v1/search?q=${query}&type=${type}&limit=${limit}`;
        return this.spotifyRequest<T>(url, 'GET');
    }

    /**
     * [Get Available Genre Seeds](https://developer.spotify.com/console/get-available-genre-seeds/)
     */
    public async genreSeedsRequest(): Promise<Spotify.GenreSeedsResponse> {
        const url = 'https://api.spotify.com/v1/recommendations/available-genre-seeds';
        return this.spotifyRequest<Spotify.GenreSeedsResponse>(url, 'GET');
    }

    /**
     * [Get Several Albums](https://developer.spotify.com/documentation/web-api/reference/albums/get-several-albums/)
     * @param albumIds Comma-separated list of the Spotify IDs for the albums. Maximum: 20
     */
    public async albumBatchRequest(albumIds: string): Promise<Spotify.AlbumBatchResponse> {
        const url = `https://api.spotify.com/v1/albums?ids=${albumIds}`;
        return this.spotifyRequest<Spotify.AlbumBatchResponse>(url, 'GET');
    }

    private async spotifyRequest<T extends Spotify.Response>(
        url: string,
        method: Spotify.RequestMethod,
    ): Promise<T> {
        const token: string = await this.getAccessToken();
        return new Promise((resolve, reject): void => {
            const requestOptions = {
                url,
                method,
                json: true,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            request(
                requestOptions,
                (error, _, body): void => {
                    if(error) {
                        reject(new Error(`request failed for ${url}`));
                    }
                    resolve(body);
                },
            );
        });
    }

    /**
     * access token getter with considerations for expiration
     */
    private async getAccessToken(): Promise<string> {
        if(!this.accessToken || this.tokenExpiration < new Date()) {
            await this.requestNewAccessToken();
        }
        return this.accessToken;
    }

    private async requestNewAccessToken(): Promise<boolean> {
        return new Promise((resolve, reject): void => {
            const authString = Base64.encode(`${this.client.id}:${this.client.secret}`);
            const requestOptions = {
                url: 'https://accounts.spotify.com/api/token',
                method: 'POST',
                json: true,
                form: {
                    grant_type: 'client_credentials',
                },
                headers: {
                    Authorization: `Basic ${authString}`,
                },
            };
            request(
                requestOptions,
                (error, _, body): void => {
                    if(error) {
                        reject(new Error(error));
                    }
                    if(!body.access_token) {
                        reject(new Error('failed to retrieve access token from Spotify'));
                    }
                    this.accessToken = body.access_token;
                    const curDate = new Date();
                    const expirationMilliseconds = body.expires_in * 1000;
                    this.tokenExpiration = new Date(curDate.getTime() + expirationMilliseconds);
                    resolve(true);
                },
            );
        });
    }
}
