/**
 * Manages the scraping and storage of artists from [Rate Your Music](https://rateyourmusic.com/).
 * See [[Scraper]] for more details.
 */

import { getConnection } from 'typeorm';

import {
    ArtistEntity,
    GenreEntity,
} from '../../entities/entities';
import { Log } from '../../helpers/classes/log';
import { ScrapeResult } from '../../helpers/classes/result';
import { stringToNum } from '../../helpers/functions/typeManips';
import {
    extractCountFromPair,
    extractMemberCountFromString,
} from '../../helpers/parsing/rymStrings';
import { ParseElement } from '../../helpers/parsing/parseElement';
import { RymScraper } from './rymScraper';
import { GenreScraper } from './genreScraper';

export class ArtistScraper extends RymScraper<ArtistEntity> {
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
        super('RYM Artist', verbose);
        this.repository = getConnection().getRepository(ArtistEntity);
        this.url = url;
        this.soloPerformer = false;
        this.active = true;
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
            .text(true, null, true, true);
    }

    /**
     * Find the database entity of a given album
     *
     * @param entityManager database connection manager, typeORM
     * @returns an AlbumEntity, the saved database record for an album
     */
    public async getEntity(): Promise<ArtistEntity> {
        return this.repository.findOne({ urlRYM: this.url });
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
            .allElements('info block');
        infoBlockParsers.forEach((blockParser: ParseElement, i): void => {
            if(blockParser.raw == null || blockParser.raw.className !== 'info_content') return;
            const headerBlockText = infoBlockParsers[i - 1].text(false, '');
            switch(headerBlockText) {
                case 'Members': {
                    const members = blockParser.text();
                    this.memberCount = extractMemberCountFromString(members, 1);
                    break;
                }
                case 'Genres': {
                    const allGenres: string[] = [];
                    blockParser
                        .list('a', 'genre links', false)
                        .allElements('individual genre')
                        .forEach((genreParser): void => {
                            const genreString = genreParser.text();
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
            .text();
        this.listCountRYM = extractCountFromPair(listCountText, false);
    }

    /**
     * Scrapes of shows an artist has performed into [[ArtistScraper.showCountRYM]]. Called  by
     * [[Scraper.extractInfo]]
     *
     * **Example of element text:** ```Show past shows [28]```
     */
    private extractPastShowCount(): void {
        let showString = this.scrapeRoot
            .element('#disco_expand_prev', 'past show count')
            .text();

        showString = showString.replace(/^.+\[/, '');
        showString = showString.substring(0, showString.length - 1);
        this.showCountRYM = stringToNum(showString, false, 0);
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
                    genreScraper.name,
                    err,
                ));
            }
        }
        this.genreScrapersRYM = successfullyScrapedGenres;
    }

    public async saveToDB(): Promise<void> {
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

        artist = await this.repository.save(artist);
        this.databaseId = artist.id;
    }

    public printInfo(): void {
        if(this.dataReadFromDB) {
            this.printResult();
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
