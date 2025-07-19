/**
 * Monaco Editor type declarations for compatibility
 * Fixes common TypeScript issues with Monaco Editor integration
 */

import { editor, languages, Position, Range, IDisposable } from 'monaco-editor';

declare global {
  namespace monaco {
    export = editor;
    
    namespace editor {
      interface IStandaloneCodeEditor {
        getValue(): string;
        setValue(value: string): void;
        getModel(): editor.ITextModel | null;
        getPosition(): Position | null;
        getSelection(): Range | null;
        setPosition(position: Position): void;
        setSelection(selection: Range): void;
        updateOptions(newOptions: editor.IStandaloneEditorConstructionOptions): void;
        onDidChangeModelContent(listener: (e: editor.IModelContentChangedEvent) => void): IDisposable;
        onDidChangeCursorPosition(listener: (e: editor.ICursorPositionChangedEvent) => void): IDisposable;
        dispose(): void;
      }

      interface ITextModel {
        id: string;
        uri: any;
        getValue(): string;
        setValue(value: string): void;
        getLineCount(): number;
        getLineContent(lineNumber: number): string;
        dispose(): void;
      }

      interface IStandaloneThemeData {
        base: 'vs' | 'vs-dark' | 'hc-black';
        inherit: boolean;
        rules: any[];
        colors: Record<string, string>;
      }
    }

    namespace languages {
      interface FormattingOptions {
        tabSize: number;
        insertSpaces: boolean;
      }

      interface TextEdit {
        range: Range;
        text: string;
      }

      interface CodeActionContext {
        markers: editor.IMarkerData[];
        only?: string;
      }

      interface ProviderResult<T> {
        then?(onfulfilled?: (value: T) => any, onrejected?: (reason: any) => any): any;
      }

      enum CompletionItemKind {
        Method = 0,
        Function = 1,
        Constructor = 2,
        Field = 3,
        Variable = 4,
        Class = 5,
        Struct = 6,
        Interface = 7,
        Module = 8,
        Property = 9,
        Event = 10,
        Operator = 11,
        Unit = 12,
        Value = 13,
        Constant = 14,
        Enum = 15,
        EnumMember = 16,
        Keyword = 17,
        Text = 18,
        Color = 19,
        File = 20,
        Reference = 21,
        Customcolor = 22,
        Folder = 23,
        TypeParameter = 24,
        User = 25,
        Issue = 26,
        Snippet = 27
      }

      enum CompletionItemInsertTextRule {
        KeepWhitespace = 1,
        InsertAsSnippet = 4
      }
    }
  }
}

export {};