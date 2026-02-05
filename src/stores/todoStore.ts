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
  const multiSelectedIds = ref<string[]>([]);
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

  const togglePin = async (id: string, forceState?: boolean) => {
    const findAndPin = (list: TodoItem[]): boolean => {
      const index = list.findIndex(item => item.id === id);

      if (index !== -1) {
        const item = list[index];

        // Если передали конкретное состояние (forceState), используем его. 
        // Если нет — просто инвертируем (!item.isPinned)
        const nextState = forceState !== undefined ? forceState : !item.isPinned;

        if (item.isPinned === nextState) return true; // Уже в нужном состоянии, ничего не делаем

        item.isPinned = nextState;

        if (item.isPinned) {
          const [pinnedItem] = list.splice(index, 1);
          list.unshift(pinnedItem);
        } else {
          // При откреплении просто оставляем как есть или сдвигаем вниз за пины
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
          // РЕКУРСИВНОЕ УДАЛЕНИЕ
          const removeItemRecursive = (list: TodoItem[]): TodoItem[] => {
            return list
              .filter(item => item.id !== id) // Удаляем если совпал ID
              .map(item => ({
                ...item,
                items: item.items ? removeItemRecursive(item.items) : item.items // Идем вглубь
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

  // ИСПРАВЛЕНО: Заменили todos на mainItems и вынесли ID в константу
  const setReminder = async (todoId: string, dateTime: string) => {
    const todo = mainItems.value.find(t => t.id === todoId);
    if (!todo) return;

    // Генерируем ID уведомления на основе ID задачи
    const rawId = todoId.replace(/\D/g, '').slice(-7);
    const notificationId = parseInt(`2${rawId}`) || Math.floor(Math.random() * 1000000);

    await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });

    if (dateTime) {
      const targetDate = new Date(dateTime);

      await LocalNotifications.schedule({
        notifications: [{
          // Убедись, что здесь именно этот текст
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
          item.items = [...newItems]; // Обновляем массив
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
    updateSubItems
  };
});
