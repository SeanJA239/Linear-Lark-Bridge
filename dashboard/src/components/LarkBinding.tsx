import { Field } from "@base-ui/react/field";
import { useState } from "react";
import { Link } from "react-router";
import { invalidate, TAG_APPS, TAG_LARK_APPS, TAG_STATUS } from "../lib/cache";
import { errMessage } from "../lib/errors";
import { useData, useMutation } from "../lib/tayori";
import { listApps, listLarkApps, setAppLarkApp } from "../sdk";
import { Select } from "./Select";

type Feedback = { tone: "ok" | "error"; text: string } | null;

/// Bind (or clear) the `[lark-apps.<name>]` this app uses for Lark credentials,
/// from the UI rather than by hand-editing TOML. Writes `[<app>].lark_app` via
/// `PUT /api/config/{app}/lark-app`; the supervisor restarts the app on the
/// resulting config broadcast, so the new binding takes effect with no manual
/// restart. Delivery (bot DMs / group cards) needs a bound app, so this sits at
/// the top of each app's page.
export function LarkBinding({ appName }: { appName: string }) {
  const { data: appsData } = useData(listApps, { cacheTags: [TAG_APPS] });
  const { data: registry } = useData(listLarkApps, {
    cacheTags: [TAG_LARK_APPS],
  });
  const bind = useMutation(setAppLarkApp);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const apps = registry?.lark_apps ?? [];
  const current =
    appsData?.apps.find((a) => a.name === appName)?.lark_app ?? "";

  const onChange = async (next: string) => {
    setFeedback(null);
    try {
      await bind.trigger({
        path: { app: appName },
        body: { lark_app: next || null },
      });
      // The binding lives in /api/apps; the rebind restarts the app, so refresh
      // status too.
      await invalidate(TAG_APPS, TAG_STATUS);
      setFeedback({
        tone: "ok",
        text: next ? `bound to "${next}"` : "unbound",
      });
    } catch (e) {
      setFeedback({ tone: "error", text: errMessage(e) });
    }
  };

  return (
    <div className="action-card binding-card">
      <div className="actions-subsystem">Lark app</div>
      <p className="muted help-text">
        The Lark credentials this app delivers with. Manage the registry in the{" "}
        <Link to="/lark-apps">Lark Apps</Link> tab.
      </p>
      <Field.Root className="field">
        <Field.Label className="field-label" htmlFor={`lark-app-${appName}`}>
          bound app
        </Field.Label>
        <Select
          id={`lark-app-${appName}`}
          className="field-input field-select"
          value={current}
          disabled={bind.isMutating || apps.length === 0}
          onValueChange={onChange}
          options={[
            { value: "", label: "— none (use env / inline) —" },
            ...apps.map((a) => ({ value: a.name, label: a.name })),
          ]}
        />
      </Field.Root>
      {apps.length === 0 && (
        <p className="muted help-text">
          No Lark apps registered yet — add one in the{" "}
          <Link to="/lark-apps">Lark Apps</Link> tab first.
        </p>
      )}
      {feedback && (
        <span className={`action-result ${feedback.tone}`}>
          {feedback.text}
        </span>
      )}
    </div>
  );
}
