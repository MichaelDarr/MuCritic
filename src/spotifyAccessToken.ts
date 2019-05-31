import * as request from 'request';
import { Base64 } from 'js-base64';

export default class SpotifyAccessToken {
    private clientId: string;

    private clientSecret: string;

    private accessToken: string;

    private tokenExpiration: Date;

    public constructor(clientId: string, clientSecret: string) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    public async get(): Promise<string> {
        if(!this.accessToken || this.tokenExpiration < new Date()) {
            await this.requestNewAccessToken();
        }
        return this.accessToken;
    }

    private async requestNewAccessToken(): Promise<boolean> {
        return new Promise((resolve, reject): void => {
            const authString = Base64.encode(`${this.clientId}:${this.clientSecret}`);
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
