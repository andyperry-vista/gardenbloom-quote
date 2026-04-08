import { useState, useEffect } from "react";
import { useJobs } from "@/hooks/useJobs";
import { useInvoices } from "@/hooks/useInvoices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Sun, Cloud, CloudRain } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from "date-fns";
import { Link } from "react-router-dom";

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
  const { jobs } = useJobs();
  const { invoices } = useInvoices();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [weather, setWeather] = useState<WeatherDay[]>([]);

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

  const getJobsForDay = (date: Date) => jobs.filter((j) => j.scheduledDate && isSameDay(new Date(j.scheduledDate), date));
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
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => <div key={`pad-${i}`} />)}
              {days.map((day) => {
                const dayJobs = getJobsForDay(day);
                const dayInvoices = getDueInvoices(day);
                const dayWeather = getWeather(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[80px] p-1 rounded-lg border text-xs ${isToday(day) ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/30"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${isToday(day) ? "text-primary" : ""}`}>{format(day, "d")}</span>
                      {dayWeather && (
                        <div className="flex items-center gap-0.5">
                          <WeatherIcon code={dayWeather.weatherCode} />
                          <span className="text-[10px] text-muted-foreground">{Math.round(dayWeather.tempMax)}°</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-0.5 mt-1">
                      {dayJobs.map((j) => (
                        <Link key={j.id} to={`/admin/jobs/${j.id}`}>
                          <div className="bg-primary/10 text-primary rounded px-1 truncate text-[10px]">{j.jobNumber}</div>
                        </Link>
                      ))}
                      {dayInvoices.map((i) => (
                        <Link key={i.id} to={`/admin/invoices/${i.id}`}>
                          <div className="bg-destructive/10 text-destructive rounded px-1 truncate text-[10px]">{i.invoiceNumber} due</div>
                        </Link>
                      ))}
                    </div>
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
