import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from '@codemirror/view';
import { defaultHighlightStyle, syntaxHighlighting, indentOnInput, bracketMatching, foldGutter, foldKeymap } from '@codemirror/language';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { lintKeymap } from '@codemirror/lint';
import { javascript } from '@codemirror/lang-javascript';

export class CodeEditor {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      language: 'javascript',
      theme: 'light',
      readOnly: false,
      ...options
    };
    this.view = null;
    this.rLanguageSupport = null;
    this.readOnlyCompartment = new Compartment();
  }

  async loadRLanguageSupport() {
    if (!this.rLanguageSupport) {
      try {
        const { r } = await import('codemirror-lang-r');
        this.rLanguageSupport = r();
      } catch (error) {
        console.error('Failed to load R language support:', error);
        return null;
      }
    }
    return this.rLanguageSupport;
  }

  async createEditor(initialCode = '') {
    const languageSupport = await this.getLanguageSupport();

    const extensions = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap
      ]),
      languageSupport,
      this.getTheme(),
      EditorView.updateListener.of(update => {
        if (update.docChanged && this.options.onChange) {
          this.options.onChange(this.getValue());
        }
      }),
      this.readOnlyCompartment.of(EditorState.readOnly.of(this.options.readOnly || false))
    ];

    const state = EditorState.create({
      doc: initialCode,
      extensions
    });

    this.view = new EditorView({
      state,
      parent: this.container
    });

    return this.view;
  }

  async getLanguageSupport() {
    if (this.options.language === 'r') {
      const rSupport = await this.loadRLanguageSupport();
      return rSupport || javascript();
    }
    return javascript();
  }

  getTheme() {
    const ideaTheme = EditorView.theme({
      '&': {
        color: '#000000',
        backgroundColor: '#ffffff',
        fontSize: '14px'
      },
      '.cm-scroller': {
        overflow: 'auto'
      },
      '.cm-content': {
        caretColor: '#000000',
        fontFamily: '"JetBrains Mono", "Consolas", "Monaco", monospace',
        padding: '10px'
      },
      '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#000000' },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: '#add6ff'
      },
      '.cm-panels': { backgroundColor: '#f5f5f5', color: '#000000' },
      '.cm-panels.cm-panels-top': { borderBottom: '1px solid #ddd' },
      '.cm-panels.cm-panels-bottom': { borderTop: '1px solid #ddd' },
      '.cm-searchMatch': {
        backgroundColor: '#ffff00',
        outline: '1px solid #dddd00'
      },
      '.cm-searchMatch.cm-searchMatch-selected': {
        backgroundColor: '#ff9632'
      },
      '.cm-activeLine': { backgroundColor: '#fffae0' },
      '.cm-selectionMatch': { backgroundColor: '#bad6fd' },
      '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
        backgroundColor: '#bad0ff',
        outline: '1px solid #bad0ff'
      },
      '.cm-gutters': {
        backgroundColor: '#f5f5f5',
        color: '#999999',
        border: 'none',
        borderRight: '1px solid #ddd'
      },
      '.cm-activeLineGutter': {
        backgroundColor: '#e8f2ff',
        color: '#000000'
      },
      '.cm-foldPlaceholder': {
        backgroundColor: 'transparent',
        border: 'none',
        color: '#969696'
      },
      '.cm-tooltip': {
        border: '1px solid #ddd',
        backgroundColor: '#f5f5f5'
      },
      '.cm-tooltip .cm-tooltip-arrow:before': {
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent'
      },
      '.cm-tooltip .cm-tooltip-arrow:after': {
        borderTopColor: '#f5f5f5',
        borderBottomColor: '#f5f5f5'
      },
      '.cm-tooltip-autocomplete': {
        '& > ul > li[aria-selected]': {
          backgroundColor: '#add6ff',
          color: '#000000'
        }
      }
    }, { dark: false });

    return ideaTheme;
  }

  getValue() {
    if (!this.view) return '';
    return this.view.state.doc.toString();
  }

  setValue(code) {
    if (!this.view) return;
    this.view.dispatch({
      changes: {
        from: 0,
        to: this.view.state.doc.length,
        insert: code
      }
    });
  }

  async setLanguage(language) {
    if (!this.view) return;

    this.options.language = language;
    const languageSupport = await this.getLanguageSupport();

    // For language change, we need to recreate the editor
    // as language support is not easily reconfigurable
    const currentCode = this.getValue();
    this.destroy();
    await this.createEditor(currentCode);
  }

  setReadOnly(readOnly) {
    if (!this.view) return;

    this.options.readOnly = readOnly;
    this.view.dispatch({
      effects: this.readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly))
    });
  }

  focus() {
    if (this.view) {
      this.view.focus();
    }
  }

  destroy() {
    if (this.view) {
      this.view.destroy();
      this.view = null;
    }
  }
}