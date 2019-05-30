import * as request from 'request';
import Log from './logger';

export default class SpotifyHelper {
    private clientId: string;

    private clientSecret: string;

    private accessToken: string;

    public constructor(clientId: string, clientSecret: string) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    public async searchAlbum(album: string, artist: string): Promise<any> {
        try {
            const queryString = `name:${album}%20artist:${artist}`;
            const body: string = await this.searchRequest(queryString, 'album');
            console.log(body);
        } catch(e) {
            console.log(e);
        }
    }

    private async requestAccessToken(): Promise<boolean> {
        return new Promise((resolve, reject): void => {
            request(
                'https://accounts.spotify.com/api/token',
                {
                    timeout: 3000,
                },
                (error, _, body): void => {
                    if(error) {
                        reject(new Error('failed to get spotify token'));
                    }
                    console.log(body);
                    this.accessToken = 'blah';
                    resolve(true);
                },
            );
        });
    }

    private async searchRequest(query: string, type: string): Promise<string> {
        if(!this.accessToken) {
            await this.requestAccessToken();
            process.exit(0);
        }
        const url = `https://api.spotify.com/v1/search?q=${query}&type=${type}`;
        return new Promise((resolve, reject): void => {
            request(
                url,
                {
                    timeout: 10000,
                    auth: {
                        bearer: '',
                    },
                },
                (error, _, body): void => {
                    if(error) {
                        reject(new Error(`request failed for ${url}`));
                    }
                    resolve(body);
                },
            );
        });
    }
}
