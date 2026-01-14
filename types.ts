/**
 * Represents a single link shortening pattern configuration
 */
export interface LinkPattern {
    /** Unique identifier for the pattern */
    id: string;

    /** Display name shown in settings UI */
    name: string;

    /** Whether this pattern is currently active */
    enabled: boolean;

    /** Domain pattern with wildcard support (e.g., "*.atlassian.net") */
    domainPattern: string;

    /**
     * Regex pattern to match and capture from the URL path
     * Uses standard JS regex syntax with capture groups
     * Example: "\/browse\/([A-Z]+-\\d+)" for JIRA issues
     */
    pathPattern: string;

    /**
     * Output template using placeholders:
     * - ${url} - The full original URL
     * - ${1}, ${2}, etc. - Capture groups from pathPattern
     * Example: "[${1}](${url})"
     */
    outputTemplate: string;

    /** Optional description for user reference */
    description?: string;

    /** If true, this is a built-in preset (informational only) */
    isPreset?: boolean;
}

/**
 * Plugin settings structure (v2)
 */
export interface LinkShortenerPluginSettings {
    /** Settings schema version for migration support */
    version: 2;

    /** Ordered list of patterns - first match wins */
    patterns: LinkPattern[];
}

/**
 * Legacy settings structure (v1) - for migration
 */
export interface LegacyPluginSettings {
    supportedDomain: string;
}
