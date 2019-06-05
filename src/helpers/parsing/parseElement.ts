import { JSDOM } from 'jsdom';

import {
    isNullOrUndef,
    stringToNum,
} from '../functions/index';
import {
    decodeHtmlText,
    ParseAnchor,
    ParseList,
} from './index';

export class ParseElement {
    public readonly raw: HTMLElement;

    public description = 'HTML Element';

    public strict: boolean;

    public constructor(
        element: HTMLElement,
        description = 'html element',
        strict = false,
    ) {
        if(isNullOrUndef(
            element,
            strict,
            `tried to initialize an empty scraping element using strict: ${description}`,
        )) {
            const { body } = (new JSDOM('')).window.document;
            this.raw = body;
        } else {
            this.raw = element;
        }

        this.description = description;
        this.strict = strict;
    }

    public element(
        htmlQuery: string,
        targetDescription: string,
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

    public anchor(
        htmlQuery: string,
        targetDescription: string,
        strict = this.strict,
    ): ParseAnchor {
        const innerElement: HTMLAnchorElement = this.raw.querySelector(htmlQuery);
        const newDescription = `${this.description} > ${targetDescription}`;
        return new ParseAnchor(
            innerElement,
            newDescription,
            strict,
        );
    }

    public list(
        htmlQuery: string,
        targetDescription: string,
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
        if(decode) return decodeHtmlText(innerHTML);
        return innerHTML;
    }

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
        if(decode) innerText = decodeHtmlText(innerText);

        return innerText;
    }

    public title(
        strict = this.strict,
        defaultVal = '',
    ): string {
        const { title } = this.raw;
        if(isNullOrUndef(
            title,
            strict,
            `No title found for element: ${this.description}`,
        )) return defaultVal;
        return title;
    }

    public number(
        strict = this.strict,
        defaultNum = 0,
    ): number {
        const innerText = this.innerText(strict);
        return stringToNum(innerText, strict, defaultNum);
    }
}
