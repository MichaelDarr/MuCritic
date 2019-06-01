/**
 * @fileOverview Manages scraping and storage of a single artist on Rate Your Music
 *
 * @author  Michael Darr
 */

// library dependencies
import { getManager } from 'typeorm';

// internal dependencies
import GenreScraper from './genreScraper';
import Log from '../helpers/classes/logger';
import AbstractScraper from './abstractScraper';
import {
    extractInnerHtml,
    getMemberCountFromRawString,
    decodeHtmlText,
    extractInnerHtmlOfGroup,
    extractHeaderNumberPair,
} from '../helpers/functions/parsing';

// database dependencies
import ArtistEntity from '../entities/Artist';
import GenreEntity from '../entities/Genre';

export default class ArtistScraperRym extends AbstractScraper {
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

    protected extractInfo(root: HTMLElement): void {
        this.extractArtistName(root);
        this.extractMainInfoBlocks(root);
        this.extractDiscographyCount(root);
        this.extractListCount(root);
        this.extractPastShowCount(root);
    }

    private extractArtistName(root: HTMLElement): void {
        const rawName = extractInnerHtml(
            root,
            'h1.artist_name_hdr',
            true,
            'RYM Artist name',
        );
        this.name = decodeHtmlText(rawName);
    }

    private extractMainInfoBlocks(root: HTMLElement): void {
        // set up temporary vars to hold raw props
        let members: string;
        let genres: string[] = [];

        // interate through the main artist info blocks, "switch" on preceeding header block
        const infoBlocks: NodeListOf<Element> = root.querySelectorAll('.artist_info > div');
        infoBlocks.forEach((block: HTMLElement, i): void => {
            if(block !== null && block.className === 'info_content') {
                const headerBlock: Element = infoBlocks.item(i - 1);
                if(headerBlock !== null) {
                    switch(headerBlock.innerHTML) {
                        case 'Members':
                            members = block.innerHTML;
                            break;
                        case 'Genres':
                            genres = extractInnerHtmlOfGroup(
                                block,
                                'a',
                                false,
                                'RYM artist genres',
                            );
                            break;
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
                }
            }
        });

        // use following methods to parse this info and sort it into class props
        this.memberCount = getMemberCountFromRawString(members, 1);
        this.genreScrapersRYM = GenreScraper.createScrapers(genres);
    }

    private extractDiscographyCount(root: HTMLElement): void {
        try {
            let countString = extractInnerHtml(
                root,
                'div.artist_page_section_active_music > span.subtext',
                true,
                'RYM artist discography count',
            );
            countString = countString.replace(/,/g, '');
            const parsedCount = Number(countString);
            if(!parsedCount || Number.isNaN(parsedCount)) throw new Error();
            this.discographyCountRYM = parsedCount;
        } catch(e) {
            this.discographyCountRYM = 0;
        }
    }

    /**
     * Extracts information from various sections of artist page
     *
     * @param page puppeteer profile page
     */
    private extractListCount(root: HTMLElement): void {
        this.listCountRYM = extractHeaderNumberPair(
            root,
            'div.section_lists > div.release_page_header > h2',
            false,
            'RYM artist list count',
        );
    }

    private extractPastShowCount(root: HTMLElement): void {
        // Total show count - format: "Show past shows [28]"
        try {
            let showString = extractInnerHtml(
                root,
                '#disco_expand_prev',
                true,
                'RYM artist past show count',
            );
            showString = showString.replace(/^.+\[/, '');
            showString = showString.substring(0, showString.length - 1);
            const parsedShowCount = Number(showString.replace(/,/g, ''));
            if(!parsedShowCount || Number.isNaN(parsedShowCount)) throw new Error();
            this.showCountRYM = parsedShowCount;
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
