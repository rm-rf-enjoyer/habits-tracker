<template>
  <div class="item-wrapper relative no-select iosevka-font">
    <div :style="itemStyle" :class="{ 'opacity-0 pointer-events-none': isDeleting }"
      @touchstart="$emit('touchstart', $event)" @touchend="$emit('touchend')" @touchmove="$emit('touchmove')"
      @click="$emit('click', habit)">

      <span :style="taskTextStyle">{{ habit.name }}</span>

      <div class="streak-container">
        <span class="items-count">{{ habit.currentStreak || 0 }}/{{ habit.bestStreak || 0 }}</span>
      </div>
    </div>

    <div v-if="isDeleting" class="delete-overlay-layer" @click.stop="$emit('cancel-delete', habit.id)">
      <div class="delete-progress-line"></div>
      <span class="delete-hint">ОТМЕНИТЬ УДАЛЕНИЕ</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue';
import type { Habit } from '../stores/habitStore';

const props = defineProps<{
  habit: Habit;
  isSelected: boolean;
  isDeleting: boolean;
}>();

defineEmits(['touchstart', 'touchend', 'touchmove', 'click', 'cancel-delete']);

const itemStyle = computed((): CSSProperties => ({
  border: '1px solid ' + (props.isSelected ? '#3880ff' : 'var(--border-color)'),
  borderRadius: '4px',
  padding: '6px 12px',
  backgroundColor: props.isSelected ? 'var(--selected-bg)' : 'var(--card-bg)',
  display: 'block',
  position: 'relative'
}));

const taskTextStyle = computed((): CSSProperties => {
  const isCompletedToday = props.habit.completedDays.includes(new Date().toISOString().split('T')[0]);
  return {
    textDecoration: isCompletedToday ? 'line-through' : 'none',
    color: isCompletedToday ? 'var(--text-muted)' : 'var(--text-color)',
    fontSize: '0.85rem',
    lineHeight: '1.2'
  };
});
</script>

<style scoped>
.streak-container {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
}

.items-count {
  font-size: 0.7rem;
  color: var(--text-muted);
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

.no-select {
  -webkit-touch-callout: none;
  user-select: none;
}

.iosevka-font {
  font-family: 'Iosevka', 'Iosevka NF', monospace;
}
</style>
