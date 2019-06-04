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
