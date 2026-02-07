import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { Preferences } from '@capacitor/preferences';
import { LocalNotifications } from '@capacitor/local-notifications';
import axios from 'axios'; // Не забудь установить: npm install axios

// Базовый URL твоего бэкенда
const API_URL = 'http://192.168.0.240:3000';

export interface TodoItem {
  id: string;
  text?: string;
  title?: string;
  completed: boolean;
  isCollapsed?: boolean;
  isPinned?: boolean;
  items?: TodoItem[];
  reminderTime?: string;
  // Новые поля для облака
  remoteId?: string | null;
  inviteKey?: string | null;
  isCloud?: boolean;
}

export const useTodoStore = defineStore('todo', () => {
  const mainItems = ref<TodoItem[]>([]);
  const multiSelectedIds = ref<string[]>([]);
  const deletingIds = ref<string[]>([]);
  const isLoaded = ref(false);

  // Хранилище для ID устройства
  const deviceId = ref<string | null>(null);

  const STORAGE_KEY = 'my_todo_data';
  const DEVICE_KEY = 'my_device_id';

  // --- ЛОГИКА DEVICE ID ---

  const initDevice = async () => {
    const { value } = await Preferences.get({ key: DEVICE_KEY });
    if (value) {
      deviceId.value = value;
    }
  };

  const registerDeviceIfNeeded = async () => {
    // Если ID еще нет — генерируем новый
    if (!deviceId.value) {
      const newId = crypto.randomUUID();
      try {
        await axios.post(`${API_URL}/register-device`, { deviceId: newId });
        deviceId.value = newId;
        await Preferences.set({ key: DEVICE_KEY, value: newId });
      } catch (e) {
        console.error("Ошибка регистрации устройства", e);
        throw e;
      }
    }
    return deviceId.value;
  };

  // --- ЛОГИКА ОБЛАЧНЫХ СПИСКОВ ---

  const createCloudList = async (title: string) => {
    try {
      // 1. Убеждаемся, что устройство зарегистрировано
      const id = await registerDeviceIfNeeded();

      // 2. Делаем запрос на создание списка
      const response = await axios.post(`${API_URL}/lists`,
        { title },
        { headers: { 'x-device-id': id } }
      );

      // Возвращаем данные (там будет id и inviteKey)
      return response.data;
    } catch (e) {
      console.error("Ошибка создания облачного списка", e);
      throw e;
    }
  };

  // --- СТАНДАРТНАЯ ЛОГИКА (БЕЗ ИЗМЕНЕНИЙ) ---

  const saveToStorage = async () => {
    await Preferences.set({
      key: STORAGE_KEY,
      value: JSON.stringify(mainItems.value),
    });
  };

  const loadData = async () => {
    try {
      await initDevice(); // Подгружаем deviceId при старте
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

  const togglePin = async (id: string, forceState?: boolean) => {
    const findAndPin = (list: TodoItem[]): boolean => {
      const index = list.findIndex(item => item.id === id);
      if (index !== -1) {
        const item = list[index];
        const nextState = forceState !== undefined ? forceState : !item.isPinned;
        if (item.isPinned === nextState) return true;
        item.isPinned = nextState;
        if (item.isPinned) {
          const [pinnedItem] = list.splice(index, 1);
          list.unshift(pinnedItem);
        } else {
          const [unpinnedItem] = list.splice(index, 1);
          const lastPinnedIndex = list.findLastIndex(i => i.isPinned);
          list.splice(lastPinnedIndex + 1, 0, unpinnedItem);
        }
        return true;
      }
      for (const item of list) {
        if (item.items && findAndPin(item.items)) return true;
      }
      return false;
    };
    findAndPin(mainItems.value);
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
          const removeItemRecursive = (list: TodoItem[]): TodoItem[] => {
            return list
              .filter(item => item.id !== id)
              .map(item => ({
                ...item,
                items: item.items ? removeItemRecursive(item.items) : item.items
              }));
          };
          mainItems.value = removeItemRecursive(mainItems.value);
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

  const setReminder = async (todoId: string, dateTime: string) => {
    const todo = mainItems.value.find(t => t.id === todoId);
    if (!todo) return;
    const rawId = todoId.replace(/\D/g, '').slice(-7);
    const notificationId = parseInt(`2${rawId}`) || Math.floor(Math.random() * 1000000);
    await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
    if (dateTime) {
      const targetDate = new Date(dateTime);
      await LocalNotifications.schedule({
        notifications: [{
          title: "Напоминание о задаче",
          body: todo.text || todo.title || "Пора сделать дело!",
          id: notificationId,
          schedule: { at: targetDate },
          sound: 'default'
        }]
      });
      todo.reminderTime = dateTime;
    } else {
      todo.reminderTime = undefined;
    }
    await saveToStorage();
  };

  const clearSelection = () => {
    multiSelectedIds.value = [];
  };

  const updateSubItems = (parentId: string, newItems: TodoItem[]) => {
    const findAndUpdate = (list: TodoItem[]) => {
      for (const item of list) {
        if (item.id === parentId) {
          item.items = [...newItems];
          return true;
        }
        if (item.items && findAndUpdate(item.items)) return true;
      }
      return false;
    };
    findAndUpdate(mainItems.value);
  };

  return {
    mainItems,
    deletingIds,
    isLoaded,
    loadData,
    updateOrder,
    toggleTask,
    toggleListCollapse,
    startDelayedRemove,
    cancelDeletion,
    togglePin,
    multiSelectedIds,
    clearSelection,
    setReminder,
    updateSubItems,
    // Экспортируем новый метод
    createCloudList
  };
});
