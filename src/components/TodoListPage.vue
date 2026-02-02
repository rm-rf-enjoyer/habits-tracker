<template>
  <div class="min-h-screen p-2 bg-white dark:bg-zinc-950 font-iosevka select-none transition-colors duration-300">

    <div v-if="pinnedItems.length > 0" class="mb-4">
      <div class="section-label">Закрепленные</div>
      <draggable v-model="pinnedItems" item-key="id" v-bind="pinnedDragOptions" class="flex flex-col gap-1.5"
        @end="onDragEnd">
        <template #item="{ element }">
          <TodoListItem :item="element" :is-selected="todoStore.selectedId === element.id"
            :is-deleting="todoStore.deletingIds.includes(element.id)" @touchstart="handleTouchStart($event, element)"
            @touchend="handleTouchEnd" @touchmove="handleTouchMove" @click="handleItemClick($event, element)"
            @open-list="id => $emit('open-list', id)" @cancel-delete="id => todoStore.cancelDeletion(id)" />
        </template>
      </draggable>
    </div>

    <div class="flex flex-col gap-1.5">
      <div v-if="pinnedItems.length > 0" class="section-label">Остальные</div>
      <draggable v-model="unpinnedItems" item-key="id" v-bind="unpinnedDragOptions" class="flex flex-col gap-1.5"
        @end="onDragEnd">
        <template #item="{ element }">
          <TodoListItem :item="element" :is-selected="todoStore.selectedId === element.id"
            :is-deleting="todoStore.deletingIds.includes(element.id)" @touchstart="handleTouchStart($event, element)"
            @touchend="handleTouchEnd" @touchmove="handleTouchMove" @click="handleItemClick($event, element)"
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
// Исправлено: Название компонента должно отличаться от названия типа TodoItem
import TodoListItem from './TodoListItem.vue';

const todoStore = useTodoStore();
const emit = defineEmits(['open-list']);

const touchTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const isScrolling = ref(false);

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

const pinnedDragOptions = { animation: 200, delay: 400, delayOnTouchOnly: true, group: 'pinned', ghostClass: 'opacity-0', forceFallback: true };
const unpinnedDragOptions = { animation: 200, delay: 400, delayOnTouchOnly: true, group: 'unpinned', ghostClass: 'opacity-0', forceFallback: true };

const handleTouchStart = (e: TouchEvent, element: TodoItem) => {
  isScrolling.value = false;
  if (touchTimer.value) clearTimeout(touchTimer.value);
  touchTimer.value = setTimeout(() => {
    if (!isScrolling.value) {
      if (window.navigator.vibrate) window.navigator.vibrate(40);
      todoStore.selectedId = element.id;
    }
  }, 600);
};

const handleTouchMove = () => {
  isScrolling.value = true;
  if (touchTimer.value) { clearTimeout(touchTimer.value); touchTimer.value = null; }
};

const handleTouchEnd = () => { if (touchTimer.value) { clearTimeout(touchTimer.value); touchTimer.value = null; } };

const handleItemClick = (event: Event, element: TodoItem) => {
  if (todoStore.selectedId) { todoStore.selectedId = null; return; }
  if (!element.items || (element.items.length === 0 && !element.title)) {
    todoStore.toggleTask(element.id);
  } else {
    emit('open-list', element.id);
  }
};

const onDragEnd = () => { todoStore.selectedId = null; };
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
