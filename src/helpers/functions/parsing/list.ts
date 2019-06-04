import {
    extractInnerHtmlFromElement,
    generateBlankNodeList,
    generateBlankElement,
} from './base';
import { isNullOrUndef } from '../typeManips';

export function extractListFromElement(
    contextElement: HTMLElement,
    htmlQuery: string,
    strict = false,
    targetDescription: string = null,
    defaultVal: NodeListOf<HTMLElement> = generateBlankNodeList(),
): NodeListOf<HTMLElement> {
    if(isNullOrUndef(
        contextElement,
        strict,
        `Tried to query on nonexistant element: ${targetDescription}`,
    )) return defaultVal;

    const innerElementList: NodeListOf<HTMLElement> = contextElement.querySelectorAll(htmlQuery);
    if(isNullOrUndef(
        innerElementList,
        strict,
        `Nested element not found: ${targetDescription}`,
    )) return defaultVal;
    return innerElementList;
}

export function extractElementFromList(
    nodeList: NodeListOf<HTMLElement>,
    itemIndex = 0,
    strict = false,
    targetDescription: string = null,
    defaultVal: HTMLElement = generateBlankElement(),
): HTMLElement {
    if(isNullOrUndef(
        nodeList,
        strict,
        `Requested element from nonexistant node list: ${targetDescription}`,
    )) return defaultVal;

    const finalElement = nodeList.item(itemIndex);
    if(isNullOrUndef(
        finalElement,
        strict,
        `Requested an inaccessable index from query selector all: ${targetDescription}`,
    )) return defaultVal;

    return finalElement;
}

export function extractElementOfListFromElement(
    contextElement: HTMLElement,
    htmlQuery: string,
    itemIndex = 0,
    strict = false,
    targetDescription: string = null,
    defaultVal: HTMLElement = generateBlankElement(),
): HTMLElement {
    const innerNodeList = extractListFromElement(
        contextElement,
        htmlQuery,
        strict,
        targetDescription,
    );
    const innerElement = extractElementFromList(
        innerNodeList,
        itemIndex,
        strict,
        targetDescription,
        defaultVal,
    );
    return innerElement;
}

export function extractInnerHtmlOfElementFromList(
    contextElement: NodeListOf<HTMLElement>,
    itemIndex = 0,
    strict = false,
    targetDescription: string = null,
    defaultVal: string = '',
    trim = true,
): string {
    const innerElement = extractElementFromList(
        contextElement,
        itemIndex,
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

export function extractInnerHtmlOfElementOfListFromElement(
    contextElement: HTMLElement,
    htmlQuery: string,
    itemIndex = 0,
    strict = false,
    targetDescription: string = null,
    defaultVal: string = '',
    trim = true,
): string {
    const innerNodeList = extractListFromElement(
        contextElement,
        htmlQuery,
        strict,
        targetDescription,
    );
    const innerText = extractInnerHtmlOfElementFromList(
        innerNodeList,
        itemIndex,
        strict,
        targetDescription,
        defaultVal,
        trim,
    );

    return innerText;
}

export function extractAllElementsFromList(
    contextElement: NodeListOf<HTMLElement>,
    strict = false,
    targetDescription: string = null,
): HTMLElement[] {
    const results: HTMLElement[] = [];
    contextElement.forEach((innerElement: HTMLElement): void => {
        if(!isNullOrUndef(
            innerElement,
            strict,
            `found a null element in node list: ${targetDescription}`,
        )) results.push(innerElement);
    });

    return results;
}

export function extractInnerHtmlOfAllElementsFromList(
    contextElement: NodeListOf<HTMLElement>,
    strict = false,
    targetDescription: string = null,
    defaultVal: string = '',
    trim = true,
    insertEmpty = false,
    insertNull = false,
): string[] {
    const results: string[] = [];
    contextElement.forEach((innerElement: HTMLElement): void => {
        const innerText = extractInnerHtmlFromElement(
            innerElement,
            strict,
            targetDescription,
            defaultVal,
            trim,
        );
        if(innerText === '') {
            if(insertEmpty) results.push(innerText);
        } else if(innerText == null) {
            if(insertNull) results.push(null);
        } else {
            results.push(null);
        }
    });

    return results;
}

export function extractInnerHtmlOfAllElementsOfListFromElement(
    contextElement: HTMLElement,
    htmlQuery: string,
    strict = false,
    targetDescription: string = null,
    defaultVal: string = '',
    trim = true,
    insertEmpty = false,
    insertNull = false,
): string[] {
    const innerNodeList = extractListFromElement(
        contextElement,
        htmlQuery,
        strict,
        targetDescription,
    );

    const innerHtmlOfAll = extractInnerHtmlOfAllElementsFromList(
        innerNodeList,
        strict,
        targetDescription,
        defaultVal,
        trim,
        insertEmpty,
        insertNull,
    );

    return innerHtmlOfAll;
}
