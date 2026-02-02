<template>
  <ion-page>
    <QuickActionPanel :is-open="!!todoStore.selectedId || !!selectedHabitId" :is-habit="!!selectedHabitId"
      @action="handlePanelAction" @close="closePanels" />

    <EditHabitModal v-if="isEditModalOpen" :is-open="isEditModalOpen" :habit-id="selectedHabitId"
      @close="isEditModalOpen = false; closePanels();" />

    <TimePickerModal v-if="isTimePickerOpen" :is-open="isTimePickerOpen" :current-time="currentTimeForPicker"
      @close="isTimePickerOpen = false" @confirm="confirmTime" @clear="clearTime" />

    <header class="bg-[var(--ion-background-color)] flex flex-col relative z-[1000] transition-all duration-300"
      :class="{ 'opacity-0 invisible -translate-y-2': todoStore.selectedId }">
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
import { ref, onMounted } from 'vue'
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
const currentTimeForPicker = ref('');

// 1. Сброс всех выделений
const closePanels = () => {
  todoStore.selectedId = null;
  selectedHabitId.value = null;
};

onMounted(async () => {
  await habitStore.loadHabits();
  await LocalNotifications.requestPermissions();
});

const addNewHabit = async (habitData: { name: string, frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' }) => {
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

const handlePanelAction = (action: string) => {
  if (action === 'remind') {
    // Находим актуальное время ПЕРЕД открытием модалки
    if (selectedHabitId.value) {
      const h = habitStore.habits.find(h => h.id === selectedHabitId.value);
      currentTimeForPicker.value = h?.notificationTime || '';
    } else if (todoStore.selectedId) {
      // Ищем задачу во всех списках mainItems
      const t = todoStore.mainItems.find(t => t.id === todoStore.selectedId);
      currentTimeForPicker.value = t?.reminderTime || '';
    }

    isTimePickerOpen.value = true;
    return; // НЕ закрываем панели, иначе потеряем ID задачи
  }

  // Для остальных действий (edit, delete, pin)
  if (action === 'edit') {
    isEditModalOpen.value = true;
    return;
  }

  if (action === 'delete') {
    if (selectedHabitId.value) {
      habitStore.startDelayedRemove(selectedHabitId.value);
    } else if (todoStore.selectedId) {
      todoStore.startDelayedRemove(todoStore.selectedId);
    }
  }

  if (action === 'pin' && todoStore.selectedId) {
    todoStore.togglePin(todoStore.selectedId);
  }

  closePanels();
};

const confirmTime = async (time: string) => {
  // Сначала сохраняем данные в Store
  if (selectedHabitId.value) {
    await habitStore.updateHabit(selectedHabitId.value, { notificationTime: time });
  } else if (todoStore.selectedId) {
    await todoStore.setReminder(todoStore.selectedId, time);
  }

  // Потом закрываем модалку времени
  isTimePickerOpen.value = false;
  // И только в самом конце сбрасываем выделение (панель действий)
  closePanels();
};

const clearTime = async () => {
  if (selectedHabitId.value) {
    await habitStore.updateHabit(selectedHabitId.value, { notificationTime: '' });
  } else if (todoStore.selectedId) {
    await todoStore.setReminder(todoStore.selectedId, '');
  }

  // ОБЯЗАТЕЛЬНО обновляем пропс, чтобы модалка увидела сброс
  currentTimeForPicker.value = '';

  // УДАЛИ ИЛИ ЗАКОММЕНТИРУЙ ЭТИ СТРОКИ:
  // isTimePickerOpen.value = false; 
  // closePanels();
};

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
