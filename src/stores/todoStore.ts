import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { Preferences } from '@capacitor/preferences';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface TodoItem {
  id: string;
  text?: string;
  title?: string;
  completed: boolean;
  isCollapsed?: boolean;
  isPinned?: boolean;
  items?: TodoItem[];
  reminderTime?: string; // Добавили поле для хранения времени
}

export const useTodoStore = defineStore('todo', () => {
  const mainItems = ref<TodoItem[]>([]);
  const selectedId = ref<string | null>(null);
  const deletingIds = ref<string[]>([]);
  const isLoaded = ref(false);

  const STORAGE_KEY = 'my_todo_data';

  const saveToStorage = async () => {
    await Preferences.set({
      key: STORAGE_KEY,
      value: JSON.stringify(mainItems.value),
    });
  };

  const loadData = async () => {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEY });
      if (value) {
        const parsed = JSON.parse(value);
        mainItems.value = Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Ошибка загрузки данных", e);
      mainItems.value = [];
    } finally {
      isLoaded.value = true;
    }
  };

  loadData();

  watch(mainItems, async () => {
    if (isLoaded.value) {
      await saveToStorage();
    }
  }, { deep: true });

  const updateOrder = (newOrder: TodoItem[]) => {
    mainItems.value = [...newOrder];
  };

  const toggleTask = (id: string) => {
    const findAndToggle = (list: TodoItem[]) => {
      for (const item of list) {
        if (item.id === id) {
          item.completed = !item.completed;
          return true;
        }
        if (item.items && findAndToggle(item.items)) return true;
      }
      return false;
    };
    findAndToggle(mainItems.value);
  };

  const togglePin = async (id: string) => {
    const itemIndex = mainItems.value.findIndex(item => item.id === id);
    if (itemIndex !== -1) {
      const item = mainItems.value[itemIndex];
      item.isPinned = !item.isPinned;
      if (item.isPinned) {
        const [pinnedItem] = mainItems.value.splice(itemIndex, 1);
        mainItems.value.unshift(pinnedItem);
      }
    }
  };

  const toggleListCollapse = (id: string) => {
    const list = mainItems.value.find(i => i.id === id);
    if (list) list.isCollapsed = !list.isCollapsed;
  };

  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  const startDelayedRemove = (id: string) => {
    if (!deletingIds.value.includes(id)) {
      deletingIds.value.push(id);
      const timerId = setTimeout(() => {
        if (deletingIds.value.includes(id)) {
          mainItems.value = mainItems.value.filter(item => item.id !== id);
          deletingIds.value = deletingIds.value.filter(di => di !== id);
        }
        timers.delete(id);
      }, 10000);
      timers.set(id, timerId);
    }
  };

  const cancelDeletion = (id: string) => {
    deletingIds.value = deletingIds.value.filter(di => di !== id);
    const timerId = timers.get(id);
    if (timerId) {
      clearTimeout(timerId);
      timers.delete(id);
    }
  };

  // ИСПРАВЛЕНО: Заменили todos на mainItems и вынесли ID в константу
  const setReminder = async (todoId: string, dateTime: string) => {
    const todo = mainItems.value.find(t => t.id === todoId);
    if (!todo || !dateTime) return;

    const targetDate = new Date(dateTime);
    const notificationId = parseInt(todoId.slice(-5)) || Math.floor(Math.random() * 10000);

    await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });

    await LocalNotifications.schedule({
      notifications: [{
        title: "Напоминание о задаче",
        body: todo.text || "Пора сделать дело!",
        id: notificationId,
        schedule: { at: targetDate }, // Используем 'at' вместо 'on' для разового события
        sound: 'default'
      }]
    });

    todo.reminderTime = dateTime;
    await saveToStorage();
  };

  return {
    mainItems,
    selectedId,
    deletingIds,
    isLoaded,
    loadData,
    updateOrder,
    toggleTask,
    toggleListCollapse,
    startDelayedRemove,
    cancelDeletion,
    togglePin,
    setReminder // ИСПРАВЛЕНО: Добавили в экспорт
  };
});
