/**
 * @fileOverview Manages scraping and storage of a single album on Rate Your Music
 *
 * @author  Michael Darr
 */

// library dependencies
import { getManager } from 'typeorm';

// internal dependencies
import { AbstractScraper } from './abstractScraper';
import { ArtistScraper } from './artistScraper';
import { GenreScraper } from './genreScraper';
import { Log } from '../helpers/classes/log';
import {
    extractHeaderNumberPair,
    extractInnerHtml,
    extractHrefLink,
    extractInnerHTMLFromGroupElement,
    extractInnerHtmlOfGroup,
    decodeHtmlText,
} from '../helpers/functions/parsing';

// database dependencies
import { AlbumEntity } from '../entities/AlbumEntity';
import { ArtistEntity } from '../entities/ArtistEntity';
import { GenreEntity } from '../entities/GenreEntity';

export class AlbumScraper extends AbstractScraper {
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
        if(url.indexOf('various_artists') !== -1 || url.indexOf('various-artists') !== -1) {
            throw new Error('Album by various artists');
        }
        super(url, 'RYM Album', verbose);
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

    protected extractInfo(root: HTMLElement): void {
        this.extractName(root);
        this.extractMainInfoBlocks(root);
        this.extractCountInfo(root);
    }

    private extractName(root: HTMLElement): void {
        let rawNameText: string = extractInnerHtml(
            root,
            'div.album_title',
            true,
            'RYM album title',
        );
        rawNameText = rawNameText.substring(0, rawNameText.indexOf('<'));
        this.name = decodeHtmlText(rawNameText);
    }

    private extractMainInfoBlocks(root: HTMLElement): void {
        // set up string vars for temporary unformatted prop storage
        let artistUrl: string;
        let rating: string;
        let ratingCount: string;
        let yearRank = '0';
        let overallRank = '0';
        let genres: string[] = [];

        // interate through the main artist info blocks, "switch" on preceeding header block
        const infoRows: NodeListOf<Element> = root.querySelectorAll('.album_info > tbody > tr');
        infoRows.forEach((rowElement: HTMLElement): void => {
            const headerText = extractInnerHtml(
                rowElement,
                'th',
                false,
                'RYM album info row',
                '',
            );
            const contentElement: HTMLElement = rowElement.querySelector('td');
            switch(headerText.trim()) {
                case 'Artist':
                    artistUrl = (
                        `https://rateyourmusic.com${extractHrefLink(
                            contentElement,
                            'a.artist',
                            true,
                            'RYM artist URL',
                        )}`
                    );
                    break;
                case 'RYM Rating':
                    rating = extractInnerHtml(
                        contentElement,
                        'span.avg_rating',
                        true,
                        'RYM album rating',
                    );
                    ratingCount = extractInnerHtml(
                        contentElement,
                        'span.num_ratings > b > span',
                        false,
                        'RYM album rating count',
                        '0',
                    );
                    break;
                case 'Ranked':
                    yearRank = extractInnerHTMLFromGroupElement(
                        contentElement,
                        'b',
                        0,
                        false,
                        'RYM year rank',
                        '0',
                    );
                    overallRank = extractInnerHTMLFromGroupElement(
                        contentElement,
                        'b',
                        1,
                        false,
                        'RYM overall rank',
                        '0',
                    );
                    break;
                case 'Genres':
                    genres = extractInnerHtmlOfGroup(
                        contentElement,
                        'span.release_pri_genres > a',
                        false,
                        'RYM album genre string',
                        '0',
                    );
                    break;
                default:
            }
        });

        if(!artistUrl || !rating || !ratingCount) {
            throw new Error('Album scrape yielded incomplete data');
        }

        this.artist = new ArtistScraper(artistUrl);
        this.ratingRYM = Number(rating);
        this.ratingCountRYM = Number(ratingCount.replace(/,/g, ''));
        this.yearRankRYM = (yearRank === null) ? 0 : Number(yearRank.replace(/,/g, ''));
        this.overallRankRYM = (overallRank === null) ? 0 : Number(overallRank.replace(/,/g, ''));
        this.genresRYM = GenreScraper.createScrapers(genres);
    }

    /**
     * Extracts information from various sections of albumpage
     *
     * @param page puppeteer profile page
     * @returns a group of all scrape results resulting from this call
     */
    private extractCountInfo(root: HTMLElement): void {
        this.issueCountRYM = extractHeaderNumberPair(
            root,
            'div.section_issues > div.page_section > h2.release_page_header',
            false,
            'RYM album issue count',
        );
        this.reviewCountRYM = extractHeaderNumberPair(
            root,
            'div.section_reviews > div.page_section > h2.release_page_header',
            false,
            'RYM album review count',
        );
        this.listCountRYM = extractHeaderNumberPair(
            root,
            'div.section_lists > div.release_page_header > h2',
            false,
            'RYM album list count',
        );
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
