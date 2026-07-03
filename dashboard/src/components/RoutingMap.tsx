import {
  Background,
  Controls,
  Handle,
  MiniMap,
  type NodeProps,
  type NodeTypes,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { type CSSProperties, useEffect, useMemo } from "react";
import {
  buildRoutingGraph,
  type RoutingGraphChat,
  type RoutingGraphConfig,
  type RoutingGraphEdge,
  type RoutingGraphEventOption,
  type RoutingGraphNode,
  type RoutingGraphUser,
} from "./routingGraph";

export interface RoutingMapProps {
  appName: string;
  routing: RoutingGraphConfig;
  eventOptions: RoutingGraphEventOption[];
  chats?: RoutingGraphChat[];
  users?: RoutingGraphUser[];
  className?: string;
  style?: CSSProperties;
}

const nodeTypes = {
  routing: RoutingMapNode,
} satisfies NodeTypes;

const hiddenHandleStyle = {
  opacity: 0,
  pointerEvents: "none",
} satisfies CSSProperties;

export function RoutingMap({
  appName,
  routing,
  eventOptions,
  chats,
  users,
  className,
  style,
}: RoutingMapProps) {
  const { nodes, edges } = useMemo(
    () => buildRoutingGraph({ appName, routing, eventOptions, chats, users }),
    [appName, routing, eventOptions, chats, users],
  );

  const flowNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        type: "routing",
      })),
    [nodes],
  );

  const flowEdges = useMemo(
    () =>
      edges.map((edge) => ({
        ...edge,
        selectable: false,
        reconnectable: false,
        className:
          edge.data?.kind === "default"
            ? "routing-map-edge default"
            : "routing-map-edge",
        style:
          edge.data?.kind === "default"
            ? { strokeDasharray: "6 5" }
            : undefined,
      })),
    [edges],
  );
  const [graphNodes, setGraphNodes, onNodesChange] =
    useNodesState<RoutingGraphNode>([]);
  const [graphEdges, setGraphEdges, onEdgesChange] =
    useEdgesState<RoutingGraphEdge>([]);

  useEffect(() => {
    setGraphNodes(flowNodes);
  }, [flowNodes, setGraphNodes]);

  useEffect(() => {
    setGraphEdges(flowEdges);
  }, [flowEdges, setGraphEdges]);

  return (
    <section
      className={["routing-map", className].filter(Boolean).join(" ")}
      style={{ height: 360, ...style }}
      aria-label={`${appName} routing map`}
    >
      <ReactFlow<RoutingGraphNode, RoutingGraphEdge>
        nodes={graphNodes}
        edges={graphEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        defaultViewport={{ x: 80, y: 70, zoom: 0.92 }}
        minZoom={0.35}
        maxZoom={1.35}
        nodesDraggable
        nodesConnectable={false}
        edgesReconnectable={false}
        deleteKeyCode={null}
        multiSelectionKeyCode={null}
        selectionKeyCode={null}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={18} size={1} />
        <MiniMap pannable zoomable className="routing-map-minimap" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </section>
  );
}

function RoutingMapNode({ data }: NodeProps<RoutingGraphNode>) {
  return (
    <div
      className={`routing-map-node routing-map-node-${data.kind}`}
      title={`${data.label}\n${data.subtitle}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={false}
        style={hiddenHandleStyle}
      />
      <span className="routing-map-node-label">{data.label}</span>
      <span className="routing-map-node-subtitle">{data.subtitle}</span>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={false}
        style={hiddenHandleStyle}
      />
    </div>
  );
}
