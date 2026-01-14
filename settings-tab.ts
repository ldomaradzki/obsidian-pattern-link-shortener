import { App, Modal, Notice, PluginSettingTab, Setting } from 'obsidian';
import { LinkPattern } from './types';
import { PRESET_PATTERNS, createPatternFromPreset, generatePatternId } from './presets';
import { validateRegexPattern, validateOutputTemplate, matchPattern, sanitizeDomain } from './utils';
import type PatternLinkShortenerPlugin from './main';

export class PatternLinkShortenerSettingsTab extends PluginSettingTab {
    plugin: PatternLinkShortenerPlugin;

    constructor(app: App, plugin: PatternLinkShortenerPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.addClass('pattern-link-shortener-settings');

        containerEl.createEl('h2', { text: 'Pattern Link Shortener' });

        // Header with action buttons
        new Setting(containerEl)
            .setName('Link patterns')
            .setDesc('Patterns are evaluated in order. First match wins. Drag handles coming soon - use arrows to reorder.')
            .addButton(btn => btn
                .setButtonText('+ Add pattern')
                .setCta()
                .onClick(() => this.openPatternModal()))
            .addDropdown(dropdown => {
                dropdown.addOption('', 'Add from preset...');
                Object.entries(PRESET_PATTERNS).forEach(([key, preset]) => {
                    dropdown.addOption(key, preset.name);
                });
                dropdown.onChange(async (value) => {
                    if (value) {
                        const newPattern = createPatternFromPreset(value);
                        this.plugin.settings.patterns.push(newPattern);
                        await this.plugin.saveSettings();
                        dropdown.setValue(''); // Reset dropdown
                        this.display(); // Refresh
                    }
                });
            });

        // Pattern list
        const listEl = containerEl.createDiv({ cls: 'pattern-list' });

        if (this.plugin.settings.patterns.length === 0) {
            listEl.createEl('p', {
                text: 'No patterns configured. Add a pattern or choose from presets above.',
                cls: 'pattern-empty-state'
            });
        } else {
            this.plugin.settings.patterns.forEach((pattern, index) => {
                this.renderPatternItem(listEl, pattern, index);
            });
        }
    }

    private renderPatternItem(container: HTMLElement, pattern: LinkPattern, index: number): void {
        const setting = new Setting(container)
            .setClass('pattern-item')
            .setName(pattern.name)
            .setDesc(pattern.domainPattern + (pattern.enabled ? '' : ' (disabled)'));

        // Enable/disable toggle
        setting.addToggle(toggle => toggle
            .setValue(pattern.enabled)
            .setTooltip(pattern.enabled ? 'Disable pattern' : 'Enable pattern')
            .onChange(async (value) => {
                pattern.enabled = value;
                await this.plugin.saveSettings();
                this.display();
            }));

        // Move up button
        if (index > 0) {
            setting.addExtraButton(btn => btn
                .setIcon('arrow-up')
                .setTooltip('Move up (higher priority)')
                .onClick(async () => {
                    await this.swapPatterns(index, index - 1);
                }));
        }

        // Move down button
        if (index < this.plugin.settings.patterns.length - 1) {
            setting.addExtraButton(btn => btn
                .setIcon('arrow-down')
                .setTooltip('Move down (lower priority)')
                .onClick(async () => {
                    await this.swapPatterns(index, index + 1);
                }));
        }

        // Edit button
        setting.addExtraButton(btn => btn
            .setIcon('pencil')
            .setTooltip('Edit pattern')
            .onClick(() => this.openPatternModal(pattern)));

        // Delete button
        setting.addExtraButton(btn => btn
            .setIcon('trash')
            .setTooltip('Delete pattern')
            .onClick(async () => {
                this.plugin.settings.patterns.splice(index, 1);
                await this.plugin.saveSettings();
                this.display();
            }));
    }

    private async swapPatterns(indexA: number, indexB: number): Promise<void> {
        const patterns = this.plugin.settings.patterns;
        [patterns[indexA], patterns[indexB]] = [patterns[indexB], patterns[indexA]];
        await this.plugin.saveSettings();
        this.display();
    }

    private openPatternModal(existingPattern?: LinkPattern): void {
        new PatternEditModal(
            this.app,
            existingPattern,
            async (pattern) => {
                if (existingPattern) {
                    // Update existing
                    const index = this.plugin.settings.patterns.findIndex(
                        p => p.id === existingPattern.id
                    );
                    if (index >= 0) {
                        this.plugin.settings.patterns[index] = pattern;
                    }
                } else {
                    // Add new
                    this.plugin.settings.patterns.push(pattern);
                }
                await this.plugin.saveSettings();
                this.display();
            }
        ).open();
    }
}

class PatternEditModal extends Modal {
    pattern: LinkPattern;
    onSave: (pattern: LinkPattern) => void;
    isNew: boolean;

    constructor(app: App, existingPattern: LinkPattern | undefined, onSave: (pattern: LinkPattern) => void) {
        super(app);
        this.onSave = onSave;
        this.isNew = !existingPattern;

        // Clone or create new pattern
        this.pattern = existingPattern
            ? { ...existingPattern }
            : {
                id: generatePatternId(),
                name: 'New Pattern',
                enabled: true,
                domainPattern: '',
                pathPattern: '',
                outputTemplate: '[${1}](${url})',
            };
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('pattern-edit-modal');

        contentEl.createEl('h2', {
            text: this.isNew ? 'Add Pattern' : `Edit: ${this.pattern.name}`
        });

        // Name field
        new Setting(contentEl)
            .setName('Name')
            .setDesc('Display name for this pattern')
            .addText(text => text
                .setPlaceholder('My Pattern')
                .setValue(this.pattern.name)
                .onChange(value => this.pattern.name = value));

        // Domain pattern field
        new Setting(contentEl)
            .setName('Domain pattern')
            .setDesc('Use * as wildcard. Examples: *.atlassian.net, jira.company.com, company.com/jira')
            .addText(text => text
                .setPlaceholder('*.example.com')
                .setValue(this.pattern.domainPattern)
                .onChange(value => this.pattern.domainPattern = sanitizeDomain(value)));

        // Path pattern field with validation
        const pathSetting = new Setting(contentEl)
            .setName('Path pattern (regex)')
            .setDesc('Regex to match URL path after domain. Use () for capture groups.');

        const pathValidationEl = contentEl.createDiv({ cls: 'validation-message' });

        pathSetting.addTextArea(text => {
            text.setPlaceholder('\\/browse\\/([A-Z]+-\\d+)')
                .setValue(this.pattern.pathPattern)
                .onChange(value => {
                    this.pattern.pathPattern = value;
                    const error = validateRegexPattern(value);
                    if (error) {
                        pathValidationEl.textContent = error;
                        pathValidationEl.addClass('error');
                    } else {
                        pathValidationEl.textContent = 'Valid pattern';
                        pathValidationEl.removeClass('error');
                    }
                    this.updateTestResult();
                });
            text.inputEl.rows = 2;
            text.inputEl.addClass('pattern-textarea');
        });

        // Output template field
        new Setting(contentEl)
            .setName('Output template')
            .setDesc('Use ${url} for full URL, ${1}, ${2}, etc. for capture groups, ${domain} for domain')
            .addText(text => text
                .setPlaceholder('[${1}](${url})')
                .setValue(this.pattern.outputTemplate)
                .onChange(value => {
                    this.pattern.outputTemplate = value;
                    this.updateTestResult();
                }));

        // Test section
        const testSection = contentEl.createDiv({ cls: 'pattern-test-section' });
        testSection.createEl('h4', { text: 'Test your pattern' });

        const testInputSetting = new Setting(testSection)
            .setName('Test URL')
            .setDesc('Paste a URL to test the pattern');

        this.testInput = testSection.createEl('input', {
            type: 'text',
            placeholder: 'https://example.com/browse/TEST-123',
            cls: 'pattern-test-input'
        });
        this.testInput.addEventListener('input', () => this.updateTestResult());

        this.testResultEl = testSection.createDiv({ cls: 'pattern-test-result' });
        this.testResultEl.textContent = 'Enter a URL above to test';

        // Description field (optional)
        new Setting(contentEl)
            .setName('Description (optional)')
            .setDesc('Notes about this pattern for your reference')
            .addText(text => text
                .setPlaceholder('For company JIRA instance')
                .setValue(this.pattern.description || '')
                .onChange(value => this.pattern.description = value || undefined));

        // Action buttons
        const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });

        const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelBtn.addEventListener('click', () => this.close());

        const saveBtn = buttonContainer.createEl('button', {
            text: 'Save',
            cls: 'mod-cta'
        });
        saveBtn.addEventListener('click', () => this.savePattern());
    }

    private testInput: HTMLInputElement;
    private testResultEl: HTMLElement;

    private updateTestResult(): void {
        if (!this.testInput || !this.testResultEl) return;

        const testUrl = this.testInput.value.trim();
        if (!testUrl) {
            this.testResultEl.textContent = 'Enter a URL above to test';
            this.testResultEl.removeClass('success');
            this.testResultEl.removeClass('error');
            return;
        }

        try {
            const result = matchPattern(testUrl, this.pattern);
            if (result) {
                this.testResultEl.textContent = `Result: ${result}`;
                this.testResultEl.addClass('success');
                this.testResultEl.removeClass('error');
            } else {
                this.testResultEl.textContent = 'No match - check domain and path pattern';
                this.testResultEl.addClass('error');
                this.testResultEl.removeClass('success');
            }
        } catch (e) {
            this.testResultEl.textContent = `Error: ${e instanceof Error ? e.message : 'Invalid pattern'}`;
            this.testResultEl.addClass('error');
            this.testResultEl.removeClass('success');
        }
    }

    private savePattern(): void {
        // Validate before saving
        if (!this.pattern.name.trim()) {
            new Notice('Name is required');
            return;
        }

        if (!this.pattern.domainPattern.trim()) {
            new Notice('Domain pattern is required');
            return;
        }

        const regexError = validateRegexPattern(this.pattern.pathPattern);
        if (regexError) {
            new Notice(`Invalid path pattern: ${regexError}`);
            return;
        }

        const templateError = validateOutputTemplate(this.pattern.outputTemplate);
        if (templateError) {
            new Notice(`Invalid template: ${templateError}`);
            return;
        }

        this.onSave(this.pattern);
        this.close();
    }

    onClose(): void {
        this.contentEl.empty();
    }
}
