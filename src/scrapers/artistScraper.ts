/**
 * Manages the scraping and storage of artists from [Rate Your Music](https://rateyourmusic.com/).
 * See [[AbstractScraper]] for more details.
 */

import { getManager } from 'typeorm';

import {
    ArtistEntity,
    GenreEntity,
} from '../entities/index';
import { Log } from '../helpers/classes/index';
import {
    requestRawScrape,
    stringToNum,
} from '../helpers/functions/index';
import {
    decodeHtmlText,
    extractInnerHtmlFromElement,
    extractInnerHtmlOfAllElementsOfListFromElement,
    extractInnerHtmlOfElementFromElement,
    extractInnerHtmlOfElementFromList,
    extractListFromElement,
    extractMemberCountFromString,
    extractNumberFromHeaderNumberPair,
    extractNumberOfElementFromElement,
} from '../helpers/parsing/index';
import {
    AbstractScraper,
    GenreScraper,
} from './index';

export class ArtistScraper extends AbstractScraper {
    private scrapedHtmlElement: HTMLElement;

    public name: string;

    public active: boolean;

    public memberCount: number;

    public disbanded: boolean;

    public soloPerformer: boolean;

    public genreScrapersRYM: GenreScraper[];

    public genreEntities: GenreEntity[];

    public listCountRYM: number;

    public discographyCountRYM: number;

    public showCountRYM: number;

    public constructor(
        url: string,
        verbose = false,
    ) {
        super(url, 'RYM Artist', verbose);
        this.soloPerformer = false;
        this.active = true;
    }

    public async getEntity(): Promise<ArtistEntity> {
        return getManager().findOne(ArtistEntity, { urlRYM: this.url });
    }

    protected extractInfo(): void {
        this.extractArtistName();
        this.extractMainInfoBlocks();
        this.extractDiscographyCount();
        this.extractListCount();
        this.extractPastShowCount();
    }

    private extractArtistName(): void {
        const rawName = extractInnerHtmlOfElementFromElement(
            this.scrapedHtmlElement,
            'h1.artist_name_hdr',
            true,
            'RYM Artist name',
        );
        this.name = decodeHtmlText(rawName);
    }

    /**
     * Scrapes artist discograph count into [[ArtistScraper.discographyCountRYM]]. Called  by
     * [[AbstractScraper.extractInfo]]
     *
     * **Example of element text:** ```lists 20```
     */
    private extractMainInfoBlocks(): void {
        // iterate through the main artist info blocks, "switch" on preceeding header bloc
        const infoBlocks = extractListFromElement(
            this.scrapedHtmlElement,
            '.artist_info > div',
            false,
            'RYM artist main info blocks scrape',
        );
        infoBlocks.forEach((block: HTMLElement, i): void => {
            if(block == null || block.className !== 'info_content') return;
            const headerBlockText = extractInnerHtmlOfElementFromList(
                infoBlocks,
                i - 1,
                false,
                'RYM Artist scrape block header',
                null,
            );
            switch(headerBlockText) {
                case 'Members': {
                    const members = extractInnerHtmlFromElement(
                        block,
                        false,
                        'RYM Artist member scrape',
                    );
                    this.memberCount = extractMemberCountFromString(members, 1);
                    break;
                }
                case 'Genres': {
                    const genres = extractInnerHtmlOfAllElementsOfListFromElement(
                        block,
                        'a',
                        false,
                        'RYM artist genres',
                    );
                    this.genreScrapersRYM = GenreScraper.createScrapers(genres);
                    break;
                }
                case 'Disbanded':
                    this.active = false;
                    break;
                case 'Born':
                    this.soloPerformer = true;
                    break;
                case 'Died':
                    this.soloPerformer = true;
                    this.active = false;
                    break;
                default:
            }
        });
    }

    /**
     * Scrapes artist discograph count into [[ArtistScraper.discographyCountRYM]]. Called  by
     * [[AbstractScraper.extractInfo]]
     *
     * **Example of element text:** ```lists 20```
     */
    private extractDiscographyCount(): void {
        this.discographyCountRYM = extractNumberOfElementFromElement(
            this.scrapedHtmlElement,
            'div.artist_page_section_active_music > span.subtext',
            false,
            'RYM artist discography count',
            0,
        );
    }

    /**
     * Scrapes number of artist list appearences into [[ArtistScraper.listCountRYM]]. Called by
     * [[AbstractScraper.extractInfo]]
     *
     * **Example of element text:** ```lists 20```
     */
    private extractListCount(): void {
        this.listCountRYM = extractNumberFromHeaderNumberPair(
            this.scrapedHtmlElement,
            'div.section_lists > div.release_page_header > h2',
            false,
            'RYM artist list count',
        );
    }

    /**
     * Scrapes of shows an artist has performed into [[ArtistScraper.showCountRYM]]. Called  by
     * [[AbstractScraper.extractInfo]]
     *
     * **Example of element text:** ```Show past shows [28]```
     */
    private extractPastShowCount(): void {
        try {
            let showString = extractInnerHtmlOfElementFromElement(
                this.scrapedHtmlElement,
                '#disco_expand_prev',
                true,
                'RYM artist past show count',
            );
            showString = showString.replace(/^.+\[/, '');
            showString = showString.substring(0, showString.length - 1);
            this.showCountRYM = stringToNum(showString, false, 0);
        } catch(e) {
            this.showCountRYM = 0;
        }
    }

    protected async scrapeDependencies(): Promise<void> {
        for await(const genreScraper of this.genreScrapersRYM) {
            await genreScraper.scrape();
            this.results.concat(genreScraper.results);
        }
    }

    public async saveToDB(): Promise<ArtistEntity> {
        const genreEntities: GenreEntity[] = [];
        for await(const genre of this.genreScrapersRYM) {
            const genreEntity: GenreEntity = await genre.getEntity();
            genreEntities.push(genreEntity);
        }

        let artist = new ArtistEntity();
        artist.genres = genreEntities;
        artist.name = this.name;
        artist.active = this.active;
        artist.memberCount = this.memberCount;
        artist.soloPerformer = this.soloPerformer;
        artist.urlRYM = this.url;
        artist.listCountRYM = this.listCountRYM;
        artist.discographyCountRYM = this.discographyCountRYM;
        artist.showCountRYM = this.showCountRYM;

        artist = await getManager().save(artist);
        this.databaseID = artist.id;
        return artist;
    }

    public async requestScrape(): Promise<void> {
        this.scrapedHtmlElement = await requestRawScrape(this.url);
    }

    public printInfo(): void {
        if(this.dataReadFromDB) {
            Log.success(`Found Artist ${this.name} in database\nID: ${this.databaseID}`);
            return;
        }
        Log.success(`Artist Scrape Successful: ${this.name}`);
        Log.log(`Type: ${this.soloPerformer ? 'Solo Performer' : 'Band'}`);
        Log.log(`Status: ${this.active ? 'active' : 'disbanded'}`);
        Log.log(`Members: ${this.memberCount}`);
        Log.log(`Genre Count: ${this.genreScrapersRYM.length}`);
        Log.log(`RYM List Features: ${this.listCountRYM}`);
        Log.log(`Discography Count: ${this.discographyCountRYM}`);
        Log.log(`Live Shows: ${this.showCountRYM}`);
    }
}
