<template>
  <HabitManager @open-manage="handleOpenEdit" @selection-change="handleSelection" />

  <EditHabitModal :is-open="isEditOpen" :habit-id="selectedId" @close="isEditOpen = false" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import HabitManager from './HabitManager.vue';
import EditHabitModal from './EditHabitModal.vue';
import type { Habit } from '../stores/habitStore';

const isEditOpen = ref(false);
const selectedId = ref<string | null>(null);

const handleSelection = (id: string | null) => {
  console.log('Выделен ID:', id);
  // Здесь может быть логика показа верхней панели удаления/редактирования
};

const handleOpenEdit = (habit: Habit) => {
  selectedId.value = habit.id; // Запоминаем, какую привычку редактировать
  isEditOpen.value = true;      // Показываем модалку
};
</script>
