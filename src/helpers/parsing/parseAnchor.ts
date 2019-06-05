import { isNullOrUndef } from '../functions/index';
import { ParseElement } from './index';

export class ParseAnchor extends ParseElement {
    public readonly rawAnchor: HTMLAnchorElement;

    public constructor(
        element: HTMLAnchorElement,
        description = 'Anchor Element',
        strict = false,
    ) {
        super(element, description, strict);
        this.rawAnchor = (this.raw as HTMLAnchorElement);
    }

    public href(
        strict = this.strict,
        defaultVal = '',
    ): string {
        const { href } = this.rawAnchor;
        if(isNullOrUndef(
            href,
            strict,
            `No href found for element: ${this.description}`,
        )) return defaultVal;
        return href;
    }
}
