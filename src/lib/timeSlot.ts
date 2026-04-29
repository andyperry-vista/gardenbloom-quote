export type TimeSlot = "morning" | "afternoon" | "all_day";

export const TIME_SLOTS: { value: TimeSlot; label: string; short: string }[] = [
  { value: "all_day", label: "All day", short: "All day" },
  { value: "morning", label: "Morning", short: "AM" },
  { value: "afternoon", label: "Afternoon", short: "PM" },
];

export function timeSlotLabel(slot: TimeSlot | null | undefined): string {
  return TIME_SLOTS.find((s) => s.value === slot)?.label ?? "All day";
}

export function timeSlotShort(slot: TimeSlot | null | undefined): string {
  return TIME_SLOTS.find((s) => s.value === slot)?.short ?? "All day";
}

/** Sort key so morning < afternoon < all_day within the same day. */
export function timeSlotOrder(slot: TimeSlot | null | undefined): number {
  switch (slot) {
    case "morning": return 0;
    case "afternoon": return 1;
    default: return 2;
  }
}
