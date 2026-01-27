import { EdgeTypes, MarkerType } from 'reactflow';

export function getDefaultEdgeOptionsForMode(mode: 'flow' | 'mindmap') {
  if (mode === 'flow') {
    return {
      type: 'smoothstep' as const,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { strokeWidth: 2 },
    } as const;
  }

  // mindmap
  return {
    type: 'bezier' as const,
    markerEnd: undefined,
    style: { strokeWidth: 1.5, stroke: '#888' },
  } as const;
}
