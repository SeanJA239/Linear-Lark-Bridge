import { Button } from "@base-ui/react/button";
import { Field } from "@base-ui/react/field";
import * as stylex from "@stylexjs/stylex";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { invalidate, TAG_CONFIG } from "../lib/cache";
import { errMessage } from "../lib/errors";
import { useData, useMutation } from "../lib/tayori";
import { getConfig, putConfig } from "../sdk";
import { button, filters } from "../theme/shared";
import { colors, effects, fonts, radii } from "../theme/tokens.stylex";

const s = stylex.create({
  header: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "1rem",
    flexWrap: "wrap",
  },
  headerTitle: {
    margin: 0,
  },
  saved: {
    fontVariantNumeric: "tabular-nums",
    color: colors.success,
  },
  editor: {
    width: "100%",
    minHeight: "22rem",
    fontFamily: fonts.mono,
    fontSize: "0.82rem",
    lineHeight: 1.6,
    padding: "1rem 1.1rem",
    borderColor: {
      default: colors.hairline,
      ":focus": colors.hairlineStrong,
      ":focus-visible": colors.hairlineStrong,
    },
    borderStyle: "solid",
    borderWidth: "1px",
    borderRadius: radii.lg,
    backgroundColor: colors.canvas,
    color: colors.ink,
    resize: "vertical",
    marginTop: "0.6rem",
    outline: { ":focus": "none", ":focus-visible": "none" },
    boxShadow: {
      ":focus": effects.focusRing,
      ":focus-visible": effects.focusRing,
    },
    opacity: { ":disabled": 0.55 },
    transitionProperty: "border-color, box-shadow",
    transitionDuration: "0.15s",
  },
});

interface ConfigForm {
  config: string;
}

export function Config() {
  // The config endpoint speaks TOML, not JSON: parse the response as text.
  const { data, error, isLoading } = useData(getConfig, {
    parseAs: "text",
    cacheTags: [TAG_CONFIG],
  });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { isDirty, isSubmitting, errors },
  } = useForm<ConfigForm>({ defaultValues: { config: "" } });
  const [saved, setSaved] = useState(false);

  // Adopt the loaded TOML as the form baseline so `isDirty` tracks real edits.
  useEffect(() => {
    if (data !== undefined) reset({ config: data });
  }, [data, reset]);

  const save = useMutation(putConfig);

  const onSubmit = handleSubmit(async ({ config }) => {
    setSaved(false);
    try {
      // The body is already TOML text — bypass the JSON body serializer.
      await save.trigger({ body: config, bodySerializer: null });
      // re-GET the canonical stored TOML → resets the baseline
      await invalidate(TAG_CONFIG);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError("root", { message: errMessage(e) });
    }
  });

  return (
    <section>
      <header {...stylex.props(s.header)}>
        <h2 {...stylex.props(s.headerTitle)}>Configuration</h2>
        <div {...stylex.props(filters.row)}>
          {errors.root?.message && (
            <span className="error">{errors.root.message}</span>
          )}
          {saved && <span {...stylex.props(s.saved)}>saved</span>}
          <Button
            className={stylex.props(button.secondary).className}
            type="button"
            onClick={onSubmit}
            disabled={!isDirty || isSubmitting || isLoading}
          >
            {isSubmitting ? "Saving…" : "Save"}
          </Button>
        </div>
      </header>
      {error !== undefined && (
        <p className="error">Failed to load: {errMessage(error)}</p>
      )}
      <Field.Root>
        <Field.Control
          className={stylex.props(s.editor).className}
          disabled={isLoading || data === undefined}
          render={<textarea spellCheck={false} />}
          {...register("config")}
        />
      </Field.Root>
    </section>
  );
}
