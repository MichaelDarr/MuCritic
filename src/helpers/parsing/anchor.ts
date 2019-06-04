import { isNullOrUndef } from '../functions/index';
import { generateBlankElement } from './index';

export function generateBlankAnchorElement(): HTMLAnchorElement {
    const blankElement = generateBlankElement();
    return (blankElement as HTMLAnchorElement);
}

export function extractAnchorElementFromElement(
    contextElement: HTMLElement,
    htmlQuery: string,
    strict = false,
    targetDescription: string = null,
    defaultVal: HTMLAnchorElement = generateBlankAnchorElement(),
): HTMLAnchorElement {
    if(isNullOrUndef(
        contextElement,
        strict,
        `Tried to query inside nonexistant element: ${targetDescription}`,
    )) return defaultVal;

    const innerAnchorElement: HTMLAnchorElement = contextElement.querySelector(htmlQuery);
    if(isNullOrUndef(
        innerAnchorElement,
        strict,
        `Nested anchor element not found: ${targetDescription}`,
    )) return defaultVal;

    return innerAnchorElement;
}

export function extractLinkFromAnchorElement(
    contextElement: HTMLAnchorElement,
    strict = true,
    targetDescription: string = null,
    defaultVal = '',
): string {
    if(isNullOrUndef(
        contextElement,
        strict,
        `Tried to get href of nonexistant anchor element: ${targetDescription}`,
    )) return defaultVal;

    const hrefLink = contextElement.href;
    if(isNullOrUndef(
        hrefLink,
        strict,
        `No link found on anchor element: ${targetDescription}`,
    )) return defaultVal;

    return hrefLink;
}

export function extractLinkFromElement(
    contextElement: HTMLElement,
    strict = true,
    targetDescription: string = null,
    defaultVal = '',
): string {
    if(isNullOrUndef(
        contextElement,
        strict,
        `Tried to get href of nonexistant element: ${targetDescription}`,
    )) return defaultVal;

    const hrefLink = (contextElement as HTMLAnchorElement).href;
    if(isNullOrUndef(
        hrefLink,
        strict,
        `Href property not found on element: ${targetDescription}`,
    )) return defaultVal;

    return hrefLink;
}

export function extractLinkOfAnchorElementFromElement(
    contextElement: HTMLElement,
    htmlQuery: string,
    strict = false,
    targetDescription: string = null,
    defaultVal = '',
): string {
    const innerElement = extractAnchorElementFromElement(
        contextElement,
        htmlQuery,
        strict,
        targetDescription,
    );
    const innerText = extractLinkFromAnchorElement(
        innerElement,
        strict,
        targetDescription,
        defaultVal,
    );
    return innerText;
}
