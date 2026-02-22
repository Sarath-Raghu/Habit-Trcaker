import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
} from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { Award, Flame, Star } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatsProps {
  habits: any[];
  currentDate: Date;
}

export default function Stats({ habits, currentDate }: StatsProps) {
  const [chartView, setChartView] = useState<'weekly' | 'monthly'>('weekly');

  // Calculate completion rate for the selected interval ending on currentDate
  const intervalDays = eachDayOfInterval({
    start: subDays(currentDate, chartView === 'weekly' ? 6 : 29),
    end: currentDate
  });

  const chartData = intervalDays.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    let completedCount = 0;
    let totalHabits = habits.length;

    if (totalHabits === 0) return { 
      name: chartView === 'weekly' ? format(day, 'EEE') : format(day, 'd'), 
      fullDate: format(day, 'MMM d, yyyy'), 
      value: 0 
    };

    habits.forEach(habit => {
      if (habit.entries.some((e: any) => e.date === dateStr && e.completed)) {
        completedCount++;
      }
    });

    return {
      name: chartView === 'weekly' ? format(day, 'EEE') : format(day, 'd'),
      fullDate: format(day, 'MMM d, yyyy'),
      value: Math.round((completedCount / totalHabits) * 100)
    };
  });

  // Calculate completion rate for the specific currentDate
  const currentDateStr = format(currentDate, 'yyyy-MM-dd');
  const totalHabits = habits.length;
  let completedToday = 0;

  habits.forEach(habit => {
    if (habit.entries.some((e: any) => e.date === currentDateStr && e.completed)) {
      completedToday++;
    }
  });

  const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
  
  // Calculate current streak (max streak of any habit)
  const currentStreak = habits.length > 0 ? Math.max(...habits.map(h => {
    let streak = 0;
    const todayStr = format(currentDate, 'yyyy-MM-dd');
    
    const entryForDate = h.entries.find((e: any) => e.date === todayStr && e.completed);
    
    let checkDate = currentDate;
    if (!entryForDate) {
       checkDate = subDays(currentDate, 1);
    }
    
    for (let i = 0; i < 365; i++) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const entry = h.entries.find((e: any) => e.date === dateStr && e.completed);
      if (entry) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }
    return streak;
  })) : 0;

  // Calculate stats per habit
  const habitStats = habits.map(habit => {
    // Calculate streak for this habit (relative to currentDate)
    let streak = 0;
    let checkDate = currentDate;
    const todayStr = format(checkDate, 'yyyy-MM-dd');
    if (!habit.entries.find((e: any) => e.date === todayStr && e.completed)) {
      checkDate = subDays(checkDate, 1);
    }
    for (let i = 0; i < 365; i++) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      if (habit.entries.find((e: any) => e.date === dateStr && e.completed)) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }
    
    // Calculate completion % (last 30 days from currentDate)
    let completedLast30 = 0;
    const last30Days = eachDayOfInterval({ start: subDays(currentDate, 29), end: currentDate });
    last30Days.forEach(day => {
      const dStr = format(day, 'yyyy-MM-dd');
      if (habit.entries.find((e: any) => e.date === dStr && e.completed)) completedLast30++;
    });
    const completionPct = Math.round((completedLast30 / 30) * 100);

    return { ...habit, streak, completionPct };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-stone-800 p-3 border border-stone-200 dark:border-stone-700 shadow-lg rounded-lg">
          <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{payload[0].payload.fullDate}</p>
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">
            {payload[0].value}% Completed
          </p>
        </div>
      );
    }
    return null;
  };

  const getMilestoneBadge = (streak: number) => {
    if (streak >= 100) return { icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: '100+ Days' };
    if (streak >= 30) return { icon: Award, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30', label: '30+ Days' };
    if (streak >= 7) return { icon: Flame, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30', label: '7+ Days' };
    return null;
  };

  return (
    <div className="flex flex-col gap-8 mb-8">
      {/* Weekly Progress Chart */}
      <div className="bg-white dark:bg-stone-900 p-4 md:p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 transition-colors duration-200">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h3 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            {chartView === 'weekly' ? 'Weekly' : 'Monthly'} Progress
          </h3>
          <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-lg">
            <button
              onClick={() => setChartView('monthly')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                chartView === 'monthly' 
                  ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm" 
                  : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
              )}
            >
              Month
            </button>
            <button
              onClick={() => setChartView('weekly')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                chartView === 'weekly' 
                  ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm" 
                  : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
              )}
            >
              Week
            </button>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e4" className="dark:stroke-stone-800" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#78716c', fontSize: 10 }} 
                dy={10}
                interval={chartView === 'weekly' ? 0 : 4}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#78716c', fontSize: 12 }} 
                domain={[0, 100]}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#10b981', strokeWidth: 2 }} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-8 items-stretch">
        {/* Completion Rate Circular Card */}
        <div className="flex justify-center lg:justify-end">
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 flex items-center justify-center bg-stone-900 rounded-full shadow-2xl border border-stone-800/50 shrink-0">
            <svg className="w-full h-full transform -rotate-90 p-2" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r="74"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-stone-800"
              />
              <circle
                cx="80"
                cy="80"
                r="74"
                stroke="#10b981"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={465}
                strokeDashoffset={465 - (465 * completionRate) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tighter leading-none">{completionRate}%</span>
              <span className="text-[10px] sm:text-xs md:text-sm text-stone-500 uppercase font-medium mt-1 md:mt-2">
                {format(currentDate, 'MMM d').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Best Streak Card */}
        <div className="flex justify-center lg:justify-start">
          <div className="w-full max-w-[320px] sm:max-w-sm bg-stone-900 rounded-3xl shadow-2xl border border-stone-800/50 overflow-hidden flex flex-col min-h-[200px] sm:h-56 md:h-64">
            <div className="bg-emerald-600 px-6 py-4 sm:px-8 sm:py-5 flex items-center">
              <h3 className="text-white text-xl sm:text-2xl md:text-3xl font-bold uppercase tracking-tight">
                Best Streak
              </h3>
            </div>
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-none">{currentStreak}</span>
                <span className="text-lg sm:text-xl md:text-2xl text-white font-medium">days</span>
              </div>
              <div className="text-sm sm:text-base md:text-lg text-stone-300 font-medium leading-tight sm:leading-relaxed mt-2 sm:mt-0">
                Keep it up! You're doing great.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Habit Breakdown */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 transition-colors duration-200">
        <h3 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-4">Habit Performance (Last 30 Days)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {habitStats.map((habit: any) => {
            const milestone = getMilestoneBadge(habit.streak);
            const MilestoneIcon = milestone?.icon;
            
            return (
              <div key={habit.id} className="p-4 rounded-lg border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: habit.color }}></div>
                    <span className="font-medium text-stone-700 dark:text-stone-200 truncate" title={habit.title}>{habit.title}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-end mt-3">
                  <div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">Streak</div>
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-bold text-stone-800 dark:text-stone-100">{habit.streak} <span className="text-xs font-normal text-stone-400">days</span></div>
                      {milestone && MilestoneIcon && (
                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${milestone.color} ${milestone.bg}`}>
                          <MilestoneIcon size={10} />
                          {milestone.label}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-stone-500 dark:text-stone-400">Completion</div>
                    <div className="text-lg font-bold text-stone-800 dark:text-stone-100">{habit.completionPct}%</div>
                  </div>
                </div>
                <div className="w-full bg-stone-200 dark:bg-stone-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${habit.completionPct}%`, backgroundColor: habit.color }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
