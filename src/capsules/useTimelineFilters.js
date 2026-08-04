import { useMemo, useState } from "react";

export const PAGE_SIZE = 50;

export const VISIBLE_TRACK_EVENTS = new Set([
  "track_play",
  "track_pause",
  "track_skip",
  "track_created",
  "track_deleted",
]);

const matchesModule = (event, filterModule) => {
  if (filterModule === "vault") return event.event_type?.startsWith("entry_") || event.event_type === "era_created";
  if (filterModule === "music") return event.event_type?.startsWith("track_") || event.event_type?.startsWith("drop_") || event.event_type === "playlist_created";
  if (filterModule === "smoke") return event.event_type?.startsWith("smoke_");
  if (filterModule === "system") return event.event_type?.startsWith("capsule_") || !event.event_type?.match(/^(entry_|track_|drop_|smoke_|era_|playlist_)/);
  return true;
};

export function filterTimelineEvents(events = [], {
  filterModule = "all",
  filterType = "all",
  filterEra = "all",
  filterUser = "all",
} = {}) {
  let result = events.filter(
    (event) => !event.event_type?.startsWith("track_") || VISIBLE_TRACK_EVENTS.has(event.event_type),
  );

  if (filterModule !== "all") result = result.filter((event) => matchesModule(event, filterModule));
  if (filterType !== "all") result = result.filter((event) => event.event_type === filterType);
  if (filterEra !== "all") {
    result = result.filter((event) => {
      try {
        const payload = typeof event.payload === "string" ? JSON.parse(event.payload || "{}") : (event.payload || {});
        return payload.era_id === filterEra || payload.era_name === filterEra;
      } catch {
        return false;
      }
    });
  }
  if (filterUser !== "all") result = result.filter((event) => event.user_id === filterUser);
  return result;
}

export function getTodayEvents(filteredEvents = [], now = new Date()) {
  const mmdd = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return filteredEvents.filter((event) => {
    if (!event.created_at) return false;
    const eventYear = new Date(event.created_at).getFullYear();
    if (eventYear === now.getFullYear()) return false;
    return event.created_at.slice(5, 10) === mmdd;
  });
}

export function getEventTypes(events = []) {
  return [...new Set(
    events
      .filter((event) => !event.event_type?.startsWith("track_") || VISIBLE_TRACK_EVENTS.has(event.event_type))
      .map((event) => event.event_type)
      .filter(Boolean),
  )].sort();
}

export function useTimelineFilters(events = []) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [filterModule, setFilterModule] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterEra, setFilterEra] = useState("all");
  const [filterUser, setFilterUser] = useState("all");

  const filteredEvents = useMemo(
    () => filterTimelineEvents(events, { filterModule, filterType, filterEra, filterUser }),
    [events, filterModule, filterType, filterEra, filterUser],
  );
  const todayEvents = useMemo(() => getTodayEvents(filteredEvents), [filteredEvents]);
  const eventTypes = useMemo(() => getEventTypes(events), [events]);
  const visibleEvents = filteredEvents.slice(0, visibleCount);
  const hasMore = visibleCount < filteredEvents.length;

  const selectFilter = (setter) => (value) => {
    setter(value);
    setVisibleCount(PAGE_SIZE);
  };

  return {
    visibleCount,
    filterModule,
    filterType,
    filterEra,
    filterUser,
    filteredEvents,
    todayEvents,
    eventTypes,
    visibleEvents,
    hasMore,
    setFilterModule: selectFilter(setFilterModule),
    setFilterType: selectFilter(setFilterType),
    setFilterEra: selectFilter(setFilterEra),
    setFilterUser: selectFilter(setFilterUser),
    loadMore: () => setVisibleCount((count) => Math.min(count + PAGE_SIZE, filteredEvents.length)),
  };
}
