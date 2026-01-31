<template>
  <div class="main-container no-select">
    <draggable v-model="internalItems" item-key="id" v-bind="dragOptions" class="drag-area" @end="onDragEnd">
      <template #item="{ element }">
        <div class="item-wrapper">
          <div v-if="todoStore.deletingIds.includes(element.id)" class="card delete-card">
            <div class="delete-content" @click="todoStore.cancelDeletion(element.id)">
              <span class="delete-text"> Удаление...</span>
              <span class="cancel-label">[ОТМЕНА]</span>
            </div>
            <div class="delete-progress"></div>
          </div>

          <div v-else class="card main-card" :class="{ 'is-selected': todoStore.selectedId === element.id }"
            @touchstart="handleTouchStart($event, element)" @touchend="handleTouchEnd" @touchmove="handleTouchMove"
            @click="handleTaskClick(element)">
            <div class="card-inner">
              <span class="item-text" :class="{ 'completed-text': element.completed }">
                {{ element.text }}
              </span>
            </div>
          </div>
        </div>
      </template>
    </draggable>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTodoStore, type TodoItem } from '../stores/todoStore';
import draggable from 'vuedraggable';

const props = defineProps<{
  tasks: TodoItem[]
}>();

const emit = defineEmits(['update:tasks']);
const todoStore = useTodoStore();

// Двустороннее связывание для draggable
const internalItems = computed({
  get: () => props.tasks,
  set: (val) => emit('update:tasks', val)
});

const dragOptions = {
  animation: 200,
  delay: 400,
  delayOnTouchOnly: true,
  ghostClass: 'ghost-card',
  forceFallback: true
};

// Твоя логика кликов и тачей (копируем один в один)
const handleTaskClick = (element: TodoItem) => {
  if (todoStore.selectedId) { todoStore.selectedId = null; return; }
  todoStore.toggleTask(element.id);
};

let touchTimer: any = null;
let isScrolling = false;

const handleTouchStart = (e: any, element: any) => {
  isScrolling = false;
  touchTimer = setTimeout(() => {
    if (!isScrolling) {
      if (window.navigator.vibrate) window.navigator.vibrate(40);
      todoStore.selectedId = element.id;
    }
  }, 600);
};

const handleTouchMove = () => { isScrolling = true; clearTimeout(touchTimer); };
const handleTouchEnd = () => { clearTimeout(touchTimer); };
const onDragEnd = () => {
  todoStore.selectedId = null;
  // Метод saveToLocalStorage удаляем, так как его нет в сторе
};
</script>

<style scoped>
/* Вставляем сюда ТВОИ ОРИГИНАЛЬНЫЕ стили из TodoList.vue */
.no-select {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

.main-container {
  padding: 6px;
  background: #ffffff;
  font-family: 'Iosevka Nerd Font', monospace;
}

.drag-area {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card {
  background: #ffffff;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.card-inner {
  padding: 4px 10px;
}

.item-text {
  font-size: 0.9rem;
  color: #000;
}

.completed-text {
  text-decoration: line-through;
  color: #a1a1a1;
  opacity: 0.5;
}

.is-selected {
  background: #f0f7ff;
  border-color: #3880ff;
}

.delete-card {
  background: #000;
  border: 1px solid #000;
  padding: 8px 10px;
  position: relative;
}

.delete-text {
  color: #fff;
  font-size: 0.8rem;
}

.cancel-label {
  color: #3880ff;
  font-weight: bold;
  margin-left: 10px;
}

.delete-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: #3880ff;
  width: 100%;
  animation: drain 10s linear forwards;
}

@keyframes drain {
  from {
    transform: scaleX(1);
  }

  to {
    transform: scaleX(0);
  }
}

.ghost-card {
  opacity: 0;
}
</style>
