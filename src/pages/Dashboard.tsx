import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import HabitGrid from '../components/HabitGrid';
import Stats from '../components/Stats';
import { Plus, X, Download } from 'lucide-react';
import { format, addMonths, subMonths, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';

const COLORS = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#6366F1', // Indigo
  '#14B8A6', // Teal
];

export default function Dashboard() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [habitTitle, setHabitTitle] = useState('');
  const [habitColor, setHabitColor] = useState(COLORS[0]);
  const [habitFrequency, setHabitFrequency] = useState('daily');
  const [habitNotes, setHabitNotes] = useState('');
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');

  const fetchHabits = async () => {
    try {
      const res = await fetch('/api/habits');
      if (res.ok) {
        const data = await res.json();
        setHabits(data);
      }
    } catch (error) {
      console.error('Failed to fetch habits', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleToggle = async (habitId: number, date: string) => {
    // Optimistic update
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        const entryExists = h.entries.find(e => e.date === date);
        let newEntries;
        if (entryExists) {
          newEntries = h.entries.filter(e => e.date !== date);
        } else {
          newEntries = [...h.entries, { date, completed: true }];
        }
        return { ...h, entries: newEntries };
      }
      return h;
    }));

    try {
      await fetch(`/api/habits/${habitId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      });
    } catch (error) {
      console.error('Failed to toggle habit', error);
      fetchHabits(); // Revert on error
    }
  };

  const handleDelete = async (habitId: number) => {
    if (!confirm('Are you sure you want to delete this habit?')) return;
    
    try {
      await fetch(`/api/habits/${habitId}`, { method: 'DELETE' });
      setHabits(prev => prev.filter(h => h.id !== habitId));
    } catch (error) {
      console.error('Failed to delete habit', error);
    }
  };

  const openModal = (habit?: any) => {
    if (habit) {
      setEditingHabit(habit);
      setHabitTitle(habit.title);
      setHabitColor(habit.color || COLORS[0]);
      setHabitFrequency(habit.frequency || 'daily');
      setHabitNotes(habit.notes || '');
    } else {
      setEditingHabit(null);
      setHabitTitle('');
      setHabitColor(COLORS[0]);
      setHabitFrequency('daily');
      setHabitNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSaveHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSaveHabit called', { habitTitle, habitColor, habitFrequency, habitNotes, editingHabit });
    
    if (!habitTitle.trim()) {
      console.log('Title is empty');
      return;
    }

    try {
      const url = editingHabit ? `/api/habits/${editingHabit.id}` : '/api/habits';
      const method = editingHabit ? 'PUT' : 'POST';
      
      console.log('Sending request', { url, method, body: { title: habitTitle, color: habitColor, frequency: habitFrequency, notes: habitNotes } });

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: habitTitle, color: habitColor, frequency: habitFrequency, notes: habitNotes }),
      });
      
      console.log('Response status:', res.status);

      if (res.ok) {
        const savedHabit = await res.json();
        console.log('Saved habit:', savedHabit);
        if (editingHabit) {
          setHabits(prev => prev.map(h => h.id === savedHabit.id ? { ...savedHabit, entries: h.entries } : h));
        } else {
          setHabits(prev => [savedHabit, ...prev]);
        }
        setIsModalOpen(false);
      } else {
        const errorData = await res.json();
        console.error('Server error:', errorData);
      }
    } catch (error) {
      console.error('Failed to save habit', error);
    }
  };

  const handleExportCSV = () => {
    // Generate CSV content
    // Format: Habit Title, Date, Completed (✓)
    
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Header row
    let csvContent = "Habit Title,Notes," + days.map(d => format(d, 'yyyy-MM-dd')).join(",") + "\n";
    
    // Data rows
    habits.forEach(habit => {
      const row = [habit.title, habit.notes || ''];
      days.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const isCompleted = habit.entries.some(e => e.date === dateStr && e.completed);
        row.push(isCompleted ? "✓" : "");
      });
      csvContent += row.join(",") + "\n";
    });

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `habits_export_${format(currentDate, 'yyyy_MM')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 md:gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-stone-800 dark:text-stone-100 tracking-tight">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
              Build healthy habits daily and weekly
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <div className="flex bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-1 shadow-sm">
              <button 
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition-all ${viewMode === 'monthly' ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
              >
                Month
              </button>
              <button 
                onClick={() => setViewMode('weekly')}
                className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition-all ${viewMode === 'weekly' ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
              >
                Week
              </button>
            </div>

            <div className="flex bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-1 shadow-sm">
              <button 
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="px-3 py-1.5 text-xs md:text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-md transition-colors"
              >
                Prev
              </button>
              <button 
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 text-xs md:text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-md border-l border-r border-stone-100 dark:border-stone-800 transition-colors"
              >
                Today
              </button>
              <button 
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="px-3 py-1.5 text-xs md:text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-md transition-colors"
              >
                Next
              </button>
            </div>
            
            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              <button 
                onClick={() => {
                  console.log('Export clicked');
                  handleExportCSV();
                }}
                className="bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 px-3 md:px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors cursor-pointer h-[38px]"
                title="Export CSV"
              >
                <Download size={16} className="pointer-events-none" />
                <span className="hidden md:inline">Export</span>
              </button>

              <button 
                onClick={() => {
                  console.log('New Habit clicked');
                  openModal();
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 md:px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors cursor-pointer h-[38px]"
              >
                <Plus size={16} className="pointer-events-none" />
                <span className="hidden md:inline">New Habit</span>
                <span className="md:hidden">New</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <Stats habits={habits} currentDate={currentDate} />

        {/* Main Grid */}
        <HabitGrid 
          habits={habits} 
          currentDate={currentDate} 
          onToggle={handleToggle}
          onDelete={handleDelete}
          onEdit={openModal}
          viewMode={viewMode}
        />
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200 border border-stone-100 dark:border-stone-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100">
                {editingHabit ? 'Edit Habit' : 'Create New Habit'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveHabit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Habit Name</label>
                <input
                  type="text"
                  value={habitTitle}
                  onChange={(e) => setHabitTitle(e.target.value)}
                  placeholder="e.g., Drink Water, Read 30 mins..."
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Frequency</label>
                <select
                  value={habitFrequency}
                  onChange={(e) => setHabitFrequency(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="weekdays">Weekdays</option>
                  <option value="weekends">Weekends</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Notes (Optional)</label>
                <textarea
                  value={habitNotes}
                  onChange={(e) => setHabitNotes(e.target.value)}
                  placeholder="Add a description or motivation..."
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none h-20"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Color</label>
                <div className="flex flex-wrap gap-3">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setHabitColor(color)}
                      className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${habitColor === color ? 'ring-2 ring-offset-2 ring-stone-400 dark:ring-offset-stone-900' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"
                >
                  {editingHabit ? 'Save Changes' : 'Create Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
