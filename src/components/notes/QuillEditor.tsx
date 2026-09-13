"use client";

import {
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

export interface QuillEditorHandle {
  focus: () => void;
  setCursorToEnd: () => void;
  insertHtmlAtEnd: (html: string) => void;
  insertHtmlAtCursor: (html: string) => void;
  getEditor: () => any;
}

export interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  editorRef?: React.MutableRefObject<QuillEditorHandle | null>;
  onEditorReady?: (handle: QuillEditorHandle) => void;
}

const FONT_SIZES = ["10px", "12px", "14px", "16px", "18px", "20px", "24px", "32px"];

if (typeof window !== "undefined" && Quill) {
  const Size = Quill.import("attributors/style/size") as any;
  if (Size) {
    Size.whitelist = FONT_SIZES;
    Quill.register(Size, true);
  }
}

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  [{ size: ["10px", "12px", false, "16px", "18px", "20px", "24px", "32px"] }],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ align: [] }],
  ["blockquote", "code-block"],
  [{ color: [] }, { background: [] }],
  ["link", "image"],
  ["clean"],
];

export const QuillEditor = forwardRef<QuillEditorHandle, QuillEditorProps>(
  function QuillEditor(
    { value, onChange, placeholder, editorRef, onEditorReady },
    ref
  ) {
    const quillRef = useRef<ReactQuill>(null);

    const getEditorHandle = useCallback((): QuillEditorHandle => {
      return {
        focus: () => {
          quillRef.current?.getEditor()?.focus();
        },
        setCursorToEnd: () => {
          const editor = quillRef.current?.getEditor();
          if (!editor) return;
          editor.focus();
          const length = editor.getLength();
          editor.setSelection(length, 0, "user");
          editor.scrollIntoView();
        },
        insertHtmlAtEnd: (html: string) => {
          const editor = quillRef.current?.getEditor();
          if (!editor) return;

          editor.focus();
          const isEmpty = editor.getText().trim() === "";
          if (isEmpty) {
            editor.setContents([], "silent");
            editor.clipboard.dangerouslyPasteHTML(0, html, "user");
          } else {
            const length = editor.getLength();
            editor.clipboard.dangerouslyPasteHTML(length, html, "user");
          }

          const newLength = editor.getLength();
          editor.setSelection(newLength, 0, "user");
          editor.focus();
          editor.scrollIntoView();

          const newHtml = editor.root.innerHTML;
          onChange(newHtml);
        },
        insertHtmlAtCursor: (html: string) => {
          const editor = quillRef.current?.getEditor();
          if (!editor) return;

          editor.focus();
          const range = editor.getSelection();
          const insertIndex = range ? range.index : editor.getLength();
          editor.clipboard.dangerouslyPasteHTML(insertIndex, html, "user");

          const newLength = editor.getLength();
          editor.setSelection(newLength, 0, "user");
          editor.focus();
          editor.scrollIntoView();

          const newHtml = editor.root.innerHTML;
          onChange(newHtml);
        },
        getEditor: () => quillRef.current?.getEditor() || null,
      };
    }, [onChange]);

    useImperativeHandle(ref, getEditorHandle, [getEditorHandle]);

    useEffect(() => {
      const handle = getEditorHandle();
      if (editorRef) {
        editorRef.current = handle;
      }
      if (onEditorReady) {
        onEditorReady(handle);
      }
      return () => {
        if (editorRef) {
          editorRef.current = null;
        }
      };
    }, [editorRef, onEditorReady, getEditorHandle]);

  const changeFontSize = (direction: "increase" | "decrease") => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const range = quill.getSelection();
    const format = quill.getFormat(range || undefined);
    const currentSize = (format.size as string) || "14px";

    let currentIndex = FONT_SIZES.indexOf(currentSize);
    if (currentIndex === -1) currentIndex = 2; // Default 14px is index 2

    let nextIndex = direction === "increase" ? currentIndex + 1 : currentIndex - 1;
    nextIndex = Math.max(0, Math.min(FONT_SIZES.length - 1, nextIndex));

    const targetSize = FONT_SIZES[nextIndex];
    if (targetSize === "14px") {
      quill.format("size", false);
    } else {
      quill.format("size", targetSize);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      // Increase size shortcuts: Ctrl + ']' or Ctrl + '.' or Ctrl + '>' or Ctrl + '=' or Ctrl + '+'
      if (e.key === "]" || e.key === "." || e.key === ">" || e.key === "=" || e.key === "+") {
        e.preventDefault();
        changeFontSize("increase");
      }
      // Decrease size shortcuts: Ctrl + '[' or Ctrl + ',' or Ctrl + '<' or Ctrl + '-'
      else if (e.key === "[" || e.key === "," || e.key === "<" || e.key === "-") {
        e.preventDefault();
        changeFontSize("decrease");
      }
    }
  };

  return (
    <>
      <style>{`
        /* ─────────────────────────────────────────
           RESET — strip all Quill default chrome
        ───────────────────────────────────────── */
        .qe .ql-toolbar,
        .qe .ql-container {
          border: none !important;
          font-family: inherit;
        }

        /* ─── Toolbar ─── */
        .qe .ql-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 2px;
          padding: 6px 0 10px;
          border-bottom: 1px solid var(--border) !important;
          background: transparent;
        }

        .qe .ql-toolbar .ql-formats {
          display: flex;
          align-items: center;
          gap: 1px;
          margin-right: 6px !important;
        }

        /* Toolbar buttons */
        .qe .ql-toolbar button {
          width: 30px !important;
          height: 30px !important;
          border-radius: 6px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: background 0.15s, opacity 0.15s;
          opacity: 0.55;
        }

        .qe .ql-toolbar button:hover {
          background: var(--muted) !important;
          opacity: 1;
        }

        .qe .ql-toolbar button.ql-active {
          background: var(--muted) !important;
          opacity: 1;
        }

        .qe .ql-toolbar .ql-stroke {
          stroke: var(--foreground) !important;
          stroke-width: 1.5px;
        }

        .qe .ql-toolbar .ql-fill {
          fill: var(--foreground) !important;
        }

        /* Picker labels (Header, Align, Color) */
        .qe .ql-toolbar .ql-picker {
          height: 30px !important;
        }

        .qe .ql-toolbar .ql-picker-label {
          color: var(--foreground) !important;
          border: none !important;
          border-radius: 6px !important;
          opacity: 0.55;
          padding: 0 6px !important;
          height: 30px !important;
          display: flex !important;
          align-items: center !important;
          transition: background 0.15s, opacity 0.15s;
        }

        .qe .ql-toolbar .ql-picker-label:hover,
        .qe .ql-toolbar .ql-picker-label.ql-active {
          background: var(--muted) !important;
          opacity: 1;
        }

        .qe .ql-toolbar .ql-picker-label .ql-stroke {
          stroke: var(--foreground) !important;
        }

        /* Dropdown panels */
        .qe .ql-toolbar .ql-picker-options {
          background: var(--card) !important;
          border: 1px solid var(--border) !important;
          border-radius: 10px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12) !important;
          padding: 4px !important;
          margin-top: 4px;
        }

        .qe .ql-toolbar .ql-picker-item {
          color: var(--foreground) !important;
          border-radius: 6px !important;
          padding: 5px 10px !important;
          font-size: 13px !important;
          transition: background 0.1s;
        }

        .qe .ql-toolbar .ql-picker-item:hover,
        .qe .ql-toolbar .ql-picker-item.ql-selected {
          background: var(--muted) !important;
          color: var(--foreground) !important;
        }

        /* Color swatches */
        .qe .ql-toolbar .ql-color-picker .ql-picker-item {
          width: 18px !important;
          height: 18px !important;
          border-radius: 4px !important;
          padding: 0 !important;
          border: 1px solid var(--border) !important;
        }

        .qe .ql-toolbar .ql-color-picker .ql-picker-options {
          padding: 8px !important;
          width: 184px !important;
        }

        /* ─── Editor body ─── */
        .qe .ql-container {
          font-size: 15.5px;
          line-height: 1.8;
          height: auto !important;
        }

        .qe .ql-editor {
          padding: 20px 0 120px;
          color: var(--foreground);
          caret-color: var(--foreground);
          outline: none !important;
          height: auto !important;
          min-height: 350px;
          overflow-y: visible !important;
        }

        .qe .ql-editor.ql-blank::before {
          font-style: normal !important;
          color: var(--muted-foreground) !important;
          opacity: 0.4;
          left: 0 !important;
          font-size: 15.5px;
        }

        /* ─── Typography ─── */
        .qe .ql-editor p {
          margin: 0 0 0.9em;
        }

        .qe .ql-editor h1 {
          font-size: 1.9rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.2;
          margin: 1.6rem 0 0.7rem;
          color: var(--foreground);
        }

        .qe .ql-editor h2 {
          font-size: 1.4rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          line-height: 1.3;
          margin: 1.3rem 0 0.5rem;
          color: var(--foreground);
        }

        .qe .ql-editor h3 {
          font-size: 1.15rem;
          font-weight: 600;
          line-height: 1.4;
          margin: 1rem 0 0.4rem;
          color: var(--foreground);
        }

        .qe .ql-editor blockquote {
          border-left: 2px solid var(--border);
          margin: 1.2rem 0;
          padding: 0.1rem 0 0.1rem 1.1rem;
          color: var(--muted-foreground);
          font-style: italic;
        }

        .qe .ql-editor pre.ql-syntax {
          background: var(--muted) !important;
          color: var(--foreground) !important;
          border-radius: 10px;
          padding: 1rem 1.2rem;
          font-size: 0.85rem;
          line-height: 1.6;
          overflow-x: auto;
          margin: 1rem 0;
        }

        .qe .ql-editor code {
          background: var(--muted);
          border-radius: 5px;
          padding: 0.1em 0.4em;
          font-size: 0.875em;
        }

        .qe .ql-editor a {
          color: var(--foreground);
          text-decoration: underline;
          text-underline-offset: 3px;
          text-decoration-thickness: 1px;
          opacity: 0.8;
        }

        .qe .ql-editor ul,
        .qe .ql-editor ol {
          padding-left: 1.4rem;
          margin: 0.2rem 0 0.9rem;
        }

        .qe .ql-editor li {
          margin-bottom: 0.25rem;
        }

        .qe .ql-editor img {
          max-width: 100%;
          border-radius: 10px;
          margin: 0.75rem 0;
        }

        /* ─── Tooltip (link editor) ─── */
        .ql-tooltip {
          background: var(--card) !important;
          border: 1px solid var(--border) !important;
          border-radius: 10px !important;
          color: var(--foreground) !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
          padding: 8px 12px !important;
        }

        .ql-tooltip input[type="text"] {
          background: var(--muted) !important;
          color: var(--foreground) !important;
          border: 1px solid var(--border) !important;
          border-radius: 6px;
          outline: none;
          padding: 4px 8px;
        }

        .ql-tooltip a.ql-action,
        .ql-tooltip a.ql-remove {
          color: var(--muted-foreground) !important;
          font-size: 12px;
        }

        /* ─── Snow theme overrides ─── */
        .ql-snow .ql-tooltip.ql-editing a.ql-action::after {
          content: "Save";
        }

        .ql-snow .ql-tooltip a.ql-action::after {
          content: "Edit";
        }

        .ql-snow .ql-tooltip a.ql-remove::before {
          content: "Remove";
          margin-left: 8px;
        }

        /* ─── Font size picker labels (numerical values) ─── */
        .qe .ql-snow .ql-picker.ql-size .ql-picker-label::before,
        .qe .ql-snow .ql-picker.ql-size .ql-picker-item::before {
          content: '14px' !important;
        }
        .qe .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="10px"]::before,
        .qe .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="10px"]::before {
          content: '10px' !important;
        }
        .qe .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="12px"]::before,
        .qe .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="12px"]::before {
          content: '12px' !important;
        }
        .qe .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="14px"]::before,
        .qe .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="14px"]::before {
          content: '14px' !important;
        }
        .qe .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="16px"]::before,
        .qe .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="16px"]::before {
          content: '16px' !important;
        }
        .qe .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="18px"]::before,
        .qe .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="18px"]::before {
          content: '18px' !important;
        }
        .qe .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="20px"]::before,
        .qe .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="20px"]::before {
          content: '20px' !important;
        }
        .qe .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="24px"]::before,
        .qe .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="24px"]::before {
          content: '24px' !important;
        }
        .qe .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="32px"]::before,
        .qe .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="32px"]::before {
          content: '32px' !important;
        }
      `}</style>

      <div className="qe" onKeyDown={handleKeyDown}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={(content, delta, source) => {
            // Only propagate user-initiated typing and editing events (ignore programmatic reset)
            if (source === "user") {
              onChange(content);
            }
          }}
          placeholder={placeholder || "Write something…"}
          modules={{ toolbar: TOOLBAR_OPTIONS }}
          formats={[
            "header",
            "size",
            "bold", "italic", "underline", "strike",
            "color", "background",
            "align",
            "list", "indent",
            "blockquote", "code-block",
            "link", "image",
          ]}
        />
      </div>
    </>
  );
});
