
import { defineStore } from 'pinia';
import { ref, watch, computed } from 'vue';
import { Preferences } from '@capacitor/preferences';
import { toastController } from '@ionic/vue';
import { LocalNotifications } from '@capacitor/local-notifications';
import axios from 'axios';
import { generateSafeId } from '../utils/uuid';

const API_URL = 'http://194.87.208.246';

export interface TodoItem {
  id: string;
  text?: string;
  title?: string;
  completed: boolean;
  isCollapsed?: boolean;
  isPinned?: boolean;
  items?: TodoItem[];
  reminderTime?: string;
  remoteId?: string | null;
  inviteKey?: string | null;
  isCloud?: boolean;
}



export const useTodoStore = defineStore('todo', () => {
  const mainItems = ref<TodoItem[]>([]);
  const multiSelectedIds = ref<string[]>([]);
  const deletingIds = ref<string[]>([]);
  const isLoaded = ref(false);
  const isCreating = ref(false);
  const deviceId = ref<string | null>(null);

  const STORAGE_KEY = 'my_todo_data';
  const DEVICE_KEY = 'my_device_id';
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  // --- Вспомогательный рекурсивный поиск ---
  const findItemById = (id: string, items: TodoItem[] = mainItems.value): TodoItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.items?.length) {
        const found = findItemById(id, item.items);
        if (found) return found;
      }
    }
    return null;
  };

  // --- Геттеры для UI ---
  const inviteKeyForPanel = computed(() => {
    if (multiSelectedIds.value.length !== 1) return null;
    return findItemById(multiSelectedIds.value[0])?.inviteKey || null;
  });

  const isFirstSelectedPinned = computed(() => {
    if (multiSelectedIds.value.length === 0) return false;
    return findItemById(multiSelectedIds.value[0])?.isPinned || false;
  });

  // --- Базовые Actions ---
  const toggleSelection = (id: string) => {
    const index = multiSelectedIds.value.indexOf(id);
    if (index > -1) multiSelectedIds.value.splice(index, 1);
    else multiSelectedIds.value.push(id);
  };

  const clearSelection = () => {
    multiSelectedIds.value = [];
  };

  const updateOrder = (newOrder: TodoItem[]) => {
    mainItems.value = [...newOrder];
  };

  const toggleTask = async (id: string) => {
    const item = findItemById(id);
    if (!item) return;

    const oldStatus = item.completed;
    item.completed = !item.completed; // Optimistic update

    // 1. Улучшенная логика: как понять, что задача НЕ облачная?
    // Если ID выглядит как таймстамп (Date.now() сейчас выдает 13 знаков)
    // или если это строка, начинающаяся с 'local-'
    const isLocalId = id.toString().length >= 13 || id.toString().startsWith('local-');

    // 2. Если задача локальная и у неё нет remoteId — просто выходим.
    // Она сохранится в localStorage и синхронизируется позже, 
    // когда мы научим addTask сразу слать её в базу.
    if (isLocalId && !item.remoteId) {
      console.log("Локальная задача, синхронизация пропущена");
      await saveToStorage(); // Сохраняем галочку локально
      return;
    }

    // 3. Если мы здесь, значит задача облачная
    try {
      // Используем remoteId если он есть, иначе сам id
      const targetId = item.remoteId || id;

      await axios.patch(`${API_URL}/tasks/${targetId}`,
        { completed: item.completed },
        { headers: { 'x-device-id': deviceId.value } }
      );

      console.log(`✅ Задача ${targetId} синхронизирована`);
      await saveToStorage();
    } catch (e) {
      // Rollback при ошибке
      item.completed = oldStatus;
      const toast = await toastController.create({
        message: 'Ошибка синхронизации',
        duration: 2000,
        color: 'danger',
        mode: 'ios'
      });
      await toast.present();
      console.error("Синхронизация провалена:", e);
    }
  };

  const togglePin = async (id: string, forceState?: boolean) => {
    const index = mainItems.value.findIndex(item => item.id === id);
    if (index !== -1) {
      const item = mainItems.value[index];
      const nextState = forceState !== undefined ? forceState : !item.isPinned;
      item.isPinned = nextState;
      const [movedItem] = mainItems.value.splice(index, 1);
      if (item.isPinned) {
        mainItems.value.unshift(movedItem);
      } else {
        const lastPinned = mainItems.value.findLastIndex(i => i.isPinned);
        mainItems.value.splice(lastPinned + 1, 0, movedItem);
      }
    }
  };

  // --- Логика удаления (с исправленным cancelDeletion) ---
  const startDelayedRemove = (id: string) => {
    if (deletingIds.value.includes(id)) return;
    deletingIds.value.push(id);

    const timerId = setTimeout(async () => {
      if (deletingIds.value.includes(id)) {
        const item = findItemById(id);

        if (item) {
          try {
            const dId = deviceId.value || await registerDeviceIfNeeded();

            // 1. Если это облачный СПИСОК (у него есть remoteId)
            if (item.isCloud && item.remoteId) {
              await axios.delete(`${API_URL}/lists/${item.remoteId}`, {
                headers: { 'x-device-id': dId }
              });
              console.log(`🌐 Список удален: ${item.remoteId}`);
            }

            // 2. Если это облачная ЗАДАЧА (ID серверный, но это не список)
            else if (!id.startsWith('local-')) {
              await axios.delete(`${API_URL}/tasks/${id}`, {
                headers: { 'x-device-id': dId }
              });
              console.log(`🗑️ Задача удалена: ${id}`);
            }
          } catch (e) {
            console.error("❌ Ошибка при удалении с сервера:", e);
          }
        }

        // 3. Локальное удаление из UI
        const removeRecursive = (list: TodoItem[]): TodoItem[] => {
          return list
            .filter(i => i.id !== id)
            .map(i => ({
              ...i,
              items: i.items ? removeRecursive(i.items) : i.items
            }));
        };

        mainItems.value = removeRecursive(mainItems.value);
        deletingIds.value = deletingIds.value.filter(di => di !== id);
        await saveToStorage();
      }
      timers.delete(id);
    }, 10000); // 10 секунд на отмену

    timers.set(id, timerId);
  };

  const cancelDeletion = (id: string) => {
    // 1. Ищем ID таймера в нашей коллекции Map
    const timerId = timers.get(id);

    if (timerId) {
      // 2. Останавливаем выполнение setTimeout
      clearTimeout(timerId);

      // 3. Удаляем таймер из коллекции
      timers.delete(id);

      // 4. Убираем ID из списка "удаляемых", чтобы UI вернулся в нормальное состояние
      deletingIds.value = deletingIds.value.filter(di => di !== id);

      console.log(`✅ Удаление объекта ${id} отменено`);
    }
  };

  // --- Клауд и напоминания ---
  const createCloudList = async (title: string) => {
    if (isCreating.value) return;
    isCreating.value = true;
    try {
      const id = await registerDeviceIfNeeded();
      const response = await axios.post(`${API_URL}/lists`, { title }, { headers: { 'x-device-id': id } });
      const { id: remoteId, inviteKey } = response.data;
      if (mainItems.value.some(item => item.remoteId === remoteId)) return response.data;

      mainItems.value.push({
        id: generateSafeId(),
        title,
        completed: false,
        isCloud: true,
        remoteId,
        inviteKey,
        items: []
      });
      await saveToStorage();
      return response.data;
    } finally {
      setTimeout(() => { isCreating.value = false; }, 500);
    }
  };

  const joinCloudList = async (inviteKey: string) => {
    if (isCreating.value) return;
    isCreating.value = true;

    try {
      const id = await registerDeviceIfNeeded();

      const response = await axios.post(`${API_URL}/lists/join`,
        { inviteKey },
        { headers: { 'x-device-id': id } }
      );

      const remoteList = response.data;

      // Проверяем, нет ли его уже у нас локально
      const exists = mainItems.value.some(item => item.remoteId === remoteList.id);
      if (exists) return remoteList;

      const newList: TodoItem = {
        id: generateSafeId(),
        title: remoteList.title,
        completed: false,
        isCloud: true,
        remoteId: remoteList.id,
        inviteKey: remoteList.inviteKey,
        items: [] // Задачи подгрузятся при открытии списка
      };

      mainItems.value.push(newList);
      await saveToStorage();
      return remoteList;
    } catch (e: any) {
      console.error("Ошибка при вступлении в список", e);
      throw e; // Пробрасываем для обработки в UI
    } finally {
      isCreating.value = false;
    }
  };

  const fetchRemoteList = async (remoteId: string) => {
    try {
      const id = await registerDeviceIfNeeded();
      const response = await axios.get(`${API_URL}/lists/${remoteId}`, {
        headers: { 'x-device-id': id }
      });

      const cloudData = response.data;
      const localList = mainItems.value.find(item => item.remoteId === remoteId);

      if (localList && cloudData.tasks) {
        // КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ ТУТ:
        localList.items = cloudData.tasks.map((t: any) => {
          // Создаем чистый объект задачи
          const task: any = {
            id: t.id,
            text: t.text,        // Используем поле text (как в Prisma)
            completed: t.isDone  // Маппим isDone в completed
          };

          // ВАЖНО: Мы НЕ добавляем сюда поле items и title. 
          // Если их нет, TodoItem.vue поймет, что это просто задача.

          return task;
        });

        await saveToStorage();
      }
    } catch (e) {
      console.error("Ошибка синхронизации:", e);
    }
  };


  const registerDeviceIfNeeded = async () => {
    if (deviceId.value) return deviceId.value;
    const { value } = await Preferences.get({ key: DEVICE_KEY });
    if (value) { deviceId.value = value; return value; }
    const newId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    await axios.post(`${API_URL}/register-device`, { deviceId: newId });
    deviceId.value = newId;
    await Preferences.set({ key: DEVICE_KEY, value: newId });
    return newId;
  };

  const setReminder = async (todoId: string, dateTime: string) => {
    const todo = findItemById(todoId);
    if (!todo) return;
    const notificationId = parseInt(todoId.replace(/\D/g, '').slice(-7)) || Math.floor(Math.random() * 1000000);
    await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
    if (dateTime) {
      await LocalNotifications.schedule({
        notifications: [{
          title: "Напоминание",
          body: todo.text || todo.title || "Пора за дело!",
          id: notificationId,
          schedule: { at: new Date(dateTime) },
          sound: 'default'
        }]
      });
      todo.reminderTime = dateTime;
    } else {
      todo.reminderTime = undefined;
    }
    await saveToStorage();
  };

  // --- Хранилище ---
  const saveToStorage = async () => {
    await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(mainItems.value) });
  };

  const loadData = async () => {
    const { value: devId } = await Preferences.get({ key: DEVICE_KEY });
    if (devId) deviceId.value = devId;
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    if (value) mainItems.value = JSON.parse(value);
    isLoaded.value = true;
  };

  watch(mainItems, () => { if (isLoaded.value) saveToStorage(); }, { deep: true });

  loadData();

  const addTask = async (parentId: string | null, text: string) => {
    // 1. Создаем временный объект (у него НЕТ title, поэтому он отображается как задача)
    const newTodo: TodoItem = {
      id: `local-${Date.now()}`,
      text,
      completed: false,
      items: undefined // Для задачи лучше держать undefined
    };

    const parent = parentId ? findItemById(parentId) : null;

    if (parent) {
      if (!parent.items) parent.items = [];
      parent.items.push(newTodo);
    } else {
      mainItems.value.push(newTodo);
    }

    if (parent && parent.isCloud && parent.remoteId) {
      try {
        const id = await registerDeviceIfNeeded();
        const response = await axios.post(`${API_URL}/tasks`, {
          listId: parent.remoteId,
          title: text
        }, { headers: { 'x-device-id': id } });

        const serverTask = response.data; // Получаем { id, text, isDone, listId }

        // ОБНОВЛЯЕМ ОСТОРОЖНО:
        newTodo.id = serverTask.id;
        newTodo.text = serverTask.text;
        newTodo.completed = serverTask.isDone;

        // ГЛАВНОЕ: Убеждаемся, что title и items не мешают
        // Если эти поля есть, TodoItem.vue решит, что это список
        delete (newTodo as any).title;
        newTodo.items = undefined;

        console.log("✅ Задача синхронизирована без превращения в список");
      } catch (e) {
        console.error("❌ Ошибка синхронизации:", e);
      }
    }
    await saveToStorage();
  };

  return {
    mainItems, multiSelectedIds, deletingIds, isLoaded,
    inviteKeyForPanel, isFirstSelectedPinned,
    toggleSelection, clearSelection, updateOrder, toggleTask,
    togglePin, startDelayedRemove, cancelDeletion, createCloudList, setReminder, joinCloudList, fetchRemoteList, addTask,
    updateSubItems: (parentId: string, newItems: TodoItem[]) => {
      const parent = findItemById(parentId);
      if (parent) parent.items = [...newItems];
    }
  };
});
