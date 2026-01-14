import { LinkPattern } from './types';

/**
 * Built-in preset pattern definitions
 */
export const PRESET_PATTERNS: Record<string, Omit<LinkPattern, 'id' | 'enabled'>> = {
    jira: {
        name: 'JIRA Issues',
        domainPattern: '*.atlassian.net',
        pathPattern: '\\/.*\\/([A-Z][A-Z0-9]*-\\d+)',
        outputTemplate: '[${1}](${url})',
        description: 'Formats JIRA issue links to show issue key (e.g., DEV-123)',
        isPreset: true,
    },

    jiraSelfHosted: {
        name: 'JIRA (Self-Hosted)',
        domainPattern: 'jira.example.com',
        pathPattern: '\\/.*\\/([A-Z][A-Z0-9]*-\\d+)',
        outputTemplate: '[${1}](${url})',
        description: 'For self-hosted JIRA instances. Update the domain pattern to match your server.',
        isPreset: true,
    },

    confluence: {
        name: 'Confluence Pages',
        domainPattern: '*.atlassian.net',
        pathPattern: '\\/wiki\\/spaces\\/[^\\/]+\\/pages\\/\\d+\\/([^?]+)',
        outputTemplate: '[${1}](${url})',
        description: 'Formats Confluence links to show page title from URL',
        isPreset: true,
    },

    confluenceSelfHosted: {
        name: 'Confluence (Self-Hosted)',
        domainPattern: 'confluence.example.com',
        pathPattern: '\\/wiki\\/spaces\\/[^\\/]+\\/pages\\/\\d+\\/([^?]+)',
        outputTemplate: '[${1}](${url})',
        description: 'For self-hosted Confluence instances. Update the domain pattern.',
        isPreset: true,
    },

    gitlabIssue: {
        name: 'GitLab Issues',
        domainPattern: 'gitlab.com',
        pathPattern: '\\/([^\\/]+\\/[^\\/]+)\\/-\\/issues\\/(\\d+)',
        outputTemplate: '[${1}#${2}](${url})',
        description: 'Formats GitLab issue links (e.g., group/project#123)',
        isPreset: true,
    },

    gitlabMergeRequest: {
        name: 'GitLab Merge Requests',
        domainPattern: 'gitlab.com',
        pathPattern: '\\/([^\\/]+\\/[^\\/]+)\\/-\\/merge_requests\\/(\\d+)',
        outputTemplate: '[${1}!${2}](${url})',
        description: 'Formats GitLab MR links (e.g., group/project!123)',
        isPreset: true,
    },

    gitlabSelfHosted: {
        name: 'GitLab (Self-Hosted)',
        domainPattern: 'gitlab.example.com',
        pathPattern: '\\/([^\\/]+\\/[^\\/]+)\\/-\\/(issues|merge_requests)\\/(\\d+)',
        outputTemplate: '[${1}#${3}](${url})',
        description: 'For self-hosted GitLab. Update domain pattern. Uses # for both issues and MRs.',
        isPreset: true,
    },

    github: {
        name: 'GitHub Issues/PRs',
        domainPattern: 'github.com',
        pathPattern: '\\/([^\\/]+\\/[^\\/]+)\\/(issues|pull)\\/(\\d+)',
        outputTemplate: '[${1}#${3}](${url})',
        description: 'Formats GitHub issue and PR links (e.g., owner/repo#123)',
        isPreset: true,
    },

    bitbucketPr: {
        name: 'Bitbucket PRs',
        domainPattern: 'bitbucket.org',
        pathPattern: '\\/([^\\/]+\\/[^\\/]+)\\/pull-requests\\/(\\d+)',
        outputTemplate: '[${1}#${2}](${url})',
        description: 'Formats Bitbucket pull request links (e.g., team/repo#123)',
        isPreset: true,
    },

    bitbucketIssue: {
        name: 'Bitbucket Issues',
        domainPattern: 'bitbucket.org',
        pathPattern: '\\/([^\\/]+\\/[^\\/]+)\\/issues\\/(\\d+)',
        outputTemplate: '[${1}#${2}](${url})',
        description: 'Formats Bitbucket issue links (e.g., team/repo#45)',
        isPreset: true,
    },

    azureDevOpsWorkItem: {
        name: 'Azure DevOps Work Items',
        domainPattern: 'dev.azure.com',
        pathPattern: '\\/[^\\/]+\\/[^\\/]+\\/_workitems\\/edit\\/(\\d+)',
        outputTemplate: '[#${1}](${url})',
        description: 'Formats Azure DevOps work item links (e.g., #1234)',
        isPreset: true,
    },

    azureDevOpsPr: {
        name: 'Azure DevOps PRs',
        domainPattern: 'dev.azure.com',
        pathPattern: '\\/[^\\/]+\\/[^\\/]+\\/_git\\/[^\\/]+\\/pullrequest\\/(\\d+)',
        outputTemplate: '[PR-${1}](${url})',
        description: 'Formats Azure DevOps pull request links (e.g., PR-56)',
        isPreset: true,
    },

    trello: {
        name: 'Trello Cards',
        domainPattern: 'trello.com',
        pathPattern: '\\/c\\/[^\\/]+\\/([^?]+)',
        outputTemplate: '[${1}](${url})',
        description: 'Formats Trello card links to show card title',
        isPreset: true,
    },

    linear: {
        name: 'Linear Issues',
        domainPattern: 'linear.app',
        pathPattern: '\\/[^\\/]+\\/issue\\/([A-Z]+-\\d+)',
        outputTemplate: '[${1}](${url})',
        description: 'Formats Linear issue links (e.g., TEAM-123)',
        isPreset: true,
    },

    notion: {
        name: 'Notion Pages',
        domainPattern: 'notion.so',
        pathPattern: '\\/([^-]+-[^-]+-[a-f0-9]+)',
        outputTemplate: '[${1}](${url})',
        description: 'Formats Notion page links to show page title',
        isPreset: true,
    },

    figma: {
        name: 'Figma Files',
        domainPattern: 'figma.com',
        pathPattern: '\\/file\\/[^\\/]+\\/([^?]+)',
        outputTemplate: '[${1}](${url})',
        description: 'Formats Figma file links to show design name',
        isPreset: true,
    },

    sentry: {
        name: 'Sentry Issues',
        domainPattern: 'sentry.io',
        pathPattern: '\\/organizations\\/[^\\/]+\\/issues\\/(\\d+)',
        outputTemplate: '[SENTRY-${1}](${url})',
        description: 'Formats Sentry issue links (e.g., SENTRY-123)',
        isPreset: true,
    },

    stackoverflow: {
        name: 'Stack Overflow',
        domainPattern: 'stackoverflow.com',
        pathPattern: '\\/questions\\/\\d+\\/([^?]+)',
        outputTemplate: '[SO: ${1}](${url})',
        description: 'Formats Stack Overflow question links',
        isPreset: true,
    },

    npm: {
        name: 'npm Packages',
        domainPattern: 'npmjs.com',
        pathPattern: '\\/package\\/([^?]+)',
        outputTemplate: '[npm: ${1}](${url})',
        description: 'Formats npm package links (e.g., npm: lodash)',
        isPreset: true,
    },
};

/**
 * Generates a unique pattern ID
 */
export function generatePatternId(): string {
    return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates a full LinkPattern from a preset key
 */
export function createPatternFromPreset(
    presetKey: string,
    overrides?: Partial<LinkPattern>
): LinkPattern {
    const preset = PRESET_PATTERNS[presetKey];
    if (!preset) {
        throw new Error(`Unknown preset: ${presetKey}`);
    }

    return {
        id: generatePatternId(),
        enabled: true,
        ...preset,
        ...overrides,
    };
}

/**
 * Returns all preset keys for UI dropdown
 */
export function getPresetKeys(): string[] {
    return Object.keys(PRESET_PATTERNS);
}
