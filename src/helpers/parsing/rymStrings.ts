/**
 * Text parsing methods specific to the rate-your-music parsing project
 */

import { stringToNum } from '../functions/typeManips';

/**
 * Simple method to separate and number-ify a combined number-header element on a page
 * For example, the element could contain: ```Discography 12``` and we want to extract ```12```
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
 * Extract current band info from a string, such as:
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
