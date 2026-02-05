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
  frequency: 'DAILY' | 'WEEKLY';
  notificationTime?: string;
  weekDays: number[];
  currentStreak: number;
}

export const useHabitStore = defineStore('habitStore', () => {
  const habits = ref<Habit[]>([]);
  const isInitialized = ref(false);
  const deletingIds = ref<string[]>([]);
  const activeTimers: Record<string, ReturnType<typeof setTimeout>> = {};

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
    console.log('Toggle start for:', id); // ЛОГ 1
    const index = habits.value.findIndex(h => h.id === id);
    if (index === -1) return;

    const habit = habits.value[index];
    const targetDate = dateStr || getTodayStr();

    // Создаем копию объекта для реактивности
    const updatedHabit = { ...habit };
    const dateIndex = updatedHabit.completedDays.indexOf(targetDate);

    if (dateIndex > -1) {
      updatedHabit.completedDays = updatedHabit.completedDays.filter(d => d !== targetDate);
      console.log('Removing date:', targetDate); // ЛОГ 2
    } else {
      if (updatedHabit.isPaused) {
        console.log('Habit is paused, skipping');
        return;
      }
      updatedHabit.completedDays = [...updatedHabit.completedDays, targetDate];
      console.log('Adding date:', targetDate); // ЛОГ 3
    }

    // Сортируем
    updatedHabit.completedDays.sort((a, b) => b.localeCompare(a));

    // СНАЧАЛА обновляем объект в сторе, чтобы UI увидел зачеркивание
    habits.value[index] = updatedHabit;

    // ТЕПЕРЬ считаем стрик
    const streakData = getStreak(updatedHabit);
    habits.value[index].currentStreak = streakData.current;

    if (habits.value[index].currentStreak > (habits.value[index].bestStreak || 0)) {
      habits.value[index].bestStreak = habits.value[index].currentStreak;
    }

    console.log('New streak:', habits.value[index].currentStreak); // ЛОГ 4
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

    if (habit.frequency === 'DAILY') {
      // Твоя текущая логика для ежедневных
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

    else if (habit.frequency === 'WEEKLY') {
      // НОВАЯ ЛОГИКА: Считаем по неделям
      let currentWeekStart = getStartOfWeek(new Date());
      let lastCompletedDay = days[0];

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
      // 1. ПОЛНАЯ ОЧИСТКА ВСЕГО (включая мусор от старых багов)
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel(pending);
      }

      // 2. ДОПОЛНИТЕЛЬНО: Если первый метод не помог, удаляем по ID вручную (диапазон префиксов)
      // Просто пройдемся циклом по возможным ID, которые мы могли насоздавать
      // (необязательно, но для надежности можно)

      console.log('СИСТЕМА УВЕДОМЛЕНИЙ ПЕРЕЗАГРУЖЕНА');

      const { value } = await Preferences.get({ key: 'habits' });
      if (value) habits.value = JSON.parse(value);
      isInitialized.value = true;
    } catch (e) {
      isInitialized.value = true;
    }
  };

  const addHabit = async (name: string, frequency: 'DAILY' | 'WEEKLY' = 'DAILY') => {
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
    const notificationId = parseInt("1" + habit.id.slice(-7));

    // 1. Отмена старого
    for (let i = 0; i < 7; i++) {
      await LocalNotifications.cancel({ notifications: [{ id: parseInt(`${notificationId}${i}`) }] });
    }
    await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });

    // 2. Проверки
    if (!habit.notificationTime || habit.isPaused) return;

    try {
      const date = new Date(habit.notificationTime);
      const hours = date.getHours();
      const minutes = date.getMinutes();

      const notificationsToSchedule = [];

      if (habit.frequency === 'DAILY') {
        // Ежедневное уведомление
        notificationsToSchedule.push({
          id: notificationId,
          title: "Пора закрепить привычку!",
          body: habit.name,
          schedule: {
            on: { hour: hours, minute: minutes },
            repeats: true,
            allowWhileIdle: true
          },
          sound: 'default'
        });
      } else if (habit.frequency === 'WEEKLY' && habit.weekDays?.length > 0) {
        // Уведомления по дням недели
        // В Capacitor для каждого дня недели создается отдельный триггер в массиве
        habit.weekDays.forEach((day, index) => {
          notificationsToSchedule.push({
            // Создаем уникальный ID для каждого дня (например: 1-ID-0, 1-ID-1...)
            id: parseInt(`${notificationId}${day}`),
            title: "День привычки!",
            body: habit.name,
            schedule: {
              on: {
                weekday: day + 1, // В Capacitor: 1 (Вс) - 7 (Сб)
                hour: hours,
                minute: minutes
              },
              repeats: true,
              allowWhileIdle: true
            },
            sound: 'default'
          });
        });
      }

      if (notificationsToSchedule.length > 0) {
        await LocalNotifications.schedule({
          notifications: notificationsToSchedule
        });
        console.log(`[Habit] Запланировано ${notificationsToSchedule.length} уведомлений для ${habit.name}`);
      }
    } catch (e) {
      console.error('Ошибка планирования по дням недели:', e);
    }
  };

  // Возвращаем все методы стора наружу
  return {
    habits,
    isInitialized,
    deletingIds,
    addHabit,
    loadHabits,
    startDelayedRemove,
    cancelDeletion,
    saveToStorage,
    toggleHabit,
    getStreak,
    getTodayStr,
    updateHabit,
    scheduleNotification
  };
});
