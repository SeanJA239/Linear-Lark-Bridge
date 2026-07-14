import { Button } from "@base-ui/react/button";
import { Field } from "@base-ui/react/field";
import { Input } from "@base-ui/react/input";
import * as stylex from "@stylexjs/stylex";
import { useEffect, useState } from "react";
import {
  type Control,
  Controller,
  type UseFormRegisterReturn,
  useForm,
} from "react-hook-form";
import { Checkbox } from "../components/Checkbox";
import { LarkBinding } from "../components/LarkBinding";
import { invalidate, TAG_STANDUP_SETTINGS } from "../lib/cache";
import { errMessage } from "../lib/errors";
import {
  getStandupSettings,
  putStandupSettings,
  type StandupSettings,
} from "../lib/standup-api";
import { useData, useMutation } from "../lib/tayori";
// Aliased: react-hook-form render props also destructure a `field`, and
// TemplateField takes a `field` prop.
import {
  button,
  card,
  field as fieldStyle,
  filters,
  text,
} from "../theme/shared";
import { colors } from "../theme/tokens.stylex";
import { typo } from "../theme/typography";

const s = stylex.create({
  subsystem: {
    color: colors.muted,
    marginBottom: "0.6rem",
  },
  subsystemSpaced: {
    marginTop: "1rem",
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
  filtersSpaced: {
    marginTop: "0.75rem",
  },
  // The time picker shouldn't stretch to the grid column.
  time: {
    width: "auto",
  },
  // Merged onto field.input (font via typo.mono13).
  template: {
    resize: "vertical",
  },
  // The "vars: …" line under a template label.
  hint: {
    color: colors.muted,
  },
});

type Feedback = { tone: "ok" | "error"; text: string } | null;

// The form mirrors the wire shape but holds column widths as an editable CSV string.
interface SettingsForm extends Omit<StandupSettings, "column_widths"> {
  column_widths: string;
}

const DEFAULT_FORM: SettingsForm = {
  timezone: "Asia/Shanghai",
  announce_time: "20:00",
  announce_enabled: true,
  remind_evening_time: "22:00",
  remind_evening_enabled: true,
  remind_morning_time: "09:30",
  remind_morning_enabled: true,
  urgent_time: "10:00",
  urgent_enabled: true,
  doc_title: "Daily Scrum - {{ date }}",
  header_done: "✅ 昨日完成",
  header_plan: "🎯 今日计划",
  header_block: "🚫 阻塞",
  column_widths: "120, 300, 300, 240",
  help_template: "",
  check_template: "",
  announce_title: "",
  announce_body: "",
  reminder_title: "",
  reminder_body: "",
};

function wireToForm(w: StandupSettings): SettingsForm {
  return { ...w, column_widths: w.column_widths.join(", ") };
}

function formToWire(f: SettingsForm): StandupSettings {
  return {
    ...f,
    timezone: f.timezone.trim(),
    column_widths: f.column_widths
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isFinite(n) && n > 0),
  };
}

// Boolean fields of the settings form — the per-job enable toggles.
type BoolField =
  | "announce_enabled"
  | "remind_evening_enabled"
  | "remind_morning_enabled"
  | "urgent_enabled";

function ScheduleRow({
  label,
  time,
  enabledName,
  control,
}: {
  label: string;
  time: UseFormRegisterReturn;
  enabledName: BoolField;
  control: Control<SettingsForm>;
}) {
  return (
    <Field.Root className={stylex.props(fieldStyle.row).className}>
      <Field.Label className={stylex.props(fieldStyle.label).className}>
        {label}
      </Field.Label>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <Input
          type="time"
          className={stylex.props(fieldStyle.input, s.time).className}
          {...time}
        />
        <label
          htmlFor={`standup-${enabledName}`}
          style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}
        >
          <Controller
            control={control}
            name={enabledName}
            render={({ field }) => (
              <Checkbox
                id={`standup-${enabledName}`}
                checked={!!field.value}
                onCheckedChange={field.onChange}
                inputRef={field.ref}
                name={field.name}
              />
            )}
          />{" "}
          enabled
        </label>
      </div>
    </Field.Root>
  );
}

function TemplateField({
  label,
  hint,
  field,
}: {
  label: string;
  hint: string;
  field: UseFormRegisterReturn;
}) {
  return (
    <Field.Root className={stylex.props(fieldStyle.row).className}>
      <Field.Label className={stylex.props(fieldStyle.label).className}>
        {label}
        <br />
        <span {...stylex.props(typo.footnote, s.hint)}>{hint}</span>
      </Field.Label>
      <Field.Control
        className={
          stylex.props(fieldStyle.input, typo.mono13, s.template).className
        }
        render={<textarea rows={4} />}
        {...field}
      />
    </Field.Root>
  );
}

function SettingsCard() {
  const { data, error } = useData(getStandupSettings, {
    cacheTags: [TAG_STANDUP_SETTINGS],
  });
  const { register, handleSubmit, reset, control } = useForm<SettingsForm>({
    defaultValues: DEFAULT_FORM,
  });
  const [feedback, setFeedback] = useState<Feedback>(null);

  // Hydrate the form once settings load.
  useEffect(() => {
    if (data) reset(wireToForm(data));
  }, [data, reset]);

  const save = useMutation(putStandupSettings, {
    onSuccess: () => void invalidate(TAG_STANDUP_SETTINGS),
  });

  const onSave = handleSubmit(async (form) => {
    setFeedback(null);
    try {
      await save.trigger({ body: formToWire(form) });
      setFeedback({ tone: "ok", text: "settings saved" });
    } catch (e) {
      setFeedback({ tone: "error", text: errMessage(e) });
    }
  });

  return (
    <div {...stylex.props(card.base, card.stacked)}>
      {error !== undefined && (
        <p className="error">Failed to load: {errMessage(error)}</p>
      )}
      <p {...stylex.props(text.help)}>
        Changes apply live — the scheduler and chat bot reload on each pass, no
        restart. Secrets &amp; bindings (chat, folder, Lark app) stay in the
        Config tab.
      </p>

      <div {...stylex.props(typo.mono12, s.subsystem)}>schedule</div>
      <div {...stylex.props(s.fields)}>
        <Field.Root className={stylex.props(fieldStyle.row).className}>
          <Field.Label className={stylex.props(fieldStyle.label).className}>
            Timezone (IANA)
          </Field.Label>
          <Field.Control
            className={stylex.props(fieldStyle.input).className}
            placeholder="Asia/Shanghai"
            {...register("timezone")}
          />
        </Field.Root>
        <ScheduleRow
          label="Announce (next-day doc)"
          time={register("announce_time")}
          enabledName="announce_enabled"
          control={control}
        />
        <ScheduleRow
          label="Remind — evening (next-day)"
          time={register("remind_evening_time")}
          enabledName="remind_evening_enabled"
          control={control}
        />
        <ScheduleRow
          label="Remind — morning (today)"
          time={register("remind_morning_time")}
          enabledName="remind_morning_enabled"
          control={control}
        />
        <ScheduleRow
          label="Urgent (today)"
          time={register("urgent_time")}
          enabledName="urgent_enabled"
          control={control}
        />
      </div>

      <div {...stylex.props(typo.mono12, s.subsystem, s.subsystemSpaced)}>
        doc table
      </div>
      <div {...stylex.props(s.fields)}>
        <Field.Root className={stylex.props(fieldStyle.row).className}>
          <Field.Label className={stylex.props(fieldStyle.label).className}>
            Doc title
            <br />
            <span {...stylex.props(typo.footnote, s.hint)}>
              vars: {"{{ date }}"} — used to match the day's doc
            </span>
          </Field.Label>
          <Field.Control
            className={stylex.props(fieldStyle.input).className}
            {...register("doc_title")}
          />
        </Field.Root>
        <Field.Root className={stylex.props(fieldStyle.row).className}>
          <Field.Label className={stylex.props(fieldStyle.label).className}>
            Header — done
          </Field.Label>
          <Field.Control
            className={stylex.props(fieldStyle.input).className}
            {...register("header_done")}
          />
        </Field.Root>
        <Field.Root className={stylex.props(fieldStyle.row).className}>
          <Field.Label className={stylex.props(fieldStyle.label).className}>
            Header — plan
          </Field.Label>
          <Field.Control
            className={stylex.props(fieldStyle.input).className}
            {...register("header_plan")}
          />
        </Field.Root>
        <Field.Root className={stylex.props(fieldStyle.row).className}>
          <Field.Label className={stylex.props(fieldStyle.label).className}>
            Header — block
          </Field.Label>
          <Field.Control
            className={stylex.props(fieldStyle.input).className}
            {...register("header_block")}
          />
        </Field.Root>
        <Field.Root className={stylex.props(fieldStyle.row).className}>
          <Field.Label className={stylex.props(fieldStyle.label).className}>
            Column widths
            <br />
            <span {...stylex.props(typo.footnote, s.hint)}>
              name, done, plan, block
            </span>
          </Field.Label>
          <Field.Control
            className={stylex.props(fieldStyle.input).className}
            placeholder="120, 300, 300, 240"
            {...register("column_widths")}
          />
        </Field.Root>
      </div>

      <div {...stylex.props(typo.mono12, s.subsystem, s.subsystemSpaced)}>
        templates (minijinja)
      </div>
      <div {...stylex.props(s.fields)}>
        <TemplateField
          label="Help reply"
          hint="no variables"
          field={register("help_template")}
        />
        <TemplateField
          label="Check report"
          hint="vars: date, url, missing (list)"
          field={register("check_template")}
        />
        <TemplateField
          label="Announce — title"
          hint="vars: date, days_until"
          field={register("announce_title")}
        />
        <TemplateField
          label="Announce — body"
          hint="vars: date, days_until, url"
          field={register("announce_body")}
        />
        <TemplateField
          label="Reminder — title"
          hint="vars: urgent (bool)"
          field={register("reminder_title")}
        />
        <TemplateField
          label="Reminder — body"
          hint="vars: urgent (bool), url"
          field={register("reminder_body")}
        />
      </div>

      <div {...stylex.props(filters.row, s.filtersSpaced)}>
        <Button
          className={stylex.props(button.secondary).className}
          type="button"
          onClick={onSave}
          disabled={save.isMutating}
        >
          {save.isMutating ? "Saving…" : "Save settings"}
        </Button>
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

export function Standup() {
  return (
    <section>
      <h2>Standup</h2>
      <LarkBinding appName="standup" />
      <SettingsCard />
    </section>
  );
}
