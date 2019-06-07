/**
 * Text parsing methods specific to the rate-your-music parsing project
 */

import { stringToNum } from '../functions/typeManips';

/**
 * Extract number a combined number-header string
 *
 * @param pairText Example: ```Discography 12```
 * @param strict see [[ParseElement.strict]]
 * @returns Example: ```12```
 */
export function extractCountFromPair(
    pairText: string,
    strict = false,
    defaultNum = 0,
): number {
    if(pairText == null || pairText === '') {
        if(strict) throw new Error('tried to get count from empty string');
        return defaultNum;
    }
    const separatedVals: string[] = pairText.split(' ');
    const rawStringNum = separatedVals.shift();
    const finalNum = stringToNum(
        rawStringNum,
        strict,
        defaultNum,
    );
    return finalNum;
}

/**
 * Extract the number of band members from a string scraped from Rate Your Music
 *
 * @param members Example:
 * ```Kevin Shields (guitar, vocals, sampler), Colm O'Ciosoig (drums, sampler, 1983-95, 2007-...```
 */
export function extractMemberCountFromString(members: string, defaultVal = 1): number {
    if(members == null || members === '') {
        return defaultVal;
    }
    const membersStripped: string = members.replace(/ *\([^)]*\) */g, '');
    const memberArray: string[] = membersStripped.split(', ');
    return memberArray.length;
}
