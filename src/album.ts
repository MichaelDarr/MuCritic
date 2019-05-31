/**
 * @fileOverview Manages scraping and storage of a single album on Rate Your Music
 *
 * @author  Michael Darr
 */

// library dependencies
import { getManager, EntityManager } from 'typeorm';

// internal class dependencies
import { ScrapingResult, ResultBatch } from './result';
import Artist from './artist';
import Genre from './genre';
import Log from './logger';

// other internal dependencies
import ScraperInterface from './interface';
import { requestScrape } from './connectionHelpers';

// database dependencies
import GenreEntity from './entity/Genre';
import AlbumEntity from './entity/Album';
import ArtistEntity from './entity/Artist';

export default class Album implements ScraperInterface {
    public databaseID: number;

    public urlRYM: string;

    public dataReadFromDB: boolean;

    public name: string;

    public artist: Artist;

    public releaseYear: number;

    public ratingRYM: number;

    public yearRankRYM: number;

    public overallRankRYM: number;

    public ratingCountRYM: number;

    public genresRYM: Genre[];

    public reviewCountRYM: number;

    public listCountRYM: number;

    public issueCountRYM: number;

    /**
     *
     * @param urlRYM link to artist profile on Rate Your Music
     */
    public constructor(urlRYM: string) {
        this.urlRYM = urlRYM;
        this.listCountRYM = 0;
        this.issueCountRYM = 1;
    }

    /**
     *  Either find this album in the local DB, or scrape the info
     *
     * @param page puppeteer profile page
     * @return ScrapingResult
     */
    public async scrape(): Promise<ResultBatch> {
        const results = new ResultBatch();
        if(this.urlRYM.indexOf('various_artists') !== -1 || this.urlRYM.indexOf('various-artists') !== -1) {
            return results.push(new ScrapingResult(false, this.urlRYM, 'Album by various artists'));
        }
        try {
            const entityManager = getManager();
            let savedAlbum = await entityManager.findOne(AlbumEntity, { urlRYM: this.urlRYM });
            if(savedAlbum !== undefined && savedAlbum !== null) {
                this.dataReadFromDB = true;
                this.databaseID = savedAlbum.id;
                this.name = savedAlbum.name;
                Log.success(`Album found in database: ${this.name}`);
                return results.push(new ScrapingResult(true, this.urlRYM));
            }

            Log.log(`Beginning album Scrape: ${this.urlRYM}`);
            // enter url in page
            const root: HTMLElement = await requestScrape(this.urlRYM);
            // scrape page for album info
            const mainInfoResult = await this.extractMainInfo(root);
            results.concat(mainInfoResult);
            const extraInfoResult = await this.extractExtraInfo(root);
            results.concat(extraInfoResult);

            if(!results.success()) {
                Log.err(`Failed album scrape: ${this.urlRYM}`);
                return results;
            }

            savedAlbum = await this.saveToDB(entityManager);
            this.name = savedAlbum.name;
            this.databaseID = savedAlbum.id;
            this.dataReadFromDB = false;

            Log.success(`Finished album scrape: ${this.name}`);
            return results.push(new ScrapingResult(true, this.urlRYM));
        } catch(e) {
            Log.err(`Failed album scrape: ${this.urlRYM}`);
            return results.push(new ScrapingResult(false, this.urlRYM, `${e.name}: ${e.message}`));
        }
    }

    /**
     * Find the database entity of a given album
     *
     * @param entityManager database connection manager, typeORM
     * @returns an AlbumEntity, the saved database record for an album
     */
    public async getEntity(): Promise<AlbumEntity> {
        const entityManager = getManager();
        if(this.databaseID === null || this.databaseID === undefined) {
            throw new Error(`Album not saved in database.\n URL: ${this.urlRYM}`);
        }
        return entityManager.findOne(AlbumEntity, { id: this.databaseID });
    }

    /**
     * Used to insert an album into the database
     *
     * @param entityManager database connection manager, typeORM
     * @returns an AlbumEntity, the saved database record for an artist
     */
    public async saveToDB(entityManager: EntityManager): Promise<AlbumEntity> {
        const genreEntities: GenreEntity[] = [];
        let artistEntity: ArtistEntity;
        for await(const genre of this.genresRYM) {
            const genreEntity: GenreEntity = await genre.getEntity();
            genreEntities.push(genreEntity);
        }
        try {
            artistEntity = await this.artist.getEntity();
        } catch(e) {
            throw new Error(`Artist not found for album: ${e}`);
        }

        let album = new AlbumEntity();
        album.name = this.name;
        album.urlRYM = this.urlRYM;
        album.ratingRYM = this.ratingRYM;
        album.yearRankRYM = this.yearRankRYM;
        album.overallRankRYM = this.overallRankRYM;
        album.reviewCountRYM = this.reviewCountRYM;
        album.listCountRYM = this.listCountRYM;
        album.issueCountRYM = this.issueCountRYM;
        album.artist = artistEntity;
        album.genres = genreEntities;

        album = await entityManager.save(album);
        this.databaseID = album.id;
        return album;
    }

    /**
     * Extracts information from the main blocks on an album page
     *
     * @param page puppeteer profile page
     * @returns a group of all scrape results resulting from this call
     */
    private async extractMainInfo(root: HTMLElement): Promise<ResultBatch> {
        const results: ResultBatch = new ResultBatch();

        // album name block
        const albumNameElement: HTMLElement = root.querySelector('div.album_title');
        if(albumNameElement === null) {
            results.push(new ScrapingResult(false, this.urlRYM, 'Album scraper unable to find name'));
            return results;
        }
        let rawNameText: string = albumNameElement.innerHTML;
        rawNameText = rawNameText.substring(0, rawNameText.indexOf('<'));
        this.name = rawNameText.trim();

        // set up string vars for temporary unformatted prop storage
        let artistURL: string;
        let rating: string;
        let ratingCount: string;
        let yearRank = '0';
        let overallRank = '0';
        let genres = '0';

        // interate through the main artist info blocks, "switch" on preceeding header block
        const infoRows: NodeListOf<Element> = root.querySelectorAll('.album_info > tbody > tr');
        infoRows.forEach((rowElement: HTMLElement): void => {
            const headerElement: HTMLElement = rowElement.querySelector('th');
            let contentElement: HTMLElement = rowElement.querySelector('td');
            const tempElement: HTMLElement = contentElement;
            switch(headerElement.innerHTML.trim()) {
                case 'Artist':
                    contentElement = contentElement.querySelector('a.artist');
                    if(contentElement !== null) {
                        artistURL = `https://rateyourmusic.com${encodeURI((contentElement as any).href)}`;
                    }
                    break;
                case 'RYM Rating':
                    contentElement = contentElement.querySelector('span.avg_rating');
                    if(contentElement !== null) rating = contentElement.innerHTML;
                    contentElement = tempElement.querySelector('span.num_ratings > b > span');
                    if(contentElement !== null) ratingCount = contentElement.innerHTML;
                    break;
                case 'Ranked':
                    contentElement = contentElement.querySelectorAll('b').item(0);
                    if(contentElement !== null) yearRank = contentElement.innerHTML;
                    contentElement = tempElement.querySelectorAll('b').item(1);
                    if(contentElement !== null) overallRank = contentElement.innerHTML;
                    break;
                case 'Genres':
                    contentElement = contentElement.querySelector('span.release_pri_genres > a');
                    if(contentElement !== null) genres = contentElement.innerHTML;
                    break;
                default:
            }
        });

        if(artistURL === null || rating === null || ratingCount === null) {
            results.push(new ScrapingResult(false, this.urlRYM, `${this.name}: album scrape yielded null data`));
            return results;
        }
        if(artistURL === undefined || rating === undefined || ratingCount === undefined) {
            results.push(new ScrapingResult(false, this.urlRYM, `${this.name}: album scrape yielded undefined data`));
            return results;
        }

        this.artist = new Artist(artistURL);
        const artistScrapeResult: ResultBatch = await this.artist.scrape();
        results.concat(artistScrapeResult);
        if(!results.success()) {
            results.push(new ScrapingResult(false, this.urlRYM, 'album\'s artist scrape failed'));
            return results;
        }

        this.ratingRYM = Number(rating);
        this.ratingCountRYM = Number(ratingCount.replace(/,/g, ''));
        this.yearRankRYM = (yearRank === null) ? 0 : Number(yearRank.replace(/,/g, ''));
        this.overallRankRYM = (overallRank === null) ? 0 : Number(overallRank.replace(/,/g, ''));
        this.genresRYM = Genre.parse(genres);

        results.push(new ScrapingResult(true, this.urlRYM));
        return results;
    }

    /**
     * Extracts information from various sections of albumpage
     *
     * @param page puppeteer profile page
     * @returns a group of all scrape results resulting from this call
     */
    private async extractExtraInfo(root: HTMLElement): Promise<ResultBatch> {
        const results: ResultBatch = new ResultBatch();

        let issueCount = '';
        let reviewCount = '';
        let listCount = '';

        const issueCountElement: HTMLElement = root.querySelector('div.section_issues > div.page_section > h2.release_page_header');
        if(issueCountElement !== null) issueCount = issueCountElement.innerHTML;
        this.issueCountRYM = Album.extractFromHeaderValuePair(issueCount, 0);

        const reviewCountElement: HTMLElement = root.querySelector('div.section_reviews > div.page_section > h2.release_page_header');
        if(reviewCountElement !== null) reviewCount = reviewCountElement.innerHTML;
        this.reviewCountRYM = Album.extractFromHeaderValuePair(reviewCount, 0);

        const listCountElement: HTMLElement = root.querySelector('div.section_lists > div.release_page_header > h2');
        if(listCountElement !== null) listCount = listCountElement.innerHTML;
        this.listCountRYM = Album.extractFromHeaderValuePair(listCount, 0);

        results.push(new ScrapingResult(true, this.urlRYM));
        return results;
    }

    /**
     * Simple method to separate and number-ify a combined number-header string
     *
     * @param combined string with "number header" format, ie: "4,132 Lists"
     */
    private static extractFromHeaderValuePair(combined: string, defaultVal: number): number {
        let finalNum: number = defaultVal;
        if(combined !== null && combined !== '' && combined !== undefined) {
            const trimmedCombined = combined.trim();
            const separatedVals: string[] = trimmedCombined.split(' ');
            finalNum = Number(separatedVals.shift().replace(/,/g, ''));
            if(Number.isNaN(finalNum)) {
                finalNum = defaultVal;
            }
        }
        return finalNum;
    }

    /**
     * FORMATTING/PRINTING METHODS
     * used for reporting
     */
    public printSuccess(): void {
        if(this.dataReadFromDB) {
            Log.success(`Found Album ${this.name} in database\nID: ${this.databaseID}`);
        } else {
            Log.success(`Album Scrape Successful: ${this.name}`);
        }
    }

    public printErr(): void {
        Log.err(`scrape failed for album url:\n${this.urlRYM}`);
    }

    public printInfo(): void {
        if(this.dataReadFromDB) {
            Log.success(`Found Artist ${this.name} in database\nID: ${this.databaseID}`);
            return;
        }
        Log.log(`Artist: ${this.artist.name}`);
        Log.log(`Release Year: ${this.releaseYear}`);
        Log.log(`RYM Rating: ${this.ratingRYM}`);
        Log.log(`${this.releaseYear} Rank: ${this.yearRankRYM}`);
        Log.log(`Overall Rank: ${this.overallRankRYM}`);
        Log.log(`RYM Ratings: ${this.ratingCountRYM}`);
        Log.log(`Genres: ${this.genresRYM.length}`);
        Log.log(`RYM Reviews: ${this.reviewCountRYM}`);
        Log.log(`RYM Lists: ${this.listCountRYM}`);
        Log.log(`RYM Issues: ${this.issueCountRYM}`);
    }
}
