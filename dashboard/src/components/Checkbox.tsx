import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import * as stylex from "@stylexjs/stylex";
import type { Ref } from "react";
import { colors, radii } from "../theme/tokens.stylex";

const s = stylex.create({
  box: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "1.05rem",
    height: "1.05rem",
    padding: 0,
    flexShrink: 0,
    borderColor: colors.hairlineStrong,
    borderStyle: "solid",
    borderWidth: "1px",
    borderRadius: radii.xs,
    backgroundColor: colors.surfaceCard,
    cursor: { default: "pointer", ":disabled": "not-allowed" },
    opacity: { ":disabled": 0.5 },
    transitionProperty: "background-color, border-color",
    transitionDuration: "0.15s",
  },
  // Selection (not on/off state) — the lavender accent, per the product idiom.
  boxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  indicator: {
    display: "inline-flex",
    fontSize: "0.7rem",
    lineHeight: 1,
    color: colors.onPrimary,
  },
});

/// A controlled Base UI checkbox styled to match the dashboard. Use
/// `checked`/`onCheckedChange`; pass `inputRef`/`name` to bind it to
/// react-hook-form via `<Controller>`.
export function Checkbox({
  checked,
  onCheckedChange,
  disabled,
  id,
  name,
  inputRef,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  inputRef?: Ref<HTMLInputElement>;
}) {
  return (
    <BaseCheckbox.Root
      className={(state) =>
        stylex.props(s.box, state.checked && s.boxChecked).className ?? ""
      }
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      id={id}
      name={name}
      inputRef={inputRef}
    >
      <BaseCheckbox.Indicator className={stylex.props(s.indicator).className}>
        ✓
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
}
