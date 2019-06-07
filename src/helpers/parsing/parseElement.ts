import { AllHtmlEntities } from 'html-entities';
import { JSDOM } from 'jsdom';

import {
    isNullOrUndef,
    stringToNum,
} from '../functions/typeManips';
import { ParseList } from './parseList';

export class ParseElement {
    public readonly raw: HTMLElement;

    public description = 'HTML Element';

    public strict: boolean;

    public entities = new AllHtmlEntities();

    public constructor(
        element: HTMLElement,
        description = 'element',
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
        this.entities = new AllHtmlEntities();
        this.description = description;
        this.strict = strict;
    }

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

    public text(
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
        const innerText = this.text(strict);
        return stringToNum(innerText, strict, defaultNum);
    }
}
