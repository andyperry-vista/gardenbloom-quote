import { useState, useEffect } from "react";
import { useJobs } from "@/hooks/useJobs";
import { useInvoices } from "@/hooks/useInvoices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Sun, Cloud, CloudRain, GripVertical } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, addMonths, subMonths } from "date-fns";
import { Link } from "react-router-dom";
import { timeSlotOrder, type TimeSlot } from "@/lib/timeSlot";
import { toast } from "sonner";

interface WeatherDay {
  date: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
}

function WeatherIcon({ code }: { code: number }) {
  if (code <= 1) return <Sun className="w-4 h-4 text-yellow-400" />;
  if (code <= 3) return <Cloud className="w-4 h-4 text-muted-foreground" />;
  return <CloudRain className="w-4 h-4 text-blue-400" />;
}

export default function CalendarPage() {
  const { jobs, updateJob, reorderJobs } = useJobs();
  const { invoices } = useInvoices();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [weather, setWeather] = useState<WeatherDay[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  // Drop target for inserting BEFORE a specific job: `${jobId}`
  const [insertBeforeId, setInsertBeforeId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, jobId: string) => {
    e.dataTransfer.setData("text/job-id", jobId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(jobId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTarget(null);
    setInsertBeforeId(null);
  };

  const handleDrop = (e: React.DragEvent, dateISO: string, slot: TimeSlot) => {
    e.preventDefault();
    const jobId = e.dataTransfer.getData("text/job-id") || draggingId;
    const beforeId = insertBeforeId;
    setDraggingId(null);
    setDropTarget(null);
    setInsertBeforeId(null);
    if (!jobId) return;
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    // Build the destination lane (excluding the dragged job), then insert.
    const destLane = jobs
      .filter(
        (j) =>
          j.id !== job.id &&
          j.scheduledDate === dateISO &&
          j.timeSlot === slot,
      )
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const insertIdx =
      beforeId && destLane.some((j) => j.id === beforeId)
        ? destLane.findIndex((j) => j.id === beforeId)
        : destLane.length;

    const movedJob = {
      ...job,
      scheduledDate: dateISO,
      timeSlot: slot,
    };
    const newDestLane = [
      ...destLane.slice(0, insertIdx),
      movedJob,
      ...destLane.slice(insertIdx),
    ];

    const updates: Array<{
      id: string;
      sortOrder: number;
      scheduledDate?: string | null;
      timeSlot?: TimeSlot;
    }> = newDestLane.map((j, idx) => {
      const u: { id: string; sortOrder: number; scheduledDate?: string | null; timeSlot?: TimeSlot } = {
        id: j.id,
        sortOrder: idx,
      };
      if (j.id === job.id) {
        u.scheduledDate = dateISO;
        u.timeSlot = slot;
      } else if (j.sortOrder !== idx) {
        // sort_order changed only
      }
      return u;
    });

    // If the source lane is different, also resequence the source lane.
    const sourceChanged =
      job.scheduledDate !== dateISO || job.timeSlot !== slot;
    if (sourceChanged && job.scheduledDate) {
      const sourceLane = jobs
        .filter(
          (j) =>
            j.id !== job.id &&
            j.scheduledDate === job.scheduledDate &&
            j.timeSlot === job.timeSlot,
        )
        .sort((a, b) => a.sortOrder - b.sortOrder);
      sourceLane.forEach((j, idx) => {
        if (j.sortOrder !== idx) {
          updates.push({ id: j.id, sortOrder: idx });
        }
      });
    }

    // No-op guard: same lane, same position
    if (!sourceChanged) {
      const oldIdx = [...destLane, movedJob]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .findIndex((j) => j.id === job.id);
      const newIdx = newDestLane.findIndex((j) => j.id === job.id);
      if (oldIdx === newIdx) return;
    }

    reorderJobs(updates);
    toast.success(
      `${job.jobNumber} → ${format(new Date(dateISO), "d MMM")} ${
        slot === "morning" ? "AM" : slot === "afternoon" ? "PM" : "All-day"
      }`,
    );
  };

  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=-37.76&longitude=145.12&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Australia%2FSydney&forecast_days=14")
      .then((r) => r.json())
      .then((d) => {
        if (d.daily) {
          setWeather(d.daily.time.map((t: string, i: number) => ({
            date: t,
            tempMax: d.daily.temperature_2m_max[i],
            tempMin: d.daily.temperature_2m_min[i],
            weatherCode: d.daily.weather_code[i],
          })));
        }
      })
      .catch(() => {});
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getJobsForDay = (date: Date) =>
    jobs
      .filter((j) => j.scheduledDate && isSameDay(new Date(j.scheduledDate), date))
      .sort(
        (a, b) =>
          timeSlotOrder(a.timeSlot) - timeSlotOrder(b.timeSlot) ||
          a.sortOrder - b.sortOrder,
      );
  const getDueInvoices = (date: Date) => invoices.filter((i) => i.dueDate && isSameDay(new Date(i.dueDate), date) && i.status !== "paid");
  const getWeather = (date: Date) => weather.find((w) => isSameDay(new Date(w.date), date));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl text-foreground">Calendar</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-lg font-medium min-w-[160px] text-center">{format(currentMonth, "MMMM yyyy")}</span>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-xs">
              <span className="text-muted-foreground font-medium">Legend:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-500/30 border-l-2 border-amber-500/70" aria-hidden />
                <span><span className="font-semibold">AM</span> — Morning</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-indigo-500/30 border-l-2 border-indigo-500/70" aria-hidden />
                <span><span className="font-semibold">PM</span> — Afternoon</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-primary/25" aria-hidden />
                <span>All-day</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-destructive/20" aria-hidden />
                <span>Invoice due</span>
              </div>
              <span className="text-muted-foreground ml-auto hidden sm:inline">
                Tip: drag a job between AM, PM or All-day to reschedule.
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => <div key={`pad-${i}`} />)}
              {days.map((day) => {
                const dayJobs = getJobsForDay(day);
                const amJobs = dayJobs.filter((j) => j.timeSlot === "morning");
                const pmJobs = dayJobs.filter((j) => j.timeSlot === "afternoon");
                const allDayJobs = dayJobs.filter((j) => j.timeSlot === "all_day");
                const dayInvoices = getDueInvoices(day);
                const dayWeather = getWeather(day);
                const dayISO = format(day, "yyyy-MM-dd");

                const renderJob = (j: typeof dayJobs[number], variant: "am" | "pm" | "all") => {
                  const base =
                    variant === "all"
                      ? "bg-primary/15 text-primary font-medium"
                      : "bg-background/70";
                  const showInsertBar =
                    insertBeforeId === j.id &&
                    draggingId &&
                    draggingId !== j.id;
                  return (
                    <div
                      key={j.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, j.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => {
                        if (!draggingId || draggingId === j.id) return;
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = "move";
                        if (insertBeforeId !== j.id) setInsertBeforeId(j.id);
                      }}
                      onDragLeave={(e) => {
                        e.stopPropagation();
                      }}
                      className={`group relative flex items-center gap-0.5 rounded px-1 py-0.5 truncate text-[10px] cursor-grab active:cursor-grabbing transition-opacity ${base} ${
                        draggingId === j.id ? "opacity-40" : "hover:opacity-80"
                      } ${showInsertBar ? "before:absolute before:left-0 before:right-0 before:-top-[3px] before:h-[2px] before:rounded before:bg-primary before:content-['']" : ""}`}
                      title="Drag to reorder, or move to AM, PM or All-day"
                    >
                      <GripVertical className="w-2.5 h-2.5 shrink-0 opacity-40 group-hover:opacity-80" aria-hidden />
                      <Link
                        to={`/admin/jobs/${j.id}`}
                        className="truncate flex-1"
                        onClick={(e) => {
                          // Prevent navigation if a drag has just ended
                          if (draggingId) e.preventDefault();
                        }}
                      >
                        {j.jobNumber}
                      </Link>
                    </div>
                  );
                };

                const dropZoneProps = (slot: TimeSlot) => {
                  const key = `${dayISO}|${slot}`;
                  return {
                    onDragOver: (e: React.DragEvent) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (dropTarget !== key) setDropTarget(key);
                      // dragging over slot background = append (no insertBefore)
                      if (insertBeforeId !== null) setInsertBeforeId(null);
                    },
                    onDragLeave: () => {
                      if (dropTarget === key) setDropTarget(null);
                    },
                    onDrop: (e: React.DragEvent) => handleDrop(e, dayISO, slot),
                    "data-active": dropTarget === key ? "true" : undefined,
                  };
                };

                const dropRing = (slot: TimeSlot) =>
                  dropTarget === `${dayISO}|${slot}` ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : "";

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[110px] p-1 rounded-lg border text-xs flex flex-col ${isToday(day) ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/30"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-medium ${isToday(day) ? "text-primary" : ""}`}>{format(day, "d")}</span>
                      {dayWeather && (
                        <div className="flex items-center gap-0.5">
                          <WeatherIcon code={dayWeather.weatherCode} />
                          <span className="text-[10px] text-muted-foreground">{Math.round(dayWeather.tempMax)}°</span>
                        </div>
                      )}
                    </div>

                    {/* All-day band (drop zone) */}
                    <div
                      {...dropZoneProps("all_day")}
                      className={`mb-0.5 rounded transition-colors ${dropRing("all_day")} ${
                        allDayJobs.length === 0
                          ? draggingId
                            ? "min-h-[14px] border border-dashed border-primary/40 bg-primary/5 text-[9px] text-primary/70 px-1 leading-[14px]"
                            : "min-h-0"
                          : ""
                      }`}
                    >
                      {allDayJobs.length > 0 ? (
                        <div className="space-y-0.5">{allDayJobs.map((j) => renderJob(j, "all"))}</div>
                      ) : draggingId ? (
                        <span>Drop for All-day</span>
                      ) : null}
                    </div>

                    {/* AM / PM split (drop zones) */}
                    <div className="flex-1 grid grid-rows-2 gap-0.5 min-h-[44px]">
                      <div
                        {...dropZoneProps("morning")}
                        className={`rounded px-1 py-0.5 border-l-2 overflow-hidden transition-colors ${dropRing("morning")} ${
                          amJobs.length > 0
                            ? "bg-amber-500/10 border-amber-500/70 text-amber-800 dark:text-amber-200"
                            : draggingId
                            ? "bg-amber-500/15 border-amber-500/70 text-amber-800 dark:text-amber-200"
                            : "bg-muted/20 border-transparent text-muted-foreground/40"
                        }`}
                      >
                        <div className="flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase opacity-80">
                          <span>AM</span>
                          {amJobs.length > 0 && <span className="opacity-60">· {amJobs.length}</span>}
                        </div>
                        <div className="space-y-0.5">{amJobs.map((j) => renderJob(j, "am"))}</div>
                      </div>
                      <div
                        {...dropZoneProps("afternoon")}
                        className={`rounded px-1 py-0.5 border-l-2 overflow-hidden transition-colors ${dropRing("afternoon")} ${
                          pmJobs.length > 0
                            ? "bg-indigo-500/10 border-indigo-500/70 text-indigo-800 dark:text-indigo-200"
                            : draggingId
                            ? "bg-indigo-500/15 border-indigo-500/70 text-indigo-800 dark:text-indigo-200"
                            : "bg-muted/20 border-transparent text-muted-foreground/40"
                        }`}
                      >
                        <div className="flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase opacity-80">
                          <span>PM</span>
                          {pmJobs.length > 0 && <span className="opacity-60">· {pmJobs.length}</span>}
                        </div>
                        <div className="space-y-0.5">{pmJobs.map((j) => renderJob(j, "pm"))}</div>
                      </div>
                    </div>

                    {dayInvoices.length > 0 && (
                      <div className="mt-0.5 space-y-0.5">
                        {dayInvoices.map((i) => (
                          <Link key={i.id} to={`/admin/invoices/${i.id}`}>
                            <div className="bg-destructive/10 text-destructive rounded px-1 truncate text-[10px]">{i.invoiceNumber} due</div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {weather.length > 0 && (
          <Card>
            <CardHeader><CardTitle>14-Day Weather — Lower Templestowe</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {weather.slice(0, 14).map((w) => (
                  <div key={w.date} className="text-center p-2 rounded-lg border">
                    <p className="text-xs text-muted-foreground">{format(new Date(w.date), "EEE d")}</p>
                    <WeatherIcon code={w.weatherCode} />
                    <p className="text-xs font-medium">{Math.round(w.tempMax)}° / {Math.round(w.tempMin)}°</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
