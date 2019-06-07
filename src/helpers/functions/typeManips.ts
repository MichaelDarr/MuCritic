/**
 * Conditional error throwing on null/undefined generic content - used heavily by [[ParseElement]]
 *
 * @strict if 'errorMessage' should be thrown, should 'content' be null/undefined
 */
export function isNullOrUndef<T>(
    content: T,
    strict: boolean,
    errorMessage: string,
): boolean {
    if(content == null) {
        if(strict) throw new Error(errorMessage);
        return true;
    }
    return false;
}

/**
 * @strict if an error should be thrown upon unsuccessful conversion
 * @defaultNum return value upon conversion failure, when strict = false
 */
export function stringToNum(
    toConvert: string,
    strict = false,
    defaultNum = 0,
): number {
    if(isNullOrUndef(
        toConvert,
        strict,
        'method stringToNum tried to convert null/undefined to number using force=true',
    )) {
        return defaultNum;
    }
    const noCommas = toConvert.replace(/,/g, '');
    const finalNum = Number(noCommas);
    if(Number.isNaN(finalNum)) {
        if(strict) {
            throw new TypeError(
                'method stringToNum failed string to number conversion using force=true',
            );
        }
        return defaultNum;
    }
    return finalNum;
}
