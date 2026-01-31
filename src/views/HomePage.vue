<template>
  <ion-page>
    <QuickActionPanel :is-open="!!todoStore.selectedId || !!selectedHabitId" :is-habit="!!selectedHabitId"
      @action="handlePanelAction" @close="closePanels" />

    <EditHabitModal v-if="isEditModalOpen" :is-open="isEditModalOpen" :habit-id="selectedHabitId"
      @close="isEditModalOpen = false; closePanels();" />

    <TimePickerModal v-if="isTimePickerOpen" :is-open="isTimePickerOpen" :current-time="currentTimeForPicker"
      @close="isTimePickerOpen = false" @confirm="confirmTime" @clear="clearTime" />

    <div class="header-container" :class="{ 'header-hidden': todoStore.selectedId }">
      <div class="status-bar-spacer"></div>
      <div class="custom-top-bar">
        <ion-segment v-model="activeTab" mode="ios">
          <ion-segment-button value="tasks"><ion-label>Задачи</ion-label></ion-segment-button>
          <ion-segment-button value="habits"><ion-label>Привычки</ion-label></ion-segment-button>
        </ion-segment>
      </div>
    </div>

    <ion-content>
      <TodoList v-if="activeTab === 'tasks'" @open-list="handleListClick" @open-list-add="openTaskModalForList" />

      <HabitManager v-else-if="activeTab === 'habits'" @selection-change="(id) => selectedHabitId = id" />

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

import TodoList from '../components/TodoList.vue';
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
    // 1. Сначала подготавливаем данные
    if (selectedHabitId.value) {
      const h = habitStore.habits.find(h => h.id === selectedHabitId.value);
      currentTimeForPicker.value = h?.notificationTime || '';
    } else if (todoStore.selectedId) {
      const t = todoStore.mainItems.find(t => t.id === todoStore.selectedId);
      currentTimeForPicker.value = t?.reminderTime || '';
    }

    // 2. Открываем модалку времени
    isTimePickerOpen.value = true;

    // 3. НЕ ВЫЗЫВАЕМ closePanels(), чтобы панель не прыгала раньше времени
    return;
  }

  // Остальные действия (edit, delete, pin)
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
  if (selectedHabitId.value) {
    await habitStore.updateHabit(selectedHabitId.value, { notificationTime: time });
  } else if (todoStore.selectedId) {
    await todoStore.setReminder(todoStore.selectedId, time);
  }
  isTimePickerOpen.value = false;
  closePanels();
};

const clearTime = async () => {
  if (selectedHabitId.value) {
    await habitStore.updateHabit(selectedHabitId.value, { notificationTime: '' });
  } else if (todoStore.selectedId) {
    // Добавь логику отмены в todoStore, если нужно
    await todoStore.setReminder(todoStore.selectedId, '');
  }
  isTimePickerOpen.value = false;
  closePanels();
};


</script>

<style scoped>
/* Твои стили header-container и прочее остаются без изменений */
.header-container {
  background: #ffffff;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 1000;
  transition: opacity 0.2s ease, visibility 0.2s ease;
}

.header-hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.status-bar-spacer {
  height: 30px !important;
}

.custom-top-bar {
  padding-bottom: 5px;
  display: flex;
  justify-content: center;
  background: #ffffff;
}

ion-segment {
  width: 94%;
  height: 70px !important;
  background: #f4f4f7;
  border-radius: 20px;
  padding: 6px;
}

ion-segment-button {
  font-size: 20px !important;
  font-weight: 800 !important;
}
</style>
