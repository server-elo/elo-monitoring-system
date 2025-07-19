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
        getValue(_): string;
        setValue(_value: string): void;
        getModel(_): editor.ITextModel | null;
        getPosition(_): Position | null;
        getSelection(_): Range | null;
        setPosition(_position: Position): void;
        setSelection(_selection: Range): void;
        updateOptions(_newOptions: editor.IStandaloneEditorConstructionOptions): void;
        onDidChangeModelContent(_listener: (e: editor.IModelContentChangedEvent) => void): IDisposable;
        onDidChangeCursorPosition(_listener: (e: editor.ICursorPositionChangedEvent) => void): IDisposable;
        dispose(_): void;
      }

      interface ITextModel {
        id: string;
        uri: any;
        getValue(_): string;
        setValue(_value: string): void;
        getLineCount(_): number;
        getLineContent(_lineNumber: number): string;
        dispose(_): void;
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
        then?(_onfulfilled?: (value: T) => any, onrejected?: (_reason: any) => any): any;
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