import { getConnection } from 'typeorm';

import { ArtistScraper } from './artistScraper';
import {
    AlbumEntity,
    ArtistEntity,
    RymGenreEntity,
} from '../../entities/entities';
import { GenreScraper } from './genreScraper';
import { Log } from '../../helpers/classes/log';
import { extractCountFromPair } from '../../helpers/parsing/rymStrings';
import { ParseElement } from '../../helpers/parsing/parseElement';
import { RymScraper } from './rymScraper';

/**
 * Manages the scraping and storage of an album from [Rate Your Music](https://rateyourmusic.com/).
 *
 * For more information on class properties, see corresponding props in [[AlbumEntity]].
 */
export class AlbumScraper extends RymScraper<AlbumEntity> {
    public artist: ArtistScraper;

    public genreScrapers: GenreScraper[];

    public issueCountRYM: number;

    public listCountRYM: number;

    public name: string;

    public overallRankRYM: number;

    public ratingCountRYM: number;

    public ratingRYM: number;

    public reviewCountRYM: number;

    public yearRankRYM: number;

    /**
     * @param url Example:
     * ```https://rateyourmusic.com/release/album/aphex-twin/_i-care-because-you-do/```
     */
    public constructor(
        url: string,
        verbose = false,
    ) {
        super(url, `RYM Album: ${url}`, verbose);
        if(url.indexOf('various_artists') !== -1 || url.indexOf('various-artists') !== -1) {
            throw new Error('Album by various artists');
        }
        this.genreScrapers = [];
        this.listCountRYM = 0;
        this.issueCountRYM = 1;
        this.repository = getConnection().getRepository(AlbumEntity);
        this.overallRankRYM = 0;
        this.yearRankRYM = 0;
    }

    /**
     * Extracts and stores three similarly laid out elements, parsed by [[extractCountFromPair]]:
     * - [[AlbumScraper.issueCountRYM]]
     * - [[AlbumScraper.reviewCountRYM]]
     * - [[AlbumScraper.listCountRYM]]
     */
    private extractCountInfo(): void {
        const issueCountText = this.scrapeRoot
            .element(
                'div.section_issues > div.page_section > h2.release_page_header',
                'issues',
                false,
            ).textContent();
        const reviewCountText = this.scrapeRoot
            .element(
                'div.section_reviews > div.page_section > h2.release_page_header',
                'reviews',
                false,
            ).textContent();
        const listCountText = this.scrapeRoot
            .element(
                'div.section_lists > div.release_page_header > h2',
                'lists',
                false,
            ).textContent();

        this.issueCountRYM = extractCountFromPair(issueCountText, false);
        this.reviewCountRYM = extractCountFromPair(reviewCountText, false);
        this.listCountRYM = extractCountFromPair(listCountText, false);
    }

    protected extractInfo(): void {
        this.extractName();
        this.extractMainInfoBlocks();
        this.extractCountInfo();
    }

    /**
     * The main information on Album pages is represented by a series of elements for which order
     * and quantity are both indeterminate. This method loops through them, storing info based on
     * their header text.
     *
     * Extracts and stores:
     * - [[AlbumScraper.artist]]
     * - [[AlbumScraper.ratingRYM]]
     * - [[AlbumScraper.ratingCountRYM]]
     * - [[AlbumScraper.yearRankRYM]]
     * - [[AlbumScraper.overallRankRYM]]
     * - [[AlbumScraper.genreScrapersRYM]]  (uses [[GenreScraper.createScrapers]])
     */
    private extractMainInfoBlocks(): void {
        const infoRowParsers = this.scrapeRoot
            .list('.album_info > tbody > tr', 'info rows', false)
            .allElements();
        infoRowParsers.forEach((rowParser: ParseElement): void => {
            const headerText = rowParser.element('th', 'header', false).textContent();
            const contentParser = rowParser.element('td', 'content', false);
            switch(headerText) {
                case 'Artist': {
                    const artistLink = contentParser.element('a.artist', 'artist', true).href();
                    this.artist = new ArtistScraper(`https://rateyourmusic.com${artistLink}`);
                    break;
                }
                case 'RYM Rating':
                    this.ratingRYM = contentParser
                        .element('span.avg_rating', 'average rating', true)
                        .number();
                    this.ratingCountRYM = contentParser
                        .element('span.num_ratings > b > span', 'rating count', false)
                        .number();
                    break;
                case 'Ranked': {
                    this.yearRankRYM = contentParser
                        .list('b', 'rankings list', false)
                        .element(0, 'year rank')
                        .number();
                    this.overallRankRYM = contentParser
                        .list('b', 'rankings list', false)
                        .element(1, 'overall rank')
                        .number();
                    break;
                }
                case 'Genres': {
                    const allGenres: string[] = [];
                    contentParser
                        .list('span.release_pri_genres > a', 'genre links', false)
                        .allElements('individual genre')
                        .forEach((genreParser): void => {
                            const genreString = genreParser.textContent(false, null);
                            if(genreString != null) allGenres.push(genreString);
                        });
                    this.genreScrapers = GenreScraper.createScrapers(allGenres);
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
     * Extracts and stores
     * - [[AlbumScraper.name]]
     */
    private extractName(): void {
        let rawName = this.scrapeRoot
            .element('div.album_title', 'title', true)
            .innerHTML(true, null, true);
        rawName = rawName.substring(0, rawName.indexOf('<'));
        this.name = rawName.trim();
    }

    public async getEntity(): Promise<AlbumEntity> {
        return this.repository.findOne({ urlRYM: this.url });
    }

    public printInfo(): void {
        if(this.dataReadFromLocal) {
            this.printResult();
            return;
        }
        Log.log(`Artist: ${this.artist.name}`);
        Log.log(`RYM Rating: ${this.ratingRYM}`);
        Log.log(`Overall Rank: ${this.overallRankRYM}`);
        Log.log(`RYM Ratings: ${this.ratingCountRYM}`);
        Log.log(`Genres: ${this.genreScrapers.length}`);
        Log.log(`RYM Reviews: ${this.reviewCountRYM}`);
        Log.log(`RYM Lists: ${this.listCountRYM}`);
        Log.log(`RYM Issues: ${this.issueCountRYM}`);
    }

    protected async saveToLocal(): Promise<void> {
        const artistEntity: ArtistEntity = await this.artist.getEntity();
        if(!artistEntity) {
            throw new Error(`Artist not found for album: ${this.name}`);
        }

        const genreEntities: RymGenreEntity[] = [];
        for await(const genre of this.genreScrapers) {
            const genreEntity: RymGenreEntity = await genre.getEntity();
            genreEntities.push(genreEntity);
        }

        let album = new AlbumEntity();
        album.name = this.name;
        album.urlRYM = this.url;
        album.ratingRYM = this.ratingRYM;
        album.ratingCountRYM = this.ratingCountRYM;
        album.yearRankRYM = this.yearRankRYM;
        album.overallRankRYM = this.overallRankRYM;
        album.reviewCountRYM = this.reviewCountRYM;
        album.listCountRYM = this.listCountRYM;
        album.issueCountRYM = this.issueCountRYM;
        album.artist = artistEntity;
        album.rymGenres = genreEntities;

        album = await this.repository.save(album);
        this.databaseId = album.id;
    }

    /**
     * Scrape the artist and genres associated with this album
     */
    protected async scrapeDependencies(): Promise<void> {
        await this.artist.scrape();
        this.results.concat(this.artist.results);

        const res = await ArtistScraper.scrapeDependencyArr<GenreScraper>(this.genreScrapers);
        this.genreScrapers = res.scrapers;
        this.results.concat(res.results);
    }
}
