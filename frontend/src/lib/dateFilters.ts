/** Map UI date filter values to API start/end date params */
export function getAppointmentDateRange(selectedDate: string): {
  startDate?: string;
  endDate?: string;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  switch (selectedDate) {
    case "today":
      return { startDate: fmt(today), endDate: fmt(today) };
    case "upcoming":
      return { startDate: fmt(today) };
    case "past": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { endDate: fmt(yesterday) };
    }
    default:
      return {};
  }
}
