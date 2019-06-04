/**
 * Manages the scraping and storage of an album from [Rate Your Music](https://rateyourmusic.com/).
 * See [[Scraper]] for more details.
 */

import { getManager } from 'typeorm';

import {
    AlbumEntity,
    ArtistEntity,
    GenreEntity,
} from '../entities/index';
import {
    Log,
    ScrapeResult,
} from '../helpers/classes/index';
import { requestRawScrape } from '../helpers/functions/index';
import {
    decodeHtmlText,
    extractElementFromElement,
    extractElementOfListFromElement,
    extractInnerHtmlOfAllElementsOfListFromElement,
    extractInnerHtmlOfElementFromElement,
    extractLinkOfAnchorElementFromElement,
    extractNumberFromElement,
    extractNumberFromHeaderNumberPair,
    extractNumberOfElementFromElement,
} from '../helpers/parsing/index';
import {
    ArtistScraper,
    GenreScraper,
    Scraper,
} from './index';

export class AlbumScraper extends Scraper {
    private scrapedHtmlElement: HTMLElement;

    public name: string;

    public artist: ArtistScraper;

    public releaseYear: number;

    public ratingRYM: number;

    public yearRankRYM: number;

    public overallRankRYM: number;

    public ratingCountRYM: number;

    public genreScrapersRYM: GenreScraper[];

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
        this.genreScrapersRYM = [];
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
        for await(const genre of this.genreScrapersRYM) {
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
                    this.genreScrapersRYM = GenreScraper.createScrapers(genres);
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
        Log.log(`Genres: ${this.genreScrapersRYM.length}`);
        Log.log(`RYM Reviews: ${this.reviewCountRYM}`);
        Log.log(`RYM Lists: ${this.listCountRYM}`);
        Log.log(`RYM Issues: ${this.issueCountRYM}`);
    }
}
