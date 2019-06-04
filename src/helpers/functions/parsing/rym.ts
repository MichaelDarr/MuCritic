/**
 * Parsing methods specific to the rate-your-music parsing project
 */

import { extractInnerHtmlOfElementFromElement } from './base';
import { stringToNum } from '../typeManips';

/**
 * Simple method to separate and number-ify a combined number-header element on a page
 * For example, the element could contain: ```Discography 12``` and we want to extract ```12```
 */
export function extractNumberFromHeaderNumberPair(
    contextElement: HTMLElement,
    htmlQuery: string,
    strict = false,
    targetDescription: string = null,
    defaultNum = 0,
): number {
    const infoPairText = extractInnerHtmlOfElementFromElement(
        contextElement,
        htmlQuery,
        strict,
        targetDescription,
    );

    const separatedVals: string[] = infoPairText.split(' ');
    const rawStringNum = separatedVals.shift();

    const finalNum = stringToNum(
        rawStringNum,
        strict,
        defaultNum,
    );
    return finalNum;
}

/**
 * Extract current band info from a string, such as:
 * ```Kevin Shields (guitar, vocals, sampler), Colm O'Ciosoig (drums, sampler, 1983-95, 2007-...```
 */
export function getMemberCountFromRawString(members: string, defaultVal = 1): number {
    if(members == null || members === '') {
        return defaultVal;
    }
    const membersStripped: string = members.replace(/ *\([^)]*\) */g, '');
    const memberArray: string[] = membersStripped.split(', ');
    return memberArray.length;
}
