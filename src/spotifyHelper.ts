// external dependencies
import * as request from 'request';

// internal class dependencies
import SpotifyAccessToken from './spotifyAccessToken';
import Log from './logger';

// database dependencies
import AlbumEntity from './entity/Album';

export default class SpotifyHelper {
    private accessToken: SpotifyAccessToken;

    public constructor(clientId: string, clientSecret: string) {
        this.accessToken = new SpotifyAccessToken(clientId, clientSecret);
    }

    public async getAlbumId(album: AlbumEntity): Promise<string> {
        let queryString = `album:${album.name} artist:${album.artist.name}`;
        queryString = encodeURIComponent(queryString);
        const body: any = await this.searchRequest(queryString, 'album', 3);
        if(!body.albums || body.albums.total === 0 || !body.albums.items) {
            throw new Error(`No albums returned from Spotify for ${album.name} by ${album.artist.name}`);
        }
        const albumResponses = body.albums.items;
        const spotifyId: string = SpotifyHelper.extractCorrectAlbum(album, albumResponses);
        if(!spotifyId) {
            throw new Error(`Unable to extract Spotify ID for ${album.name} by ${album.artist.name}`);
        }
        return spotifyId;
    }

    private static extractCorrectAlbum(album: AlbumEntity, albumResponses: any[]): string {
        const albumName = album.name;
        const albumArtist = album.artist.name;
        const finalIds: string[] = [];
        albumResponses.forEach((albumResponse): void => {
            if(albumName === albumResponse.name && albumArtist === albumResponse.artists[0].name) {
                finalIds.push(albumResponse.id);
            }
        });
        if(finalIds.length > 0) {
            return finalIds[0];
        }
        return albumResponses[0].id;
    }

    private async searchRequest(query: string, type: string, limit: number): Promise<any> {
        const token: string = await this.accessToken.get();
        return new Promise((resolve, reject): void => {
            const requestOptions = {
                url: `https://api.spotify.com/v1/search?q=${query}&type=${type}&limit=${limit}`,
                method: 'GET',
                json: true,
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
