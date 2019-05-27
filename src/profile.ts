/**
 * @fileOverview Manages scraping and storage of a single user profile on Rate Your Music
 *
 * @author  Michael Darr
 */

// library dependencies
import { getManager, EntityManager } from 'typeorm';

// internal class dependencies
import Artist from './artist';
import ReviewPage from './reviewPage';
import { ScrapingResult, ScrapingResultBatch } from './scrapingResult';
import Log from './logger';

// other internal dependencies
import { Gender } from './enums';
import ScraperInterface from './interface';
import { requestScrape } from './connectionHelpers';

// database dependencies
import ProfileEntity from './entity/Profile';
import ArtistEntity from './entity/Artist';


export default class Profile implements ScraperInterface {
    public databaseID: number;

    public dataReadFromDB: boolean;

    public name: string;

    public age: number;

    public gender: Gender;

    public favoriteArtists: Artist[];

    public urlUsernameRYM: string;

    public urlRYM: string;

    public reviewPageScraper: ReviewPage;

    /**
     *
     * @param urlRYM link to artist profile on Rate Your Music
     */
    public constructor(urlUsernameRYM: string) {
        this.urlUsernameRYM = urlUsernameRYM;
        this.urlRYM = `https://rateyourmusic.com/~${urlUsernameRYM}`;
        this.dataReadFromDB = false;
        this.favoriteArtists = [];
    }

    /**
     * Gets all information for a given RYM profile
     *
     * @param page puppeteer profile page
     * @return ScrapingResult
     */
    public async scrape(): Promise<ScrapingResultBatch> {
        const profileScrapeResults = new ScrapingResultBatch();
        try {
            const entityManager = getManager();
            const savedProfile = await entityManager.findOne(
                ProfileEntity,
                { urlRYM: this.urlRYM },
            );
            if(savedProfile !== undefined && savedProfile !== null) {
                this.dataReadFromDB = true;
                this.databaseID = savedProfile.id;
                this.name = savedProfile.name;
                this.age = savedProfile.age;
                this.gender = savedProfile.gender ? Gender.Male : Gender.Female;
                profileScrapeResults.push(
                    new ScrapingResult(true, this.urlRYM),
                );
            } else {
                // enter url in page
                const root: HTMLElement = await requestScrape(this.urlRYM);

                // scrape page for reviewer info
                await this.extractUserInfo(root);
                const artistResults: ScrapingResultBatch = await this.extractArtists(root);
                profileScrapeResults.concat(artistResults);
            }

            profileScrapeResults.push(new ScrapingResult(true, this.urlRYM));

            await this.saveToDB(entityManager);

            const reviewPagesResults = await this.scrapeReviewPages();
            profileScrapeResults.concat(reviewPagesResults);
        } catch(e) {
            profileScrapeResults.push(new ScrapingResult(false, this.urlRYM, `${e.name}: ${e.message}`));
        }
        return profileScrapeResults;
    }

    /**
     * Used to insert an artist into the database. In addition, upserts genre records
     * Creates records for artist-genre pivot table
     *
     * @param entityManager database connection manager, typeORM
     * @returns an ProfileEntity, the saved database record for a profile
     */
    public async saveToDB(entityManager: EntityManager): Promise<ProfileEntity> {
        let savedProfile = await entityManager.findOne(ProfileEntity, { urlRYM: this.urlRYM });
        // if reviewer exists in database, extract skeleton data and return entity
        if(savedProfile !== undefined && savedProfile !== null) {
            this.databaseID = savedProfile.id;
            this.name = savedProfile.name;
            return savedProfile;
        }

        // new entity creation, basic properties filled in
        savedProfile = new ProfileEntity();
        savedProfile.name = this.name;
        savedProfile.age = this.age;
        savedProfile.gender = (this.gender === Gender.Male);
        savedProfile.urlRYM = this.urlRYM;

        // extract artist db records for pivot table
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
        savedProfile.favoriteArtists = artistEntities;

        // save & return
        savedProfile = await entityManager.save(savedProfile);
        return savedProfile;
    }

    /**
     * Find the database entity of a given profile
     *
     * @param entityManager database connection manager, typeORM
     * @returns an ArtistEntity, the saved database record for an artist
     */
    public async getEntity(): Promise<ProfileEntity> {
        const entityManager = getManager();
        if(this.databaseID === null || this.databaseID === undefined) {
            throw new Error(`Artist not saved in database.\n URL: ${this.urlRYM}`);
        }
        return entityManager.findOne(ProfileEntity, { id: this.databaseID });
    }

    private async scrapeReviewPages(): Promise<ScrapingResultBatch> {
        this.reviewPageScraper = new ReviewPage(this.urlUsernameRYM, this);
        const reviewScrapeResults = await this.reviewPageScraper.scrape();
        return reviewScrapeResults;
    }

    /**
     * Extracts a basic user information from a Rate Your Music profile page
     *
     * @param page puppeteer profile page
     * @param profile username for a RYM user
     */
    private async extractUserInfo(root: HTMLElement): Promise<void> {
        const userAgeAndGenderElement: HTMLElement = root.querySelector('.profilehii > table > tbody > tr:nth-child(2) > td');
        const userAgeAndGenderConcat = userAgeAndGenderElement.innerHTML;
        const splitUserInfo = userAgeAndGenderConcat.split(' / ');
        const userProfileName: HTMLElement = root.querySelector('#profilename');
        this.name = userProfileName.innerHTML;

        this.age = Number(splitUserInfo[0]);
        this.gender = Gender[splitUserInfo[1]];
    }

    /**
     * Extracts an array of favorite artists from a Rate Your Music profile page
     *
     * @param page puppeteer profile page
     * @returns An array of artist objects, with keys "name" and "url"
     */
    private async extractArtists(root: HTMLElement): Promise<ScrapingResultBatch> {
        const favoriteArtistsScrape = new ScrapingResultBatch();
        // extracts all content blocks from the page
        const allBlocks: NodeListOf<Element> = root.querySelectorAll('#content > table > tbody > tr > td > div');

        const artists: string[] = [];
        let artistTitleBlockFound = false;

        // iterate through content blocks, detect favorite artists header, grab artists
        allBlocks.forEach((block: HTMLElement): void => {
            if(artistTitleBlockFound) {
                block
                    .querySelectorAll('div > a')
                    .forEach((artistElement: HTMLElement): void => {
                        artists.push(`https://rateyourmusic.com${encodeURI((artistElement as any).href)}`);
                    });
                artistTitleBlockFound = false;
            } else if(block.innerHTML === 'favorite artists') {
                artistTitleBlockFound = true;
            }
        });

        for await(const artist of artists) {
            const newArtist = new Artist(artist);
            const artistScrapeResults: ScrapingResultBatch = await newArtist.scrape();
            if(artistScrapeResults.success()) {
                this.favoriteArtists.push(newArtist);
                newArtist.printSuccess();
            } else {
                artistScrapeResults.logErrors();
                favoriteArtistsScrape.concat(artistScrapeResults);
            }
        }
        return favoriteArtistsScrape;
    }

    /**
     * FORMATTING/PRINTING METHODS
     * simple, used for reporting
     */

    public formattedGender(): string {
        return this.gender === Gender.Male ? 'Male' : 'Female';
    }

    public printSuccess(): void {
        Log.success(`Profile Scrape Successful: ${this.name}`);
    }

    public printErr(): void {
        Log.err(`scrape failed for profile url:\n${this.urlRYM}`);
    }

    public printInfo(): void {
        Log.log(`Username: ${this.name}`);
        Log.log(`Age: ${this.age}`);
        Log.log(`Gender: ${this.formattedGender()}`);
    }
}
