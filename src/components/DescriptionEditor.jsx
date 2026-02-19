import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { useEffect } from 'react';

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  const btn = (label, action, isActive) => (
    <button
      type="button"
      className={`wf-rte__btn ${isActive ? 'wf-rte__btn--active' : ''}`}
      onMouseDown={(e) => {
        e.preventDefault();
        action();
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="wf-rte__toolbar">
      {btn('B', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
      {btn('I', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
      {btn('U', () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'))}
      <span className="wf-rte__sep" />
      {btn('H1', () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive('heading', { level: 1 }))}
      {btn('H2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
      {btn('H3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}
      <span className="wf-rte__sep" />
      {btn('List', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
    </div>
  );
};

export default function DescriptionEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
  });

  // Sync when switching selected nodes
  useEffect(() => {
    if (editor && !editor.isFocused) {
      const current = editor.getHTML();
      const incoming = value || '';
      if (incoming !== current && incoming !== (current === '<p></p>' ? '' : current)) {
        editor.commands.setContent(incoming, false);
      }
    }
  }, [value, editor]);

  return (
    <div className="wf-rte">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="wf-rte__content" />
    </div>
  );
}
