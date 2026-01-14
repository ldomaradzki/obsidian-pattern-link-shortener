# Pattern Link Shortener

Obsidian plugin that automatically shortens pasted URLs into clean markdown links using configurable regex patterns.

## Example

| Pasted URL | Result |
|------------|--------|
| `https://company.atlassian.net/browse/DEV-123` | `[DEV-123](url)` |
| `https://gitlab.com/team/repo/-/merge_requests/42` | `[team/repo!42](url)` |
| `https://confluence.com/spaces/TEAM/pages/123/Page+Title` | `[Page Title](url)` |

## Features

- 19 built-in presets (JIRA, Confluence, GitHub, GitLab, Bitbucket, Azure DevOps, Trello, Linear, Figma, Sentry, and more)
- Custom patterns with full regex support
- Capture groups for flexible output formatting
- URL decoding (automatically converts `+` and `%20` to spaces)
- Pattern ordering (first match wins)

## Installation

### Manual / BRAT

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin
2. Add beta plugin: `your-username/pattern-link-shortener`

Or manually copy `main.js`, `manifest.json`, and `styles.css` to `<vault>/.obsidian/plugins/pattern-link-shortener/`

## Usage

1. Settings > Pattern Link Shortener
2. Add patterns from presets or create custom ones
3. Paste URLs - they will be formatted automatically

### Custom Pattern Example

```
Domain:   jira.mycompany.com
Path:     \/browse\/([A-Z][A-Z0-9]*-\d+)
Template: [${1}](${url})
```

### Template Placeholders

- `${url}` - Full original URL
- `${domain}` - Matched domain
- `${1}`, `${2}`, ... - Regex capture groups

## Credits

Based on [JIRA Links Shortener](https://github.com/rplatonovs/obsidian-jira-links-shortener) by Ruslans Platonovs.

## License

MIT
