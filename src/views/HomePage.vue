<template>
  <ion-page>
    <QuickActionPanel :is-open="todoStore.multiSelectedIds.length > 0 || !!selectedHabitId"
      :invite-key="todoStore.inviteKeyForPanel" :is-pinned="todoStore.isFirstSelectedPinned"
      :is-habit="activeTab === 'habits'" @action="handleBulkAction" @close="closePanels" />

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
            <ion-segment-button value="tasks"><ion-label
                class="text-xl font-bold">Задачи</ion-label></ion-segment-button>
            <ion-segment-button value="habits"><ion-label
                class="text-xl font-bold">Привычки</ion-label></ion-segment-button>
          </ion-segment>
        </div>
      </div>
    </header>

    <ion-content>
      <div class="mt-0">
        <TodoList v-if="activeTab === 'tasks'" ref="todoListRef" @open-list="handleListClick"
          @open-list-add="openTaskModalForList" />
        <HabitManager v-else-if="activeTab === 'habits'" @selection-change="(id) => selectedHabitId = id" />
      </div>

      <UniversalFab :mode="activeTab" @create-habit="showHabitModal = true" @create-single="showSingleTaskModal = true"
        @create-list="showListModal = true" @add-task="showSingleTaskModal = true" @join-list="showJoinModal = true" />

      <CreateTaskModal v-if="showSingleTaskModal" :listId="targetListId" @close="closeTaskModal" />
      <CreateListModal v-if="showListModal" @close="showListModal = false" />
      <CreateHabitModal v-if="showHabitModal" @close="showHabitModal = false" @add="addNewHabit" />
      <JoinListModal :is-open="showJoinModal" @close="showJoinModal = false" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { IonPage, IonContent, IonSegment, IonSegmentButton, IonLabel, toastController } from '@ionic/vue';
import { useRouter } from 'vue-router';
import { useTodoStore } from '../stores/todoStore';
import { useHabitStore } from '../stores/habitStore';
import { Clipboard } from '@capacitor/clipboard';
import { LocalNotifications } from '@capacitor/local-notifications';

// Компоненты
import TodoList from '../components/TodoListPage.vue';
import HabitManager from '../components/HabitManager.vue';
import QuickActionPanel from '../components/QuickActionPanel.vue';
import UniversalFab from '../components/UniversalFab.vue';
import CreateTaskModal from '../components/CreateTaskModal.vue';
import CreateListModal from '../components/CreateListModal.vue';
import CreateHabitModal from '../components/CreateHabitModal.vue';
import EditHabitModal from '../components/EditHabitModal.vue';
import TimePickerModal from '../components/TimePickerModal.vue';
import JoinListModal from '../components/JoinListModal.vue';

const todoStore = useTodoStore();
const habitStore = useHabitStore();
const router = useRouter();
const todoListRef = ref<any>(null);

const activeTab = ref<'tasks' | 'habits'>('tasks');
const showSingleTaskModal = ref(false);
const showListModal = ref(false);
const showHabitModal = ref(false);
const targetListId = ref<string | null>(null);
const selectedHabitId = ref<string | null>(null);
const isEditModalOpen = ref(false);
const isTimePickerOpen = ref(false);
const showJoinModal = ref(false);

const closePanels = () => {
  todoStore.clearSelection();
  selectedHabitId.value = null;
};

onMounted(async () => {
  await habitStore.loadHabits();
  await LocalNotifications.requestPermissions();
});

const handleBulkAction = async (action: string) => {
  if (action === 'share') {
    const key = todoStore.inviteKeyForPanel;
    if (key) {
      await Clipboard.write({ string: key });
      const toast = await toastController.create({
        message: 'Код доступа скопирован!',
        duration: 2000,
        color: 'success',
        mode: 'ios'
      });
      await toast.present();
    }
    closePanels();
  } else if (action === 'remind') {
    if (activeTab.value === 'habits') isTimePickerOpen.value = true;
    else todoListRef.value?.triggerDatePicker();
  } else if (action === 'edit') {
    isEditModalOpen.value = true;
  } else if (action === 'delete') {
    if (selectedHabitId.value) {
      // Для привычек (если там тоже асинхронно)
      habitStore.startDelayedRemove(selectedHabitId.value);
    } else {
      // Важно: копируем массив ID, чтобы очистка выделения не стерла их
      const idsToDelete = [...todoStore.multiSelectedIds];

      // Запускаем удаление для каждого ID
      idsToDelete.forEach(id => {
        todoStore.startDelayedRemove(id);
      });
    }
    // Теперь можно безопасно закрыть панель
    closePanels();
  } else if (action === 'pin' || action === 'unpin') {
    // 1. Копируем ID, чтобы очистка панели не стерла данные для цикла
    const idsToToggle = [...todoStore.multiSelectedIds];

    // 2. Определяем целевое состояние на основе нажатой кнопки
    const shouldPin = action === 'pin';

    // 3. Выполняем действия
    idsToToggle.forEach(id => {
      // Передаем id и принудительное состояние (если твой togglePin это поддерживает)
      todoStore.togglePin(id, shouldPin);
    });

    // 4. Закрываем панель
    closePanels();
  }
};

const confirmTime = async (time: string) => {
  if (selectedHabitId.value) await habitStore.updateHabit(selectedHabitId.value, { notificationTime: time });
  isTimePickerOpen.value = false;
  closePanels();
};

const clearTime = async () => {
  if (selectedHabitId.value) await habitStore.updateHabit(selectedHabitId.value, { notificationTime: '' });
};

const handleListClick = (listId: string) => router.push(`/list/${listId}`);
const openTaskModalForList = (listId: string) => { targetListId.value = listId; showSingleTaskModal.value = true; };
const closeTaskModal = () => { showSingleTaskModal.value = false; targetListId.value = null; };
const addNewHabit = async (data: any) => { await habitStore.addHabit(data.name, data.frequency); showHabitModal.value = false; };

const currentTimeForPicker = computed(() => {
  if (selectedHabitId.value) {
    const h = habitStore.habits.find(h => h.id === selectedHabitId.value);
    return h?.notificationTime || '';
  }
  return '';
});
</script>

<style scoped>
ion-segment {
  --background: transparent;
  height: 60px;
}

ion-segment-button {
  --color: #71717a;
  --color-checked: #3b82f6;
  --indicator-color: #ffffff;
  --indicator-box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  --border-radius: 10px;
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
