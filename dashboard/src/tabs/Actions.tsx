import { Button } from "@base-ui/react/button";
import { Field } from "@base-ui/react/field";
import * as stylex from "@stylexjs/stylex";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { errMessage } from "../lib/errors";
import { useMutation } from "../lib/tayori";
import { dispatchAction } from "../sdk";
import { button, card, field, text } from "../theme/shared";
import { colors, fonts } from "../theme/tokens.stylex";

const s = stylex.create({
  group: {
    marginBottom: "1.75rem",
  },
  subsystem: {
    fontFamily: fonts.mono,
    fontSize: "0.82rem",
    color: colors.muted,
    marginBottom: "0.6rem",
  },
  cards: {
    display: "grid",
    gap: "0.6rem",
  },
  head: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "1rem",
  },
  name: {
    fontSize: "0.92rem",
    fontWeight: 600,
    color: colors.ink,
  },
  fields: {
    display: "grid",
    gap: "0.45rem",
    marginTop: "0.7rem",
    paddingTop: "0.7rem",
    borderTopColor: colors.hairlineStrong,
    borderTopStyle: "dashed",
    borderTopWidth: "1px",
  },
});

interface ActionParam {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
}

interface Action {
  name: string;
  description: string;
  params?: ActionParam[];
}

const CATALOG: Record<string, Action[]> = {
  linear: [
    {
      name: "ping",
      description: "Emit a pong log event (smoke test the action plumbing)",
    },
    {
      name: "test-lark",
      description: "Post a test message to the configured Lark webhook",
    },
  ],
  github: [
    {
      name: "ping",
      description: "Emit a pong log event (smoke test the action plumbing)",
    },
    {
      name: "test-lark",
      description: "Post a test message to the configured Lark webhook",
    },
  ],
  x: [
    {
      name: "ping",
      description: "Emit a pong log event (smoke test the action plumbing)",
    },
  ],
  standup: [
    {
      name: "announce",
      description: "Ensure tomorrow's doc and post the announcement card",
      params: [
        {
          name: "date",
          label: "date (today | tomorrow | YYYY-MM-DD)",
          placeholder: "tomorrow",
        },
      ],
    },
    {
      name: "ensure",
      description: "Create tomorrow's doc + share with chat (no card)",
      params: [{ name: "date", label: "date", placeholder: "tomorrow" }],
    },
    {
      name: "remind",
      description: "DM everyone still empty for today's doc",
      params: [{ name: "date", label: "date", placeholder: "today" }],
    },
    {
      name: "urgent",
      description: "Remind + in-app urgent escalation for today's doc",
      params: [{ name: "date", label: "date", placeholder: "today" }],
    },
    {
      name: "check",
      description: "List missing fillers for today (read-only)",
      params: [{ name: "date", label: "date", placeholder: "today" }],
    },
    {
      name: "urgent-user",
      description: "Escalate one specific user (for testing)",
      params: [
        {
          name: "open_id",
          label: "open_id",
          required: true,
          placeholder: "ou_xxx",
        },
        { name: "date", label: "date", placeholder: "today" },
      ],
    },
  ],
  minutes: [
    {
      name: "process-meeting",
      description: "Backfill / re-process one meeting by ID",
      params: [
        {
          name: "meeting_id",
          label: "meeting_id",
          required: true,
          placeholder: "VC meeting ID",
        },
        {
          name: "owner",
          label: "owner (optional override)",
          placeholder: "open_id",
        },
        {
          name: "url",
          label: "url (skip VC lookup, use this URL)",
          placeholder: "https://…",
        },
      ],
    },
  ],
};

type RunState = { tone: "ok" | "error"; text: string } | null;

function ActionCard({
  subsystem,
  action,
}: {
  subsystem: string;
  action: Action;
}) {
  const params = action.params ?? [];
  const defaults: Record<string, string> = {};
  for (const p of params) defaults[p.name] = "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Record<string, string>>({ defaultValues: defaults });
  const [result, setResult] = useState<RunState>(null);

  const fire = useMutation(dispatchAction);

  const onRun = handleSubmit(async (values) => {
    setResult(null);
    // Send required fields always; drop empty optionals so JSON carries only
    // real values.
    const required = new Set(
      params.filter((p) => p.required).map((p) => p.name),
    );
    const body: Record<string, string> = {};
    for (const [k, v] of Object.entries(values)) {
      const trimmed = v.trim();
      if (required.has(k) || trimmed) body[k] = trimmed;
    }
    try {
      await fire.trigger({
        path: { app: subsystem, action: action.name },
        body,
      });
      setResult({ tone: "ok", text: "dispatched" });
      window.setTimeout(() => setResult(null), 2500);
    } catch (e) {
      setResult({ tone: "error", text: errMessage(e) });
    }
  });

  return (
    <div {...stylex.props(card.base)}>
      <div {...stylex.props(s.head)}>
        <div>
          <code {...stylex.props(s.name)}>{action.name}</code>
          <div {...stylex.props(text.help)}>{action.description}</div>
        </div>
        <Button
          className={
            stylex.props(
              button.action,
              result?.tone === "ok" && button.actionOk,
              result?.tone === "error" && button.actionError,
            ).className
          }
          type="button"
          onClick={onRun}
          disabled={fire.isMutating}
        >
          {fire.isMutating ? "…" : "Run"}
        </Button>
      </div>
      {params.length > 0 && (
        <div {...stylex.props(s.fields)}>
          {params.map((p) => (
            <Field.Root
              key={p.name}
              className={stylex.props(field.row).className}
              invalid={!!errors[p.name]}
            >
              <Field.Label className={stylex.props(field.label).className}>
                {p.label}
                {p.required && (
                  <span {...stylex.props(field.required)}> *</span>
                )}
              </Field.Label>
              <Field.Control
                className={
                  stylex.props(
                    field.input,
                    !!errors[p.name] && field.inputInvalid,
                  ).className
                }
                placeholder={p.placeholder}
                {...register(
                  p.name,
                  p.required ? { required: `${p.name} is required` } : {},
                )}
              />
              {errors[p.name] && (
                <Field.Error
                  className={stylex.props(field.error).className}
                  match
                >
                  {errors[p.name]?.message}
                </Field.Error>
              )}
            </Field.Root>
          ))}
        </div>
      )}
      {result && (
        <div
          {...stylex.props(
            result.tone === "ok" ? text.resultOk : text.resultError,
          )}
        >
          {result.text}
        </div>
      )}
    </div>
  );
}

export function Actions() {
  return (
    <section>
      <h2>Actions</h2>
      <p {...stylex.props(text.help)}>
        Dispatch is fire-and-forget. The outcome of each action shows up in the{" "}
        <Link to="/events">Events</Link> tab.
      </p>
      {Object.entries(CATALOG).map(([subsystem, actions]) => (
        <div key={subsystem} {...stylex.props(s.group)}>
          <div {...stylex.props(s.subsystem)}>{subsystem}</div>
          {actions.length === 0 ? (
            <div {...stylex.props(text.help)}>no actions defined yet</div>
          ) : (
            <div {...stylex.props(s.cards)}>
              {actions.map((a) => (
                <ActionCard key={a.name} subsystem={subsystem} action={a} />
              ))}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
