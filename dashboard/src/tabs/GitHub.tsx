import { LarkBinding } from "../components/LarkBinding";
import { RoutingMapPanel } from "../components/RoutingMapPanel";
import type { RoutingGraphEventOption } from "../components/routingGraph";

const GITHUB_EVENTS: RoutingGraphEventOption[] = [
  { value: "pull_request", label: "Pull requests" },
  { value: "issues", label: "Issues (alert labels)" },
  { value: "workflow_run", label: "CI failures" },
  { value: "secret_scanning", label: "Secret scanning" },
  { value: "dependabot", label: "Dependabot alerts" },
];

export function GitHub() {
  return (
    <section>
      <h2>GitHub</h2>
      <LarkBinding appName="github" />
      <RoutingMapPanel appName="github" eventOptions={GITHUB_EVENTS} />
    </section>
  );
}
