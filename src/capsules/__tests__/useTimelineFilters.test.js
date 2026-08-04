// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  filterTimelineEvents,
  getEventTypes,
  getTodayEvents,
  useTimelineFilters,
} from "../useTimelineFilters.js";

const events = [
  { id: "1", event_type: "entry_created", user_id: "edu", created_at: "2025-03-15T10:00:00.000Z" },
  { id: "2", event_type: "track_updated", user_id: "edu", created_at: "2025-03-15T11:00:00.000Z" },
  { id: "3", event_type: "track_play", user_id: "david", created_at: "2024-03-15T12:00:00.000Z", payload: { era_id: "era-1" } },
  { id: "4", event_type: "drop_sent", user_id: "david", created_at: "2023-06-10T12:00:00.000Z", payload: '{"era_name":"era-2"}' },
];

describe("useTimelineFilters", () => {
  it("filters modules and hides non-whitelisted track events", () => {
    expect(filterTimelineEvents(events, { filterModule: "music" }).map((event) => event.id)).toEqual(["3", "4"]);
    expect(filterTimelineEvents(events).map((event) => event.id)).not.toContain("2");
  });

  it("filters by era and user while preserving malformed-payload safety", () => {
    expect(filterTimelineEvents(events, { filterEra: "era-1", filterUser: "david" }).map((event) => event.id)).toEqual(["3"]);
    expect(filterTimelineEvents([{ event_type: "entry_created", payload: "{bad" }], { filterEra: "era-1" })).toEqual([]);
  });

  it("keeps event types based on raw events plus whitelist", () => {
    expect(getEventTypes(events)).toEqual(["drop_sent", "entry_created", "track_play"]);
  });

  it("finds events from the same month/day in previous years", () => {
    const today = new Date("2026-03-15T12:00:00.000Z");
    const filtered = filterTimelineEvents(events);
    expect(getTodayEvents(filtered, today).map((event) => event.id)).toEqual(["1", "3"]);
  });

  it("resets pagination when a filter changes and loads more", () => {
    const manyEvents = Array.from({ length: 55 }, (_, index) => ({
      id: String(index), event_type: "entry_created", created_at: "2026-01-01T00:00:00.000Z",
    }));
    const { result } = renderHook(() => useTimelineFilters(manyEvents));
    expect(result.current.visibleCount).toBe(50);
    act(() => result.current.loadMore());
    expect(result.current.visibleCount).toBe(55);
    act(() => result.current.setFilterModule("vault"));
    expect(result.current.visibleCount).toBe(50);
    vi.restoreAllMocks();
  });
});
