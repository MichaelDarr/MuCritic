import { AllHtmlEntities } from 'html-entities';

export function decodeHtmlText(rawText: string): string {
    const entities = new AllHtmlEntities();
    const newText = rawText.trim();
    return entities.decode(newText);
}

export function encodeHtmlText(rawText: string): string {
    const entities = new AllHtmlEntities();
    const newText = rawText.trim();
    return entities.encode(newText);
}
