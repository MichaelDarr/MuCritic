/**
 * Manages scraping and storage of a single album on Rate Your Music
 */

// library dependencies
import { getManager } from 'typeorm';

// internal dependencies
import { AbstractScraper } from './abstractScraper';
import { ArtistScraper } from './artistScraper';
import { GenreScraper } from './genreScraper';
import { Log } from '../helpers/classes/log';
import { requestRawScrape } from '../helpers/functions/scraping';
import {
    extractElementFromElement,
    extractInnerHtmlOfElementFromElement,
} from '../helpers/functions/parsing/base';
import {
    extractElementOfListFromElement,
    extractInnerHtmlOfAllElementsOfListFromElement,
} from '../helpers/functions/parsing/list';
import {
    extractNumberOfElementFromElement,
    extractNumberFromElement,
} from '../helpers/functions/parsing/number';
import { extractNumberFromHeaderNumberPair } from '../helpers/functions/parsing/rym';

// database dependencies
import { AlbumEntity } from '../entities/AlbumEntity';
import { ArtistEntity } from '../entities/ArtistEntity';
import { GenreEntity } from '../entities/GenreEntity';
import { decodeHtmlText } from '../helpers/functions/parsing/encoding';
import { extractLinkOfAnchorElementFromElement } from '../helpers/functions/parsing/anchor';

export class AlbumScraper extends AbstractScraper {
    private scrapedHtmlElement: HTMLElement;

    public name: string;

    public artist: ArtistScraper;

    public releaseYear: number;

    public ratingRYM: number;

    public yearRankRYM: number;

    public overallRankRYM: number;

    public ratingCountRYM: number;

    public genresRYM: GenreScraper[];

    public reviewCountRYM: number;

    public listCountRYM: number;

    public issueCountRYM: number;

    public constructor(
        url: string,
        verbose = false,
    ) {
        super(url, 'RYM Album', verbose);
        if(url.indexOf('various_artists') !== -1 || url.indexOf('various-artists') !== -1) {
            throw new Error('Album by various artists');
        }
        this.genresRYM = [];
        this.listCountRYM = 0;
        this.issueCountRYM = 1;
    }

    /**
     * Find the database entity of a given album
     *
     * @param entityManager database connection manager, typeORM
     * @returns an AlbumEntity, the saved database record for an album
     */
    public async getEntity(): Promise<AlbumEntity> {
        return getManager().findOne(AlbumEntity, { urlRYM: this.url });
    }

    /**
     * Used to insert an album into the database
     *
     * @returns an AlbumEntity, the saved database record for an artist
     */
    protected async saveToDB(): Promise<AlbumEntity> {
        const artistEntity: ArtistEntity = await this.artist.getEntity();
        if(!artistEntity) {
            throw new Error(`Artist not found for album: ${this.name}`);
        }

        const genreEntities: GenreEntity[] = [];
        for await(const genre of this.genresRYM) {
            const genreEntity: GenreEntity = await genre.getEntity();
            genreEntities.push(genreEntity);
        }

        let album = new AlbumEntity();
        album.name = this.name;
        album.urlRYM = this.url;
        album.ratingRYM = this.ratingRYM;
        album.yearRankRYM = this.yearRankRYM;
        album.overallRankRYM = this.overallRankRYM;
        album.reviewCountRYM = this.reviewCountRYM;
        album.listCountRYM = this.listCountRYM;
        album.issueCountRYM = this.issueCountRYM;
        album.artist = artistEntity;
        album.genres = genreEntities;

        album = await getManager().save(album);
        this.databaseID = album.id;
        return album;
    }

    protected async scrapeDependencies(): Promise<void> {
        await this.artist.scrape();
        this.results.concat(this.artist.results);

        for await(const genre of this.genresRYM) {
            await genre.scrape();
            this.results.concat(genre.results);
        }
    }

    protected extractInfo(): void {
        this.extractName();
        this.extractMainInfoBlocks();
        this.extractCountInfo();
    }

    private extractName(): void {
        let rawNameText: string = extractInnerHtmlOfElementFromElement(
            this.scrapedHtmlElement,
            'div.album_title',
            true,
            'RYM album title',
        );
        rawNameText = rawNameText.substring(0, rawNameText.indexOf('<'));
        this.name = decodeHtmlText(rawNameText);
    }

    private extractMainInfoBlocks(): void {
        // interate through the main artist info blocks, "switch" on preceeding header block
        const infoRows: NodeListOf<Element> = (
            this.scrapedHtmlElement.querySelectorAll('.album_info > tbody > tr')
        );
        infoRows.forEach((rowElement: HTMLElement): void => {
            const headerText = extractInnerHtmlOfElementFromElement(
                rowElement,
                'th',
                false,
                'RYM album info row header text',
                '',
            );
            const contentElement: HTMLElement = extractElementFromElement(
                rowElement,
                'td',
                false,
                'RYM album info row content element',
            );
            switch(headerText) {
                case 'Artist': {
                    const artistLink = extractLinkOfAnchorElementFromElement(
                        contentElement,
                        'a.artist',
                        true,
                    );
                    this.artist = new ArtistScraper(`https://rateyourmusic.com${artistLink}`);
                    break;
                }
                case 'RYM Rating':
                    this.ratingRYM = extractNumberOfElementFromElement(
                        contentElement,
                        'span.avg_rating',
                        true,
                        'RYM album rating',
                    );
                    this.ratingCountRYM = extractNumberOfElementFromElement(
                        contentElement,
                        'span.num_ratings > b > span',
                        false,
                        'RYM album rating count',
                        0,
                    );
                    break;
                case 'Ranked': {
                    const yearElement = extractElementOfListFromElement(
                        contentElement,
                        'b',
                        0,
                        false,
                        'RYM year rank',
                    );
                    this.yearRankRYM = extractNumberFromElement(
                        yearElement,
                        false,
                        'RYM year rank',
                        0,
                    );
                    const overallElement = extractElementOfListFromElement(
                        contentElement,
                        'b',
                        1,
                        false,
                        'RYM overall rank',
                    );
                    this.overallRankRYM = extractNumberFromElement(
                        overallElement,
                        false,
                        'RYM overall rank',
                        0,
                    );
                    break;
                }
                case 'Genres': {
                    const genres = extractInnerHtmlOfAllElementsOfListFromElement(
                        contentElement,
                        'span.release_pri_genres > a',
                        false,
                        'RYM album genre string',
                    );
                    this.genresRYM = GenreScraper.createScrapers(genres);
                    break;
                }
                default:
            }
        });

        if(!this.artist || !this.ratingRYM) {
            throw new Error('Album scrape yielded incomplete data');
        }
    }

    /**
     * Extracts information from various sections of albumpage
     *
     * @param page puppeteer profile page
     * @returns a group of all scrape results resulting from this call
     */
    private extractCountInfo(): void {
        this.issueCountRYM = extractNumberFromHeaderNumberPair(
            this.scrapedHtmlElement,
            'div.section_issues > div.page_section > h2.release_page_header',
            false,
            'RYM album issue count',
        );
        this.reviewCountRYM = extractNumberFromHeaderNumberPair(
            this.scrapedHtmlElement,
            'div.section_reviews > div.page_section > h2.release_page_header',
            false,
            'RYM album review count',
        );
        this.listCountRYM = extractNumberFromHeaderNumberPair(
            this.scrapedHtmlElement,
            'div.section_lists > div.release_page_header > h2',
            false,
            'RYM album list count',
        );
    }

    public async requestScrape(): Promise<void> {
        this.scrapedHtmlElement = await requestRawScrape(this.url);
    }

    public printInfo(): void {
        if(this.dataReadFromDB) {
            this.printResult();
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
