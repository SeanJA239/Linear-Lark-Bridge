import { Button } from "@base-ui/react/button";
import { Field } from "@base-ui/react/field";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { invalidate, TAG_CONFIG } from "../lib/cache";
import { errMessage } from "../lib/errors";
import { useData, useMutation } from "../lib/tayori";
import { getConfig, putConfig } from "../sdk";

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
      <header className="events-header">
        <h2>Configuration</h2>
        <div className="filters">
          {errors.root?.message && (
            <span className="error">{errors.root.message}</span>
          )}
          {saved && <span className="conn ok">saved</span>}
          <Button
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
          className="config-editor"
          disabled={isLoading || data === undefined}
          render={<textarea spellCheck={false} />}
          {...register("config")}
        />
      </Field.Root>
    </section>
  );
}
