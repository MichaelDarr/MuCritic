// external dependencies
import * as request from 'request';
import { Repository } from 'typeorm';

// internal class dependencies
import SpotifyAccessToken from './spotifyAccessToken';
import { ResultBatch, ApiResult } from './result';
import Log from './logger';
import { Api } from './enums';

// database dependencies
import AlbumEntity from './entity/Album';
import ArtistEntity from './entity/Artist';

export default class SpotifyHelper {
    private accessToken: SpotifyAccessToken;

    public constructor(clientId: string, clientSecret: string) {
        this.accessToken = new SpotifyAccessToken(clientId, clientSecret);
    }

    public async attatchIdsToAllEntries(
        repository: Repository<AlbumEntity | ArtistEntity>,
        entities: AlbumEntity[] | ArtistEntity[],
    ): Promise<ResultBatch> {
        const results = new ResultBatch();
        for await(const entity of entities) {
            let paramDescription: string;
            if(entity instanceof AlbumEntity) {
                paramDescription = `album: ${entity.name}, artist: ${entity.artist.name}`;
            } if(entity instanceof ArtistEntity) {
                paramDescription = `artist: ${entity.name}`;
            }
            try {
                if(!entity.spotifyId) {
                    const spotifyId = await this.getAssetId(entity);
                    entity.spotifyId = spotifyId;
                    await repository.save(entity);
                    results.push(new ApiResult(
                        true,
                        Api.Spotify,
                        '/search',
                        paramDescription,
                    ));
                }
                Log.success(`${entity.name}: ${entity.spotifyId}`);
            } catch(err) {
                results.push(new ApiResult(
                    false,
                    Api.Spotify,
                    '/search',
                    paramDescription,
                    err,
                ));
            }
        }
        return results;
    }

    public async getAssetId(asset: AlbumEntity | ArtistEntity): Promise<string> {
        let queryString: string;
        let assetType: string;
        if(asset instanceof AlbumEntity) {
            queryString = `album:${asset.name} artist:${asset.artist.name}`;
            assetType = 'album';
        } else if(asset instanceof ArtistEntity) {
            queryString = asset.name;
            assetType = 'artist';
        } else {
            throw new Error(`Unsupported asset type requested from spotifyHelper class: ${typeof asset}`);
        }

        queryString = encodeURIComponent(queryString);
        const body = await this.searchRequest(queryString, assetType, 3);
        let responseList: any[];
        if(asset instanceof AlbumEntity) {
            if(!body.albums || body.albums.total === 0 || !body.albums.items) {
                throw new Error(`No albums returned from Spotify for ${asset.name} by ${asset.artist.name}`);
            }
            responseList = body.albums.items;
        } else if(asset instanceof ArtistEntity) {
            if(!body.artists || body.artists.total === 0 || !body.artists.items) {
                throw new Error(`No artists returned from Spotify for ${asset.name}`);
            }
            responseList = body.artists.items;
        }

        const spotifyId: string = SpotifyHelper.extractCorrectItem(asset, responseList);
        if(!spotifyId) {
            throw new Error(`Unable to extract Spotify ID for ${assetType}: ${asset.name}`);
        }
        return spotifyId;
    }

    private static extractCorrectItem(
        asset: AlbumEntity | ArtistEntity,
        responseList: any[],
    ): string {
        for(const response of responseList) {
            if(
                asset instanceof AlbumEntity
                && asset.name === response.name
                && asset.artist.name === response.artists[0].name
            ) {
                return response.id;
            } if(
                asset instanceof ArtistEntity
                && asset.name === response.name
            ) {
                return response.id;
            }
        }
        return responseList[0].id;
    }

    private async searchRequest(
        query: string,
        type: string,
        limit: number,
    ): Promise<any> {
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
