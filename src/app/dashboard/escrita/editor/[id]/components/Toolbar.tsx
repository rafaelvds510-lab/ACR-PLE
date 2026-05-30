'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import styles from '../editor.module.css';
import {
  Bold, Italic, Strikethrough, Underline as UnderlineIcon,
  List, ListOrdered,
  Quote, Minus, Table, AlignLeft, AlignCenter, AlignRight,
  Highlighter, Code, Undo, Redo
} from 'lucide-react';
import { FontSize } from '@/components/editor/extensions/FontSizeExtension';

interface ToolbarProps {
  editor: Editor | null;
}

const ToolbarBtn = ({
  onClick, active, title, disabled, children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}) => (
  <button
    onMouseDown={e => { e.preventDefault(); onClick(); }}
    className={`${styles.tbBtn} ${active ? styles.tbBtnActive : ''}`}
    title={title}
    disabled={disabled}
    type="button"
  >
    {children}
  </button>
);

export default function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null;

  const insertTable = () =>
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();

  return (
    <div className={styles.editorToolbar}>
      {/* Fonts and Sizes */}
      <div className={styles.tbGroup}>
        <select 
          className={styles.tbDropdown}
          onChange={(e) => editor?.chain().focus().setFontFamily(e.target.value).run()}
          style={{ width: '120px' }}
        >
          <option value="Inter">Inter</option>
          <option value="Arial">Arial</option>
          <option value="Arial Black">Arial Black</option>
          <option value="Calibri">Calibri</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
          <option value="Courier New">Courier New</option>
          <option value="Times New Roman">Times New Roman</option>
        </select>

        <select 
          className={styles.tbDropdown}
          onChange={(e) => editor?.chain().focus().setFontSize(e.target.value).run()}
          defaultValue="16px"
        >
          <option value="8px">8</option>
          <option value="9px">9</option>
          <option value="10px">10</option>
          <option value="11px">11</option>
          <option value="12px">12</option>
          <option value="14px">14</option>
          <option value="16px">16</option>
          <option value="18px">18</option>
          <option value="20px">20</option>
          <option value="24px">24</option>
          <option value="28px">28</option>
          <option value="32px">32</option>
          <option value="36px">36</option>
          <option value="48px">48</option>
        </select>
      </div>

      <span className={styles.tbDivider} />

      {/* Inline Formatting */}
      <div className={styles.tbGroup}>
        <ToolbarBtn title="Negrito" active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={15} />
        </ToolbarBtn>
        <ToolbarBtn title="Itálico" active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={15} />
        </ToolbarBtn>
        <ToolbarBtn title="Sublinhado" active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={15} />
        </ToolbarBtn>
        
        <ToolbarBtn title="Realce" active={editor.isActive('highlight')}
          onClick={() => editor.chain().focus().toggleHighlight({ color: '#ffff00' }).run()}>
          <Highlighter size={15} />
        </ToolbarBtn>

        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginLeft: '8px', borderLeft: '1px solid #ddd', paddingLeft: '8px' }}>
          {['#000000', '#ffffff', '#4285F4', '#DB4437', '#0F9D58', '#F4B400'].map(c => (
            <div
              key={c}
              onClick={() => editor?.chain().focus().setColor(c).run()}
              style={{ 
                width: 14, 
                height: 14, 
                backgroundColor: c, 
                borderRadius: '50%', 
                cursor: 'pointer',
                border: '1px solid #ccc'
              }}
              title={c}
            />
          ))}
          <input 
            type="color" 
            style={{ width: 18, height: 18, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', marginLeft: '4px' }}
            onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
            title="Mais Cores"
          />
        </div>
      </div>

      <span className={styles.tbDivider} />

      {/* Lists */}
      <div className={styles.tbGroup}>
        <ToolbarBtn title="Bullets" active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={15} />
        </ToolbarBtn>
        <ToolbarBtn title="Numeração" active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={15} />
        </ToolbarBtn>
      </div>

      <span className={styles.tbDivider} />

      {/* History */}
      <div className={styles.tbGroup}>
        <ToolbarBtn title="Desfazer" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo size={15} />
        </ToolbarBtn>
        <ToolbarBtn title="Refazer" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo size={15} />
        </ToolbarBtn>
      </div>

      <span className={styles.tbDivider} />

      {/* Other Tools */}
      <div className={styles.tbGroup}>
        <ToolbarBtn title="Alinhar à esquerda" active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft size={15} />
        </ToolbarBtn>
        <ToolbarBtn title="Centralizar" active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter size={15} />
        </ToolbarBtn>
        <ToolbarBtn title="Alinhar à direita" active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight size={15} />
        </ToolbarBtn>
        <ToolbarBtn title="Inserir tabela" onClick={insertTable}>
          <Table size={15} />
        </ToolbarBtn>
      </div>
    </div>
  );
}
