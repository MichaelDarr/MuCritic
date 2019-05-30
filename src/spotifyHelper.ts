import * as request from 'request';

import SpotifyAccessToken from './spotifyAccessToken';
import Log from './logger';

export default class SpotifyHelper {
    private accessToken: SpotifyAccessToken;

    public constructor(clientId: string, clientSecret: string) {
        this.accessToken = new SpotifyAccessToken(clientId, clientSecret);
    }

    public async searchAlbum(album: string, artist: string): Promise<any> {
        try {
            let queryString = `album:${album} artist:${artist}`;
            queryString = encodeURIComponent(queryString);
            const body: string = await this.searchRequest(queryString, 'album');
            return body;
        } catch(e) {
            return e;
        }
    }

    private async searchRequest(query: string, type: string): Promise<string> {
        const token: string = await this.accessToken.get();
        return new Promise((resolve, reject): void => {
            const requestOptions = {
                url: `https://api.spotify.com/v1/search?q=${query}&type=${type}`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            request(
                requestOptions,
                (error, _, body): void => {
                    if(error) {
                        reject(new Error(`request failed for ${query}`));
                    }
                    resolve(body);
                },
            );
        });
    }
}
