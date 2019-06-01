// external dependencies
import { Repository } from 'typeorm';

// internal class dependencies
import SpotifyApi from '../classes/spotifyApi';
import { ResultBatch, ApiResult } from '../classes/result';
import Log from '../classes/logger';
import { ApiService } from '../enums';

// database dependencies
import AlbumEntity from '../../entities/Album';
import ArtistEntity from '../../entities/Artist';

function extractCorrectItem(
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

async function getAssetId(
    asset: AlbumEntity | ArtistEntity,
    spotifyApi: SpotifyApi,
): Promise<string> {
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
    const body = await spotifyApi.searchRequest(queryString, assetType, 3);
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

    const spotifyId: string = extractCorrectItem(asset, responseList);
    if(!spotifyId) {
        throw new Error(`Unable to extract Spotify ID for ${assetType}: ${asset.name}`);
    }
    return spotifyId;
}


export async function attatchIdsToEntries(
    repository: Repository<AlbumEntity | ArtistEntity>,
    entities: AlbumEntity[] | ArtistEntity[],
    spotifyApi: SpotifyApi,
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
                const spotifyId = await getAssetId(entity, spotifyApi);
                entity.spotifyId = spotifyId;
                await repository.save(entity);
                results.push(new ApiResult(
                    true,
                    ApiService.Spotify,
                    '/search',
                    paramDescription,
                ));
            }
            Log.success(`${entity.name}: ${entity.spotifyId}`);
        } catch(err) {
            results.push(new ApiResult(
                false,
                ApiService.Spotify,
                '/search',
                paramDescription,
                err,
            ));
        }
    }
    return results;
}
