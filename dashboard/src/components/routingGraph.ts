import { type Edge, MarkerType, type Node, Position } from "@xyflow/react";

export type RoutingGraphDestinationKind = "chat" | "dm";

export interface RoutingGraphDestination {
  kind: RoutingGraphDestinationKind;
  target: string;
}

export interface RoutingGraphRule {
  match: string;
  events: string[];
  destinations: RoutingGraphDestination[];
}

export interface RoutingGraphConfig {
  rules: RoutingGraphRule[];
  default_destinations: RoutingGraphDestination[];
}

export interface RoutingGraphEventOption {
  value: string;
  label: string;
}

export interface RoutingGraphChat {
  chat_id: string;
  name: string;
}

export interface RoutingGraphUser {
  open_id: string;
  name: string;
}

export type RoutingGraphNodeKind =
  | "source"
  | "event"
  | "rule"
  | "destination"
  | "default"
  | "drop";

export type RoutingGraphColumn = "source" | "event" | "rule" | "destination";

export interface RoutingGraphColumnDefinition {
  key: RoutingGraphColumn;
  label: string;
  x: number;
}

export interface RoutingGraphNodeKindDefinition {
  kind: RoutingGraphNodeKind;
  column: RoutingGraphColumn;
  label: string;
}

export interface RoutingGraphNodeData extends Record<string, unknown> {
  label: string;
  subtitle: string;
  kind: RoutingGraphNodeKind;
  column: RoutingGraphColumn;
}

export interface RoutingGraphEdgeData extends Record<string, unknown> {
  kind: "routing" | "default";
}

export type RoutingGraphNode = Node<RoutingGraphNodeData>;
export type RoutingGraphEdge = Edge<RoutingGraphEdgeData>;

export interface BuildRoutingGraphArgs {
  appName: string;
  routing: RoutingGraphConfig;
  eventOptions: RoutingGraphEventOption[];
  chats?: RoutingGraphChat[];
  users?: RoutingGraphUser[];
}

export interface RoutingGraphResult {
  nodes: RoutingGraphNode[];
  edges: RoutingGraphEdge[];
}

export const ROUTING_GRAPH_COLUMNS = [
  { key: "source", label: "Source", x: 0 },
  { key: "event", label: "Event", x: 210 },
  { key: "rule", label: "Rule", x: 430 },
  { key: "destination", label: "Destination", x: 660 },
] as const satisfies readonly RoutingGraphColumnDefinition[];

export const ROUTING_GRAPH_NODE_KINDS = [
  { kind: "source", column: "source", label: "Source" },
  { kind: "event", column: "event", label: "Event" },
  { kind: "rule", column: "rule", label: "Rule" },
  { kind: "default", column: "rule", label: "Default" },
  { kind: "destination", column: "destination", label: "Destination" },
  { kind: "drop", column: "destination", label: "Dropped" },
] as const satisfies readonly RoutingGraphNodeKindDefinition[];

const ROW_GAP = {
  event: 125,
  rule: 145,
  destination: 105,
};

const ALL_EVENTS = "*";

export function buildRoutingGraph({
  appName,
  routing,
  eventOptions,
  chats,
  users,
}: BuildRoutingGraphArgs): RoutingGraphResult {
  const nodes: RoutingGraphNode[] = [];
  const edges: RoutingGraphEdge[] = [];
  const edgeKeys = new Set<string>();
  const eventLabels = new Map(
    eventOptions
      .map((event) => ({
        value: event.value.trim(),
        label: event.label.trim() || event.value.trim(),
      }))
      .filter((event) => event.value.length > 0)
      .map((event) => [event.value, event.label]),
  );
  const chatLabels = new Map(
    (chats ?? [])
      .map((chat) => ({
        id: chat.chat_id.trim(),
        name: chat.name.trim() || chat.chat_id.trim(),
      }))
      .filter((chat) => chat.id.length > 0)
      .map((chat) => [chat.id, chat.name]),
  );
  const userLabels = new Map(
    (users ?? [])
      .map((user) => ({
        id: user.open_id.trim(),
        name: user.name.trim() || user.open_id.trim(),
      }))
      .filter((user) => user.id.length > 0)
      .map((user) => [user.id, user.name]),
  );
  const destinationIds = new Map<string, string>();
  const usedDestinationRows = new Set<number>();
  let edgeCount = 0;

  const addNode = (
    id: string,
    kind: RoutingGraphNodeKind,
    label: string,
    subtitle: string,
    y: number,
  ) => {
    const column = columnForKind(kind);
    nodes.push({
      id,
      position: { x: xForColumn(column), y },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: { label, subtitle, kind, column },
    });
  };

  const addEdge = (
    source: string,
    target: string,
    kind: RoutingGraphEdgeData["kind"] = "routing",
  ) => {
    const edgeKey = `${source}->${target}:${kind}`;
    if (edgeKeys.has(edgeKey)) return;
    edgeKeys.add(edgeKey);
    edgeCount += 1;
    edges.push({
      id: `edge-${edgeCount}`,
      source,
      target,
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed },
      data: { kind },
    });
  };

  const normalizedRules = routing.rules.map((rule) => ({
    ...rule,
    events: normalizeEvents(rule.events),
  }));
  const eventValues = unique(normalizedRules.flatMap((rule) => rule.events));
  const eventIds = new Map(
    eventValues.map((event, index) => [event, eventNodeId(event, index + 1)]),
  );
  const sourceY = Math.max(0, (Math.max(eventValues.length, 1) - 1) * 55);
  const sourceId = "source";

  addNode(
    sourceId,
    "source",
    titleCase(appName) || "App",
    "webhook events",
    sourceY,
  );

  eventValues.forEach((event, index) => {
    const eventId = eventIds.get(event) ?? eventNodeId(event, index + 1);
    addNode(
      eventId,
      "event",
      event === ALL_EVENTS ? "All events" : eventLabels.get(event) || event,
      event === ALL_EVENTS ? "no event filter" : event,
      index * ROW_GAP.event,
    );
    addEdge(sourceId, eventId);
  });

  if (routing.rules.length === 0) {
    addNode("no-rules", "drop", "No rules", "unmatched events use defaults", 0);
    addEdge(sourceId, "no-rules");
  }

  normalizedRules.forEach((rule, index) => {
    const ruleId = `rule-${index + 1}`;
    const match = rule.match.trim() || "*";

    addNode(
      ruleId,
      "rule",
      `Rule ${index + 1}`,
      `${match} | ${eventSummary(rule.events, eventLabels)}`,
      index * ROW_GAP.rule,
    );

    rule.events.forEach((event) => {
      addEdge(eventIds.get(event) ?? eventNodeId(event, 0), ruleId);
    });

    const destinations = nonEmptyDestinations(rule.destinations);
    if (destinations.length === 0) {
      const dropId = `${ruleId}-drop`;
      addNode(
        dropId,
        "drop",
        "No destination",
        "matching events are dropped",
        index * ROW_GAP.rule,
      );
      addEdge(ruleId, dropId);
      return;
    }

    destinations.forEach((destination) => {
      const destinationId = ensureDestinationNode(
        destination,
        index * ROW_GAP.rule,
      );
      addEdge(ruleId, destinationId);
    });
  });

  const defaultY =
    Math.max(
      eventValues.length * ROW_GAP.event,
      Math.max(routing.rules.length, 1) * ROW_GAP.rule,
    ) + 30;
  const defaultId = "default";

  addNode(defaultId, "default", "Default", "when no rule matches", defaultY);
  addEdge(sourceId, defaultId, "default");

  const defaultDestinations = nonEmptyDestinations(
    routing.default_destinations,
  );
  if (defaultDestinations.length === 0) {
    addNode(
      "default-drop",
      "drop",
      "No default",
      "unmatched events are dropped",
      defaultY,
    );
    addEdge(defaultId, "default-drop", "default");
  } else {
    defaultDestinations.forEach((destination) => {
      const destinationId = ensureDestinationNode(destination, defaultY);
      addEdge(defaultId, destinationId, "default");
    });
  }

  return { nodes, edges };

  function ensureDestinationNode(
    destination: RoutingGraphDestination,
    preferredY: number,
  ): string {
    const target = destination.target.trim();
    const key = `${destination.kind}:${target}`;
    const existing = destinationIds.get(key);
    if (existing) return existing;

    const id = `destination-${destinationIds.size + 1}`;
    const y = nextAvailableDestinationY(preferredY);
    destinationIds.set(key, id);

    addNode(
      id,
      "destination",
      destinationLabel(destination, chatLabels, userLabels),
      target,
      y,
    );

    return id;
  }

  function nextAvailableDestinationY(preferredY: number): number {
    let row = Math.max(0, Math.round(preferredY / ROW_GAP.destination));
    while (usedDestinationRows.has(row)) {
      row += 1;
    }
    usedDestinationRows.add(row);
    return row * ROW_GAP.destination;
  }
}

function columnForKind(kind: RoutingGraphNodeKind): RoutingGraphColumn {
  return (
    ROUTING_GRAPH_NODE_KINDS.find((definition) => definition.kind === kind)
      ?.column ?? "destination"
  );
}

function xForColumn(column: RoutingGraphColumn): number {
  return (
    ROUTING_GRAPH_COLUMNS.find((definition) => definition.key === column)?.x ??
    0
  );
}

function eventNodeId(event: string, index: number): string {
  return `event-${index}-${sanitizeId(event) || "all"}`;
}

function sanitizeId(value: string): string {
  return value.replaceAll(/[^a-zA-Z0-9_-]/g, "_");
}

function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function eventSummary(
  events: string[],
  eventLabels: Map<string, string>,
): string {
  if (events.length === 0 || events.includes(ALL_EVENTS)) return "all events";
  return events.map((event) => eventLabels.get(event) || event).join(", ");
}

function destinationLabel(
  destination: RoutingGraphDestination,
  chatLabels: Map<string, string>,
  userLabels: Map<string, string>,
): string {
  const target = destination.target.trim();
  if (destination.kind === "chat") {
    return chatLabels.get(target) || "Group chat";
  }
  return userLabels.get(target) || "Direct message";
}

function normalizeEvents(events: string[]): string[] {
  const normalized = unique(
    events.map((event) => event.trim()).filter((event) => event.length > 0),
  );
  if (normalized.length === 0 || normalized.includes(ALL_EVENTS)) {
    return [ALL_EVENTS];
  }
  return normalized;
}

function nonEmptyDestinations(
  destinations: RoutingGraphDestination[],
): RoutingGraphDestination[] {
  const seen = new Set<string>();
  return destinations
    .map((destination) => ({
      kind: destination.kind,
      target: destination.target.trim(),
    }))
    .filter((destination) => {
      if (destination.target.length === 0) return false;
      const key = `${destination.kind}:${destination.target}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}
