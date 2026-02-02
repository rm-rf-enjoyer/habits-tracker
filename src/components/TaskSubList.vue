<template>
  <div class="w-full px-2 pt-2 select-none transition-colors duration-300">
    <draggable v-model="internalItems" item-key="id" v-bind="dragOptions" class="flex flex-col gap-1.5"
      @end="onDragEnd">
      <template #item="{ element }: { element: TodoItem }">
        <TodoListItem :item="element" :is-selected="todoStore.selectedId === element.id"
          :is-deleting="todoStore.deletingIds.includes(element.id)" @touchstart="handleTouchStart($event, element)"
          @touchend="handleTouchEnd" @touchmove="handleTouchMove" @click="handleItemClick($event, element)"
          @open-list="id => $emit('open-list', id)" @cancel-delete="id => todoStore.cancelDeletion(id)" />
      </template>
    </draggable>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTodoStore, type TodoItem } from '../stores/todoStore';
import draggable from 'vuedraggable';
import TodoListItem from './TodoListItem.vue';

const props = defineProps<{
  tasks: TodoItem[]
}>();

const emit = defineEmits(['update:tasks', 'open-list']);
const todoStore = useTodoStore();

const internalItems = computed({
  get: () => props.tasks,
  set: (val) => emit('update:tasks', val)
});

const dragOptions = {
  animation: 200,
  delay: 400,
  delayOnTouchOnly: true,
  ghostClass: 'opacity-0',
  forceFallback: true
};

// --- Твоя логика (без изменений) ---
let touchTimer: any = null;
let isScrolling = false;

const handleTouchStart = (e: TouchEvent, element: TodoItem) => {
  isScrolling = false;
  if (touchTimer) clearTimeout(touchTimer);
  touchTimer = setTimeout(() => {
    if (!isScrolling) {
      if (window.navigator.vibrate) window.navigator.vibrate(40);
      todoStore.selectedId = element.id;
    }
  }, 600);
};

const handleTouchMove = () => { isScrolling = true; clearTimeout(touchTimer); };
const handleTouchEnd = () => { clearTimeout(touchTimer); };

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
