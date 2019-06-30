import { Base64 } from 'js-base64';
import * as request from 'request';

import * as Spotify from 'spotify';

import { Log } from './log';

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

    private client: ClientCredentials;

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
     * [Get an Album's Tracks](https://developer.spotify.com/documentation/web-api/reference/albums/get-albums-tracks/)
     */
    public async getAlbumTracks(
        albumId: string,
        limit = 50,
    ): Promise<Spotify.TracksResponse> {
        const url = `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=${limit}`;
        return this.spotifyRequest<Spotify.TracksResponse>(url, 'GET');
    }

    /**
     * [Get an Artist](https://developer.spotify.com/documentation/web-api/reference/artists/get-artist/)
     */
    public async getArtist(artistId: string): Promise<Spotify.ArtistResponse> {
        const url = `https://api.spotify.com/v1/artists/${artistId}`;
        return this.spotifyRequest<Spotify.ArtistResponse>(url, 'GET');
    }

    /**
     * [Get an Artist's Top Tracks](https://developer.spotify.com/documentation/web-api/reference/artists/get-artists-top-tracks/)
     *
     * @param country
     * [ISO 3166-1 alpha-2 country code](http://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)
     */
    public async getArtistTopTracks(
        artistId: string,
        country = 'US',
    ): Promise<Spotify.TopTracksResponse> {
        const url = `https://api.spotify.com/v1/artists/${artistId}/top-tracks?country=${country}`;
        return this.spotifyRequest<Spotify.TopTracksResponse>(url, 'GET');
    }

    /**
     * [Get Several Albums](https://developer.spotify.com/documentation/web-api/reference/albums/get-several-albums/)
     * @param albumIds Comma-separated list of the Spotify IDs for the albums. Maximum: 20
     */
    public async getBatch<T extends Spotify.BatchResponse>(
        ids: string | string[],
        batchName: string,
    ): Promise<T> {
        const idString = (Array.isArray(ids)) ? ids.join(',') : ids;
        const url = `https://api.spotify.com/v1/${batchName}?ids=${idString}`;
        return this.spotifyRequest<T>(url, 'GET');
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
     * [Get Available Genre Seeds](https://developer.spotify.com/console/get-available-genre-seeds/)
     */
    public async getGenreSeeds(): Promise<Spotify.GenreSeedsResponse> {
        const url = 'https://api.spotify.com/v1/recommendations/available-genre-seeds';
        return this.spotifyRequest<Spotify.GenreSeedsResponse>(url, 'GET');
    }

    /**
     * [Get Audio Features for a Track](https://developer.spotify.com/documentation/web-api/reference/tracks/get-audio-features/)
     */
    public async getTrackAudioFeatures(trackId: string): Promise<Spotify.AudioFeatureResponse> {
        const url = `https://api.spotify.com/v1/audio-features/${trackId}`;
        return this.spotifyRequest<Spotify.AudioFeatureResponse>(url, 'GET');
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
                (error, response, body): void => {
                    if(error) {
                        reject(new Error(`request failed for ${url}: ${error}`));
                    } else if(body.error != null && body.error.status === 429) {
                        const spotifyApiTemp = this;
                        setTimeout(() => {
                            resolve(spotifyApiTemp.spotifyRequest(url, method));
                        }, (response.headers['Retry-After'] as unknown) as number * 1000);
                    } else{
                        resolve(body);
                    }
                },
            );
        });
    }
}

export interface ClientCredentials {
    id: string;
    secret: string;
}
