import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Preferences } from '@capacitor/preferences';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface Habit {
  id: string;
  name: string;
  completedDays: string[];
  bestStreak: number;
  isPaused: boolean;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  notificationTime?: string;
  weekDays: number[];
  currentStreak: number;
}

export const useHabitStore = defineStore('habitStore', () => {
  const habits = ref<Habit[]>([]);
  const isInitialized = ref(false);
  const deletingIds = ref<string[]>([]);
  const activeTimers: Record<string, ReturnType<typeof setTimeout>> = {};

  let streak = 0;
  let checkDate = new Date();
  const toStr = (d: Date) => d.toISOString().split('T')[0];


  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const saveToStorage = async () => {
    try {
      await Preferences.set({
        key: 'habits',
        value: JSON.stringify(habits.value),
      });
    } catch (e) {
      console.error('Ошибка записи:', e);
    }
  };

  const toggleHabit = async (id: string, dateStr?: string) => {
    const habit = habits.value.find(h => h.id === id);
    if (!habit) return;

    // Используем переданную дату или текущую
    const targetDate = dateStr || getTodayStr();
    const index = habit.completedDays.indexOf(targetDate);

    if (index > -1) {
      // Снимать отметку можно всегда
      habit.completedDays.splice(index, 1);
    } else {
      // Ставить новую — только если не на паузе
      if (habit.isPaused) return;
      habit.completedDays.push(targetDate);
      // b.localeCompare(a) — сортировка от новых к старым (DESC)
      habit.completedDays.sort((a, b) => b.localeCompare(a));
    }

    // Обновляем данные стрика
    const streakData = getStreak(habit);
    habit.currentStreak = streakData.current;

    if (habit.currentStreak > (habit.bestStreak || 0)) {
      habit.bestStreak = habit.currentStreak;
    }

    await saveToStorage();
  };

  // Обновленная логика расчета стрика с учетом паузы
  const getStreak = (habit: Habit) => {
    if (!habit || !Array.isArray(habit.completedDays)) {
      return { current: 0 };
    }

    const days = [...habit.completedDays].sort((a, b) => b.localeCompare(a));
    const completedDays = habit.completedDays;
    if (!completedDays || completedDays.length === 0) return { current: 0 };


    // Утилита для получения начала недели (понедельника) для заданной даты
    const getStartOfWeek = (date: Date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Коррекция для Пн как начала недели
      return new Date(d.setDate(diff)).toISOString().split('T')[0];
    };

    let streak = 0;
    let curr = new Date(); // Начинаем проверку от "сейчас"

    if (habit.frequency === 'DAILY') {
      // Твоя текущая логика для ежедневных
      const todayStr = getTodayStr();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (!habit.isPaused && !days.includes(todayStr) && !days.includes(yesterdayStr)) return { current: 0 };

      let checkDate = new Date(habit.isPaused ? days[0] : (days.includes(todayStr) ? todayStr : yesterdayStr));

      for (let i = 0; i < 365; i++) {
        const s = checkDate.toISOString().split('T')[0];
        if (days.includes(s)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else { break; }
      }
      if (habit.frequency === 'DAILY') {
        const todayStr = getTodayStr();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // ЛОГИКА "24 ЧАСА":
        // Если сегодня нет отметки И вчера нет отметки, 
        // и при этом привычка не на паузе — стрик обнуляется.
        // Это и дает те самые ~24-48 часов (весь сегодняшний и весь вчерашний день) на "подумать".
        if (!habit.isPaused && !days.includes(todayStr) && !days.includes(yesterdayStr)) {
          return { current: 0 };
        }

        // Если проверка пройдена, считаем длину непрерывной цепи
        let checkDate = new Date(habit.isPaused ? days[0] : (days.includes(todayStr) ? todayStr : yesterdayStr));

        for (let i = 0; i < 365; i++) {
          const s = checkDate.toISOString().split('T')[0];
          if (days.includes(s)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            // Если пропустили день — стрик прерывается здесь
            break;
          }
        }
      }
    }

    else if (habit.frequency === 'WEEKLY') {
      // НОВАЯ ЛОГИКА: Считаем по неделям
      let currentWeekStart = getStartOfWeek(new Date());
      let lastCompletedDay = days[0];
      let lastCompletedWeekStart = getStartOfWeek(new Date(lastCompletedDay));

      // Если на этой неделе пусто И на прошлой неделе пусто — стрик сгорел
      // (кроме случая паузы)
      if (!habit.isPaused) {
        const prevWeek = new Date();
        prevWeek.setDate(prevWeek.getDate() - 7);
        const prevWeekStart = getStartOfWeek(prevWeek);

        const hasThisWeek = days.some(d => getStartOfWeek(new Date(d)) === currentWeekStart);
        const hasLastWeek = days.some(d => getStartOfWeek(new Date(d)) === prevWeekStart);

        if (!hasThisWeek && !hasLastWeek) return { current: 0 };
      }

      // Считаем недели назад
      let weekToCheck = new Date(habit.isPaused ? lastCompletedDay : new Date());
      let checkedWeeks = new Set();

      for (let i = 0; i < 52; i++) {
        const ws = getStartOfWeek(weekToCheck);
        if (checkedWeeks.has(ws)) continue;

        const hasMarkInWeek = days.some(d => getStartOfWeek(new Date(d)) === ws);
        if (hasMarkInWeek) {
          streak++;
          checkedWeeks.add(ws);
          weekToCheck.setDate(weekToCheck.getDate() - 7);
        } else {
          break;
        }
      }
    }

    return { current: streak };
  };

  const loadHabits = async () => {
    try {
      const { value } = await Preferences.get({ key: 'habits' });
      if (value) habits.value = JSON.parse(value);
      isInitialized.value = true;
    } catch (e) {
      isInitialized.value = true;
    }
  };

  const addHabit = async (name: string, frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'DAILY') => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name,
      completedDays: [],
      bestStreak: 0,
      isPaused: false,
      frequency,
      currentStreak: 0,
      weekDays: frequency === 'DAILY' ? [0, 1, 2, 3, 4, 5, 6] : [],
    };
    habits.value = [...habits.value, newHabit];
    await saveToStorage();
    return true;
  };

  const startDelayedRemove = (id: string) => {
    if (deletingIds.value.includes(id)) return;
    deletingIds.value.push(id);
    activeTimers[id] = setTimeout(async () => {
      if (deletingIds.value.includes(id)) {
        habits.value = habits.value.filter(h => h.id !== id);
        deletingIds.value = deletingIds.value.filter(did => did !== id);
        delete activeTimers[id];
        await saveToStorage();
      }
    }, 10000);
  };

  const cancelDeletion = (id: string) => {
    if (activeTimers[id]) {
      clearTimeout(activeTimers[id]);
      delete activeTimers[id];
    }
    deletingIds.value = deletingIds.value.filter(did => did !== id);
  };

  const updateHabit = async (id: string, updates: Partial<Habit>) => {
    const index = habits.value.findIndex(h => h.id === id);
    if (index > -1) {
      habits.value[index] = { ...habits.value[index], ...updates };
      await scheduleNotification(habits.value[index]);
      await saveToStorage();
    }
  };

  const scheduleNotification = async (habit: Habit) => {
    const notificationId = parseInt(habit.id.slice(-5));
    await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });

    if (!habit.notificationTime || habit.isPaused) return;

    const startDate = new Date(habit.notificationTime);

    // Формируем правило повторения
    let scheduleOptions: any = { at: startDate, allowWhileIdle: true };

    if (habit.frequency === 'DAILY') {
      scheduleOptions.repeats = true;
      scheduleOptions.every = 'day';
    } else if (habit.frequency === 'WEEKLY') {
      scheduleOptions.repeats = true;
      scheduleOptions.every = 'week';
    } else if (habit.frequency === 'MONTHLY') {
      scheduleOptions.repeats = true;
      scheduleOptions.every = 'month';
    }

    await LocalNotifications.schedule({
      notifications: [{
        id: notificationId,
        title: "Пора закрепить привычку!",
        body: habit.name,
        schedule: scheduleOptions,
        sound: 'default'
      }]
    });
  };

  return {
    habits, isInitialized, deletingIds,
    addHabit, loadHabits, startDelayedRemove,
    cancelDeletion, saveToStorage,
    toggleHabit, getStreak, getTodayStr, updateHabit, scheduleNotification
  };
});
