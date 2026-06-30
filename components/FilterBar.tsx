"use client";

import { useState, useRef, useEffect } from "react";

export type FilterValue = string;

export interface FilterDef {
  key: string;            // "team" | "tournament" | "venue"
  label: string;          // short label ("Team")
  defaultValue: FilterValue;
  options: FilterValue[]; // list of selectable values
  /** When true (e.g. "Tournament"), the filter is always-on; no enable toggle is shown. */
  alwaysOn?: boolean;
  /** Optional: returns a hex color for the given option value (e.g. team primary color) */
  colorFn?: (value: FilterValue) => string | undefined;
}

interface FilterBarProps {
  filters: FilterDef[];
  values: Record<string, FilterValue>;
  enabled: Record<string, boolean>;
  onValueChange: (key: string, value: FilterValue) => void;
  onEnabledChange: (key: string, enabled: boolean) => void;
}

/**
 * Bawler v0.6 filter row.
 *   - Pre-filled values (KKR / Eden Gardens), not "All".
 *   - Each pill has a SEPARATE enable toggle (left circle) + value-dropdown
 *     button (right text + chevron). Tap the circle to enable/disable.
 *     Tap the text to open the dropdown.
 *   - Dropdown uses a fixed backdrop for click-outside-to-close (avoids the
 *     overflow-clip bug from the previous version).
 *   - Picking a non-default value automatically enables the filter.
 */
export default function FilterBar({ filters, values, enabled, onValueChange, onEnabledChange }: FilterBarProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-1 flex-nowrap">
      {filters.map(f => (
        <FilterPill
          key={f.key}
          def={f}
          value={values[f.key]}
          enabled={!!enabled[f.key]}
          open={openKey === f.key}
          color={f.colorFn?.(values[f.key])}
          onToggleEnable={() => onEnabledChange(f.key, !enabled[f.key])}
          onOpen={() => setOpenKey(f.key)}
          onClose={() => setOpenKey(null)}
          onChoose={(v) => {
            onValueChange(f.key, v);
            if (v !== f.defaultValue && !enabled[f.key]) {
              onEnabledChange(f.key, true);
            }
            setOpenKey(null);
          }}
        />
      ))}
    </div>
  );
}

function FilterPill({
  def,
  value,
  enabled,
  open,
  color,
  onToggleEnable,
  onOpen,
  onClose,
  onChoose,
}: {
  def: FilterDef;
  value: FilterValue;
  enabled: boolean;
  open: boolean;
  color?: string;
  onToggleEnable: () => void;
  onOpen: () => void;
  onClose: () => void;
  onChoose: (v: FilterValue) => void;
}) {
  const pillRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  // Position the dropdown using fixed coords so it escapes any overflow-clip parent
  useEffect(() => {
    if (!open || !pillRef.current) return;
    const rect = pillRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 6,
      left: Math.min(rect.left, window.innerWidth - 180),
      minWidth: 160,
      zIndex: 50,
    });
  }, [open]);

  const showEnableToggle = !def.alwaysOn;
  const effectivelyOn = def.alwaysOn || enabled;

  // Truncate displayed value if too long so all 3 pills fit in one row on narrow phones.
  const displayValue = value.length > 8 ? value.slice(0, 7) + "…" : value;

  return (
    <div
      ref={pillRef}
      className={`inline-flex items-center rounded-full border text-[10px] font-bold transition-colors overflow-hidden shrink-0 ${
        effectivelyOn
          ? "bg-cyan/15 border-cyan/55 text-cyan"
          : "bg-bg-surface border-line text-text-secondary"
      }`}
    >
      {showEnableToggle && (
        <button
          type="button"
          onClick={onToggleEnable}
          className={`pl-1.5 pr-1 py-1 ${effectivelyOn ? "" : "opacity-60"}`}
          aria-label={enabled ? `Disable ${def.label} filter` : `Enable ${def.label} filter`}
        >
          {enabled ? (
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden>
              <circle cx="6" cy="6" r="4.5" fill="currentColor" />
            </svg>
          ) : (
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden>
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          )}
        </button>
      )}
      <button
        type="button"
        onClick={onOpen}
        className="flex items-center gap-0.5 pl-0.5 pr-1.5 py-1"
      >
        {color && effectivelyOn && (
          <span
            className="w-2 h-2 rounded-full shrink-0 mr-0.5"
            style={{ background: color, boxShadow: `0 0 4px ${color}88` }}
          />
        )}
        <span className="text-[7.5px] uppercase tracking-widest font-extrabold opacity-65 leading-none">{def.label}</span>
        <span className="text-[10.5px] leading-none">{displayValue}</span>
        <svg width="8" height="8" viewBox="0 0 12 12" fill="none" className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>
          <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {open && (
        <>
          {/* full-page backdrop so any tap outside closes the dropdown */}
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <div
            style={dropdownStyle}
            className="rounded-xl bg-bg-elevated border border-line shadow-2xl overflow-hidden max-h-[60vh] overflow-y-auto scrollbar-thin"
          >
            {def.options.map(opt => {
              const isActive = opt === value;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onChoose(opt)}
                  className={`block w-full text-left px-3 py-2 text-xs transition-colors ${
                    isActive ? "bg-cyan/15 text-cyan" : "hover:bg-bg-surface text-text-primary"
                  }`}
                >
                  <span className="flex items-center justify-between">
                    <span>{opt}</span>
             