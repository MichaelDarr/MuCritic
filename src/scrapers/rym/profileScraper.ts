/**
 * Manages the scraping and storage of a profile from [Rate Your Music](https://rateyourmusic.com/).
 * See [[Scraper]] for more details.
 */

import { getConnection } from 'typeorm';

import {
    ArtistEntity,
    ProfileEntity,
} from '../../entities/entities';
import { RymScraper } from './rymScraper';
import { ArtistScraper } from './artistScraper';
import { Log } from '../../helpers/classes/log';
import { ScrapeResult } from '../../helpers/classes/result';
import { Gender } from '../../helpers/types';
import { ParseElement } from '../../helpers/parsing/parseElement';

export class ProfileScraper extends RymScraper<ProfileEntity> {
    public scrapedHtmlElement: HTMLElement;

    public name: string;

    public age: number;

    public gender: Gender;

    public favoriteArtists: ArtistScraper[];

    public constructor(
        name: string,
        verbose = false,
    ) {
        super(`RYM User: ${name}`, verbose);
        this.url = `https://rateyourmusic.com/~${name}`;
        this.name = name;
        this.dataReadFromDB = false;
        this.favoriteArtists = [];
        this.repository = getConnection().getRepository(ProfileEntity);
    }

    public async saveToDB(): Promise<void> {
        // extract artist db records
        const artistEntities: ArtistEntity[] = [];
        const artistEntityIds: number[] = [];
        for await(const artist of this.favoriteArtists) {
            const artistEntity = await artist.getEntity();
            if(artistEntity != null && artistEntityIds.indexOf(artistEntity.id) === -1) {
                artistEntities.push(artistEntity);
                artistEntityIds.push(artistEntity.id);
            }
        }

        let profile = new ProfileEntity();
        profile.name = this.name;
        profile.age = this.age;
        profile.gender = (this.gender === Gender.Male);
        profile.urlRYM = this.url;
        profile.favoriteArtists = artistEntities;

        profile = await this.repository.save(profile);
        this.databaseId = profile.id;
    }

    /**
     * Find the database entity of a given profile
     *
     * @param entityManager database connection manager, typeORM
     * @returns an ArtistEntity, the saved database record for an artist
     */
    public async getEntity(): Promise<ProfileEntity> {
        return this.repository.findOne({ name: this.name });
    }

    protected extractInfo(): void {
        this.extractUserInfo();
        this.extractArtists();
    }

    protected async scrapeDependencies(): Promise<void> {
        const successfullyScrapedArtists: ArtistScraper[] = [];
        for await(const artist of this.favoriteArtists) {
            try {
                await artist.scrape();
                successfullyScrapedArtists.push(artist);
                this.results.concat(artist.results);
            } catch(e) {
                this.results.push(
                    new ScrapeResult(false, artist.url, e),
                );
            }
        }
        this.favoriteArtists = successfullyScrapedArtists;
    }

    /**
     * Extracts a basic user information from a Rate Your Music profile page
     *
     * @param page puppeteer profile page
     * @param profile username for a RYM user
     */
    private extractUserInfo(): void {
        const userAgeAndGenderRaw = this.scrapeRoot
            .element('.profilehii > table > tbody > tr:nth-child(2) > td', 'age/gender', true)
            .textContent();
        const splitUserInfo: string[] = userAgeAndGenderRaw.split(' / ');
        this.age = Number(splitUserInfo[0]);
        this.gender = Gender[splitUserInfo[1]];
    }

    /**
     * Extracts an array of favorite artists from a Rate Your Music profile page
     */
    private extractArtists(): void {
        // extracts all content blocks from the page
        let artistTitleBlockFound = false;
        const unserInfoBlockParsers = this.scrapeRoot
            .list('#content > table > tbody > tr > td > div', 'info blocks', true)
            .allElements();

        let artistParser: ParseElement;
        // iterate through content blocks, detect favorite artists header, grab artists
        for (const blockParser of unserInfoBlockParsers) {
            if(artistTitleBlockFound) {
                artistParser = blockParser;
                artistTitleBlockFound = false;
            }
            if(blockParser.textContent() === 'favorite artists') {
                artistTitleBlockFound = true;
            }
        }
        if(artistParser) {
            artistParser
                .list('div > a', 'favorite artists', true)
                .allElements('artists')
                .forEach((artist): void => {
                    let artistLink = artist.href(false);
                    artistLink = encodeURI(artistLink);
                    if(artistLink != null && artistLink !== '') {
                        this.favoriteArtists.push(
                            new ArtistScraper(`https://rateyourmusic.com${artistLink}`),
                        );
                    }
                });
        }
    }

    public formattedGender(): string {
        return this.gender === Gender.Male ? 'Male' : 'Female';
    }

    public printInfo(): void {
        Log.log(`Username: ${this.name}`);
        Log.log(`Age: ${this.age}`);
        Log.log(`Gender: ${this.formattedGender()}`);
    }
}
