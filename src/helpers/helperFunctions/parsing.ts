import { AllHtmlEntities } from 'html-entities';

export function falseyWithStrict(
    content: HTMLElement | Element | NodeListOf<Element> | string,
    strict: boolean,
    errorMessage: string,
): boolean {
    if(!content) {
        if(strict) throw new Error(errorMessage);
        return true;
    }
    return false;
}

export function extractInnerHtml(
    contextElement: HTMLElement,
    htmlQuery: string,
    strict = false,
    targetDescription: string = null,
    defaultVal = null,
): string {
    if(falseyWithStrict(contextElement, strict, `Tried to query falsey element: ${targetDescription}`)) {
        return defaultVal;
    }
    const innerElement = contextElement.querySelector(htmlQuery);
    if(falseyWithStrict(innerElement, strict, `Query selector found no element: ${targetDescription}`)) {
        return defaultVal;
    }
    const finalText = innerElement.innerHTML;
    if(falseyWithStrict(finalText, strict, `No HTML value for queried element: ${targetDescription}`)) {
        return defaultVal;
    }
    return finalText;
}

export function extractInnerHTMLFromGroupElement(
    contextElement: HTMLElement,
    htmlQuery: string,
    itemIndex = 0,
    strict = false,
    targetDescription: string = null,
    defaultVal = null,
): string {
    if(falseyWithStrict(contextElement, strict, `Tried to query falsey element: ${targetDescription}`)) {
        return defaultVal;
    }
    const innerElementList = contextElement.querySelectorAll(htmlQuery);
    if(falseyWithStrict(innerElementList, strict, `Query selector all found no element: ${targetDescription}`)) {
        return defaultVal;
    }
    const finalElement = innerElementList.item(itemIndex);
    if(falseyWithStrict(finalElement, strict, `Requested an inaccessable index from query selector all: ${targetDescription}`)) {
        return defaultVal;
    }
    const finalText = finalElement.innerHTML;
    if(falseyWithStrict(finalText, strict, `No HTML value for queried element: ${targetDescription}`)) {
        return defaultVal;
    }
    return finalText;
}

export function extractHrefLink(
    contextElement: HTMLElement,
    htmlQuery: string,
    strict = true,
    targetDescription: string = null,
    defaultVal = null,
): string {
    if(falseyWithStrict(contextElement, strict, `Tried to get href link of falsey element: ${targetDescription}`)) {
        return defaultVal;
    }
    const innerElement = contextElement.querySelector(htmlQuery);
    if(falseyWithStrict(innerElement, strict, `Href query selector found no element: ${targetDescription}`)) {
        return defaultVal;
    }
    const finalLink = encodeURI((innerElement as any).href);
    if(falseyWithStrict(finalLink, strict, `Link element href was falsey: ${targetDescription}`)) {
        return defaultVal;
    }
    return finalLink;
}

/**
 * Simple method to separate and number-ify a combined number-header element on a page
 *
 * @param combined string with "number header" format, ie: "4,132 Lists"
 */
export function extractHeaderNumberPair(
    contextElement: HTMLElement,
    htmlQuery: string,
    strict = false,
    targetDescription: string = null,
    defaultNum = 0,
): number {
    let finalNum: number = defaultNum;
    let infoPairText = extractInnerHtml(
        contextElement,
        htmlQuery,
        strict,
        targetDescription,
    );
    if(!infoPairText) {
        if(strict) {
            throw new Error(`Unable to extract inner html for info pair: ${targetDescription}`);
        }
        return finalNum;
    }

    infoPairText = infoPairText.trim();
    const separatedVals: string[] = infoPairText.split(' ');
    finalNum = Number(separatedVals.shift().replace(/,/g, ''));
    if(Number.isNaN(finalNum)) {
        return defaultNum;
    }
    return finalNum;
}

export function extractInnerHtmlOfGroup(
    contextElement: HTMLElement,
    htmlQuery: string,
    strict = false,
    targetDescription: string = null,
    defaultElementString: string = null,
): string[] {
    const finalResult: string[] = [];
    const elementGroup = contextElement.querySelectorAll(htmlQuery);
    if(falseyWithStrict(elementGroup, strict, `Unable to retrieve element group: ${targetDescription}`)) {
        return finalResult;
    }
    elementGroup.forEach((element): void => {
        const elementText = element.innerHTML;
        if(!elementText && defaultElementString) {
            finalResult.push(defaultElementString);
        } else if(elementText) {
            finalResult.push(elementText);
        }
    });
    return finalResult;
}

/**
 * Extract current band info from a string
 *
 * @param current band info string. ex:
 * Kevin Shields (guitar, vocals, sampler), Colm O'Ciosoig (drums, sampler, 1983-95, 2007-pr...
 */
export function getMemberCountFromRawString(members: string, defaultVal = 1): number {
    if(members === null || members === '' || members === undefined) {
        return defaultVal;
    }
    const membersStripped: string = members.replace(/ *\([^)]*\) */g, '');
    const memberArray: string[] = membersStripped.split(', ');
    return memberArray.length;
}

export function decodeHtmlText(rawText: string): string {
    const entities = new AllHtmlEntities();
    const newText = rawText.trim();
    return entities.decode(newText);
}

export function encodeHtmlText(rawText: string): string {
    const entities = new AllHtmlEntities();
    const newText = rawText.trim();
    return entities.encode(newText);
}
