<template>
  <ion-page>
    <QuickActionPanel :is-open="todoStore.multiSelectedIds.length > 0 || !!selectedHabitId"
      :is-pinned="isFirstSelectedPinned" :is-habit="activeTab === 'habits'" @action="handleBulkAction"
      @close="closePanels" />

    <EditHabitModal v-if="isEditModalOpen" :is-open="isEditModalOpen" :habit-id="selectedHabitId"
      @close="isEditModalOpen = false; closePanels();" />

    <TimePickerModal v-if="isTimePickerOpen" :is-open="isTimePickerOpen" :current-time="currentTimeForPicker"
      @close="isTimePickerOpen = false" @confirm="confirmTime" @clear="clearTime" />

    <header class="bg-[var(--ion-background-color)] flex flex-col relative z-[1000] transition-all duration-300"
      :class="{ 'opacity-0 invisible -translate-y-2 pointer-events-none': todoStore.multiSelectedIds.length > 0 }">
      <div class="h-[40px]"></div>

      <div class="pb-2 flex justify-center">
        <div
          class="w-[96%] px-[3px] h-[68px] flex items-center bg-zinc-100 dark:bg-zinc-800/60 rounded-xl shadow-sm border border-black/5 dark:border-white/5">
          <ion-segment v-model="activeTab" mode="ios" class="custom-modern-segment w-full">
            <ion-segment-button value="tasks">
              <ion-label class="text-xl font-bold">Задачи</ion-label>
            </ion-segment-button>
            <ion-segment-button value="habits">
              <ion-label class="text-xl font-bold">Привычки</ion-label>
            </ion-segment-button>
          </ion-segment>
        </div>
      </div>
    </header>

    <ion-content>
      <div class="mt-0">
        <TodoList v-if="activeTab === 'tasks'" @open-list="handleListClick" @open-list-add="openTaskModalForList" />
        <HabitManager v-else-if="activeTab === 'habits'" @selection-change="(id) => selectedHabitId = id" />
      </div>

      <UniversalFab :mode="activeTab" @create-habit="showHabitModal = true" @create-single="showSingleTaskModal = true"
        @create-list="showListModal = true" @add-task="showSingleTaskModal = true" />

      <CreateTaskModal v-if="showSingleTaskModal" :listId="targetListId" @close="closeTaskModal" />
      <CreateListModal v-if="showListModal" @close="showListModal = false" />
      <CreateHabitModal v-if="showHabitModal" @close="showHabitModal = false" @add="addNewHabit" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { IonPage, IonContent, IonSegment, IonSegmentButton, IonLabel } from '@ionic/vue';
import { useRouter } from 'vue-router'; // 1. Импортируем роутер
import { useTodoStore } from '../stores/todoStore';
import { useHabitStore } from '../stores/habitStore';

import TodoList from '../components/TodoListPage.vue';
import HabitManager from '../components/HabitManager.vue';
import QuickActionPanel from '../components/QuickActionPanel.vue';
import UniversalFab from '../components/UniversalFab.vue';
import CreateTaskModal from '../components/CreateTaskModal.vue';
import CreateListModal from '../components/CreateListModal.vue';
import CreateHabitModal from '../components/CreateHabitModal.vue';
import EditHabitModal from '../components/EditHabitModal.vue';
import { LocalNotifications } from '@capacitor/local-notifications';
import TimePickerModal from '../components/TimePickerModal.vue';

const todoStore = useTodoStore();
const habitStore = useHabitStore();
const router = useRouter(); // 2. Инициализируем роутер
const activeTab = ref<'tasks' | 'habits'>('tasks');

const showSingleTaskModal = ref(false);
const showListModal = ref(false);
const showHabitModal = ref(false);
const targetListId = ref<string | null>(null);
const selectedHabitId = ref<string | null>(null);
const isEditModalOpen = ref(false);
const isTimePickerOpen = ref(false);

// 1. Сброс всех выделений
const closePanels = () => {
  // Сбрасываем выделение задач в сторе
  todoStore.clearSelection();

  // Сбрасываем ID выбранной привычки
  selectedHabitId.value = null;

  console.log('Панель закрыта, ID привычки сброшен');
};

onMounted(async () => {
  await habitStore.loadHabits();
  await LocalNotifications.requestPermissions();
});

const isFirstSelectedPinned = computed(() => {
  if (todoStore.multiSelectedIds.length === 0) return false;
  const firstId = todoStore.multiSelectedIds[0];
  const item = todoStore.mainItems.find(i => i.id === firstId);
  return item?.isPinned || false;
});

const handleBulkAction = async (action: string) => {
  const ids = [...todoStore.multiSelectedIds];

  if (action === 'remind') {
    isTimePickerOpen.value = true;
    return;
  }

  if (action === 'edit') {
    isEditModalOpen.value = true;
    return;
  }

  if (action === 'delete') {
    if (selectedHabitId.value) {
      habitStore.startDelayedRemove(selectedHabitId.value);
    } else {
      ids.forEach(id => todoStore.startDelayedRemove(id));
    }
  }

  if (action === 'pin' || action === 'unpin') {
    if (ids.length > 0) {
      ids.forEach(id => todoStore.togglePin(id));
    }
  }

  closePanels();
};

const confirmTime = async (time: string) => {
  if (selectedHabitId.value) {
    // Если выбрана привычка
    await habitStore.updateHabit(selectedHabitId.value, { notificationTime: time });
  } else {
    // Массовое напоминание для ВСЕХ выбранных задач
    for (const id of todoStore.multiSelectedIds) {
      await todoStore.setReminder(id, time);
    }
  }

  isTimePickerOpen.value = false;
  closePanels(); // Сбрасываем выделение только после сохранения
};

const clearTime = async () => {
  if (selectedHabitId.value) {
    await habitStore.updateHabit(selectedHabitId.value, { notificationTime: '' });
  } else {
    for (const id of todoStore.multiSelectedIds) {
      await todoStore.setReminder(id, '');
    }
  }
};

const addNewHabit = async (habitData: { name: string, frequency: 'DAILY' | 'WEEKLY' }) => {
  // Теперь TypeScript видит, что frequency существует в объекте habitData
  await habitStore.addHabit(habitData.name, habitData.frequency);
  showHabitModal.value = false;
};

// 3. НОВАЯ ФУНКЦИЯ: Переход на экран списка
const handleListClick = (listId: string) => {
  console.log('Переход к списку:', listId);
  router.push(`/list/${listId}`);
};

const openTaskModalForList = (listId: string) => {
  targetListId.value = listId;
  showSingleTaskModal.value = true;
};

const closeTaskModal = () => {
  showSingleTaskModal.value = false;
  targetListId.value = null;
};

const currentTimeForPicker = computed(() => {
  // Проверяем привычки
  if (selectedHabitId.value) {
    const h = habitStore.habits.find(h => h.id === selectedHabitId.value);
    return h?.notificationTime || '';
  }

  // Проверяем задачи (берем время первой выбранной)
  if (todoStore.multiSelectedIds.length > 0) {
    const firstId = todoStore.multiSelectedIds[0];
    const item = todoStore.mainItems.find(i => i.id === firstId);
    return item?.reminderTime || '';
  }

  return '';
});

</script>


<style scoped>
ion-segment {
  --background: transparent;
  height: 60px;
  /* Сама кнопка */
}

ion-segment-button {
  --color: #71717a;
  --color-checked: #3b82f6;
  --indicator-color: #ffffff;
  --indicator-box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  --border-radius: 10px;
  /* Убрали лишние маржины, чтобы паддинг контейнера работал на симметрию */
  margin: 0;
}

ion-segment-button::part(native) {
  border-radius: 10px !important;
}

@media (prefers-color-scheme: dark) {
  ion-segment-button {
    --indicator-color: #27272a;
    --color-checked: #60a5fa;
    --color: #a1a1aa;
  }
}

ion-label {
  font-size: 20px !important;
}
</style>
