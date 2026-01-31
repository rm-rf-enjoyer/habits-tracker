<template>
  <div class="main-container no-select iosevka-font">
    <draggable v-model="habitsList" item-key="id" v-bind="dragOptions" class="drag-area" @end="onDragEnd">
      <template #item="{ element }">
        <div class="item-wrapper">

          <div v-if="habitStore.deletingIds.includes(element.id)" class="card delete-card">
            <div class="delete-content" @click.stop="habitStore.cancelDeletion(element.id)">
              <span class="delete-text"> Удаление...</span>
              <span class="cancel-label">[ОТМЕНА]</span>
            </div>
            <div class="delete-progress"></div>
          </div>

          <div v-else class="card main-card" :class="{
            'is-selected': internalSelectedId === element.id,
            'card-inactive': !(element.weekDays || []).includes(new Date().getDay())
          }" @touchstart="handleTouchStart($event, element)" @touchend="handleTouchEnd" @touchmove="handleTouchMove"
            @click="handleHabitClick(element)">
            <div class="card-inner habit-row">
              <div class="habit-content">
                <span class="item-text"
                  :class="{ 'completed-text': element.completedDays.includes(habitStore.getTodayStr()) }">
                  {{ element.name }}
                </span>
              </div>

              <div class="streak-mini">
                <span class="s-val">{{ habitStore.getStreak(element).current }}</span>
                <span class="s-divider">/</span>
                <span class="s-val best">{{ element.bestStreak || 0 }}</span>
              </div>
            </div>
          </div>

        </div>
      </template>
    </draggable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useHabitStore, type Habit } from '../stores/habitStore';
import draggable from 'vuedraggable';

const habitStore = useHabitStore();
const emit = defineEmits<{
  (e: 'selection-change', id: string | null): void;
  (e: 'open-manage', habit: Habit): void;
}>();

const internalSelectedId = ref<string | null>(null);
const touchTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const isScrolling = ref(false);

const habitsList = computed<Habit[]>({
  get: () => habitStore.habits,
  set: (val) => { habitStore.habits = val; }
});

const dragOptions = {
  animation: 200,
  delay: 400,
  delayOnTouchOnly: true,
  ghostClass: 'ghost-card',
  forceFallback: true
};

const handleTouchStart = (e: TouchEvent, element: Habit) => {
  isScrolling.value = false;
  if (touchTimer.value) clearTimeout(touchTimer.value);
  touchTimer.value = setTimeout(() => {
    if (!isScrolling.value) {
      if (window.navigator.vibrate) window.navigator.vibrate(40);
      internalSelectedId.value = element.id;
      emit('selection-change', element.id);
    }
  }, 600);
};

const handleTouchMove = () => { isScrolling.value = true; };
const handleTouchEnd = () => { if (touchTimer.value) clearTimeout(touchTimer.value); };

const handleHabitClick = (element: Habit) => {
  if (internalSelectedId.value) {
    internalSelectedId.value = null;
    emit('selection-change', null);
    return;
  }

  const todayStr = habitStore.getTodayStr();
  const dayOfWeek = new Date().getDay();
  const isScheduledForToday = (element.weekDays || []).includes(dayOfWeek);

  if (isScheduledForToday) {
    habitStore.toggleHabit(element.id, todayStr);
  } else {
    emit('open-manage', element);
  }
};

const onDragEnd = () => {
  internalSelectedId.value = null;
  emit('selection-change', null);
  habitStore.saveToStorage();
};
</script>

<style scoped>
/* СТРОГО ТВОИ ОРИГИНАЛЬНЫЕ СТИЛИ */
.no-select {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

.main-container {
  padding: 6px;
  background: #ffffff;
  min-height: 100vh;
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
  transition: background 0.2s, border-color 0.2s;
}

.card-inner {
  padding: 4px 10px;
}

.habit-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* ТО САМОЕ ВЫДЕЛЕНИЕ (Синий контур и фон) */
.is-selected {
  background: #f0f7ff !important;
  border-color: #3880ff !important;
}

.completed-text {
  text-decoration: line-through;
  color: #a1a1a1;
  opacity: 0.5;
}

.item-text {
  font-size: 0.9rem;
  color: #000;
}

/* МИНИМАЛИСТИЧНЫЕ СТРИКИ (Мелкие, серые, в ряд) */
.streak-mini {
  display: flex;
  align-items: center;
  gap: 3px;
  opacity: 0.35;
  font-family: 'Iosevka', monospace;
  white-space: nowrap;
}

.s-val {
  font-size: 0.7rem;
  color: #000;
}

.s-divider {
  font-size: 0.6rem;
  color: #ccc;
}

.best {
  color: #888;
}

/* СТИЛИ УДАЛЕНИЯ (Твои оригинальные) */
.delete-card {
  background: #000;
  border: 1px solid #000;
  padding: 8px 10px;
  position: relative;
}

.delete-content {
  display: flex;
  justify-content: space-between;
  width: 100%;
  z-index: 2;
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

.iosevka-font {
  font-family: 'Iosevka', 'Iosevka NF', monospace;
}

.card-inactive {
  opacity: 0.5;
  /* Привычка выглядит "спящей" */
  filter: grayscale(0.5);
}
</style>
