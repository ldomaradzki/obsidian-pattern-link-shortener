import { LinkPattern } from './types';

/**
 * Decodes URL-encoded strings (e.g., "Hello+World" or "Hello%20World" -> "Hello World")
 */
export function decodeUrlString(str: string): string {
    try {
        // First replace + with space (common in URL paths for spaces)
        const withSpaces = str.replace(/\+/g, ' ');
        // Then decode any %XX encoded characters
        return decodeURIComponent(withSpaces);
    } catch {
        // If decoding fails, return original with just + replaced
        return str.replace(/\+/g, ' ');
    }
}

/**
 * Escapes a domain pattern for use in regex
 * Converts wildcards (*) to regex equivalent (.*)
 */
export function escapeDomainPattern(domain: string): string {
    return domain
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')  // Escape special regex chars
        .replace(/\*/g, '.*');                    // Convert wildcards
}

/**
 * Sanitizes user input for domain patterns
 * Allows alphanumeric, dots, asterisks, hyphens, and forward slashes
 */
export function sanitizeDomain(domain: string): string {
    return domain.replace(/[^a-zA-Z0-9.*\-\/]/g, '');
}

/**
 * Validates a regex pattern string
 * Returns null if valid, error message if invalid
 */
export function validateRegexPattern(pattern: string): string | null {
    if (!pattern || pattern.trim() === '') {
        return 'Pattern cannot be empty';
    }
    try {
        new RegExp(pattern);
        return null;
    } catch (e) {
        return e instanceof Error ? e.message : 'Invalid regex pattern';
    }
}

/**
 * Validates an output template
 * Checks for valid placeholder syntax
 */
export function validateOutputTemplate(template: string): string | null {
    if (!template || template.trim() === '') {
        return 'Template cannot be empty';
    }

    // Must contain ${url} or at least one capture group reference
    if (!template.includes('${url}') && !/\$\{\d+\}/.test(template)) {
        return 'Template must include ${url} or at least one capture group (${1}, ${2}, etc.)';
    }

    return null;
}

/**
 * Attempts to match a URL against a single pattern
 * Returns the formatted result or null if no match
 */
export function matchPattern(url: string, pattern: LinkPattern): string | null {
    if (!pattern.enabled) return null;
    if (!pattern.domainPattern || !pattern.pathPattern) return null;

    // Build domain regex
    const escapedDomain = escapeDomainPattern(pattern.domainPattern);
    const domainRegex = new RegExp(`^https?:\\/\\/${escapedDomain}`);

    // Check domain match first (fast path)
    if (!domainRegex.test(url)) return null;

    // Build full URL regex with path pattern
    // The path pattern is appended after the domain, with optional query string at the end
    const fullRegex = new RegExp(
        `^(https?:\\/\\/${escapedDomain})${pattern.pathPattern}(\\?.*)?$`
    );

    const match = url.match(fullRegex);
    if (!match) return null;

    // Build output from template
    let output = pattern.outputTemplate;

    // Replace ${url} with the full URL
    output = output.replace(/\$\{url\}/g, url);

    // Replace ${domain} with matched domain (without protocol)
    const domainMatch = match[1].replace(/^https?:\/\//, '');
    output = output.replace(/\$\{domain\}/g, domainMatch);

    // Replace capture groups ${1}, ${2}, etc.
    // match[0] is full match, match[1] is protocol+domain from our wrapper group
    // Actual user captures from pathPattern start at match[2]
    // Capture groups are URL-decoded (e.g., "Hello+World" -> "Hello World")
    for (let i = 1; i <= 9; i++) {
        const captureIndex = i + 1; // Offset by domain capture group
        const rawValue = match[captureIndex] !== undefined ? match[captureIndex] : '';
        const captureValue = decodeUrlString(rawValue);
        output = output.replace(new RegExp(`\\$\\{${i}\\}`, 'g'), captureValue);
    }

    return output;
}

/**
 * Main formatting function - tries patterns in order, returns first match
 */
export function formatLink(pastedText: string, patterns: LinkPattern[]): string | null {
    // Sanity checks
    if (typeof pastedText !== 'string' || !pastedText.trim()) return null;

    // Reject if contains whitespace (not a single URL)
    if (/\s/.test(pastedText)) return null;

    // Try each pattern in order
    for (const pattern of patterns) {
        const result = matchPattern(pastedText, pattern);
        if (result !== null) {
            return result;
        }
    }

    return null;
}

