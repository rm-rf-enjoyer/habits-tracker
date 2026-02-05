<template>
  <div class="min-h-screen p-2 bg-white dark:bg-zinc-950 font-iosevka select-none transition-colors duration-300">

    <input type="datetime-local" ref="datePicker" class="fixed opacity-0 pointer-events-none"
      @change="onDateSelected" />

    <QuickActionPanel :is-open="multiSelectedIds.length > 0" :is-pinned="firstSelectedPinned" @action="handleBulkAction"
      @close="clearSelection" />

    <div v-if="pinnedItems.length > 0" class="mb-4">
      <div class="section-label">Закрепленные</div>
      <draggable v-model="pinnedItems" item-key="id" v-bind="dragOptions" class="flex flex-col gap-1.5"
        @end="onDragEnd">
        <template #item="{ element }">
          <TodoListItem :item="element" :is-selected="multiSelectedIds.includes(element.id)"
            :is-selection-mode-active="multiSelectedIds.length > 0"
            :is-deleting="todoStore.deletingIds.includes(element.id)" @touchstart="handleTouchStart(element)"
            @touchend="handleTouchEnd" @touchmove="handleTouchMove" @click="handleItemClick(element)"
            @open-list="id => $emit('open-list', id)" @cancel-delete="id => todoStore.cancelDeletion(id)" />
        </template>
      </draggable>
    </div>

    <div class="flex flex-col gap-1.5">
      <div v-if="pinnedItems.length > 0" class="section-label">Остальные</div>
      <draggable v-model="unpinnedItems" item-key="id" v-bind="dragOptions" class="flex flex-col gap-1.5"
        @end="onDragEnd">
        <template #item="{ element }">
          <TodoListItem :item="element" :is-selected="multiSelectedIds.includes(element.id)"
            :is-selection-mode-active="multiSelectedIds.length > 0"
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
import draggable from 'vuedraggable';
import TodoListItem from './TodoListItem.vue';
import QuickActionPanel from './QuickActionPanel.vue';

const todoStore = useTodoStore();
const emit = defineEmits(['open-list']);

// Реф для инпута даты
const datePicker = ref<HTMLInputElement | null>(null);

// Состояние мультивыбора
const multiSelectedIds = ref<string[]>([]);
const touchTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const isScrolling = ref(false);

// Проверка закрепленности ПЕРВОГО элемента для Action Bar
const firstSelectedPinned = computed(() => {
  if (multiSelectedIds.value.length === 0) return false;
  const item = todoStore.mainItems.find(i => i.id === multiSelectedIds.value[0]);
  return item?.isPinned || false;
});

// Настройки Draggable (блокируем перетаскивание, если идет выбор)
const dragOptions = computed(() => ({
  animation: 200,
  delay: 400,
  delayOnTouchOnly: true,
  group: 'todos',
  ghostClass: 'opacity-0',
  forceFallback: true,
  disabled: false
}));

const pinnedItems = computed({
  get: () => todoStore.mainItems.filter(i => i.isPinned),
  set: (val: TodoItem[]) => {
    todoStore.mainItems = [...val, ...todoStore.mainItems.filter(i => !i.isPinned)];
  }
});

const unpinnedItems = computed({
  get: () => todoStore.mainItems.filter(i => !i.isPinned),
  set: (val: TodoItem[]) => {
    todoStore.mainItems = [...todoStore.mainItems.filter(i => i.isPinned), ...val];
  }
});

// --- ОБРАБОТЧИКИ ТАЧЕЙ ---
const handleTouchStart = (element: TodoItem) => {
  isScrolling.value = false;

  if (touchTimer.value) clearTimeout(touchTimer.value);

  touchTimer.value = setTimeout(() => {
    // Если мы не скроллим и НЕ начали активно перетаскивать (библиотека не скрыла элемент)
    if (!isScrolling.value) {
      // Вибрация — сигнал, что режим выбора включился
      if (window.navigator.vibrate) window.navigator.vibrate(40);

      if (!multiSelectedIds.value.includes(element.id)) {
        multiSelectedIds.value.push(element.id);
      }
    }
  }, 600); // Это время должно быть БОЛЬШЕ, чем delay в dragOptions
};

const handleTouchMove = () => {
  isScrolling.value = true;
  if (touchTimer.value) clearTimeout(touchTimer.value);
};

const handleTouchEnd = () => {
  if (touchTimer.value) clearTimeout(touchTimer.value);
};

const handleItemClick = (element: TodoItem) => {
  // 1. Если режим выбора УЖЕ активен
  if (multiSelectedIds.value.length > 0) {
    const index = multiSelectedIds.value.indexOf(element.id);
    if (index > -1) {
      multiSelectedIds.value.splice(index, 1);
    } else {
      multiSelectedIds.value.push(element.id);
    }
    return;
  }

  // Обычное поведение
  if (!element.items || (element.items.length === 0 && !element.title)) {
    todoStore.toggleTask(element.id);
  }
};

const clearSelection = () => {
  multiSelectedIds.value = [];
};

// --- МАССОВЫЕ ДЕЙСТВИЯ ---
const handleBulkAction = async (action: string) => {
  if (action === 'delete') {
    multiSelectedIds.value.forEach(id => todoStore.startDelayedRemove(id));
    clearSelection();
  }
  else if (action === 'pin' || action === 'unpin') {
    const newState = action === 'pin';
    multiSelectedIds.value.forEach(id => {
      const item = todoStore.mainItems.find(i => i.id === id);
      if (item && item.isPinned !== newState) {
        todoStore.togglePin(id);
      }
    });
    clearSelection();
  }
  else if (action === 'remind') {
    // Открываем нативный календарь
    datePicker.value?.showPicker();
  }
};

const onDateSelected = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target.value) return;

  // Устанавливаем выбранное время для всех выделенных задач
  for (const id of multiSelectedIds.value) {
    await todoStore.setReminder(id, target.value);
  }

  target.value = '';
  clearSelection();
};

const onDragEnd = () => {
  // Логика завершения перетаскивания
};
</script>

<style scoped>
.font-iosevka {
  font-family: 'Iosevka', 'Iosevka NF', monospace;
}

.section-label {
  margin-left: 0.75rem;
  margin-bottom: 0.375rem;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
  opacity: 0.6;
}
</style>
