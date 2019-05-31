/**
 * @fileOverview Manages scraping and storage of a single artist on Rate Your Music
 *
 * @author  Michael Darr
 */

// library dependencies
import { getManager, EntityManager } from 'typeorm';

// internal class dependencies
import { ScrapingResult, ResultBatch } from './result';
import Genre from './genre';
import Log from './logger';

// other internal dependencies
import ScraperInterface from './interface';
import { requestScrape } from './connectionHelpers';

// database dependencies
import ArtistEntity from './entity/Artist';
import GenreEntity from './entity/Genre';

export default class Artist implements ScraperInterface {
    public databaseID: number;

    public dataReadFromDB: boolean;

    public name: string;

    public active: boolean;

    public memberCount: number;

    public disbanded: boolean;

    public soloPerformer: boolean;

    public urlRYM: string;

    public genresRYM: Genre[];

    public listCountRYM: number;

    public discographyCountRYM: number;

    public showCountRYM: number;

    /**
     *
     * @param urlRYM link to artist profile on Rate Your Music
     */
    public constructor(urlRYM: string) {
        this.urlRYM = urlRYM;
        this.soloPerformer = false;
        this.active = true;
    }

    /**
     *  Either find this artist in the local DB, or scrape the info
     *
     * @param page puppeteer profile page
     * @return ScrapingResult
     */
    public async scrape(): Promise<ResultBatch> {
        const results = new ResultBatch();
        try {
            const entityManager = getManager();
            let savedArtist = await entityManager.findOne(ArtistEntity, { urlRYM: this.urlRYM });
            if(savedArtist !== undefined && savedArtist !== null) {
                this.dataReadFromDB = true;
                this.databaseID = savedArtist.id;
                this.name = savedArtist.name;
                Log.success(`Artist found in database: ${this.name}`);
                return results.push(new ScrapingResult(true, this.urlRYM));
            }
            Log.log(`Beginning artist scrape: ${this.urlRYM}`);

            // enter url in page
            const root: HTMLElement = await requestScrape(this.urlRYM);

            // scrape page for reviewer info
            const mainInfoResult = await this.extractMainInfo(root);
            results.concat(mainInfoResult);
            // scrape extranious info
            const extraInfoResult = await this.extractExtraInfo(root);
            results.concat(extraInfoResult);

            if(!results.success()) {
                return results;
            }

            savedArtist = await this.saveToDB(entityManager);
            this.name = savedArtist.name;
            this.databaseID = savedArtist.id;
            this.dataReadFromDB = false;

            Log.success(`Finished artist scrape: ${this.name}`);
            return results.push(new ScrapingResult(true, this.urlRYM));
        } catch(e) {
            return results.push(new ScrapingResult(false, this.urlRYM, `${e.name}: ${e.message}`));
        }
    }

    /**
     * Find the database entity of a given artist
     *
     * @param entityManager database connection manager, typeORM
     * @returns an ArtistEntity, the saved database record for an artist
     */
    public async getEntity(): Promise<ArtistEntity> {
        const entityManager = getManager();
        if(this.databaseID === null || this.databaseID === undefined) {
            throw new Error(`Artist not saved in database.\n URL: ${this.urlRYM}`);
        }
        return entityManager.findOne(ArtistEntity, { id: this.databaseID });
    }

    /**
     * Extracts information from various sections of artist page
     *
     * @param page puppeteer profile page
     */
    private async extractExtraInfo(root: HTMLElement): Promise<ResultBatch> {
        const results: ResultBatch = new ResultBatch();
        // Discography Count
        const totalDiscographyElement: HTMLElement = root.querySelector('div.artist_page_section_active_music > span.subtext');
        if(totalDiscographyElement !== null) {
            const totalDiscographyText = totalDiscographyElement.innerHTML;
            if(totalDiscographyText === null || totalDiscographyText === undefined) {
                this.discographyCountRYM = 0;
            } else {
                this.discographyCountRYM = Number(totalDiscographyText.replace(/,/g, ''));
                if(Number.isNaN(this.discographyCountRYM)) {
                    this.discographyCountRYM = 0;
                }
            }
        } else {
            this.discographyCountRYM = 0;
        }

        // RYM user list inclusion count
        const listCountElement: HTMLElement = root.querySelector('div.section_lists > div.release_page_header > h2');
        if(listCountElement !== null) {
            let listCountRaw = listCountElement.innerHTML;
            if(listCountRaw === null || listCountRaw === undefined) {
                this.listCountRYM = 0;
            } else {
                listCountRaw = listCountRaw.trim();
                const listCountSplit: string[] = listCountRaw.split(' ');
                this.listCountRYM = Number(listCountSplit[0].replace(/,/g, ''));
                if(Number.isNaN(this.listCountRYM)) {
                    this.listCountRYM = 0;
                }
            }
        } else {
            this.listCountRYM = 0;
        }

        // Total show count - format: "Show past shows [28]"
        const pastShowsElement: HTMLElement = root.querySelector('#disco_expand_prev');
        if(pastShowsElement !== null) {
            const showStringRaw = pastShowsElement.innerHTML;
            if(showStringRaw === null || showStringRaw === undefined) {
                this.showCountRYM = 0;
            } else {
                let showString: string = showStringRaw.replace(/^.+\[/, '');
                showString = showString.substring(0, showString.length - 1);
                this.showCountRYM = Number(showString.replace(/,/g, ''));
                if(Number.isNaN(this.showCountRYM)) {
                    this.listCountRYM = 0;
                }
            }
        } else {
            this.showCountRYM = 0;
        }

        results.push(new ScrapingResult(true, this.urlRYM));
        return results;
    }

    /**
     * Extracts information from the main blocks on an artist page
     *
     * @param page puppeteer profile page
     */
    private async extractMainInfo(root: HTMLElement): Promise<ResultBatch> {
        const results: ResultBatch = new ResultBatch();
        // set up temporary vars to hold raw props
        let members: string;
        const genres: string[] = [];

        // simple artist name block. Stored in position 0.
        const artistNameElement: HTMLElement = root.querySelector('h1.artist_name_hdr');
        if(artistNameElement !== null) {
            this.name = artistNameElement.innerHTML;
        } else {
            results.push(new ScrapingResult(false, this.urlRYM, 'failed to read artist name'));
            return results;
        }

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
                            block.querySelectorAll('a').forEach((genre): void => {
                                genres.push(genre.innerHTML);
                            });
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
        this.parseMembers(members);
        this.genresRYM = Genre.createGenres(genres);

        results.push(new ScrapingResult(true, this.urlRYM));
        return results;
    }

    /**
     * Extract current band info from a string
     *
     * @param current band info string. ex:
     * Kevin Shields (guitar, vocals, sampler), Colm O'Ciosoig (drums, sampler, 1983-95, 2007-pr...
     */
    private parseMembers(members: string): void {
        if(members === null || members === '' || members === undefined) {
            this.memberCount = 1;
            return;
        }
        const membersStripped: string = members.replace(/ *\([^)]*\) */g, '');
        const memberArray: string[] = membersStripped.split(', ');
        this.memberCount = memberArray.length;
    }

    /**
     * Used to insert an artist into the database. In addition, upserts genre records
     * Creates records for artist-genre pivot table
     *
     * @param entityManager database connection manager, typeORM
     * @returns an ArtistEntity, the saved database record for an artist
     */
    public async saveToDB(entityManager: EntityManager): Promise<ArtistEntity> {
        const genreEntities: GenreEntity[] = [];
        for await(const genre of this.genresRYM) {
            const genreEntity: GenreEntity = await genre.getEntity();
            genreEntities.push(genreEntity);
        }

        let artist = new ArtistEntity();
        artist.genres = genreEntities;
        artist.name = this.name;
        artist.active = this.active;
        artist.memberCount = this.memberCount;
        artist.soloPerformer = this.soloPerformer;
        artist.urlRYM = this.urlRYM;
        artist.listCountRYM = this.listCountRYM;
        artist.discographyCountRYM = this.discographyCountRYM;
        artist.showCountRYM = this.showCountRYM;

        artist = await entityManager.save(artist);
        this.databaseID = artist.id;
        return artist;
    }

    /**
     * FORMATTING/PRINTING METHODS
     * used for reporting
     */
    public printSuccess(): void {
        if(this.dataReadFromDB) {
            Log.success(`Found Artist ${this.name} in database\nID: ${this.databaseID}`);
        } else {
            Log.success(`Artist Scrape Successful: ${this.name}`);
        }
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
        Log.log(`Genre Count: ${this.genresRYM.length}`);
        Log.log(`RYM List Features: ${this.listCountRYM}`);
        Log.log(`Discography Count: ${this.discographyCountRYM}`);
        Log.log(`Live Shows: ${this.showCountRYM}`);
    }
}
