<template>
  <div class="min-h-screen p-2 bg-white dark:bg-zinc-950 font-iosevka select-none transition-colors duration-300">



    <HabitEditModal :is-open="isEditModalOpen" :habit-id="internalSelectedId" @close="isEditModalOpen = false" />

    <draggable v-model="habitsList" item-key="id" v-bind="dragOptions" class="flex flex-col gap-1.5" @end="onDragEnd">
      <template #item="{ element }">
        <HabitItem :habit="element" :is-selected="internalSelectedId === element.id"
          :is-deleting="habitStore.deletingIds.includes(element.id)" @touchstart="handleTouchStart(element)"
          @touchend="handleTouchEnd" @touchmove="handleTouchMove" @click="handleHabitClick(element)"
          @cancel-delete="id => habitStore.cancelDeletion(id)" />
      </template>
    </draggable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useHabitStore, type Habit } from '../stores/habitStore';
import draggable from 'vuedraggable';
import HabitItem from './HabitItem.vue';
import HabitEditModal from './EditHabitModal.vue';

const habitStore = useHabitStore();
const emit = defineEmits(['selection-change', 'open-manage', 'action']);
const internalSelectedId = ref<string | null>(null);
const touchTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const isScrolling = ref(false);
const isEditModalOpen = ref(false);

// Работаем со списком из стора
const habitsList = computed<Habit[]>({
  get: () => habitStore.habits,
  set: (val) => { habitStore.habits = val; }
});

// Настройки драг-н-дропа (копия из TodoListPage)
const dragOptions = {
  animation: 200,
  delay: 400,
  delayOnTouchOnly: true,
  ghostClass: 'opacity-0',
  forceFallback: true
};

// Логика выделения (Long Press) — копия из TodoListPage
const handleTouchStart = (element: Habit) => {
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

const handleTouchMove = () => {
  isScrolling.value = true;
  if (touchTimer.value) { clearTimeout(touchTimer.value); touchTimer.value = null; }
};

const handleTouchEnd = () => {
  if (touchTimer.value) { clearTimeout(touchTimer.value); touchTimer.value = null; }
};

// Клик по привычке
const handleHabitClick = (element: Habit) => {
  if (internalSelectedId.value) {
    internalSelectedId.value = null;
    emit('selection-change', null);
    return;
  }

  // Убираем проверку на "сегодняшний день" для теста. 
  // Если нажали — значит хотим отметить!
  const todayStr = habitStore.getTodayStr();
  habitStore.toggleHabit(element.id, todayStr);
};

const onDragEnd = () => {
  internalSelectedId.value = null;
  emit('selection-change', null);
  habitStore.saveToStorage();
};
</script>

<style scoped>
/* Шрифт подтягиваем как в TodoListPage */
.font-iosevka {
  font-family: 'Iosevka', 'Iosevka NF', monospace;
}

/* Убираем все лишние отступы, которые могли конфликтовать */
:deep(.sortable-ghost) {
  opacity: 0;
}
</style>
