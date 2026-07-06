import useSWR from "swr";
import { errMessage } from "../lib/http";
import { RoutingMap } from "./RoutingMap";
import {
  type RoutingGraphChat,
  type RoutingGraphConfig,
  type RoutingGraphEventOption,
  type RoutingGraphUser,
} from "./routingGraph";
import { Spinner } from "./Spinner";

export interface RoutingMapPanelProps {
  appName: string;
  eventOptions: RoutingGraphEventOption[];
}

export function RoutingMapPanel({
  appName,
  eventOptions,
}: RoutingMapPanelProps) {
  const url = `/api/apps/${appName}/routing`;
  const { data: routing, error } = useSWR<RoutingGraphConfig>(url);
  const { data: chats } = useSWR<RoutingGraphChat[]>(
    `/api/apps/${appName}/chats`,
    { shouldRetryOnError: false },
  );
  const { data: users } = useSWR<RoutingGraphUser[]>(
    `/api/apps/${appName}/users`,
    { shouldRetryOnError: false },
  );

  return (
    <div className="action-card routing-map-card">
      <div className="action-card-head">
        <div>
          <div className="actions-subsystem">routing map</div>
          <h3>{appName}</h3>
        </div>
      </div>

      {error && <p className="error">Failed to load: {errMessage(error)}</p>}
      {!error && !routing && <Spinner />}
      {routing && (
        <RoutingMap
          appName={appName}
          routing={routing}
          eventOptions={eventOptions}
          chats={chats}
          users={users}
        />
      )}
    </div>
  );
}
