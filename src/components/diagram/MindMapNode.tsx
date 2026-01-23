"use client"

"use client"

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { NodeProps } from 'reactflow';
import styles from './DiagramEditor.module.css';

type Data = { label: string; onAddChild?: (parentId: string) => void; onEdit?: (id: string, label: string) => void };

const MindMapNode: React.FC<NodeProps<Data>> = ({ id, data }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(data.label || '');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setValue(data.label || '');
  }, [data.label]);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const onAdd = useCallback(() => {
    data.onAddChild && data.onAddChild(id);
  }, [data, id]);

  const onDoubleClick = useCallback(() => {
    setEditing(true);
  }, []);

  const commit = useCallback(() => {
    setEditing(false);
    if (data.onEdit && value.trim()) {
      data.onEdit(id, value.trim());
    }
  }, [data, id, value]);

  return (
    <div className={styles.mindNode} onDoubleClick={onDoubleClick}>
      {editing ? (
        <input
          ref={inputRef}
          className={styles.mindInput}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
        />
      ) : (
        <div className={styles.mindLabel}>{data.label}</div>
      )}

      <button className={styles.addChildBtn} onClick={onAdd} aria-label="Adicionar filho">
        +
      </button>
    </div>
  );
};

export default MindMapNode;
