import { isNullOrUndef } from '../functions/typeManips';
import { ParseElement } from './parseElement';

export class ParseList {
    public readonly raw: NodeListOf<Element>;

    public description: string;

    public strict: boolean;

    public constructor(
        listElement: NodeListOf<Element>,
        description = 'list',
        strict = false,
    ) {
        isNullOrUndef(
            listElement,
            strict,
            `tried to initialize scrape list from null element using strict: ${description}`,
        );
        this.raw = listElement;
        this.description = description;
        this.strict = strict;
    }

    public element(
        index = 0,
        targetDescription = 'element',
        strict = this.strict,
    ): ParseElement {
        const innerElement = this.raw.item(index);
        const newDescription = `${this.description} > ${targetDescription}`;
        return new ParseElement(
            innerElement as HTMLElement,
            newDescription,
            strict,
        );
    }

    public allElements(
        targetDescription = 'element',
        strict = this.strict,
    ): ParseElement[] {
        const innerElements: ParseElement[] = [];
        const newDescription = `${this.description} > ${targetDescription}`;
        this.raw.forEach((innerElement): void => {
            innerElements.push(new ParseElement(
                innerElement as HTMLElement,
                newDescription,
                strict,
            ));
        });
        return innerElements;
    }
}
