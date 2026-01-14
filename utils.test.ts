import { LinkPattern } from './types';
import { formatLink, matchPattern, sanitizeDomain, validateRegexPattern, validateOutputTemplate, decodeUrlString } from './utils';

// Helper to create a JIRA-style pattern for testing
function createJiraPattern(domain: string): LinkPattern {
    return {
        id: 'test-jira',
        name: 'JIRA',
        enabled: true,
        domainPattern: domain,
        pathPattern: '\\/.*\\/([A-Z][A-Z0-9]*-\\d+)',
        outputTemplate: '[${1}](${url})',
    };
}

describe('formatLink sanity checks', () => {
    const patterns = [createJiraPattern('*.atlassian.net')];

    it('should return null if pasted text is empty', () => {
        expect(formatLink('', patterns)).toBeNull();
    });

    it('should return null if pasted text is null', () => {
        expect(formatLink(null as unknown as string, patterns)).toBeNull();
    });

    it('should return null if not a hyperlink', () => {
        expect(formatLink('random text', patterns)).toBeNull();
    });

    it('should return null if not an http(s) hyperlink', () => {
        expect(formatLink('ftp://examplecompany.atlassian.net/browse/DEV-456', patterns)).toBeNull();
    });

    it('should return null if URL does not match any pattern', () => {
        expect(formatLink('https://docs.google.com/spreadsheets/d/2343223432', patterns)).toBeNull();
    });

    it('should return null if patterns array is empty', () => {
        expect(formatLink('https://examplecompany.atlassian.net/browse/DEV-456', [])).toBeNull();
    });
});

describe('formatLink with JIRA-style patterns', () => {
    it('should format link with reverse proxy path', () => {
        const patterns = [createJiraPattern('atlassian.examplecompany.net')];
        expect(formatLink('https://atlassian.examplecompany.net/jira/browse/DEV-456', patterns))
            .toBe('[DEV-456](https://atlassian.examplecompany.net/jira/browse/DEV-456)');
    });

    it('should format link with multiple path segments', () => {
        const patterns = [createJiraPattern('atlassian.examplecompany.net')];
        expect(formatLink('https://atlassian.examplecompany.net/jira/some/path/browse/DEV-456', patterns))
            .toBe('[DEV-456](https://atlassian.examplecompany.net/jira/some/path/browse/DEV-456)');
    });

    it('should format link preserving query string', () => {
        const patterns = [createJiraPattern('atlassian.examplecompany.net')];
        expect(formatLink('https://atlassian.examplecompany.net/jira/browse/DEV-456?foo=bar', patterns))
            .toBe('[DEV-456](https://atlassian.examplecompany.net/jira/browse/DEV-456?foo=bar)');
    });

    it('should format link with exact domain match', () => {
        const patterns = [createJiraPattern('examplecompany.atlassian.net')];
        expect(formatLink('https://examplecompany.atlassian.net/browse/DEV-456', patterns))
            .toBe('[DEV-456](https://examplecompany.atlassian.net/browse/DEV-456)');
    });

    it('should format HTTP links', () => {
        const patterns = [createJiraPattern('examplecompany.atlassian.net')];
        expect(formatLink('http://examplecompany.atlassian.net/browse/DEV-456', patterns))
            .toBe('[DEV-456](http://examplecompany.atlassian.net/browse/DEV-456)');
    });

    it('should format link with wildcard domain', () => {
        const patterns = [createJiraPattern('*.atlassian.net')];
        expect(formatLink('https://examplecompany.atlassian.net/browse/DEV-456', patterns))
            .toBe('[DEV-456](https://examplecompany.atlassian.net/browse/DEV-456)');
    });

    it('should not match if domain does not match wildcard', () => {
        const patterns = [createJiraPattern('*.selfhosted.com')];
        expect(formatLink('https://examplecompany.atlassian.net/browse/DEV-456', patterns)).toBeNull();
    });

    it('should not match if no exact match for domain', () => {
        const patterns = [createJiraPattern('company.selfhosted.com')];
        expect(formatLink('https://examplecompany.atlassian.net/browse/DEV-456', patterns)).toBeNull();
    });

    it('should ignore text with spaces (not a single URL)', () => {
        const patterns = [createJiraPattern('*.atlassian.net')];
        expect(formatLink('https://examplecompany.atlassian.net/browse/DEV-456 is a link', patterns)).toBeNull();
    });

    it('should ignore multiple URLs', () => {
        const patterns = [createJiraPattern('*.atlassian.net')];
        expect(formatLink('https://a.atlassian.net/browse/DEV-1 https://b.atlassian.net/browse/DEV-2', patterns)).toBeNull();
    });

    it('should format link with project key containing digits', () => {
        const patterns = [createJiraPattern('examplecompany.atlassian.net')];
        expect(formatLink('https://examplecompany.atlassian.net/browse/D0EV12-456', patterns))
            .toBe('[D0EV12-456](https://examplecompany.atlassian.net/browse/D0EV12-456)');
    });

    it('should format link with non-browse path', () => {
        const patterns = [createJiraPattern('examplecompany.atlassian.net')];
        expect(formatLink('https://examplecompany.atlassian.net/issues/ABC-123', patterns))
            .toBe('[ABC-123](https://examplecompany.atlassian.net/issues/ABC-123)');
    });
});

describe('formatLink with multiple patterns (first match wins)', () => {
    const patterns: LinkPattern[] = [
        {
            id: 'jira',
            name: 'JIRA',
            enabled: true,
            domainPattern: '*.atlassian.net',
            pathPattern: '\\/.*\\/([A-Z][A-Z0-9]*-\\d+)',
            outputTemplate: '[${1}](${url})',
        },
        {
            id: 'github',
            name: 'GitHub',
            enabled: true,
            domainPattern: 'github.com',
            pathPattern: '\\/([^\\/]+\\/[^\\/]+)\\/(issues|pull)\\/(\\d+)',
            outputTemplate: '[${1}#${3}](${url})',
        },
    ];

    it('should match first pattern for JIRA URL', () => {
        expect(formatLink('https://company.atlassian.net/browse/DEV-123', patterns))
            .toBe('[DEV-123](https://company.atlassian.net/browse/DEV-123)');
    });

    it('should match second pattern for GitHub URL', () => {
        expect(formatLink('https://github.com/owner/repo/issues/42', patterns))
            .toBe('[owner/repo#42](https://github.com/owner/repo/issues/42)');
    });

    it('should return null when no pattern matches', () => {
        expect(formatLink('https://google.com/search', patterns)).toBeNull();
    });

    it('should skip disabled patterns', () => {
        const patternsWithDisabled = [
            { ...patterns[0], enabled: false },
            patterns[1],
        ];
        // JIRA pattern disabled, should not match
        expect(formatLink('https://company.atlassian.net/browse/DEV-123', patternsWithDisabled)).toBeNull();
    });
});

describe('matchPattern with multiple capture groups', () => {
    it('should support multiple capture groups in template', () => {
        const pattern: LinkPattern = {
            id: 'gitlab',
            name: 'GitLab',
            enabled: true,
            domainPattern: 'gitlab.com',
            pathPattern: '\\/([^\\/]+\\/[^\\/]+)\\/-\\/issues\\/(\\d+)',
            outputTemplate: '[${1}#${2}](${url})',
        };

        expect(matchPattern('https://gitlab.com/group/project/-/issues/42', pattern))
            .toBe('[group/project#42](https://gitlab.com/group/project/-/issues/42)');
    });

    it('should support ${domain} placeholder', () => {
        const pattern: LinkPattern = {
            id: 'test',
            name: 'Test',
            enabled: true,
            domainPattern: '*.example.com',
            pathPattern: '\\/page\\/(\\d+)',
            outputTemplate: '[Page ${1} on ${domain}](${url})',
        };

        expect(matchPattern('https://sub.example.com/page/123', pattern))
            .toBe('[Page 123 on sub.example.com](https://sub.example.com/page/123)');
    });

    it('should handle missing capture groups gracefully', () => {
        const pattern: LinkPattern = {
            id: 'test',
            name: 'Test',
            enabled: true,
            domainPattern: 'example.com',
            pathPattern: '\\/page\\/(\\d+)',
            outputTemplate: '[${1} ${2} ${3}](${url})',  // ${2} and ${3} don't exist
        };

        expect(matchPattern('https://example.com/page/123', pattern))
            .toBe('[123  ](https://example.com/page/123)');
    });
});

describe('sanitizeDomain', () => {
    it('should not fail with empty string', () => {
        expect(sanitizeDomain('')).toBe('');
    });

    it('should remove illegal characters', () => {
        expect(sanitizeDomain('!@#$%^&()domain.com')).toBe('domain.com');
    });

    it('should keep dots and asterisks for wildcard definition', () => {
        expect(sanitizeDomain('*.example.domain.com')).toBe('*.example.domain.com');
    });

    it('should keep forward slashes for path support', () => {
        expect(sanitizeDomain('example.com/jira')).toBe('example.com/jira');
    });
});

describe('validateRegexPattern', () => {
    it('should return null for valid patterns', () => {
        expect(validateRegexPattern('\\d+')).toBeNull();
        expect(validateRegexPattern('([A-Z]+-\\d+)')).toBeNull();
        expect(validateRegexPattern('\\/browse\\/([A-Z]+-\\d+)')).toBeNull();
    });

    it('should return error for empty pattern', () => {
        expect(validateRegexPattern('')).not.toBeNull();
        expect(validateRegexPattern('   ')).not.toBeNull();
    });

    it('should return error message for invalid patterns', () => {
        expect(validateRegexPattern('[')).not.toBeNull();
        expect(validateRegexPattern('(unclosed')).not.toBeNull();
    });
});

describe('validateOutputTemplate', () => {
    it('should accept templates with ${url}', () => {
        expect(validateOutputTemplate('[Link](${url})')).toBeNull();
    });

    it('should accept templates with capture groups', () => {
        expect(validateOutputTemplate('[${1}](${url})')).toBeNull();
        expect(validateOutputTemplate('[${1}]')).toBeNull();
    });

    it('should reject empty template', () => {
        expect(validateOutputTemplate('')).not.toBeNull();
    });

    it('should reject templates without placeholders', () => {
        expect(validateOutputTemplate('[static text]')).not.toBeNull();
    });
});

describe('decodeUrlString', () => {
    it('should replace + with spaces', () => {
        expect(decodeUrlString('Hello+World')).toBe('Hello World');
    });

    it('should decode %20 as space', () => {
        expect(decodeUrlString('Hello%20World')).toBe('Hello World');
    });

    it('should decode multiple + signs', () => {
        expect(decodeUrlString('Claude+Code+z+LiteLLM')).toBe('Claude Code z LiteLLM');
    });

    it('should handle mixed encoding', () => {
        expect(decodeUrlString('Hello+World%21')).toBe('Hello World!');
    });

    it('should return original if no encoding', () => {
        expect(decodeUrlString('HelloWorld')).toBe('HelloWorld');
    });
});

describe('matchPattern with URL decoding', () => {
    it('should decode + to spaces in Confluence page titles', () => {
        const pattern: LinkPattern = {
            id: 'confluence',
            name: 'Confluence',
            enabled: true,
            domainPattern: 'confluence.corp.xtb.com',
            pathPattern: '\\/spaces\\/[^\\/]+\\/pages\\/\\d+\\/([^?]+)',
            outputTemplate: '[${1}](${url})',
        };

        expect(matchPattern('https://confluence.corp.xtb.com/spaces/AIRND/pages/201901327/Claude+Code+z+LiteLLM', pattern))
            .toBe('[Claude Code z LiteLLM](https://confluence.corp.xtb.com/spaces/AIRND/pages/201901327/Claude+Code+z+LiteLLM)');
    });

    it('should decode %20 in URLs', () => {
        const pattern: LinkPattern = {
            id: 'test',
            name: 'Test',
            enabled: true,
            domainPattern: 'example.com',
            pathPattern: '\\/page\\/([^?]+)',
            outputTemplate: '[${1}](${url})',
        };

        expect(matchPattern('https://example.com/page/Hello%20World', pattern))
            .toBe('[Hello World](https://example.com/page/Hello%20World)');
    });
});
