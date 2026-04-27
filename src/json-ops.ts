function parseJson(input: string): unknown {
	return JSON.parse(input);
}

function stringifyPretty(value: unknown): string {
	return JSON.stringify(value, null, 4);
}

function stringifyCompact(value: unknown): string {
	return JSON.stringify(value);
}

function toUnicodeEscape(char: string): string {
	return `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`;
}

function sortObjectKeysRecursively(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(sortObjectKeysRecursively);
	}

	if (value === null || typeof value !== 'object') {
		return value;
	}

	const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right));
	const sorted: Record<string, unknown> = {};

	for (const [key, child] of entries) {
		sorted[key] = sortObjectKeysRecursively(child);
	}

	return sorted;
}

export function prettify(input: string): string {
	return stringifyPretty(parseJson(input));
}

export function minify(input: string): string {
	return stringifyCompact(parseJson(input));
}

export function escape(input: string): string {
	return stripOuterQuotes(JSON.stringify(minify(input)));
}

export function unescape(input: string): string {
	const value = JSON.parse(wrapIfBareObject(input));

	if (typeof value !== 'string') {
		throw new Error('Unescaped value is not a string');
	}

	return value;
}

export function jsonToUnicode(input: string): string {
	return minify(input).replace(/[^\x00-\x7F]/g, toUnicodeEscape);
}

export function unicodeFromJson(input: string): string {
	return minify(input);
}

export function sortByKey(input: string): string {
	return stringifyPretty(sortObjectKeysRecursively(parseJson(input)));
}

export function isValidJson(input: string): boolean {
	try {
		parseJson(input);
		return true;
	} catch {
		return false;
	}
}

export function wrapIfBareObject(input: string): string {
	const isBareObject = input.startsWith('{') && input.endsWith('}');
	const isBareArray = input.startsWith('[') && input.endsWith(']');

	return isBareObject || isBareArray ? `"${input}"` : input;
}

export function stripOuterQuotes(input: string): string {
	if (input.length > 2 && input.startsWith('"') && input.endsWith('"')) {
		return input.slice(1, -1);
	}

	return input;
}
