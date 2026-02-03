<template>
  <teleport to="body">
    <div v-if="isOpen"
      class="fixed inset-0 w-screen h-screen flex items-start justify-center z-[9999999] p-4 bg-black/40 backdrop-blur-[4px] font-mono"
      @mousedown.self="$emit('close')">

      <div
        class="w-full max-w-[400px] mt-[calc(env(safe-area-inset-top,20px)+35px)] p-5 flex flex-col shadow-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
        style="border-radius: 6px !important;">

        <div class="mb-3 flex items-center justify-center">
          <h3 class="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 whitespace-nowrap tracking-tight">
            НАСТРОЙКА ПРИВЫЧКИ
          </h3>
        </div>

        <div class="mb-4">
          <textarea ref="inputRef" v-model="editedHabitName" placeholder="Название..."
            class="w-full h-20 p-3 text-sm leading-relaxed outline-none transition-all resize-none appearance-none bg-zinc-50 dark:bg-zinc-800/50 text-zinc-800 dark:text-white border border-zinc-200 dark:border-zinc-700 focus:border-blue-500 dark:focus:border-blue-600 font-mono"
            style="border-radius: 6px !important;"></textarea>
        </div>

        <div class="mb-4 grid grid-cols-7 gap-1">
          <div v-for="day in lastSevenDays" :key="day.dateStr" @click="handleToggleDate(day.dateStr)" :class="[
            'flex flex-col items-center justify-center py-2 border transition-all cursor-pointer active:scale-90',
            isDayCompleted(day.dateStr)
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-transparent border-zinc-100 dark:border-zinc-800 text-zinc-400'
          ]" style="border-radius: 4px !important;">
            <span class="text-[8px] font-bold uppercase mb-0.5">{{ day.label }}</span>
            <div
              :class="['w-1 h-1 rounded-full', isDayCompleted(day.dateStr) ? 'bg-white' : 'bg-zinc-300 dark:bg-zinc-700']">
            </div>
          </div>
        </div>

        <div v-if="currentHabit?.frequency === 'WEEKLY'" class="mb-4">
          <div class="flex gap-1">
            <button v-for="(label, index) in ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']" :key="index"
              @click="toggleDayInPlan(index)" :class="[
                'flex-1 py-3 text-[9px] font-black border transition-all',
                weekDaysInternal.includes(index)
                  ? 'bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent'
                  : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700'
              ]" style="border-radius: 4px !important;">
              {{ label }}
            </button>
          </div>
        </div>

        <div class="mb-6">
          <div @click="isPausedInternal = !isPausedInternal"
            class="flex items-center justify-between p-3 border border-zinc-100 dark:border-zinc-800 cursor-pointer bg-zinc-50 dark:bg-zinc-800/20 shadow-sm transition-all active:bg-zinc-100 dark:active:bg-zinc-800/40"
            style="border-radius: 6px !important;">
            <span class="text-[9px] font-black text-zinc-400 uppercase tracking-tight">ЗАМОРОЗКА СТРИКА</span>
            <div
              :class="['w-8 h-4 transition-all relative', isPausedInternal ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700']"
              style="border-radius: 10px !important;">
              <div :class="['absolute top-1 w-2 h-2 bg-white transition-all', isPausedInternal ? 'left-5' : 'left-1']"
                style="border-radius: 50% !important;"></div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button @click="$emit('close')"
            class="h-11 text-[10px] font-bold tracking-wider uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-500 active:bg-zinc-200 dark:active:bg-zinc-700"
            style="border-radius: 6px !important;">
            ОТМЕНА
          </button>
          <button @click="handleSave"
            class="h-11 text-[10px] font-bold tracking-wider uppercase bg-blue-600 text-white active:bg-blue-700 shadow-md shadow-blue-500/20"
            style="border-radius: 6px !important;">
            СОХРАНИТЬ
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useHabitStore } from '../stores/habitStore';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const props = defineProps<{ isOpen: boolean; habitId: string | null; }>();
const emit = defineEmits(['close']);
const habitStore = useHabitStore();

const editedHabitName = ref('');
const isPausedInternal = ref(false);
const weekDaysInternal = ref<number[]>([]);
const inputRef = ref<HTMLTextAreaElement | null>(null);

// Ищем привычку в сторе
const currentHabit = computed(() => {
  if (!props.habitId) return null;
  return habitStore.habits.find(h => h.id === props.habitId) || null;
});

const isDayCompleted = (dateStr: string) => {
  return currentHabit.value?.completedDays?.includes(dateStr) || false;
};

// Генерация списка дней для сетки истории
const lastSevenDays = computed(() => {
  const days = [];
  const labels = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      dateStr: d.toISOString().split('T')[0],
      label: labels[d.getDay()]
    });
  }
  return days;
});

// Синхронизация данных при открытии модалки
watch(() => [props.isOpen, props.habitId], ([open]) => {
  if (open && currentHabit.value) {
    editedHabitName.value = currentHabit.value.name;
    isPausedInternal.value = currentHabit.value.isPaused;
    weekDaysInternal.value = [...(currentHabit.value.weekDays || [])];
  }
}, { immediate: true });

const handleToggleDate = (dateStr: string) => {
  if (!props.habitId) return;
  Haptics.impact({ style: ImpactStyle.Light });
  habitStore.toggleHabit(props.habitId, dateStr);
};

const toggleDayInPlan = (dayNum: number) => {
  const index = weekDaysInternal.value.indexOf(dayNum);
  if (index > -1) weekDaysInternal.value.splice(index, 1);
  else weekDaysInternal.value.push(dayNum);
};

const handleSave = async () => {
  if (!props.habitId) return;
  await habitStore.updateHabit(props.habitId, {
    name: editedHabitName.value.trim(),
    isPaused: isPausedInternal.value,
    weekDays: weekDaysInternal.value
  });
  emit('close');
};
</script>
