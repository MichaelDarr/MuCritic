/**
 * Spotify API types/interfaces, WIP
 * See https://developer.spotify.com/documentation/web-api/reference/object-model/
 */

export interface ClientCredentials {
    id: string;
    secret: string;
}

export type RequestMethod =
    | 'GET'
    | 'POST';

export type SearchType =
    | 'album'
    | 'artist'
    | 'playlist'
    | 'track';

export type AlbumType =
    | 'album'
    | 'single'
    | 'compilation';

/**
 * album_group: "The field is present when getting an artist’s albums."
 */
export type AlbumGroup =
    | 'album'
    | 'single'
    | 'compilation'
    | 'appears_on';

/**
 * see https://developer.spotify.com/documentation/web-api/#spotify-uris-and-ids
 */
export type SpotifyUrl = string;

/**
 * see https://developer.spotify.com/documentation/web-api/#spotify-uris-and-ids
 */
export type SpotifyUri = string;

/**
 * A link to a Web API endpoint
 *
 * @typeparam T the resource targeted by an endpoint
 */
export type SpotifyApiLink<T> = string;

/**
 * A URL to a 30 second preview (MP3 format) of a track
 */
export type PreviewUrl = string;

/**
 * The date the album was first released, for example ```1981```. Depending on the precision, it
 * might be shown as ```1981-12``` or ```1981-12-15```.
 */
export type ReleaseDate = string;

/**
 * The precision with which [[ReleaseDate]] value is known: ```year```, ```month``` , or ```day```.
 */
export type ReleaseDatePrecision =
    | 'year'
    | 'month'
    | 'day';

/**
 * between 0 and 100, with 100 being the most popular
 */
export type Popularity = number;

export interface ExternalUrls {
    spotify: SpotifyUrl;
    [prop: string]: string;
}

export interface ExternalIds {
    isrc?: string;
    ean?: number;
    upc?: number;
}

/**
 * href: "Please note that this will always be set to null, as the Web API does not support it at
 * the moment."
 * https://developer.spotify.com/documentation/web-api/reference/object-model/#followers-object
 */
export interface Followers {
    href: null;
    total: string;
}

/**
 * Part of the response when Track Relinking is applied, the original track is not available in the
 * given market, and Spotify did not have any tracks to relink it with. The track response will
 * still contain metadata for the original track, and a restrictions object containing the reason
 * why the track is not available: "restrictions" : {"reason" : "market"}
 */
export interface Restrictions {
    reason: 'market';
}

export interface Copyright {
    text: string;
    type: 'C' | 'P';
}

export interface Paging<T> {
    href: string;
    items: T[];
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
}

/**
 * Part of the response when Track Relinking is applied and is only part of the response if the
 * track linking, in fact, exists. The requested track has been replaced with a different track.
 * The track in the linked_from object contains information about the originally requested track.
 */
export interface TrackLink {
    external_urls: ExternalUrls;
    href: SpotifyApiLink<Track>;
    id: number;
    type: 'track';
    uri: SpotifyUri;
}

export interface Image {
    height: number;
    url: string;
    width: number;
}

export interface ArtistSimplified {
    external_urls: ExternalUrls;
    href: SpotifyApiLink<Artist>;
    id: string;
    name: string;
    type: 'artist';
    uri: SpotifyUri;
}

export interface Artist extends ArtistSimplified{
    followers: Followers;
    genres: string[];
    images: Image[];
    name: string;
    popularity: Popularity;
}

export interface AlbumSimplified {
    album_group?: AlbumGroup;
    album_type: AlbumType;
    artists: ArtistSimplified[];
    available_markets: CountryCode[];
    external_urls: ExternalUrls;
    href: SpotifyApiLink<Album>;
    id: string;
    images: Image[];
    name: string;
    release_date: ReleaseDate;
    release_date_precision: ReleaseDatePrecision;
    restrictions?: Restrictions;
    type: 'album';
    uri: SpotifyUri;
}

export interface Album extends AlbumSimplified {
    album_group: never;
    available_markets: CountryCode[];
    copyrights: Copyright[];
    external_ids: ExternalIds;
    genres: string[];
    label: string;
    popularity: Popularity;
    tracks: Paging<TrackSimplified>;
}

export interface TrackSimplified {
    artists: ArtistSimplified[];
    available_markets: CountryCode[];
    disc_number: number;
    duration_ms: number;
    explicit: boolean;
    external_urls: ExternalUrls;
    href: SpotifyApiLink<Track>;
    id: number;
    is_playable: boolean;
    linked_from?: TrackLink;
    restrictions?: Restrictions;
    name: string;
    preview_url: PreviewUrl;
    track_number: number;
    type: 'track';
    uri: SpotifyUri;
    is_local: boolean;
}

export interface Track extends TrackSimplified {
    album: AlbumSimplified;
    external_ids: ExternalIds;
    popularity: Popularity;
}

export interface AlbumArtistPairSimplified {
    album: AlbumSimplified;
    artist: ArtistSimplified;
}

export type AlbumBatch = Album[];

export type ArtistBatch = Artist[];

export interface AlbumBatchResponse {
    albums: AlbumBatch;
}

export interface ArtistBatchResponse {
    artists: ArtistBatch;
}

export interface GenreSeedsResponse {
    genres: string[];
}

export interface AlbumSearchResponse {
    albums: Paging<AlbumSimplified>;
}

export interface ArtistSearchResponse {
    artists: Paging<Artist>;
}

export type SearchResponse =
    | AlbumSearchResponse
    | ArtistSearchResponse;

export type BatchResponse =
    | AlbumBatchResponse
    | ArtistBatchResponse;

export type InnerBatchResponse =
    | Album[]
    | Artist[];

export type Response =
    | BatchResponse
    | GenreSeedsResponse
    | SearchResponse;


// Aquired from https://gist.github.com/evolkmann/740d24889c509c08484a8ff72af5dd64
export enum CountryCode {
    AF = 'Afghanistan',
    AX = 'AlandIslands',
    AL = 'Albania',
    DZ = 'Algeria',
    AS = 'American Samoa',
    AD = 'Andorra',
    AO = 'Angola',
    AI = 'Anguilla',
    AQ = 'Antarctica',
    AG = 'Antigua and Barbuda',
    AR = 'Argentina',
    AM = 'Armenia',
    AW = 'Aruba',
    AU = 'Australia',
    AT = 'Austria',
    AZ = 'Azerbaijan',
    BS = 'Bahamas',
    BH = 'Bahrain',
    BD = 'Bangladesh',
    BB = 'Barbados',
    BY = 'Belarus',
    BE = 'Belgium',
    BZ = 'Belize',
    BJ = 'Benin',
    BM = 'Bermuda',
    BT = 'Bhutan',
    BO = 'Bolivia',
    BA = 'Bosnia and Herzegovina',
    BW = 'Botswana',
    BV = 'Bouvet Island',
    BR = 'Brazil',
    IO = 'British Indian Ocean Territory',
    BN = 'Brunei Darussalam',
    BG = 'Bulgaria',
    BF = 'Burkina Faso',
    BI = 'Burundi',
    KH = 'Cambodia',
    CM = 'Cameroon',
    CA = 'Canada',
    CV = 'Cape Verde',
    KY = 'Cayman Islands',
    CF = 'Central African Republic',
    TD = 'Chad',
    CL = 'Chile',
    CN = 'China',
    CX = 'Christmas Island',
    CC = 'Cocos Keeling Islands',
    CO = 'Colombia',
    KM = 'Comoros',
    CG = 'Congo',
    CD = 'Congo Democratic Republic',
    CK = 'Cook Islands',
    CR = 'Costa Rica',
    CI = 'CoteDIvoire',
    HR = 'Croatia',
    CU = 'Cuba',
    CY = 'Cyprus',
    CZ = 'CzechRepublic',
    DK = 'Denmark',
    DJ = 'Djibouti',
    DM = 'Dominica',
    DO = 'Dominican Republic',
    EC = 'Ecuador',
    EG = 'Egypt',
    SV = 'El Salvador',
    GQ = 'Equatorial Guinea',
    ER = 'Eritrea',
    EE = 'Estonia',
    ET = 'Ethiopia',
    FK = 'Falkland Islands',
    FO = 'Faroe Islands',
    FJ = 'Fiji',
    FI = 'Finland',
    FR = 'France',
    GF = 'French Guiana',
    PF = 'French Polynesia',
    TF = 'French Southern Territories',
    GA = 'Gabon',
    GM = 'Gambia',
    GE = 'Georgia',
    DE = 'Germany',
    GH = 'Ghana',
    GI = 'Gibraltar',
    GR = 'Greece',
    GL = 'Greenland',
    GD = 'Grenada',
    GP = 'Guadeloupe',
    GU = 'Guam',
    GT = 'Guatemala',
    GG = 'Guernsey',
    GN = 'Guinea',
    GW = 'Guinea Bissau',
    GY = 'Guyana',
    HT = 'Haiti',
    HM = 'Heard Island Mcdonald Islands',
    VA = 'Holy See Vatican City State',
    HN = 'Honduras',
    HK = 'HongKong',
    HU = 'Hungary',
    IS = 'Iceland',
    IN = 'India',
    ID = 'Indonesia',
    IR = 'Iran',
    IQ = 'Iraq',
    IE = 'Ireland',
    IM = 'Isle Of Man',
    IL = 'Israel',
    IT = 'Italy',
    JM = 'Jamaica',
    JP = 'Japan',
    JE = 'Jersey',
    JO = 'Jordan',
    KZ = 'Kazakhstan',
    KE = 'Kenya',
    KI = 'Kiribati',
    KR = 'Korea',
    KW = 'Kuwait',
    KG = 'Kyrgyzstan',
    LA = 'Lao Peoples Democratic Republic',
    LV = 'Latvia',
    LB = 'Lebanon',
    LS = 'Lesotho',
    LR = 'Liberia',
    LY = 'Libyan Arab Jamahiriya',
    LI = 'Liechtenstein',
    LT = 'Lithuania',
    LU = 'Luxembourg',
    MO = 'Macao',
    MK = 'Macedonia',
    MG = 'Madagascar',
    MW = 'Malawi',
    MY = 'Malaysia',
    MV = 'Maldives',
    ML = 'Mali',
    MT = 'Malta',
    MH = 'Marshall Islands',
    MQ = 'Martinique',
    MR = 'Mauritania',
    MU = 'Mauritius',
    YT = 'Mayotte',
    MX = 'Mexico',
    FM = 'Micronesia',
    MD = 'Moldova',
    MC = 'Monaco',
    MN = 'Mongolia',
    ME = 'Montenegro',
    MS = 'Montserrat',
    MA = 'Morocco',
    MZ = 'Mozambique',
    MM = 'Myanmar',
    NA = 'Namibia',
    NR = 'Nauru',
    NP = 'Nepal',
    NL = 'Netherlands',
    AN = 'Netherlands Antilles',
    NC = 'New Caledonia',
    NZ = 'New Zealand',
    NI = 'Nicaragua',
    NE = 'Niger',
    NG = 'Nigeria',
    NU = 'Niue',
    NF = 'Norfolk Island',
    MP = 'Northern Mariana Islands',
    NO = 'Norway',
    OM = 'Oman',
    PK = 'Pakistan',
    PW = 'Palau',
    PS = 'Palestinian Territory',
    PA = 'Panama',
    PG = 'Papua New Guinea',
    PY = 'Paraguay',
    PE = 'Peru',
    PH = 'Philippines',
    PN = 'Pitcairn',
    PL = 'Poland',
    PT = 'Portugal',
    PR = 'Puerto Rico',
    QA = 'Qatar',
    RE = 'Reunion',
    RO = 'Romania',
    RU = 'Russian Federation',
    RW = 'Rwanda',
    BL = 'Saint Barthelemy',
    SH = 'Saint Helena',
    KN = 'Saint Kitts And Nevis',
    LC = 'Saint Lucia',
    MF = 'Saint Martin',
    PM = 'Saint Pierre And Miquelon',
    VC = 'Saint Vincent And Grenadines',
    WS = 'Samoa',
    SM = 'San Marino',
    ST = 'Sao Tome And Principe',
    SA = 'Saudi Arabia',
    SN = 'Senegal',
    RS = 'Serbia',
    SC = 'Seychelles',
    SL = 'Sierra Leone',
    SG = 'Singapore',
    SK = 'Slovakia',
    SI = 'Slovenia',
    SB = 'Solomon Islands',
    SO = 'Somalia',
    ZA = 'South Africa',
    GS = 'South Georgia And Sandwich Island',
    ES = 'Spain',
    LK = 'Sri Lanka',
    SD = 'Sudan',
    SR = 'Suriname',
    SJ = 'Svalbard And Jan Mayen',
    SZ = 'Swaziland',
    SE = 'Sweden',
    CH = 'Switzerland',
    SY = 'Syrian Arab Republic',
    TW = 'Taiwan',
    TJ = 'Tajikistan',
    TZ = 'Tanzania',
    TH = 'Thailand',
    TL = 'TimorLeste',
    TG = 'Togo',
    TK = 'Tokelau',
    TO = 'Tonga',
    TT = 'Trinidad And Tobago',
    TN = 'Tunisia',
    TR = 'Turkey',
    TM = 'Turkmenistan',
    TC = 'Turks And Caicos Islands',
    TV = 'Tuvalu',
    UG = 'Uganda',
    UA = 'Ukraine',
    AE = 'United Arab Emirates',
    GB = 'United Kingdom',
    US = 'United States',
    UM = 'United States Outlying Islands',
    UY = 'Uruguay',
    UZ = 'Uzbekistan',
    VU = 'Vanuatu',
    VE = 'Venezuela',
    VN = 'Vietnam',
    VG = 'Virgin Islands British',
    VI = 'Virgin Islands US',
    WF = 'Wallis And Futuna',
    EH = 'Western Sahara',
    YE = 'Yemen',
    ZM = 'Zambia',
    ZW = 'Zimbabw'
}
