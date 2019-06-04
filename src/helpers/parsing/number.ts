import {
    extractElementFromElement,
    extractInnerHtmlFromElement,
} from './index';
import {
    stringToNum,
} from '../functions/index';

export function extractNumberFromElement(
    contextElement: HTMLElement,
    strict = false,
    targetDescription: string = null,
    defaultNum: number = 0,
): number {
    const innerText = extractInnerHtmlFromElement(
        contextElement,
        strict,
        targetDescription,
        null,
        true,
    );
    const innerNum = stringToNum(
        innerText,
        strict,
        defaultNum,
    );
    return innerNum;
}

export function extractNumberOfElementFromElement(
    contextElement: HTMLElement,
    htmlQuery: string,
    strict = false,
    targetDescription: string = null,
    defaultNum: number = 0,
): number {
    const innerElement = extractElementFromElement(
        contextElement,
        htmlQuery,
        strict,
        targetDescription,
    );
    const innerNum = extractNumberFromElement(
        innerElement,
        strict,
        targetDescription,
        defaultNum,
    );
    return innerNum;
}
