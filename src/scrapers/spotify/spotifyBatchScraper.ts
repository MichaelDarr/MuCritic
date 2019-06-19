import { getConnection } from 'typeorm';

import * as Spotify from '../../types/spotify';
import { SpotifyBatchEntities } from '../../types/types';
import { SpotifyScraper } from './spotifyScraper';

/**
 * Spotify Batch Scraper
 *
 * Scrapes 20 Entities at a time via endpoints such as the
 * [[Get Several Albums]](https://developer.spotify.com/documentation/web-api/reference/albums/get-several-albums/)
 * endpoint.
 */
export abstract class SpotifyBatchScraper<
    T1 extends SpotifyBatchEntities,
    T2 extends Spotify.BatchResponse,
> extends SpotifyScraper<T2> {
    /**
     * up to 20 batch-requestable entities with Spotify Ids to be requested
     */
    protected entities: T1[];

    /**
     * Spotify batch API enpoint name, such as 'albums' or 'artists'. used for URL resolution
     */
    protected batchDescription: string;

    /**
     * @param entities Database entities with the column **spotifyId**
     */
    public constructor(
        entities: T1[],
        batchDescription: string,
        verbose = false,
    ) {
        super(`Spotify batch: ${batchDescription}`, verbose);
        this.entities = entities;
        this.batchDescription = batchDescription;
    }

    /**
     * pull spotify info using a comma-separated string concatination of every
     * [[SpotifyBatchScraper.entities]].spotifyId
     */
    public async requestScrape(): Promise<void> {
        const idString = this.entities.map(entity => entity.spotifyId).join();
        this.spotifyResponse = await this.spotifyApi.getBatch<T2>(
            idString,
            this.batchDescription,
        );
    }

    protected async saveToLocal(): Promise<void> {
        await Promise.all(this.entities.map(async (entity: SpotifyBatchEntities) => {
            await getConnection().manager.save(entity);
        }));
    }
}
