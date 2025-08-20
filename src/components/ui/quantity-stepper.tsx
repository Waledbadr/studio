"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";

type QuantityStepperProps = {
  value: number;
  onValueChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  disallowedValues?: number[];
} & React.ComponentPropsWithoutRef<"div">;

/**
 * Compact, consistent quantity control with - [input] + arranged neatly.
 * - Keyboard: ArrowUp/ArrowDown/PageUp/PageDown adjust value.
 * - Clamped to [min, max].
 * - Forwards ref to the input so parent can focus/select it.
 */
export const QuantityStepper = React.forwardRef<HTMLInputElement, QuantityStepperProps>(
  ({ value, onValueChange, min = 1, max, step = 1, disabled, className, disallowedValues, ...rest }, ref) => {
    const blocked = React.useMemo(() => new Set(disallowedValues ?? []), [disallowedValues]);
    const clamp = (n: number) => {
      let v = Number.isFinite(n) ? n : min;
      if (min !== undefined) v = Math.max(min, v);
      if (max !== undefined) v = Math.min(max, v);
      if (v < 1) v = 1; // safety for legacy callers
      return v;
    };

    // Resolve to nearest allowed number if current is blocked.
    const resolveAllowed = (n: number, preferUp = true) => {
      let v = clamp(n);
      if (!blocked.size || !blocked.has(v)) return v;
      // Try stepping away in the preferred direction, then opposite.
      const tryDir = (dir: 1 | -1) => {
        let cur = v;
        for (let i = 0; i < 100; i++) { // safety cap
          cur = clamp(cur + dir * (step || 1));
          if (cur === v) break; // cannot move
          if (!blocked.has(cur)) return cur;
        }
        return v; // fallback
      };
      let next = preferUp ? tryDir(1) : tryDir(-1);
      if (next === v) {
        // try opposite direction once
        next = preferUp ? tryDir(-1) : tryDir(1);
      }
      return next;
    };

    const dec = () => onValueChange(resolveAllowed(value - step, false));
    const inc = () => onValueChange(resolveAllowed(value + step, true));

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const n = parseInt(e.target.value, 10);
      if (Number.isNaN(n)) {
        // Keep empty string to let user type, but don't propagate NaN
        onValueChange(min);
        return;
      }
      onValueChange(resolveAllowed(n, true));
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          inc();
          break;
        case "ArrowDown":
          e.preventDefault();
          dec();
          break;
        case "PageUp":
          e.preventDefault();
          onValueChange(resolveAllowed(value + step * 5, true));
          break;
        case "PageDown":
          e.preventDefault();
          onValueChange(resolveAllowed(value - step * 5, false));
          break;
      }
    };

    return (
      <div
        {...rest}
        className={[
          "inline-flex select-none items-stretch rounded-md border bg-background text-foreground",
          disabled ? "opacity-60" : "",
          className || "",
        ].join(" ")}
        aria-disabled={disabled}
      >
        <button
          type="button"
          onClick={dec}
          disabled={disabled || (min !== undefined && value <= min)}
          className="grid h-9 w-9 place-items-center border-r text-muted-foreground hover:bg-muted/60 disabled:opacity-40"
          aria-label="Decrease"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          ref={ref}
          type="number"
          inputMode="numeric"
          value={value}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          disabled={disabled}
          className="h-9 w-16 border-0 bg-transparent px-2 text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          aria-live="polite"
        />
        <button
          type="button"
          onClick={inc}
          disabled={disabled || (max !== undefined && value >= max)}
          className="grid h-9 w-9 place-items-center border-l text-muted-foreground hover:bg-muted/60 disabled:opacity-40"
          aria-label="Increase"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    );
  }
);

QuantityStepper.displayName = "QuantityStepper";
