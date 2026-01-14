import { Plugin, MarkdownView, Editor } from "obsidian";
import { formatLink } from './utils';
import { LinkShortenerPluginSettings } from './types';
import { createPatternFromPreset } from './presets';
import { PatternLinkShortenerSettingsTab } from './settings-tab';

function getDefaultSettings(): LinkShortenerPluginSettings {
    return {
        version: 2,
        patterns: [
            createPatternFromPreset('jira', { enabled: true }),
        ],
    };
}

export default class PatternLinkShortenerPlugin extends Plugin {
    settings: LinkShortenerPluginSettings;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new PatternLinkShortenerSettingsTab(this.app, this));

        console.log("Pattern Link Shortener plugin loaded");

        this.registerEvent(
            this.app.workspace.on(
                "editor-paste",
                (evt: ClipboardEvent, editor: Editor, view: MarkdownView) => {
                    const pastedText = evt.clipboardData?.getData("text/plain");
                    if (!pastedText) return;

                    const modifiedText = formatLink(pastedText, this.settings.patterns);
                    if (!modifiedText) return;

                    evt.preventDefault();
                    editor.replaceSelection(modifiedText);
                }
            )
        );
    }

    async loadSettings() {
        const loadedData = await this.loadData();
        this.settings = Object.assign({}, getDefaultSettings(), loadedData);
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
