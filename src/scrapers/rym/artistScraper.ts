import { getConnection } from 'typeorm';

import {
    ArtistEntity,
    RymGenreEntity,
} from '../../entities/entities';
import { GenreScraper } from './genreScraper';
import { Log } from '../../helpers/classes/log';
import { stringToNum } from '../../helpers/functions/typeManips';
import { ParseElement } from '../../helpers/parsing/parseElement';
import {
    extractCountFromPair,
    extractMemberCountFromString,
} from '../../helpers/parsing/rymStrings';
import { RymScraper } from './rymScraper';

/**
 * Manages the scraping and storage of artists from [Rate Your Music](https://rateyourmusic.com/).
 *
 * For more information on class properties, see corresponding props in [[ArtistEntity]]
 */
export class ArtistScraper extends RymScraper<ArtistEntity> {
    public active: boolean;

    public discographyCountRYM: number;

    /**
     * Indicates a breakup (irrelevant for solo acts)
     */
    public disbanded: boolean;

    public genreEntities: RymGenreEntity[];

    public genreScrapers: GenreScraper[];

    public listCountRYM: number;

    public memberCount: number;

    public name: string;

    public showCountRYM: number;

    public soloPerformer: boolean;

    /**
     * @param url Example:
     * ```https://rateyourmusic.com/artist/deftones```
     */
    public constructor(
        url: string,
        verbose = false,
    ) {
        super('RYM Artist', verbose);
        this.repository = getConnection().getRepository(ArtistEntity);
        this.url = url;
        this.soloPerformer = false;
        this.active = true;
        this.genreScrapers = [];
        this.memberCount = 1;
        this.soloPerformer = false;
        this.active = true;
    }

    /**
     * Retrieves and stores artist name
     */
    private extractArtistName(): void {
        this.name = this.scrapeRoot
            .element('h1.artist_name_hdr', 'artist', true)
            .textContent(true, null, true, true);
    }

    /**
     * Extracts and stores
     * - [[ArtistScraper.discographyCountRYM]]
     */
    private extractDiscographyCount(): void {
        this.discographyCountRYM = this.scrapeRoot
            .element('div.artist_page_section_active_music > span.subtext', 'discog count', false)
            .number();
    }

    protected extractInfo(): void {
        this.extractArtistName();
        this.extractMainInfoBlocks();
        this.extractDiscographyCount();
        this.extractListCount();
        this.extractPastShowCount();
    }

    /**
     * Extracts and stores one elements, parsed by [[extractCountFromPair]]:
     * - [[ArtistScraper.listCountRYM]]
     */
    private extractListCount(): void {
        const listCountText = this.scrapeRoot
            .element('div.section_lists > div.release_page_header > h2', 'list count', false)
            .textContent();
        this.listCountRYM = extractCountFromPair(listCountText, false);
    }

    /**
     * The main information on artist pages is represented by a series of elements, alternating
     * between "headers blocks" and their corresponding "content blocks". The order and quantity
     * of both indeterminate. This method loops through them, storing content blocks based on the
     * preceeding header block
     *
     * Extracts and stores:
     * - [[ArtistScraper.memberCount]] (uses [[extractMemberCountFromString]])
     * - [[ArtistScraper.genreScrapersRYM]] (uses [[GenreScraper.createScrapers]])
     * - [[ArtistScraper.active]]
     * - [[ArtistScraper.soloPerformer]]
     */
    private extractMainInfoBlocks(): void {
        // iterate through the main artist info blocks, "switch" on preceeding header block
        const infoBlockParsers = this.scrapeRoot
            .list('.artist_info > div', 'main info blocks', false)
            .allElements('info block');
        infoBlockParsers.forEach((blockParser: ParseElement, i): void => {
            if(blockParser.raw == null || blockParser.raw.className !== 'info_content') return;
            const headerBlockText = infoBlockParsers[i - 1].textContent(false, '');
            switch(headerBlockText) {
                case 'Members': {
                    const members = blockParser.textContent();
                    this.memberCount = extractMemberCountFromString(members, 1);
                    break;
                }
                case 'Genres': {
                    const allGenres: string[] = [];
                    blockParser
                        .list('a', 'genre links', false)
                        .allElements('individual genre')
                        .forEach((genreParser): void => {
                            const genreString = genreParser.textContent();
                            if(genreString != null) allGenres.push(genreString);
                        });
                    this.genreScrapers = GenreScraper.createScrapers(allGenres);
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
     * Extracts and stores
     * - [[ArtistScraper.showCountRYM]] Example of raw element text: ```Show past shows [28]```
     */
    private extractPastShowCount(): void {
        let showString = this.scrapeRoot
            .element('#disco_expand_prev', 'past show count', false)
            .textContent();

        showString = showString.replace(/^.+\[/, '');
        showString = showString.substring(0, showString.length - 1);
        this.showCountRYM = stringToNum(showString, false);
    }

    public async getEntity(): Promise<ArtistEntity> {
        return this.repository.findOne({ urlRYM: this.url });
    }

    public printInfo(): void {
        if(this.dataReadFromLocal) {
            this.printResult();
            return;
        }
        Log.success(`Artist Scrape Successful: ${this.name}`);
        Log.log(`Type: ${this.soloPerformer ? 'Solo Performer' : 'Band'}`);
        Log.log(`Status: ${this.active ? 'active' : 'disbanded'}`);
        Log.log(`Members: ${this.memberCount}`);
        Log.log(`Genre Count: ${this.genreScrapers.length}`);
        Log.log(`RYM List Features: ${this.listCountRYM}`);
        Log.log(`Discography Count: ${this.discographyCountRYM}`);
        Log.log(`Live Shows: ${this.showCountRYM}`);
    }

    public async saveToLocal(): Promise<void> {
        const genreEntities: RymGenreEntity[] = [];
        for await(const genre of this.genreScrapers) {
            const genreEntity: RymGenreEntity = await genre.getEntity();
            genreEntities.push(genreEntity);
        }

        let artist = new ArtistEntity();
        artist.rymGenres = genreEntities;
        artist.name = this.name;
        artist.active = this.active;
        artist.memberCount = this.memberCount;
        artist.soloPerformer = this.soloPerformer;
        artist.urlRYM = this.url;
        artist.listCountRYM = this.listCountRYM;
        artist.discographyCountRYM = this.discographyCountRYM;
        artist.showCountRYM = this.showCountRYM;

        artist = await this.repository.save(artist);
        this.databaseId = artist.id;
    }

    /**
     * Scrape the genres associated with this artist
     */
    protected async scrapeDependencies(): Promise<void> {
        const res = await ArtistScraper.scrapeDependencyArr<GenreScraper>(this.genreScrapers);
        this.genreScrapers = res.scrapers;
        this.results.concat(res.results);
    }
}
