import { Base64 } from 'js-base64';
import * as request from 'request';

import { Log } from './log';
import * as Spotify from '../../types/spotify';

/**
 * Interface for all interaction with Spotify API using the
 * [Implicit Grant Flow](https://developer.spotify.com/documentation/general/guides/authorization-guide/)
 *
 * Usage:
 * 1. [[SpotifyApi.connect]]
 * 2. [[SpotifyApi.getConnection]]
 */
export class SpotifyApi {
    private accessToken: string;

    private client: Spotify.ClientCredentials;

    private static instance: SpotifyApi;

    private tokenExpiration: Date;

    private constructor(clientId: string, clientSecret: string) {
        this.client = {
            id: clientId,
            secret: clientSecret,
        };
    }

    /**
     * Creates the single instance of this class used for all Spotify requests. Must be called
     * before [[SpotifyApi.getConnection]].
     *
     * [Implicit Grant Flow](https://developer.spotify.com/documentation/general/guides/authorization-guide/)
     */
    public static async connect(clientId: string, clientSecret: string): Promise<SpotifyApi> {
        Log.notify('Connecting to Spotify API...');
        if(SpotifyApi.instance) {
            Log.notify('Overriding existing connection with new credentials');
        }
        if(!clientId) throw new Error('Spotify API: client id not provided');
        if(!clientSecret) throw new Error('Spotify API: client secret not provided');
        SpotifyApi.instance = new SpotifyApi(clientId, clientSecret);
        const accessTokenReceived = await SpotifyApi.instance.requestNewAccessToken();
        if(accessTokenReceived) {
            Log.success('Spotify API connection succeeded');
            return SpotifyApi.instance;
        }
        throw new Error('Spotify API connection failed');
    }

    /**
     * Get the instance of this class created by [[SpotifyApi.connect]].
     */
    public static getConnection(): SpotifyApi {
        if(!SpotifyApi.instance) {
            throw new Error('Spotify API connection not intialized');
        }
        return SpotifyApi.instance;
    }

    /**
     * [Get an Album's Tracks](https://developer.spotify.com/documentation/web-api/reference/albums/get-albums-tracks/)
     */
    public async getAlbumTracks(
        albumId: string,
        limit = 50,
    ): Promise<Spotify.AlbumTracksResponse> {
        const url = `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=${limit}`;
        return this.spotifyRequest<Spotify.AlbumTracksResponse>(url, 'GET');
    }

    /**
     * [Get Several Albums](https://developer.spotify.com/documentation/web-api/reference/albums/get-several-albums/)
     * @param albumIds Comma-separated list of the Spotify IDs for the albums. Maximum: 20
     */
    public async getBatch<T extends Spotify.BatchResponse>(
        ids: string,
        batchName: string,
    ): Promise<T> {
        const url = `https://api.spotify.com/v1/${batchName}?ids=${ids}`;
        return this.spotifyRequest<T>(url, 'GET');
    }

    /**
     * [Get Available Genre Seeds](https://developer.spotify.com/console/get-available-genre-seeds/)
     */
    public async getGenreSeeds(): Promise<Spotify.GenreSeedsResponse> {
        const url = 'https://api.spotify.com/v1/recommendations/available-genre-seeds';
        return this.spotifyRequest<Spotify.GenreSeedsResponse>(url, 'GET');
    }

    /**
     * @param query [spotify docs](https://developer.spotify.com/documentation/web-api/reference/search/search/)
     */
    public async search<T extends Spotify.SearchResponse>(
        query: string,
        type: Spotify.SearchType,
        limit: number,
    ): Promise<T> {
        const url = `https://api.spotify.com/v1/search?q=${query}&type=${type}&limit=${limit}`;
        return this.spotifyRequest<T>(url, 'GET');
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
