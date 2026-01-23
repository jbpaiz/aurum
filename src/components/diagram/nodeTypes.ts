import React from 'react';
import { NodeTypes } from 'reactflow';
import ProcessNode from './ProcessNode';
import MindMapNode from './MindMapNode';

// Map node type keys used in DiagramEditor to the React components
export const nodeTypes: NodeTypes = {
  processNode: ProcessNode,
  startEndNode: (props) => React.createElement(ProcessNode as any, { ...props, data: { ...(props as any).data, variant: 'startend' } }),
  decisionNode: (props) => React.createElement(ProcessNode as any, { ...props, data: { ...(props as any).data, variant: 'decision' } }),
  mindMapNode: MindMapNode,
};
