"use client";

import { useRef } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Minimal toolbar — Bold/Italic/Underline removed (use Ctrl+B / Ctrl+I / Ctrl+U)
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ align: [] }],
  ["blockquote", "code-block"],
  [{ color: [] }, { background: [] }],
  ["link", "image"],
  ["clean"],
];

export function QuillEditor({ value, onChange, placeholder }: QuillEditorProps) {
  const quillRef = useRef<ReactQuill>(null);

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
        }

        .qe .ql-editor {
          padding: 20px 0 120px;
          color: var(--foreground);
          caret-color: var(--foreground);
          outline: none !important;
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
      `}</style>

      <div className="qe">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          placeholder={placeholder || "Write something…"}
          modules={{ toolbar: TOOLBAR_OPTIONS }}
          formats={[
            "header",
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
}
