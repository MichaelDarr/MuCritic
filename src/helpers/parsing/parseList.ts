import { isNullOrUndef } from '../functions/index';
import {
    ParseElement,
    ParseAnchor,
} from './index';

export class ParseList {
    public readonly raw: NodeListOf<Element>;

    public description: string;

    public strict: boolean;

    public constructor(
        listElement: NodeListOf<Element>,
        description = 'Node List',
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
        strict = this.strict,
        targetDescription = this.description,
    ): ParseElement {
        const innerElement = this.raw.item(index);
        return new ParseElement(
            innerElement as HTMLElement,
            targetDescription,
            strict,
        );
    }

    public allElements(
        strict = this.strict,
        targetDescription = this.description,
    ): ParseElement[] {
        const innerElements: ParseElement[] = [];
        this.raw.forEach((innerElement): void => {
            innerElements.push(new ParseElement(
                innerElement as HTMLElement,
                targetDescription,
                strict,
            ));
        });
        return innerElements;
    }

    public anchor(
        index = 0,
        strict = this.strict,
        targetDescription = this.description,
    ): ParseAnchor {
        const innerElement = this.raw.item(index);
        return new ParseAnchor(
            innerElement as HTMLAnchorElement,
            targetDescription,
            strict,
        );
    }

    public allAnchors(
        strict = this.strict,
        targetDescription = this.description,
    ): ParseAnchor[] {
        const innerElements: ParseAnchor[] = [];
        this.raw.forEach((innerElement): void => {
            innerElements.push(new ParseAnchor(
                innerElement as HTMLAnchorElement,
                targetDescription,
                strict,
            ));
        });
        return innerElements;
    }
}
