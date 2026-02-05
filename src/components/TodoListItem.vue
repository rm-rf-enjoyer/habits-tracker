<template>
  <div class="item-wrapper relative flex flex-col gap-1.5">
    <div :style="itemStyle" class="visual-card relative" @touchstart="$emit('touchstart', $event)"
      @touchend="$emit('touchend')" @touchmove="$emit('touchmove')" @click="$emit('click', $event)">

      <template v-if="!item.items && !item.title">
        <span :style="taskTextStyle">{{ item.text }}</span>
      </template>
      <template v-else>
        <div class="flex flex-col">
          <div class="flex items-center justify-between" @click.stop="handleHeaderClick">
            <div class="flex items-center gap-2">
              <div class="indicator-bar"></div>
              <span class="item-title">{{ item.title }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="items-count">{{ item.items?.length || 0 }}</span>
              <ion-icon :icon="chevronForwardOutline" class="chevron-icon"></ion-icon>
            </div>
          </div>
          <div v-if="item.items && item.items.length > 0"
            class="subtasks-preview mt-1 pl-2 border-l-2 border-zinc-100 dark:border-zinc-800 ml-0.5">
            <div v-for="subTask in item.items.slice(0, 3)" :key="subTask.id" class="flex items-center gap-1.5 h-4">
              <span :style="getSubTaskTextStyle(subTask.completed)">{{ subTask.text }}</span>
            </div>
          </div>
        </div>
      </template>

      <div v-if="isDeleting" class="delete-overlay-layer"
        style="position: absolute; inset: 0; z-index: 50; background: var(--card-bg); display: flex; align-items: center; justify-content: center;"
        @click.stop="$emit('cancel-delete', item.id)">
        <div class="delete-progress-line"></div>
        <span class="delete-hint">ОТМЕНИТЬ УДАЛЕНИЕ</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue';
import { IonIcon } from '@ionic/vue';
import { chevronForwardOutline } from 'ionicons/icons';
// Импортируем тип с префиксом type, чтобы не было конфликта с названием компонента
import type { TodoItem } from '../stores/todoStore';
import { useTodoStore } from '../stores/todoStore';

const props = defineProps<{
  item: TodoItem;
  isSelected: boolean;
  isDeleting: boolean;
  isSelectionModeActive: boolean;
}>();

const todoStore = useTodoStore();

const emit = defineEmits<{
  (e: 'touchstart', event: TouchEvent): void;
  (e: 'touchend'): void;
  (e: 'touchmove'): void;
  (e: 'click', event: MouseEvent): void;
  (e: 'open-list', id: string): void;
  (e: 'cancel-delete', id: string): void;
}>();

const itemStyle = computed((): CSSProperties => {
  // ОШИБКА 1: Было .emultiSelectedIds (лишняя буква 'e')
  // ОШИБКА 2: Убедись, что todoStore импортирован и инициализирован в этом компоненте
  const isSelected = props.isSelected || todoStore.multiSelectedIds.includes(props.item.id);

  const activeBorder = '#3880ff';
  const normalBorder = 'var(--border-color, #e4e4e7)';
  const bgSelected = 'rgba(56, 128, 255, 0.12)';
  const bgNormal = 'var(--card-bg, transparent)';

  return {
    display: 'block',
    position: 'relative',
    padding: '8px 12px',
    borderRadius: '8px',
    border: `1.5px solid ${isSelected ? activeBorder : normalBorder}`,
    backgroundColor: isSelected ? bgSelected : bgNormal,
    boxShadow: isSelected
      ? '0 4px 12px rgba(56, 128, 255, 0.15)'
      : 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    // В JS/TS свойства с дефисом пишутся в camelCase или в кавычках
    WebkitTapHighlightColor: 'transparent'
  };
});

const taskTextStyle = computed((): CSSProperties => ({
  textDecoration: props.item.completed ? 'line-through' : 'none',
  color: props.item.completed ? 'var(--text-muted)' : 'var(--text-color)',
  fontSize: '0.85rem',
  lineHeight: '1.2'
}));

const getSubTaskTextStyle = (completed: boolean): CSSProperties => ({
  fontSize: '0.75rem',
  lineHeight: '1.3',
  color: completed ? 'var(--text-muted)' : 'var(--text-color)',
  textDecoration: completed ? 'line-through' : 'none',
  opacity: completed ? 0.5 : 0.9
});

const handleHeaderClick = (event: MouseEvent) => {
  if (props.isSelectionModeActive) {
    // В режиме выбора header-click не должен делать ничего особенного,
    // пусть событие всплывает к родителю
    return;
  }

  if (!props.isDeleting) {
    // ОСТАНАВЛИВАЕМ всплытие только если мы НЕ в режиме выбора
    // чтобы не сработал toggleTask
    event.stopPropagation();
    emit('open-list', props.item.id);
  }
};


</script>

<style scoped>
.indicator-bar {
  width: 2px;
  height: 12px;
  background-color: #3880ff;
  border-radius: 1px;
}

.item-title {
  font-weight: 500;
  font-size: 0.9rem;
  color: var(--text-color);
}

.items-count {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.chevron-icon {
  font-size: 10px;
  color: var(--text-muted);
  opacity: 0.4;
}

.subtasks-container {
  margin-top: 2px;
  margin-left: 2px;
  padding-left: 8px;
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.subtask-dash {
  font-size: 0.75rem;
  color: var(--text-muted);
  opacity: 0.5;
}

.delete-overlay-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--border-color);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.delete-progress-line {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: #3880ff;
  opacity: 0.15;
  width: 100%;
  transform-origin: left;
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

.delete-hint {
  position: relative;
  z-index: 20;
  font-size: 9px;
  font-weight: 800;
  color: var(--text-color);
  opacity: 0.6;
}

.item-wrapper {
  --card-bg: #ffffff;
  --text-color: #1a1a1a;
  --text-muted: #8e8e93;
  --border-color: #f2f2f7;
  --selected-bg: #f5f9ff;
}

@media (prefers-color-scheme: dark) {
  .item-wrapper {
    --card-bg: #121212;
    --text-color: #efefef;
    --text-muted: #636366;
    --border-color: #1c1c1e;
    --selected-bg: #161c2c;
  }
}
</style>
