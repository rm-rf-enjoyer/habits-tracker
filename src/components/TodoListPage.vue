<template>
  <div class="min-h-screen p-2 bg-white dark:bg-zinc-950 font-iosevka select-none transition-colors duration-300">
    <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
      <ion-refresher-content></ion-refresher-content>
    </ion-refresher>

    <input type="datetime-local" ref="datePicker" class="fixed opacity-0 pointer-events-none"
      @change="onDateSelected" />

    <div v-if="pinnedItems.length > 0" class="mb-4 mt-2">
      <div class="section-label">Закрепленные</div>
      <draggable v-model="pinnedItems" item-key="id" v-bind="dragOptions" class="flex flex-col gap-1.5">
        <template #item="{ element }">
          <TodoListItem :item="element" :is-selected="todoStore.multiSelectedIds.includes(element.id)"
            :is-selection-mode-active="todoStore.multiSelectedIds.length > 0"
            :is-deleting="todoStore.deletingIds.includes(element.id)" @touchstart="handleTouchStart(element)"
            @touchend="handleTouchEnd" @touchmove="handleTouchMove" @click="handleItemClick(element)"
            @open-list="id => $emit('open-list', id)" @cancel-delete="id => todoStore.cancelDeletion(id)" />
        </template>
      </draggable>
    </div>

    <div class="flex flex-col gap-1.5">
      <div v-if="pinnedItems.length > 0" class="section-label">Остальные</div>
      <draggable v-model="unpinnedItems" item-key="id" v-bind="dragOptions" class="flex flex-col gap-1.5">
        <template #item="{ element }">
          <TodoListItem :item="element" :is-selected="todoStore.multiSelectedIds.includes(element.id)"
            :is-selection-mode-active="todoStore.multiSelectedIds.length > 0"
            :is-deleting="todoStore.deletingIds.includes(element.id)" @touchstart="handleTouchStart(element)"
            @touchend="handleTouchEnd" @touchmove="handleTouchMove" @click="handleItemClick(element)"
            @open-list="id => $emit('open-list', id)" @cancel-delete="id => todoStore.cancelDeletion(id)" />
        </template>
      </draggable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTodoStore, type TodoItem } from '../stores/todoStore';
import { IonRefresher, IonRefresherContent } from '@ionic/vue'; // Импорты Ionic
import draggable from 'vuedraggable';
import TodoListItem from './TodoListItem.vue';

const todoStore = useTodoStore();
const emit = defineEmits(['open-list']);
const datePicker = ref<HTMLInputElement | null>(null);
const touchTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const isScrolling = ref(false);

// --- Логика синхронизации ---
const handleRefresh = async (event: any) => {
  try {
    // Находим все облачные списки в главном массиве
    const cloudLists = todoStore.mainItems.filter(i => i.isCloud && i.remoteId);

    // Запускаем синхронизацию всех облачных списков параллельно
    if (cloudLists.length > 0) {
      await Promise.all(cloudLists.map(list => todoStore.fetchRemoteList(list.remoteId!)));
    }
  } finally {
    // Останавливаем анимацию вращения в любом случае
    event.target.complete();
  }
};

// --- Остальная логика без изменений ---
const dragOptions = computed(() => ({
  animation: 200, delay: 400, delayOnTouchOnly: true,
  group: 'todos', ghostClass: 'opacity-0', forceFallback: true,
  disabled: todoStore.multiSelectedIds.length > 0
}));

const pinnedItems = computed({
  get: () => todoStore.mainItems.filter(i => i.isPinned),
  set: (val: TodoItem[]) => {
    todoStore.updateOrder([...val, ...todoStore.mainItems.filter(i => !i.isPinned)]);
  }
});

const unpinnedItems = computed({
  get: () => todoStore.mainItems.filter(i => !i.isPinned),
  set: (val: TodoItem[]) => {
    todoStore.updateOrder([...todoStore.mainItems.filter(i => i.isPinned), ...val]);
  }
});

const handleTouchStart = (element: TodoItem) => {
  isScrolling.value = false;
  if (touchTimer.value) clearTimeout(touchTimer.value);
  touchTimer.value = setTimeout(() => {
    if (!isScrolling.value) {
      if (window.navigator.vibrate) window.navigator.vibrate(40);
      todoStore.toggleSelection(element.id);
    }
  }, 600);
};

const handleTouchMove = () => { isScrolling.value = true; if (touchTimer.value) clearTimeout(touchTimer.value); };
const handleTouchEnd = () => { if (touchTimer.value) clearTimeout(touchTimer.value); };

const handleItemClick = (element: TodoItem) => {
  if (todoStore.multiSelectedIds.length > 0) {
    todoStore.toggleSelection(element.id);
    return;
  }
  // Если это не список (нет вложенных items) и не заголовок - переключаем статус
  if (!element.items || (element.items.length === 0 && !element.title)) {
    todoStore.toggleTask(element.id);
  } else if (element.title) {
    // Если это заголовок списка, пробрасываем событие открытия
    emit('open-list', element.id);
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

defineExpose({ triggerDatePicker: () => datePicker.value?.showPicker() });
</script>
