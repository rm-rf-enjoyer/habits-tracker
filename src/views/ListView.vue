<template>
  <ion-page>
    <QuickActionPanel :is-open="todoStore.multiSelectedIds.length > 0" :is-pinned="firstSelectedPinned"
      @action="handleBulkAction" @close="todoStore.clearSelection" />

    <input type="datetime-local" ref="datePicker" class="fixed opacity-0 pointer-events-none"
      @change="onDateSelected" />

    <header
      class="bg-[var(--ion-background-color)] flex flex-col shadow-[0_4px_15px_rgba(0,0,0,0.05)] dark:shadow-none border-b border-transparent dark:border-zinc-800 relative z-[1000]">
      <div class="h-[40px]"></div>
      <div class="flex items-center justify-between px-2.5 pb-2.5 bg-[var(--ion-background-color)]">
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" :icon="chevronBack" class="--color-[#3b82f6]"></ion-back-button>
        </ion-buttons>
        <span class="text-xl font-extrabold text-[var(--ion-text-color)] font-mono tracking-tight">
          {{ currentList?.title }}
        </span>
        <div class="w-[48px]"></div>
      </div>
    </header>

    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
      <div class="p-2 min-h-full bg-white dark:bg-zinc-950 transition-colors duration-300">
        <TaskSubList v-if="currentList" :tasks="currentList.items || []" :deleting-ids="todoStore.deletingIds"
          @update:tasks="(newList) => {
            if (currentList) {
              todoStore.updateSubItems(currentList.id, newList);
            }
          }" @cancel-delete="(id: string) => todoStore.cancelDeletion(id)"
          @open-list="(id: string) => $router.push(`/list/${id}`)" />
      </div>

      <UniversalFab mode="list" @add-task="showAddTask = true" />
      <CreateTaskModal v-if="showAddTask && currentList" :listId="currentList.id" @close="showAddTask = false" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
// Скрипт оставляем без изменений, он правильный
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTodoStore, type TodoItem } from '../stores/todoStore';
import { IonPage, IonContent, IonButtons, IonBackButton } from '@ionic/vue';
import { chevronBack } from 'ionicons/icons';

import TaskSubList from '../components/TaskSubList.vue';
import CreateTaskModal from '../components/CreateTaskModal.vue';
import UniversalFab from '../components/UniversalFab.vue';
import QuickActionPanel from '../components/QuickActionPanel.vue';

const route = useRoute();
const todoStore = useTodoStore();
const showAddTask = ref(false);
const datePicker = ref<HTMLInputElement | null>(null);

const currentList = computed(() => {
  const id = route.params.id as string;
  return todoStore.mainItems.find(l => l.id === id);
});

const firstSelectedPinned = computed(() => {
  if (todoStore.multiSelectedIds.length === 0) return false;
  const firstId = todoStore.multiSelectedIds[0];

  const findItem = (list: TodoItem[]): TodoItem | undefined => {
    for (const item of list) {
      if (item.id === firstId) return item;
      if (item.items && item.items.length > 0) {
        const found = findItem(item.items);
        if (found) return found;
      }
    }
    return undefined; // ОБЯЗАТЕЛЬНО: возвращаем undefined, если ничего не нашли
  };

  const item = findItem(todoStore.mainItems);
  return item?.isPinned || false;
});

const handleBulkAction = async (action: string) => {
  if (action === 'delete') {
    todoStore.multiSelectedIds.forEach(id => todoStore.startDelayedRemove(id));
    todoStore.clearSelection();
  }
  else if (action === 'pin' || action === 'unpin') {
    // Определяем желаемое состояние один раз для всей группы
    const shouldBePinned = action === 'pin';

    for (const id of todoStore.multiSelectedIds) {
      // Передаем принудительное состояние вторым аргументом
      await todoStore.togglePin(id, shouldBePinned);
    }
    todoStore.clearSelection();
  }
  else if (action === 'remind') {
    datePicker.value?.showPicker();
  }
};

const onDateSelected = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target.value) return;

  for (const id of todoStore.multiSelectedIds) {
    await todoStore.setReminder(id, target.value);
  }

  target.value = '';
  todoStore.clearSelection();
};

onMounted(async () => {
  // Если зашли в список, который помечен как облачный и имеет remoteId
  if (currentList.value?.isCloud && currentList.value.remoteId) {
    try {
      await todoStore.fetchRemoteList(currentList.value.remoteId);
      console.log("✅ Список синхронизирован с облаком");
    } catch (e) {
      console.error("❌ Не удалось обновить список:", e);
    }
  }
});

const handleRefresh = async (event: any) => {
  if (currentList.value?.isCloud && currentList.value.remoteId) {
    await todoStore.fetchRemoteList(currentList.value.remoteId);
  }
  event.target.complete(); // Останавливает анимацию крутилки
};
</script>

<style scoped>
/* Пробиваем Shadow DOM кнопки назад */
ion-back-button {
  --color: #3b82f6;
  /* Modern Blue */
}

/* Принудительно убираем стандартные фоны Ionic, если они вылезут */
ion-toolbar {
  --background: transparent;
  --border-style: none;
}
</style>
