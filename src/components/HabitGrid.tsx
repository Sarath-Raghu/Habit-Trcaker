import React from 'react';
import { 
  format, 
  getDaysInMonth, 
  getDate, 
  isToday, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { Check, Trash2, Edit2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface Habit {
  id: number;
  title: string;
  color: string;
  notes?: string;
  entries: { date: string; completed: boolean }[];
}

interface HabitGridProps {
  habits: Habit[];
  currentDate: Date;
  onToggle: (habitId: number, date: string) => void;
  onDelete: (habitId: number) => void;
  onEdit: (habit: Habit) => void;
  viewMode: 'monthly' | 'weekly';
}

export default function HabitGrid({ habits, currentDate, onToggle, onDelete, onEdit, viewMode }: HabitGridProps) {
  let days: Date[];
  
  if (viewMode === 'weekly') {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  } else {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  }

  const daysCount = days.length;

  // Calculate daily totals for the bottom summary
  const dailyTotals = days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    let completedCount = 0;
    habits.forEach(habit => {
      if (habit.entries.some(e => e.date === dateStr && e.completed)) {
        completedCount++;
      }
    });
    return {
      date: dateStr,
      percentage: habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0
    };
  });

  const getHabitGoal = (habit: Habit) => {
    // Default to daily if not specified (though DB defaults to daily)
    const freq = (habit as any).frequency || 'daily';
    
    if (freq === 'daily') return daysCount;
    if (freq === 'weekly') return Math.ceil(daysCount / 7);
    
    let count = 0;
    days.forEach(day => {
      const dayOfWeek = day.getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      if (freq === 'weekdays' && !isWeekend) count++;
      if (freq === 'weekends' && isWeekend) count++;
    });
    return count;
  };

  return (
    <div className="overflow-x-auto pb-4 -mx-4 md:mx-0 px-4 md:px-0">
      <div className={cn(
        "bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 transition-colors duration-200 overflow-hidden inline-block min-w-full align-middle [--habit-col-width:140px] md:[--habit-col-width:220px] [--goal-col-width:50px]"
      )}>
        {/* Header Row */}
        <div className="grid border-b border-stone-200 dark:border-stone-800" style={{ gridTemplateColumns: `var(--habit-col-width) var(--goal-col-width) repeat(${daysCount}, minmax(44px, 1fr))` }}>
          <div className="sticky left-0 z-20 bg-white dark:bg-stone-900 p-4 font-semibold text-stone-500 dark:text-stone-400 text-xs uppercase tracking-wider flex items-end border-r border-stone-100 dark:border-stone-800 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
            Habit
          </div>
          <div className="p-4 font-semibold text-stone-500 dark:text-stone-400 text-xs uppercase tracking-wider flex items-end justify-center border-stone-100 dark:border-stone-800">
            Goal
          </div>
          {days.map((day) => (
            <div 
              key={day.toString()} 
              className={cn(
                "flex flex-col items-center justify-end p-2 text-xs border-l border-stone-100 dark:border-stone-800",
                isToday(day) && "bg-emerald-50/50 dark:bg-emerald-900/20"
              )}
            >
              <span className="text-stone-400 dark:text-stone-500 font-medium mb-1">{format(day, 'EEEEE')}</span>
              <span className={cn(
                "w-6 h-6 flex items-center justify-center rounded-full font-semibold",
                isToday(day) ? "bg-emerald-500 text-white shadow-sm" : "text-stone-600 dark:text-stone-400"
              )}>
                {getDate(day)}
              </span>
            </div>
          ))}
        </div>

        {/* Habit Rows */}
        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {habits.map((habit) => {
            // Calculate row progress
            const completedInPeriod = days.filter(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                return habit.entries.some(e => e.date === dateStr && e.completed);
            }).length;
            const progress = Math.round((completedInPeriod / daysCount) * 100);
            const goal = getHabitGoal(habit);

            return (
              <div key={habit.id} className="grid group hover:bg-stone-50/50 dark:hover:bg-stone-800/50 transition-colors" style={{ gridTemplateColumns: `var(--habit-col-width) var(--goal-col-width) repeat(${daysCount}, minmax(44px, 1fr))` }}>
                <div className="sticky left-0 z-20 bg-white dark:bg-stone-900 group-hover:bg-stone-50 dark:group-hover:bg-stone-900 transition-colors p-4 flex items-center justify-between pr-6 border-r border-stone-100 dark:border-stone-800 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
                  <div className="flex flex-col overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-700 dark:text-stone-200 truncate" title={habit.title}>{habit.title}</span>
                    </div>
                    {habit.notes && (
                       <span className="text-[10px] text-stone-400 dark:text-stone-500 truncate mt-0.5">{habit.notes}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onEdit(habit)}
                      className="p-1 text-stone-300 hover:text-emerald-500 dark:text-stone-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                      title="Edit Habit"
                    >
                      <Edit2 size={14} className="pointer-events-none" />
                    </button>
                    <button 
                      onClick={() => onDelete(habit.id)}
                      className="p-1 text-stone-300 hover:text-red-500 dark:text-stone-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete Habit"
                    >
                      <Trash2 size={14} className="pointer-events-none" />
                    </button>
                  </div>
                </div>

                {/* Goal Column */}
                <div className="flex items-center justify-center border-stone-100 dark:border-stone-800 text-xs font-medium text-stone-500 dark:text-stone-400">
                  {goal}
                </div>
                
                {days.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isCompleted = habit.entries.some(e => e.date === dateStr && e.completed);
                  
                  return (
                    <div 
                      key={dateStr} 
                      className={cn(
                        "border-l border-stone-100 dark:border-stone-800 flex items-center justify-center relative",
                        isToday(day) && "bg-emerald-50/30 dark:bg-emerald-900/10"
                      )}
                    >
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => onToggle(habit.id, dateStr)}
                        className={cn(
                          "w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-200 cursor-pointer",
                          isCompleted 
                            ? "text-white shadow-sm border-transparent" 
                            : "bg-transparent border-stone-200 dark:border-stone-700 hover:border-emerald-300 dark:hover:border-emerald-500 text-transparent hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        )}
                        style={{
                          backgroundColor: isCompleted ? habit.color : undefined,
                          borderColor: isCompleted ? habit.color : undefined
                        }}
                      >
                        <Check size={14} strokeWidth={3} className="pointer-events-none" />
                      </motion.button>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {habits.length === 0 && (
            <div className="p-8 text-center text-stone-400 dark:text-stone-500 text-sm">
              No habits yet. Add one to get started!
            </div>
          )}
        </div>

        {/* Footer Row (Daily Totals) */}
        <div className="grid border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50"
             style={{ gridTemplateColumns: `var(--habit-col-width) var(--goal-col-width) repeat(${daysCount}, minmax(44px, 1fr))` }}>
             <div className="sticky left-0 z-20 bg-stone-50 dark:bg-stone-900 p-4 font-semibold text-stone-500 dark:text-stone-400 text-xs uppercase tracking-wider flex items-center border-r border-stone-100 dark:border-stone-800 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
                Daily Total
             </div>
             <div className="border-stone-100 dark:border-stone-800"></div>
             {dailyTotals.map((stat) => (
                 <div key={stat.date} className="flex items-center justify-center p-2 border-l border-stone-100 dark:border-stone-800">
                    <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400">{stat.percentage}%</span>
                 </div>
             ))}
        </div>
      </div>
    </div>
  );
}
