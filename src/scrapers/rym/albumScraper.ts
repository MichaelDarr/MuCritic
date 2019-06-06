/**
 * Manages the scraping and storage of an album from [Rate Your Music](https://rateyourmusic.com/).
 * See [[Scraper]] for more details.
 */

import { getConnection } from 'typeorm';

import {
    AlbumEntity,
    ArtistEntity,
    GenreEntity,
} from '../../entities/index';
import { Log } from '../../helpers/classes/log';
import { ScrapeResult } from '../../helpers/classes/result';
import { extractCountFromPair } from '../../helpers/parsing/rym';
import { ParseElement } from '../../helpers/parsing/parseElement';
import { ArtistScraper } from './artistScraper';
import { RymScraper } from './rymScraper';
import { GenreScraper } from './genreScraper';

export class AlbumScraper extends RymScraper<AlbumEntity> {
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
        super(`RYM Album: ${url}`, verbose);
        if(url.indexOf('various_artists') !== -1 || url.indexOf('various-artists') !== -1) {
            throw new Error('Album by various artists');
        }
        this.url = url;
        this.genreScrapersRYM = [];
        this.listCountRYM = 0;
        this.issueCountRYM = 1;
        this.repository = getConnection().getRepository(AlbumEntity);
    }

    /**
     * Used to insert an album into the database
     *
     * @returns an AlbumEntity, the saved database record for an artist
     */
    protected async saveToDB(): Promise<void> {
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

        album = await this.repository.save(album);
        this.databaseId = album.id;
    }

    /**
     * Find the database entity of a given album
     *
     * @param entityManager database connection manager, typeORM
     * @returns an AlbumEntity, the saved database record for an album
     */
    public async getEntity(): Promise<AlbumEntity> {
        return this.repository.findOne({ urlRYM: this.url });
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
                    genreScraper.name,
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
        let rawName = this.scrapeRoot
            .element('div.album_title', 'title', true)
            .text();
        rawName = rawName.substring(0, rawName.indexOf('<'));
        this.name = rawName.trim();
    }

    private extractMainInfoBlocks(): void {
        // interate through the main artist info blocks, "switch" on preceeding header block
        const infoRowParsers = this.scrapeRoot
            .list('.album_info > tbody > tr', 'info rows', false)
            .allElements();
        infoRowParsers.forEach((rowParser: ParseElement): void => {
            const headerText = rowParser.element('th', 'header', false).text(false, '');
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
                        .number(false, 0);
                    break;
                case 'Ranked': {
                    this.yearRankRYM = contentParser
                        .list('b', 'rankings list', false)
                        .element(0, 'year rank')
                        .number(false, 0);
                    this.overallRankRYM = contentParser
                        .list('b', 'rankings list', false)
                        .element(1, 'overall rank')
                        .number(false, 0);
                    break;
                }
                case 'Genres': {
                    const allGenres: string[] = [];
                    contentParser
                        .list('span.release_pri_genres > a', 'genre links', false)
                        .allElements('individual genre')
                        .forEach((genreParser): void => {
                            const genreString = genreParser.text(false, null);
                            if(genreString != null) allGenres.push(genreString);
                        });
                    this.genreScrapersRYM = GenreScraper.createScrapers(allGenres);
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
        const issueCountText = this.scrapeRoot
            .element(
                'div.section_issues > div.page_section > h2.release_page_header',
                'issues',
                false,
            ).text();
        const reviewCountText = this.scrapeRoot
            .element(
                'div.section_reviews > div.page_section > h2.release_page_header',
                'reviews',
                false,
            ).text();
        const listCountText = this.scrapeRoot
            .element(
                'div.section_lists > div.release_page_header > h2',
                'lists',
                false,
            ).text();

        this.issueCountRYM = extractCountFromPair(issueCountText, false, 0);
        this.reviewCountRYM = extractCountFromPair(reviewCountText, false, 0);
        this.listCountRYM = extractCountFromPair(listCountText, false, 0);
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
