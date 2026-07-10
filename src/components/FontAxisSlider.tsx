"use client";

import { Slider, resolveSliderValue } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import type { VariableAxis } from "@/lib/fontMeta";

export function FontAxisSlider({
  axis,
  value,
  onChange,
}: {
  axis: VariableAxis;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777]">
        <span>
          {axis.name}{" "}
          <span className="text-foreground">{axis.tag}</span>
        </span>
        <span className="font-mono">{value}</span>
      </div>
      <Slider
        min={axis.min}
        max={axis.max}
        step={0.1}
        value={[value]}
        onValueChange={(v) => onChange(resolveSliderValue(v))}
      />
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onChange(axis.default)}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
