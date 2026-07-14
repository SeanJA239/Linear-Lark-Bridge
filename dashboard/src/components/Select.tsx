import { Select as BaseSelect } from "@base-ui/react/select";
import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { colors, radii } from "../theme/tokens.stylex";

const s = stylex.create({
  trigger: {
    font: "inherit",
    fontSize: "0.85rem",
    padding: "0.28rem 0.55rem",
    borderColor: { default: colors.hairlineStrong, ":hover": colors.mutedSoft },
    borderStyle: "solid",
    borderWidth: "1px",
    borderRadius: radii.md,
    backgroundColor: colors.surfaceCard,
    color: colors.ink,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.4rem",
    minWidth: "6rem",
    cursor: "pointer",
    transitionProperty: "border-color",
    transitionDuration: "0.15s",
  },
  triggerOpen: {
    borderColor: colors.mutedSoft,
  },
  icon: {
    fontSize: "0.7rem",
    color: colors.muted,
  },
  popup: {
    backgroundColor: colors.surfacePop,
    color: colors.ink,
    borderColor: colors.hairlineStrong,
    borderStyle: "solid",
    borderWidth: "1px",
    borderRadius: radii.md,
    padding: "0.25rem",
    boxShadow: "0 8px 28px rgb(0 0 0 / 0.5)",
    minWidth: "7rem",
    zIndex: 10,
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.3rem 0.55rem 0.3rem 0.35rem",
    borderRadius: radii.sm,
    fontSize: "0.85rem",
    cursor: "pointer",
    userSelect: "none",
    outline: "none",
  },
  itemHighlighted: {
    backgroundColor: colors.surfaceStrong,
  },
  itemIndicator: {
    width: "1rem",
    display: "inline-flex",
    justifyContent: "center",
    fontSize: "0.75rem",
    color: colors.primaryHover,
  },
});

export interface SelectOption {
  value: string;
  label: ReactNode;
}

/// A thin wrapper over Base UI `Select` for single-value string selects: pass
/// `options` and a controlled `value`/`onValueChange`. `trigger` merges extra
/// StyleX styles onto the trigger — default is the compact pill (Events
/// filters); form fields pass `[field.input, field.selectTrigger]` to match
/// the other inputs.
export function Select({
  value,
  onValueChange,
  options,
  id,
  name,
  disabled,
  trigger,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  id?: string;
  name?: string;
  disabled?: boolean;
  trigger?: stylex.StyleXStyles;
}) {
  const labelOf = (v: string): ReactNode =>
    options.find((o) => o.value === v)?.label ?? v;
  return (
    <BaseSelect.Root
      modal={false}
      value={value}
      disabled={disabled}
      name={name}
      onValueChange={(v) => onValueChange((v as string | null) ?? "")}
    >
      <BaseSelect.Trigger
        id={id}
        className={(state) =>
          // Open-state border merges after caller overrides so it wins even on
          // restyled triggers (e.g. the routing kind select).
          stylex.props(s.trigger, trigger, state.open && s.triggerOpen)
            .className ?? ""
        }
      >
        <BaseSelect.Value>{(v) => labelOf(v as string)}</BaseSelect.Value>
        <BaseSelect.Icon className={stylex.props(s.icon).className}>
          ▾
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={4} align="start">
          <BaseSelect.Popup className={stylex.props(s.popup).className}>
            {options.map((o) => (
              <BaseSelect.Item
                key={o.value}
                value={o.value}
                className={(state) =>
                  stylex.props(s.item, state.highlighted && s.itemHighlighted)
                    .className ?? ""
                }
              >
                <BaseSelect.ItemIndicator
                  className={stylex.props(s.itemIndicator).className}
                >
                  ✓
                </BaseSelect.ItemIndicator>
                <BaseSelect.ItemText>{o.label}</BaseSelect.ItemText>
              </BaseSelect.Item>
            ))}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
