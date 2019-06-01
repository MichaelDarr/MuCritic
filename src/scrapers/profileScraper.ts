/**
 * @fileOverview Manages scraping and storage of a single user profile on Rate Your Music
 *
 * @author  Michael Darr
 */

// library dependencies
import { getManager, EntityManager } from 'typeorm';

// internal class dependencies
import Artist from './artistScraper';
import { ScrapeResult, ResultBatch } from '../helpers/classes/result';
import Log from '../helpers/classes/logger';

// other internal dependencies
import { Gender } from '../helpers/enums';
import AbstractScraper from './abstractScraper';
import { extractInnerHtml } from '../helpers/functions/parsing';

// database dependencies
import ProfileEntity from '../entities/Profile';
import ArtistEntity from '../entities/Artist';


export default class ProfileScraper extends AbstractScraper {
    public name: string;

    public age: number;

    public gender: Gender;

    public favoriteArtists: Artist[];

    public constructor(
        name: string,
        verbose = false,
    ) {
        super(`https://rateyourmusic.com/~${name}`, 'RYM User', verbose);
        this.name = name;
        this.dataReadFromDB = false;
        this.favoriteArtists = [];
    }

    public async saveToDB(): Promise<ProfileEntity> {
        // extract artist db records
        const artistEntities: ArtistEntity[] = [];
        const artistEntityIds: number[] = [];
        for await(const artist of this.favoriteArtists) {
            try {
                const artistEntity = await artist.getEntity();
                if(artistEntityIds.indexOf(artistEntity.id) === -1) {
                    artistEntities.push(artistEntity);
                    artistEntityIds.push(artistEntity.id);
                }
            } catch(e) {
                Log.err(`Artist not found - nonfatal: ${e}`);
            }
        }

        let savedProfile = new ProfileEntity();
        savedProfile.name = this.name;
        savedProfile.age = this.age;
        savedProfile.gender = (this.gender === Gender.Male);
        savedProfile.urlRYM = this.url;

        savedProfile.favoriteArtists = artistEntities;

        // save & return
        savedProfile = await getManager().save(savedProfile);
        return savedProfile;
    }

    /**
     * Find the database entity of a given profile
     *
     * @param entityManager database connection manager, typeORM
     * @returns an ArtistEntity, the saved database record for an artist
     */
    public async getEntity(): Promise<ProfileEntity> {
        return getManager().findOne(ProfileEntity, { id: this.databaseID });
    }

    protected extractInfo(root: HTMLElement): void {
        this.extractUserInfo(root);
        this.extractArtists(root);
    }

    protected async scrapeDependencies(): Promise<void> {
        for await(const artist of this.favoriteArtists) {
            try {
                await artist.scrape();
                this.results.concat(artist.results);
            } catch(e) {
                this.results.push(
                    new ScrapeResult(false, artist.url, e)
                );
            }
        }
    }

    /**
     * Extracts a basic user information from a Rate Your Music profile page
     *
     * @param page puppeteer profile page
     * @param profile username for a RYM user
     */
    private extractUserInfo(root: HTMLElement): void {
        const userAgeAndGenderConcat = extractInnerHtml(
            root,
            '.profilehii > table > tbody > tr:nth-child(2) > td',
            true,
            'RYM Profile age/gender',
        )
        const splitUserInfo: string[] = userAgeAndGenderConcat.split(' / ');
        this.age = Number(splitUserInfo[0]);
        this.gender = Gender[splitUserInfo[1]];
    }

    /**
     * Extracts an array of favorite artists from a Rate Your Music profile page
     *
     * @param page puppeteer profile page
     * @returns An array of artist objects, with keys "name" and "url"
     */
    private extractArtists(root: HTMLElement): void {
        // extracts all content blocks from the page
        const allBlocks: NodeListOf<Element> = root.querySelectorAll('#content > table > tbody > tr > td > div');
        let artistTitleBlockFound = false;

        // iterate through content blocks, detect favorite artists header, grab artists
        allBlocks.forEach((block: HTMLElement): void => {
            if(artistTitleBlockFound) {
                block
                    .querySelectorAll('div > a')
                    .forEach((artistElement: HTMLElement): void => {
                        this.favoriteArtists.push(new Artist(`https://rateyourmusic.com${encodeURI((artistElement as any).href)}`));
                    });
                artistTitleBlockFound = false;
            } else if(block.innerHTML === 'favorite artists') {
                artistTitleBlockFound = true;
            }
        });
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
