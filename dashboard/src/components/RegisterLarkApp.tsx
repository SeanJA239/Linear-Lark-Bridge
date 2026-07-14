import { Button } from "@base-ui/react/button";
import { Field } from "@base-ui/react/field";
import * as stylex from "@stylexjs/stylex";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { invalidate, TAG_LARK_APPS } from "../lib/cache";
import { errMessage } from "../lib/errors";
import { useMutation } from "../lib/tayori";
import { type LarkAppView, testLarkApp, upsertLarkApp } from "../sdk";
import { button, card, field, filters, text } from "../theme/shared";
import { colors } from "../theme/tokens.stylex";
import { typo } from "../theme/typography";

const s = stylex.create({
  subsystem: {
    color: colors.muted,
    marginBottom: "0.6rem",
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
  buttonRow: {
    marginTop: "0.75rem",
  },
});

interface LarkAppForm {
  name: string;
  app_id: string;
  app_secret: string;
  base_url: string;
}

type Feedback = { tone: "ok" | "error"; text: string } | null;

const DEFAULT_BASE = "https://open.larksuite.com";
const EMPTY: LarkAppForm = {
  name: "",
  app_id: "",
  app_secret: "",
  base_url: DEFAULT_BASE,
};

/// Credentials portion (no name) — shared by Save and the dry-run Test.
function creds(form: LarkAppForm) {
  return {
    app_id: form.app_id.trim(),
    app_secret: form.app_secret,
    base_url: form.base_url.trim() || DEFAULT_BASE,
  };
}

interface Props {
  /// When set, the form edits an existing entry (name readonly, prefilled).
  editing?: LarkAppView | null;
  /// Called after a successful save with the saved entry name.
  onSaved?: (name: string) => void;
  /// Called when the user abandons an in-progress edit.
  onCancelEdit?: () => void;
}

/// The "register a Lark app" form card: name + credentials, a dry-run **Test**
/// and a **Save** that live-tests server-side before persisting. Shared by the
/// Lark Apps tab (register + edit) and the first-run Setup screen (register).
/// On success it revalidates `/api/lark-apps` so every consumer refreshes.
export function RegisterLarkApp({ editing, onSaved, onCancelEdit }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<LarkAppForm>({ defaultValues: EMPTY });
  const [feedback, setFeedback] = useState<Feedback>(null);

  // Re-seed the form whenever the edit target changes (or clears).
  useEffect(() => {
    reset(
      editing
        ? {
            name: editing.name,
            app_id: editing.app_id,
            app_secret: "",
            base_url: editing.base_url,
          }
        : EMPTY,
    );
    setFeedback(null);
  }, [editing, reset]);

  const save = useMutation(upsertLarkApp, {
    onSuccess: () => void invalidate(TAG_LARK_APPS),
  });
  // Dry-run: answers 200 `{ ok:false }` on bad creds, so it is read, not thrown.
  const test = useMutation(testLarkApp);

  const onSave = handleSubmit(async (form) => {
    setFeedback(null);
    try {
      await save.trigger({ body: { name: form.name.trim(), ...creds(form) } });
      const name = form.name.trim();
      setFeedback({ tone: "ok", text: `saved "${name}"` });
      if (!editing) reset(EMPTY);
      onSaved?.(name);
    } catch (e) {
      setFeedback({ tone: "error", text: errMessage(e) });
    }
  });

  // Test needs only app_id + app_secret, so it reads values directly rather than
  // going through `handleSubmit` (which would also require `name`).
  const onTest = async () => {
    setFeedback(null);
    const form = getValues();
    if (!form.app_id.trim() || !form.app_secret) {
      setFeedback({
        tone: "error",
        text: "app_id and app_secret are required",
      });
      return;
    }
    try {
      const r = await test.trigger({ body: creds(form) });
      setFeedback(
        r.ok
          ? { tone: "ok", text: `valid — token good for ${r.expire ?? "?"}s` }
          : { tone: "error", text: r.error ?? "credential test failed" },
      );
    } catch (e) {
      setFeedback({ tone: "error", text: errMessage(e) });
    }
  };

  const busy = save.isMutating || test.isMutating;

  const controlClass = (state: { valid: boolean | null }) =>
    stylex.props(field.input, state.valid === false && field.inputInvalid)
      .className ?? "";

  return (
    <div {...stylex.props(card.base)}>
      <div {...stylex.props(typo.mono12, s.subsystem)}>
        {editing ? `update "${editing.name}"` : "register a Lark app"}
      </div>
      <div {...stylex.props(s.fields)}>
        <Field.Root
          className={stylex.props(field.row).className}
          invalid={!!errors.name}
        >
          <Field.Label className={stylex.props(field.label).className}>
            name<span {...stylex.props(field.required)}> *</span>
          </Field.Label>
          <Field.Control
            className={(state) =>
              stylex.props(
                field.input,
                state.valid === false && field.inputInvalid,
                !!editing && field.inputReadonly,
              ).className ?? ""
            }
            placeholder="main"
            {...register("name", { required: "name is required" })}
            readOnly={!!editing}
          />
          {errors.name && (
            <Field.Error className={stylex.props(field.error).className} match>
              {errors.name.message}
            </Field.Error>
          )}
        </Field.Root>
        <Field.Root
          className={stylex.props(field.row).className}
          invalid={!!errors.app_id}
        >
          <Field.Label className={stylex.props(field.label).className}>
            app_id<span {...stylex.props(field.required)}> *</span>
          </Field.Label>
          <Field.Control
            className={controlClass}
            placeholder="cli_…"
            {...register("app_id", { required: "app_id is required" })}
          />
          {errors.app_id && (
            <Field.Error className={stylex.props(field.error).className} match>
              {errors.app_id.message}
            </Field.Error>
          )}
        </Field.Root>
        <Field.Root
          className={stylex.props(field.row).className}
          invalid={!!errors.app_secret}
        >
          <Field.Label className={stylex.props(field.label).className}>
            app_secret<span {...stylex.props(field.required)}> *</span>
          </Field.Label>
          <Field.Control
            className={controlClass}
            type="password"
            autoComplete="off"
            placeholder="write-only — re-enter to update"
            {...register("app_secret", { required: "app_secret is required" })}
          />
          {errors.app_secret && (
            <Field.Error className={stylex.props(field.error).className} match>
              {errors.app_secret.message}
            </Field.Error>
          )}
        </Field.Root>
        <Field.Root className={stylex.props(field.row).className}>
          <Field.Label className={stylex.props(field.label).className}>
            base_url
          </Field.Label>
          <Field.Control
            className={stylex.props(field.input).className}
            placeholder={DEFAULT_BASE}
            {...register("base_url")}
          />
        </Field.Root>
      </div>
      <div {...stylex.props(filters.row, s.buttonRow)}>
        <Button
          className={stylex.props(button.secondary).className}
          type="button"
          onClick={onTest}
          disabled={busy}
        >
          {test.isMutating ? "Testing…" : "Test"}
        </Button>
        <Button
          className={stylex.props(button.secondary).className}
          type="button"
          onClick={onSave}
          disabled={busy}
        >
          {save.isMutating ? "Saving…" : editing ? "Update" : "Save"}
        </Button>
        {editing && onCancelEdit && (
          <Button
            className={stylex.props(button.secondary).className}
            type="button"
            onClick={onCancelEdit}
            disabled={busy}
          >
            Cancel
          </Button>
        )}
        {feedback && (
          <span
            {...stylex.props(
              feedback.tone === "ok" ? text.resultOk : text.resultError,
            )}
          >
            {feedback.text}
          </span>
        )}
      </div>
    </div>
  );
}
