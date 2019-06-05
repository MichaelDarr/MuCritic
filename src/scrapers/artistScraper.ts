/**
 * Manages the scraping and storage of artists from [Rate Your Music](https://rateyourmusic.com/).
 * See [[Scraper]] for more details.
 */

import { getManager } from 'typeorm';

import {
    ArtistEntity,
    GenreEntity,
} from '../entities/index';
import {
    Log,
    ScrapeResult,
} from '../helpers/classes/index';
import {
    requestRawScrape,
    stringToNum,
} from '../helpers/functions/index';
import {
    extractMemberCountFromString,
    extractCountFromPair,
    ParseElement,
} from '../helpers/parsing/index';
import {
    GenreScraper,
    Scraper,
} from './index';

export class ArtistScraper extends Scraper {
    private scrapeRoot: ParseElement;

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
        this.name = this.scrapeRoot
            .element('h1.artist_name_hdr', 'artist', true)
            .innerText(true, null, true, true);
    }

    /**
     * Scrapes artist discograph count into [[ArtistScraper.discographyCountRYM]]. Called  by
     * [[Scraper.extractInfo]]
     *
     * **Example of element text:** ```lists 20```
     */
    private extractMainInfoBlocks(): void {
        // iterate through the main artist info blocks, "switch" on preceeding header block
        const infoBlockParsers = this.scrapeRoot
            .list('.artist_info > div', 'main info blocks', false)
            .allElements(false, 'info block');
        infoBlockParsers.forEach((blockParser: ParseElement, i): void => {
            if(blockParser.raw == null || blockParser.raw.className !== 'info_content') return;
            const headerBlockText = infoBlockParsers[i - 1].innerText(false, '');
            switch(headerBlockText) {
                case 'Members': {
                    const members = blockParser.innerText(false);
                    this.memberCount = extractMemberCountFromString(members, 1);
                    break;
                }
                case 'Genres': {
                    const allGenres: string[] = [];
                    blockParser
                        .list('a', 'genre links', false)
                        .allAnchors(false, 'individual genre')
                        .forEach((genreParser): void => {
                            const genreString = genreParser.innerText(false, null);
                            if(genreString != null) allGenres.push(genreString);
                        });
                    this.genreScrapersRYM = GenreScraper.createScrapers(allGenres);
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
     * [[Scraper.extractInfo]]
     *
     * **Example of element text:** ```lists 20```
     */
    private extractDiscographyCount(): void {
        this.discographyCountRYM = this.scrapeRoot
            .element('div.artist_page_section_active_music > span.subtext', 'discog count', false)
            .number(false, 0);
    }

    /**
     * Scrapes number of artist list appearences into [[ArtistScraper.listCountRYM]]. Called by
     * [[Scraper.extractInfo]]
     *
     * **Example of element text:** ```lists 20```
     */
    private extractListCount(): void {
        const listCountText = this.scrapeRoot
            .element('div.section_lists > div.release_page_header > h2', 'list count', false)
            .innerText();
        this.listCountRYM = extractCountFromPair(listCountText, false);
    }

    /**
     * Scrapes of shows an artist has performed into [[ArtistScraper.showCountRYM]]. Called  by
     * [[Scraper.extractInfo]]
     *
     * **Example of element text:** ```Show past shows [28]```
     */
    private extractPastShowCount(): void {
        try {
            let showString = this.scrapeRoot
                .element('#disco_expand_prev', 'past show count')
                .innerText();

            showString = showString.replace(/^.+\[/, '');
            showString = showString.substring(0, showString.length - 1);
            this.showCountRYM = stringToNum(showString, false, 0);
        } catch(e) {
            this.showCountRYM = 0;
        }
    }

    protected async scrapeDependencies(): Promise<void> {
        const successfullyScrapedGenres: GenreScraper[] = [];
        for await(const genreScraper of this.genreScrapersRYM) {
            try {
                await genreScraper.scrape();
                successfullyScrapedGenres.push(genreScraper);
                this.results.concat(genreScraper.results);
            } catch(err) {
                this.results.push(new ScrapeResult(
                    false,
                    genreScraper.url,
                    err,
                ));
            }
        }
        this.genreScrapersRYM = successfullyScrapedGenres;
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
        this.scrapeRoot = await requestRawScrape(this.url, 'RYM artist scrape');
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
