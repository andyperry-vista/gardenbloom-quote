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
  const { jobs, updateJob } = useJobs();
  const { invoices } = useInvoices();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [weather, setWeather] = useState<WeatherDay[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, jobId: string) => {
    e.dataTransfer.setData("text/job-id", jobId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(jobId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, dateISO: string, slot: TimeSlot) => {
    e.preventDefault();
    const jobId = e.dataTransfer.getData("text/job-id") || draggingId;
    setDraggingId(null);
    setDropTarget(null);
    if (!jobId) return;
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    const sameDate = job.scheduledDate === dateISO;
    const sameSlot = job.timeSlot === slot;
    if (sameDate && sameSlot) return;
    const updates: Parameters<typeof updateJob>[1] = { timeSlot: slot };
    if (!sameDate) updates.scheduledDate = dateISO;
    updateJob(job.id, updates);
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
      .sort((a, b) => timeSlotOrder(a.timeSlot) - timeSlotOrder(b.timeSlot));
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

                const renderJob = (j: typeof dayJobs[number]) => (
                  <Link key={j.id} to={`/admin/jobs/${j.id}`}>
                    <div className="rounded px-1 py-0.5 truncate text-[10px] hover:opacity-80 transition-opacity bg-background/70">
                      {j.jobNumber}
                    </div>
                  </Link>
                );

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

                    {/* All-day band */}
                    {allDayJobs.length > 0 && (
                      <div className="mb-0.5 space-y-0.5">
                        {allDayJobs.map((j) => (
                          <Link key={j.id} to={`/admin/jobs/${j.id}`}>
                            <div className="bg-primary/15 text-primary rounded px-1 truncate text-[10px] font-medium">
                              {j.jobNumber}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* AM / PM split */}
                    <div className="flex-1 grid grid-rows-2 gap-0.5 min-h-[44px]">
                      <div className={`rounded px-1 py-0.5 border-l-2 overflow-hidden ${
                        amJobs.length > 0
                          ? "bg-amber-500/10 border-amber-500/70 text-amber-800 dark:text-amber-200"
                          : "bg-muted/20 border-transparent text-muted-foreground/40"
                      }`}>
                        <div className="flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase opacity-80">
                          <span>AM</span>
                          {amJobs.length > 0 && <span className="opacity-60">· {amJobs.length}</span>}
                        </div>
                        <div className="space-y-0.5">{amJobs.map(renderJob)}</div>
                      </div>
                      <div className={`rounded px-1 py-0.5 border-l-2 overflow-hidden ${
                        pmJobs.length > 0
                          ? "bg-indigo-500/10 border-indigo-500/70 text-indigo-800 dark:text-indigo-200"
                          : "bg-muted/20 border-transparent text-muted-foreground/40"
                      }`}>
                        <div className="flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase opacity-80">
                          <span>PM</span>
                          {pmJobs.length > 0 && <span className="opacity-60">· {pmJobs.length}</span>}
                        </div>
                        <div className="space-y-0.5">{pmJobs.map(renderJob)}</div>
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
