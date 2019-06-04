// external
import { JSDOM } from 'jsdom';

// internal
import { isNullOrUndef } from '../typeManips';

export function generateBlankElement(): HTMLElement {
    const { body } = (new JSDOM('')).window.document;
    return body;
}

export function generateBlankNodeList(): NodeListOf<HTMLElement> {
    const blankElement = generateBlankElement();
    return blankElement.querySelectorAll('.none');
}

export function extractElementFromElement(
    contextElement: HTMLElement,
    htmlQuery: string,
    strict = false,
    targetDescription: string = null,
    defaultVal: HTMLElement = generateBlankElement(),
): HTMLElement {
    if(isNullOrUndef(
        contextElement,
        strict,
        `Tried to query inside nonexistant element: ${targetDescription}`,
    )) return defaultVal;

    const innerElement: HTMLElement = contextElement.querySelector(htmlQuery);
    if(isNullOrUndef(
        innerElement,
        strict,
        `Nested element not found: ${targetDescription}`,
    )) return defaultVal;
    return innerElement;
}

export function extractInnerHtmlFromElement(
    contextElement: HTMLElement,
    strict = false,
    targetDescription: string = null,
    defaultVal: string = '',
    trim = true,
): string {
    if(isNullOrUndef(
        contextElement,
        strict,
        `Tried to get innerHTML of nonexistant element: ${targetDescription}`,
    )) return defaultVal;

    let innerText = contextElement.innerHTML;
    if(isNullOrUndef(
        innerText,
        strict,
        `No HTML value for queried element: ${targetDescription}`,
    )) return defaultVal;

    if(trim) {
        innerText = innerText.trim();
    }

    return innerText;
}

export function extractInnerHtmlOfElementFromElement(
    contextElement: HTMLElement,
    htmlQuery: string,
    strict = false,
    targetDescription: string = null,
    defaultVal: string = '',
    trim = true,
): string {
    const innerElement = extractElementFromElement(
        contextElement,
        htmlQuery,
        strict,
        targetDescription,
    );
    let innerText = extractInnerHtmlFromElement(
        innerElement,
        strict,
        targetDescription,
        defaultVal,
    );
    if(trim) {
        innerText = innerText.trim();
    }

    return innerText;
}
