import React from 'react';
import { NodeProps } from 'reactflow';
import styles from './DiagramEditor.module.css';

type Data = { label: string; variant?: 'process' | 'startend' | 'decision' };

const ProcessNode: React.FC<NodeProps<Data>> = ({ id, data }) => {
  const variant = data.variant || 'process';
  const label = data.label || '';

  // Use an SVG to draw different shapes cleanly
  return (
    <div className={styles.processNode} data-variant={variant}>
      {variant === 'startend' && (
        <svg width="160" height="60">
          <ellipse cx="80" cy="30" rx="74" ry="26" fill="#fff" stroke="#333" />
          <text x="80" y="34" textAnchor="middle" style={{ fontSize: 13 }}>
            {label}
          </text>
        </svg>
      )}

      {variant === 'process' && (
        <svg width="160" height="60">
          <rect x="4" y="8" width="152" height="44" rx="6" fill="#fff" stroke="#333" />
          <text x="80" y="36" textAnchor="middle" style={{ fontSize: 13 }}>
            {label}
          </text>
        </svg>
      )}

      {variant === 'decision' && (
        <svg width="120" height="80">
          <g transform="translate(60,40) rotate(45)">
            <rect x="-40" y="-24" width="80" height="48" rx="2" fill="#fff" stroke="#333" />
            <text x="0" y="6" textAnchor="middle" transform="rotate(-45)" style={{ fontSize: 12 }}>
              {label}
            </text>
          </g>
        </svg>
      )}
    </div>
  );
};

export default ProcessNode;
