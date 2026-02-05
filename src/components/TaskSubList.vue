<template>
  <div class="w-full select-none transition-colors duration-300">
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
          <TodoListItem :item="element" :is-selected="todoStore.multiSelectedIds.includes(element.id)"
            :is-selection-mode-active="todoStore.multiSelectedIds.length > 0"
            :is-deleting="deletingIds.includes(element.id)" @touchstart="handleTouchStart(element)"
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

const props = defineProps<{
  tasks: TodoItem[];
  deletingIds: string[];
}>();

const emit = defineEmits(['update:tasks', 'open-list']);
const todoStore = useTodoStore();

// Состояние мультивыбора (локальное для каждого списка)
const multiSelectedIds = ref<string[]>([]);
const touchTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const isScrolling = ref(false);

const dragOptions = {
  animation: 200,
  delay: 400,
  delayOnTouchOnly: true,
  group: 'subtasks',
  ghostClass: 'opacity-0',
  forceFallback: true
};

// --- ЛОГИКА РАЗДЕЛЕНИЯ ---
const pinnedItems = computed({
  get: () => props.tasks.filter(i => i.isPinned),
  set: (val: TodoItem[]) => {
    const unpinned = props.tasks.filter(i => !i.isPinned);
    emit('update:tasks', [...val, ...unpinned]);
  }
});

const unpinnedItems = computed({
  get: () => props.tasks.filter(i => !i.isPinned),
  set: (val: TodoItem[]) => {
    const pinned = props.tasks.filter(i => i.isPinned);
    emit('update:tasks', [...pinned, ...val]);
  }
});

// --- ОБРАБОТЧИКИ (КОПИЯ ИЗ ТВОЕГО КОДА) ---
const handleTouchStart = (element: TodoItem) => {
  isScrolling.value = false;
  if (touchTimer.value) clearTimeout(touchTimer.value);

  touchTimer.value = setTimeout(() => {
    if (!isScrolling.value) {
      if (window.navigator.vibrate) window.navigator.vibrate(40);

      // Добавляем в ГЛОБАЛЬНЫЙ массив стора
      if (!todoStore.multiSelectedIds.includes(element.id)) {
        todoStore.multiSelectedIds.push(element.id);
      }
    }
  }, 600);
};

const handleTouchMove = () => {
  isScrolling.value = true;
  if (touchTimer.value) clearTimeout(touchTimer.value);
};

const handleTouchEnd = () => {
  if (touchTimer.value) clearTimeout(touchTimer.value);
};

const handleItemClick = (element: TodoItem) => {
  // ВАЖНО: смотрим в стор!
  if (todoStore.multiSelectedIds.length > 0) {
    const index = todoStore.multiSelectedIds.indexOf(element.id);
    if (index > -1) {
      // Если уже выбран — удаляем
      todoStore.multiSelectedIds.splice(index, 1);
    } else {
      // Если не выбран — добавляем
      todoStore.multiSelectedIds.push(element.id);
    }
    return;
  }

  // Обычный клик (открытие списка или чекбокс)
  if (!element.items || (element.items.length === 0 && !element.title)) {
    todoStore.toggleTask(element.id);
  } else {
    emit('open-list', element.id);
  }
};

const onDragEnd = () => { /* Сюда можно добавить сохранение */ };
</script>

<style scoped>
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
