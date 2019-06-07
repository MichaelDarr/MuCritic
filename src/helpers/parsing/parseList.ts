import { isNullOrUndef } from '../functions/typeManips';
import { ParseElement } from './parseElement';

/**
 * ## See [[ParseElement]]
 */
export class ParseList {
    public description: string;

    /**
     * [```NodeList```](https://developer.mozilla.org/en-US/docs/Web/API/NodeList), set during
     * instance construction
     */
    public readonly raw: NodeListOf<Element>;

    /**
     * see [[ParseElement.strict]]
     */
    public strict: boolean;

    /**
     * @param strict see [[ParseElement.strict]]
     */
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

    /**
     * Finds *index*th element of this list using
     * [```.item(itemIndex)```](https://developer.mozilla.org/en-US/docs/Web/API/NodeList/item)
     *
     * @param index position of element in list, 0-indexed
     * @param strict see [[ParseElement.strict]]
     */
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

    /**
     * @param strict see [[ParseElement.strict]]
     */
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
