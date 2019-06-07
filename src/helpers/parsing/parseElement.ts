import { AllHtmlEntities } from 'html-entities';
import { JSDOM } from 'jsdom';

import {
    isNullOrUndef,
    stringToNum,
} from '../functions/typeManips';
import { ParseList } from './parseList';

/**
 * Together, [[ParseElement]] and [[ParseList]] are a powerful DOM querying tool.
 *
 * Their class architecture is implemented to encourage method chaining, stringing together class
 * methods to describe complex queries from the DOM. Each class method returns either a final query
 * result (such as [[ParseElement.innerHTML]]) or a new instance of [[ParseElement]] or
 * [[ParseList]] (such as [[ParseElement.element]]). See [usage](#usage) for examples.
 *
 * Internally, this class stores any element as an HTMLElement in [[ParseElement.raw]]. Entities
 * returned by methods such as
 * [```querySelector(someDomString)```](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector)
 * are typed as [Element](https://developer.mozilla.org/en-US/docs/Web/API/Element), even if they
 * actually contain the properties of some more descriptive class such as
 * [HTMLAnchorElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAnchorElement). In the
 * future, I may to try to infer types through the requested
 * [DOMString](https://developer.mozilla.org/en-US/docs/Web/API/DOMString). Until then,
 * [[ParseElement.prop]] and [[ParseElement.propAsNum]] are leveraged to access any
 * [Element](https://developer.mozilla.org/en-US/docs/Web/API/Element) properties not explicitly
 * accessable through class methods.
 *
 * ## Usage
 *
 * ### Initialization (for all other examples)
 * ```typescript
 * // create a new ParseElement from existing DOM element containing data to be scraped
 *  const page = new ParseElement(scrapedPageElement, 'some page');
 * ```
 *
 * ### Example 1: Extract a number from an element, defaulting to 0
 * ```typescript
 * extractedNumber = page
 *     .element('.inner > p.num') // inherits parseElement.strict = false
 *     .number(); // inherits strict, returns 0 if a number cannot be extracted
 * ```
 *
 * ### Example 2: Extract link from element, throwing an error if not found
 * ```typescript
 * extractedLink = page
 *     .element('.inner > a.link', 'some link', true) // overrides parseElement.strict = false
 *     .href(); // inherits strict, throws error if link not found
 * ```
 *
 * Here, if ```.inner > a.link``` cannot be found, an error will be thrown:
 *
 * ```Cannot find element: some page > some link```.
 *
 * If the element is found, but has no ```href``` value, this error will be thrown:
 *
 * ```No href found for element: scrape of some page > some link```
 *
 * ### Example 3: Extract the name of the second artist in a list (uses [[ParseList]]):
 * ```typescript
 * const secondArtistInList = page
 *     .element('div.music-element', 'some container', true)
 *     .list('div.artist-blocks', 'artist elements')
 *     .element(1, 'second artist')
 *     .element('p.artist-name', 'artist name')
 *     .text();
 * ```
 *
 * If the second artist block is found, but not the nested *'p.artist-name'*, an error is thrown:
 *
 * ```Cannot find element: some page > some container > artist elements > second artist```
 */
export class ParseElement {
    public description = 'HTML Element';

    /**
     * Decodes HTML character entities
     */
    public readonly entities = new AllHtmlEntities();

    /**
     * [```HTMLElement```](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement), set
     * during instance construction
     */
    public readonly raw: HTMLElement;

    /**
     * - **true**: method failures result in thrown errors instead proceeding
     * - **false**: method failures return empty (*not null*) elements or default values. Allows
     * method chaining to continue indefinitely
     */
    public readonly strict: boolean;

    /**
     * @param strict see [[ParseElement.strict]]
     */
    public constructor(
        element: Element,
        description = 'element',
        strict = false,
    ) {
        if(isNullOrUndef(
            element,
            strict,
            `Cannot find element: ${description}`,
        )) {
            const { body } = (new JSDOM('')).window.document;
            this.raw = body;
        } else {
            this.raw = element as HTMLElement;
        }
        this.entities = new AllHtmlEntities();
        this.description = description;
        this.strict = strict;
    }

    /**
     * Finds a nested element using
     * [```.querySelector(someDomString)```](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector)
     *
     * @param htmlQuery a valid [```DOMString```](https://developer.mozilla.org/en-US/docs/Web/API/DOMString)
     * @param strict see [[ParseElement.strict]]
     */
    public element(
        htmlQuery: string,
        targetDescription = 'element',
        strict = this.strict,
    ): ParseElement {
        const innerElement: HTMLElement = this.raw.querySelector(htmlQuery);
        const newDescription = `${this.description} > ${targetDescription}`;
        return new ParseElement(
            innerElement,
            newDescription,
            strict,
        );
    }

    /**
     * See [```HyperlinkElementUtils.href```](https://developer.mozilla.org/en-US/docs/Web/API/HTMLHyperlinkElementUtils/href)
     *
     * @param strict see [[ParseElement.strict]]
     */
    public href(
        strict = this.strict,
        defaultVal = '',
    ): string {
        const elementAsLink = this.raw as HTMLAnchorElement;
        const { href } = elementAsLink;
        if(isNullOrUndef(
            href,
            strict,
            `No href found for element: ${this.description}`,
        )) return defaultVal;
        return href;
    }

    /**
     * See [```Element.innerHTML```](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML)
     *
     * @param strict see [[ParseElement.strict]]
     */
    public innerHTML(
        strict = this.strict,
        defaultVal = '',
        decode = false,
    ): string {
        const { innerHTML } = this.raw;
        if(isNullOrUndef(
            innerHTML,
            strict,
            `No inner HTML found for element: ${this.description}`,
        )) return defaultVal;
        if(decode) return this.entities.decode(innerHTML);
        return innerHTML;
    }

    /**
     * See [```HTMLElement.innerText```](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/innerText)
     *
     * @param strict see [[ParseElement.strict]]
     * @param trim trim whitespace from either end of return string
     * @param decode convert HTML character entities to UTF
     */
    public innerText(
        strict = this.strict,
        defaultVal = '',
        trim = true,
        decode = false,
    ): string {
        let { innerText } = this.raw;
        if(isNullOrUndef(
            innerText,
            strict,
            `No inner text found for element: ${this.description}`,
        )) return defaultVal;
        if(trim) innerText = innerText.trim();
        if(decode) innerText = this.entities.decode(innerText);
        return innerText;
    }

    /**
     * Finds a nested list of elements using
     * [```.querySelectorAll(someDomString)```](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll).
     *
     * @param htmlQuery a valid [```DOMString```](https://developer.mozilla.org/en-US/docs/Web/API/DOMString)
     * @param strict see [[ParseElement.strict]]
     */
    public list(
        htmlQuery: string,
        targetDescription = 'list',
        strict = this.strict,
    ): ParseList {
        const innerList = this.raw.querySelectorAll(htmlQuery);
        const newDescription = `${this.description} > ${targetDescription}`;
        return new ParseList(
            innerList,
            newDescription,
            strict,
        );
    }

    /**
     * @param strict see [[ParseElement.strict]]
     * @returns The text content of an element, converted to a number
     */
    public number(
        strict = this.strict,
        defaultNum = 0,
    ): number {
        const innerText = this.textContent(strict);
        return stringToNum(innerText, strict, defaultNum);
    }

    /**
     * Get the value of any property of the raw DOM entity stored in this class, such as the alt
     * text for an image element wrapped in [[ParseElement]]. Do not use for properties that have
     * already been explicitly implemented by [[ParseElement]].
     *
     * @param propName element property to retrieve, such as ```alt```.
     * @param strict see [[ParseElement.strict]]
     */
    public prop(
        propName: string,
        strict = this.strict,
        defaultVal = '',
    ): string {
        const propValue: string = this.raw[propName];
        if(isNullOrUndef(
            propValue,
            strict,
            `No property ${propName} found for element: ${this.description}`,
        )) return defaultVal;
        return propValue;
    }

    /**
     * Same as [[ParseElement.prop]], but attempts to parse the output to a number.
     *
     * @param propName numbic element property to retrieve, such as ```height```.
     * @param strict  see [[ParseElement.strict]]
     */
    public propAsNum(
        propName: string,
        strict = this.strict,
        defaultNum = 0,
    ): number {
        const propString: string = this.prop(propName, strict);
        return stringToNum(propString, strict, defaultNum);
    }

    /**
     * See [```Node.textContent```](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent)
     *
     * @param strict see [[ParseElement.strict]]
     * @param trim trim whitespace from either end of return string
     * @param decode convert HTML character entities to UTF
     */
    public textContent(
        strict = this.strict,
        defaultVal = '',
        trim = true,
        decode = false,
    ): string {
        let { textContent } = this.raw;
        if(isNullOrUndef(
            textContent,
            strict,
            `No inner text found for element: ${this.description}`,
        )) return defaultVal;
        if(trim) textContent = textContent.trim();
        if(decode) textContent = this.entities.decode(textContent);
        return textContent;
    }
}
