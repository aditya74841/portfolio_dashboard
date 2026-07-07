import React, { useMemo, useState } from "react";
import { format, subDays, startOfWeek, addDays, isSameDay } from "date-fns";

interface StreakLog {
  value: number;
  completed: boolean;
  completedAt?: Date;
  note?: string;
}

interface HeatmapProps {
  logs: StreakLog[];
}

export function StreakHeatmap({ logs }: HeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{ date: Date; log?: StreakLog } | null>(null);

  // Calculate the last 14 weeks (98 days)
  const WEEKS_TO_SHOW = 14;
  
  const calendarGrid = useMemo(() => {
    const today = new Date();
    const startDate = startOfWeek(subDays(today, (WEEKS_TO_SHOW - 1) * 7));
    
    const grid: { date: Date; log?: StreakLog }[][] = [];
    
    let currentDate = startDate;
    for (let w = 0; w < WEEKS_TO_SHOW; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const logForDay = logs.find(log => log.completedAt && isSameDay(new Date(log.completedAt), currentDate));
        week.push({
          date: currentDate,
          log: logForDay
        });
        currentDate = addDays(currentDate, 1);
      }
      grid.push(week);
    }
    return grid;
  }, [logs]);

  return (
    <div className="relative mt-6 pt-4 border-t border-gray-800">
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
        {calendarGrid.map((week, wIndex) => (
          <div key={wIndex} className="flex flex-col gap-1">
            {week.map((cell, dIndex) => {
              const isFuture = cell.date > new Date();
              const hasCompleted = !!cell.log?.completed;

              return (
                <div
                  key={dIndex}
                  onMouseEnter={() => !isFuture && setHoveredCell(cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={`w-3 h-3 rounded-sm transition-colors cursor-pointer ${
                    isFuture
                      ? "bg-transparent"
                      : hasCompleted
                      ? "bg-emerald-500 hover:bg-emerald-400"
                      : "bg-gray-800 hover:bg-gray-700"
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {hoveredCell && (
        <div className="absolute top-[-40px] left-1/2 transform -translate-x-1/2 bg-gray-950 text-white text-xs py-1.5 px-3 rounded-md shadow-xl border border-gray-800 z-10 whitespace-nowrap pointer-events-none">
          <div className="font-semibold text-emerald-400">
            {format(hoveredCell.date, "MMM d, yyyy")}
          </div>
          {hoveredCell.log?.note ? (
            <div className="text-gray-300 mt-0.5 truncate max-w-[200px]">
              "{hoveredCell.log.note}"
            </div>
          ) : hoveredCell.log?.completed ? (
            <div className="text-gray-400 mt-0.5">Completed</div>
          ) : (
            <div className="text-gray-500 mt-0.5">No activity</div>
          )}
        </div>
      )}
    </div>
  );
}
