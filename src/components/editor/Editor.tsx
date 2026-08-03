'use client';

import { useEditor, EditorContent, type Editor as TipTapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import yaml from 'highlight.js/lib/languages/yaml';
import { useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

const lowlight = createLowlight();
lowlight.register({ bash, json, python, sql, typescript, yaml });

const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'bash', label: 'Bash' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'sql', label: 'SQL' },
  { value: 'yaml', label: 'YAML' },
  { value: 'json', label: 'JSON' },
];

interface Props {
  /** HTML initial. */
  value: string;
  /** Appelé à chaque frappe : le parent garde le HTML pour l'enregistrement. */
  onChange: (html: string) => void;
  /** Upload d'une image déposée dans l'éditeur ; renvoie l'URL publique. */
  onUploadImage?: (file: File) => Promise<string | null>;
}

function ToolbarButton({
  active,
  label,
  onClick,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'border-line rounded border px-2 py-1 font-mono text-xs',
        active ? 'border-accent text-accent' : 'text-muted hover:text-text',
      )}
    >
      {label}
    </button>
  );
}

function Toolbar({
  editor,
  onPickImage,
}: {
  editor: TipTapEditor;
  onPickImage: () => void;
}) {
  const setLink = useCallback(() => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL du lien', previous ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="border-line flex flex-wrap items-center gap-1 border-b p-2">
      <ToolbarButton
        label="H2"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        label="H3"
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />
      <ToolbarButton
        label="Gras"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label="Italique"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        label="Liste"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        label="1. Liste"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        label="Citation"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton label="Lien" active={editor.isActive('link')} onClick={setLink} />
      <ToolbarButton label="Image" onClick={onPickImage} />
      <ToolbarButton
        label="Code"
        active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      />

      {editor.isActive('codeBlock') && (
        <select
          aria-label="Langage du bloc de code"
          className="border-line rounded border px-2 py-1 font-mono text-xs"
          value={(editor.getAttributes('codeBlock').language as string) || 'python'}
          onChange={(e) =>
            editor.chain().focus().updateAttributes('codeBlock', { language: e.target.value }).run()
          }
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export function Editor({ value, onChange, onUploadImage }: Props) {
  const editor = useEditor({
    immediatelyRender: false, // requis en SSR Next.js
    extensions: [
      /* StarterKit embarque déjà codeBlock et link : on les désactive pour
         installer nos versions configurées (coloration, pas d'ouverture au clic). */
      StarterKit.configure({ codeBlock: false, link: false }),
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: 'python' }),
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose-editor min-h-80 px-4 py-3 focus:outline-none',
      },
      /* Glisser-déposer d'une image directement dans l'éditeur. */
      handleDrop(view, event) {
        const file = event.dataTransfer?.files?.[0];
        if (!file || !file.type.startsWith('image/') || !onUploadImage) return false;
        event.preventDefault();
        void onUploadImage(file).then((url) => {
          if (url) editor?.chain().focus().setImage({ src: url }).run();
        });
        return true;
      },
      handlePaste(view, event) {
        const file = event.clipboardData?.files?.[0];
        if (!file || !file.type.startsWith('image/') || !onUploadImage) return false;
        event.preventDefault();
        void onUploadImage(file).then((url) => {
          if (url) editor?.chain().focus().setImage({ src: url }).run();
        });
        return true;
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  /* Recharge le contenu si le parent change de document (changement d'entrée). */
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
    // On ne veut réagir qu'au changement de `value` venant du parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const pickImage = useCallback(() => {
    if (!onUploadImage) {
      window.alert("L'upload d'images sera disponible une fois Cloudinary configuré.");
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const url = await onUploadImage(file);
      if (url) editor?.chain().focus().setImage({ src: url }).run();
    };
    input.click();
  }, [editor, onUploadImage]);

  if (!editor) return <div className="border-line h-96 rounded-md border" />;

  return (
    <div className="border-line overflow-hidden rounded-md border bg-white">
      <Toolbar editor={editor} onPickImage={pickImage} />
      <EditorContent editor={editor} />
    </div>
  );
}
