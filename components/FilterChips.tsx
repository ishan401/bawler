"use client";

import React from "react";

/**
 * Shared filter-chip row — single-row, horizontally-scrollable pill selector.
 * Originally built for DigestTab's Day (Test) / Innings (T20/ODI) filters;
 * extracted so any tab needing the same "pick one of N, active = cyan pill"
 * pattern (e.g. Scorecard's innings selector) reuses the exact same
 * component instead of re-implementing the markup.
 *
 * Renders nothing when there's only one (or zero) option — a single chip
 * would just be a redundant, unselectable pill.
 */
export interface FilterChipItem<T extends string | number> {
  value: T;
  label: string;
}

interface FilterChipsProps<T extends string | number> {
  items: FilterChipItem<T>[];
  active: T;
  onSelect: (value: T) => void;
}

export default function FilterChips<T extends string | number>({
  items,
  active,
  onSelect,
}: FilterChipsProps<T>) {
  if (items.length <= 1) return null;
  return (
    <div className="flex gap-2 pb-3 overflow-x-auto no-scrollbar">
      {items.map(item => (
        <button
          key={item.value}
          onClick={() => onSelect(item.value)}
          className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
            item.value === active
              ? "bg-cyan text-bg-base border-cyan"
              : "bg-transparent text-text-dim border-line/60 active:bg-line/30"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
