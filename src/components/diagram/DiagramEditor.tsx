"use client"

import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  ReactFlowInstance,
  OnConnect,
} from 'reactflow';
import 'reactflow/dist/style.css';

import styles from './DiagramEditor.module.css';
import { nodeTypes } from './nodeTypes';
import { getDefaultEdgeOptionsForMode } from './edgeTypes';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { saveDiagram, listDiagrams, loadDiagram, Diagram } from '@/lib/diagram-service';

type Mode = 'flow' | 'mindmap';

let id = 0;
const getId = () => `node_${id++}`;

export default function DiagramEditor() {
  const [mode, setMode] = useState<Mode>('flow');
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // Nodes & edges state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);

  // Use a ref to avoid circular capture between createMindNodeData and createMindChild
  const createMindChildRef = useRef<(parentId: string) => void>(() => {});

  const createMindNodeData = useCallback(
    (label = 'Novo') => ({
      label,
      onAddChild: (parentId: string) => createMindChildRef.current(parentId),
      onEdit: (nodeId: string, newLabel: string) => {
        setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel } } : n)));
      },
    }),
    [setNodes]
  );

  // Helpers for mindmap layout
  const findRootNode = useCallback(() => {
    // root is node with no incoming edges
    const targets = new Set(edges.map((e) => e.target));
    return nodes.find((n) => !targets.has(n.id) && n.type === 'mindMapNode');
  }, [nodes, edges]);

  const layoutMindmap = useCallback(
    (rootId: string) => {
      if (!reactFlowInstance) return;

      // Build adjacency list
      const adj: Record<string, string[]> = {};
      edges.forEach((e) => {
        if (!adj[e.source]) adj[e.source] = [];
        adj[e.source].push(e.target);
      });

      const baseRadius = 140;

      const doLayout = (parentId: string, centerAngle: number, span: number, depth: number) => {
        const children = adj[parentId] || [];
        if (!children.length) return;

        children.forEach((childId, i) => {
          const angle = centerAngle - span / 2 + (i + 0.5) * (span / children.length);
          const radius = baseRadius * depth;
          const parentNode = nodes.find((n) => n.id === parentId);
          if (!parentNode) return;
          const parentPos = parentNode.position;
          const newPos = { x: parentPos.x + Math.cos(angle) * radius, y: parentPos.y + Math.sin(angle) * radius };

          setNodes((nds) => nds.map((n) => (n.id === childId ? { ...n, position: newPos, data: { ...(n.data as any), angle, depth } } : n)));

          // Recurse into subtree with a narrower span
          doLayout(childId, angle, span * 0.6, depth + 1);
        });
      };

      const rootNode = nodes.find((n) => n.id === rootId);
      if (!rootNode) return;

      // Root children are arranged around full circle
      doLayout(rootId, 0, Math.PI * 2, 1);

      // Fit view to show the whole mindmap
      setTimeout(() => reactFlowInstance.fitView({ padding: 0.2 }), 50);
    },
    [nodes, edges, reactFlowInstance, setNodes]
  );

  const createMindChild = useCallback(
    (parentId: string) => {
      const parent = nodes.find((n) => n.id === parentId);
      if (!parent || !reactFlowWrapper.current || !reactFlowInstance) return;

      // Create child with temporary position; will be repositioned by layout
      const childId = getId();
      const childNode: Node = {
        id: childId,
        type: 'mindMapNode',
        position: { x: parent.position.x + 140, y: parent.position.y },
        data: createMindNodeData('Novo'),
      };

      const newEdge: Edge = {
        id: `edge_${parentId}_${childId}`,
        source: parentId,
        target: childId,
        type: 'bezier',
      };

      setNodes((nds) => nds.concat(childNode));
      setEdges((eds) => eds.concat(newEdge));

      // After adding, run a layout pass to position nodes nicely
      setTimeout(() => {
        const root = findRootNode();
        if (root) layoutMindmap(root.id);
      }, 16);
    },
    [nodes, reactFlowInstance, setEdges, setNodes, findRootNode, layoutMindmap, createMindNodeData]
  );

  // Keep the ref up-to-date so createMindNodeData can call the current implementation
  useEffect(() => {
    createMindChildRef.current = createMindChild;
  }, [createMindChild]);

  const onInit = useCallback((rfi: ReactFlowInstance) => {
    setReactFlowInstance(rfi);
  }, []);

  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: mode === 'flow' ? 'smoothstep' : 'bezier',
            markerEnd: mode === 'flow' ? { type: MarkerType.ArrowClosed } : undefined,
          },
          eds
        )
      );
    },
    [mode, setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const data = event.dataTransfer.getData('application/reactflow');
      if (!data) return;
      const parsed = JSON.parse(data);

      // Only allow sidebar drop in flow mode
      if (mode !== 'flow') return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: getId(),
        type:
          parsed.variant === 'startend'
            ? 'startEndNode'
            : parsed.variant === 'decision'
            ? 'decisionNode'
            : 'processNode',
        position,
        data: { label: parsed.label || 'Nodo' },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, mode, setNodes]
  );

  const centerRoot = useCallback(() => {
    const root = findRootNode();
    if (root && reactFlowInstance) reactFlowInstance.setCenter(root.position.x, root.position.y, { zoom: 1 });
  }, [findRootNode, reactFlowInstance]);

  const { user } = useAuth()
  const { toast } = useToast()

  const [currentDiagramId, setCurrentDiagramId] = useState<string | null>(null)
  const [currentTitle, setCurrentTitle] = useState<string>('')
  const [openList, setOpenList] = useState(false)
  const [listItems, setListItems] = useState<Array<{ id: string; title?: string }>>([])

  const saveToSupabase = useCallback(async (asCopy = false) => {
    if (!user) {
      // Fallback: localStorage
      const id = `aurum.diagram.${Date.now()}`
      const payload = { id, title: currentTitle || 'Sem título', nodes, edges }
      localStorage.setItem(id, JSON.stringify(payload))
      toast({ title: 'Salvo localmente', description: 'Diagrama salvo no localStorage (usuário não autenticado).' })
      return
    }

    const payload: Diagram = {
      id: asCopy ? undefined : currentDiagramId || undefined,
      userId: user.id,
      title: currentTitle || 'Sem título',
      nodes,
      edges,
    }

    const { data, error } = await saveDiagram(payload)
    if (error) {
      toast({ title: 'Erro ao salvar', description: String(error) })
      return
    }

    setCurrentDiagramId(data?.id || null)
    setCurrentTitle(data?.title || '')
    toast({ title: 'Diagrama salvo', description: 'Diagrama salvo com sucesso.' })
  }, [user, currentDiagramId, nodes, edges, toast, currentTitle])

  const openDialog = useCallback(async () => {
    if (!user) {
      toast({ title: 'Login necessário', description: 'Faça login para salvar/abrir diagramas no servidor.' })
      return
    }

    const { data, error } = await listDiagrams(user.id)
    if (error) {
      toast({ title: 'Erro ao listar', description: String(error) })
      return
    }

    setListItems((data || []).map((d: any) => ({ id: d.id, title: d.title })))
    setOpenList(true)
  }, [user, toast])

  const loadFromServer = useCallback(async (id: string) => {
    const { data, error } = await loadDiagram(id)
    if (error || !data) {
      toast({ title: 'Erro ao carregar', description: String(error) })
      return
    }

    setNodes(() => data.nodes)
    setEdges(() => data.edges)
    setCurrentDiagramId(data.id || null)
    setCurrentTitle(data.title || '')
    setOpenList(false)
    // re-run layout for mindmap
    if (mode === 'mindmap') {
      const root = findRootNode()
      if (root) layoutMindmap(root.id)
    }

    setTimeout(() => reactFlowInstance?.fitView({ padding: 0.2 }), 50)
    toast({ title: 'Diagrama carregado', description: data.title || 'Diagrama aberto com sucesso.' })
  }, [toast, setNodes, setEdges, layoutMindmap, findRootNode, mode, reactFlowInstance])

  const onSave = useCallback(() => {
    // shortcut: save (update or insert)
    saveToSupabase(false)
  }, [saveToSupabase])


  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.modeButtons}>
          <button
            className={mode === 'flow' ? styles.active : ''}
            onClick={() => setMode('flow')}
            aria-pressed={mode === 'flow'}
          >
            Fluxograma
          </button>
          <button
            className={mode === 'mindmap' ? styles.active : ''}
            onClick={() => setMode('mindmap')}
            aria-pressed={mode === 'mindmap'}
          >
            Mapa Mental
          </button>
        </div>

        <div className={styles.actions}>
          <input
            className={styles.titleInput}
            placeholder="Título do diagrama"
            value={currentTitle}
            onChange={(e) => setCurrentTitle(e.target.value)}
          />

          <div className={styles.actionButtons}>
            <Button size="sm" onClick={onSave}>Salvar</Button>
            <Button size="sm" variant="outline" onClick={() => saveToSupabase(true)}>Salvar como</Button>
            <Button size="sm" variant="ghost" onClick={() => openDialog()}>Abrir</Button>
          </div>
        </div>
      </div>

      <div className={styles.main} ref={reactFlowWrapper}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTitle}>Componentes</div>

          {mode === 'flow' ? (
            <>
              <div
                className={styles.draggable}
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData(
                    'application/reactflow',
                    JSON.stringify({ variant: 'startend', label: 'Início/Fim' })
                  )
                }
              >
                Início / Fim
              </div>

              <div
                className={styles.draggable}
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData(
                    'application/reactflow',
                    JSON.stringify({ variant: 'process', label: 'Processo' })
                  )
                }
              >
                Processo
              </div>

              <div
                className={styles.draggable}
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData(
                    'application/reactflow',
                    JSON.stringify({ variant: 'decision', label: 'Decisão' })
                  )
                }
              >
                Decisão
              </div>

              <div className={styles.hint}>Arraste para o canvas para criar nós.</div>
            </>
          ) : (
            <>
              <div className={styles.sidebarBody}>
                <p>Modo Mapa Mental</p>
                <p className={styles.hint}>Clique no <strong>+</strong> em um nó para criar um filho.</p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={() => {
                    // reset mindmap: clear and recreate root
                    if (!reactFlowWrapper.current || !reactFlowInstance) return;
                    setNodes([]);
                    setEdges([]);
                    const bounds = reactFlowWrapper.current.getBoundingClientRect();
                    const position = reactFlowInstance.project({ x: bounds.width / 2, y: bounds.height / 2 });
                    const rootId = getId();
                    const rootNode: Node = { id: rootId, type: 'mindMapNode', position, data: createMindNodeData('Raiz') };
                    setNodes((nds) => nds.concat(rootNode));
                    setTimeout(() => reactFlowInstance.fitView({ padding: 0.2 }), 50);
                  }}>Criar nó raiz</Button>

                  <Button size="sm" variant="outline" onClick={() => {
                    const root = findRootNode();
                    if (root) layoutMindmap(root.id);
                  }}>Organizar</Button>

                  <Button size="sm" variant="ghost" onClick={() => centerRoot()}>Centralizar raiz</Button>
                </div>
              </div>
            </>
          )}
        </aside>

        <div className={styles.canvas} onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={onInit}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
            defaultEdgeOptions={getDefaultEdgeOptionsForMode(mode)}
          >
            <MiniMap />
            <Controls />
            <Background gap={12} />
          </ReactFlow>

          {openList && (
            <div className={styles.openListOverlay} role="dialog">
              <div className={styles.openList}>
                <h3>Abrir Diagrama</h3>
                <ul>
                  {listItems.map((it) => (
                    <li key={it.id}>
                      <button className={styles.openItem} onClick={() => loadFromServer(it.id)}>
                        {it.title || 'Sem título'}
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-2">
                  <Button size="sm" variant="ghost" onClick={() => setOpenList(false)}>Fechar</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
