import { LarkBinding } from "../components/LarkBinding";
import { RoutingMapPanel } from "../components/RoutingMapPanel";
import type { RoutingGraphEventOption } from "../components/routingGraph";

const GITLAB_EVENTS: RoutingGraphEventOption[] = [
  { value: "merge_request", label: "Merge requests" },
  { value: "issue", label: "Issues (alert labels)" },
  { value: "pipeline", label: "Pipeline failures" },
  { value: "note", label: "Comments" },
  { value: "push", label: "Pushes" },
];

export function Gitlab() {
  return (
    <section>
      <h2>GitLab</h2>
      <LarkBinding appName="gitlab" />
      <RoutingMapPanel appName="gitlab" eventOptions={GITLAB_EVENTS} />
    </section>
  );
}
