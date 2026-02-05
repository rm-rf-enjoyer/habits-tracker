<template>
  <teleport to="body">
    <div
      class="fixed inset-0 w-screen h-screen flex items-start justify-center z-[9999999] p-4 bg-black/40 backdrop-blur-[4px]"
      @mousedown.self="$emit('close')">

      <div
        class="w-full max-w-[400px] mt-[calc(env(safe-area-inset-top,20px)+35px)] p-6 h-[350px] flex flex-col shadow-2xl font-mono bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
        style="border-radius: 6px !important;">

        <div class="mb-4 text-center">
          <h3 class="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-tight">
            НОВАЯ ПРИВЫЧКА
          </h3>
        </div>

        <div class="mb-5">
          <input ref="inputRef" :value="habitName" @input="habitName = ($event.target as HTMLInputElement).value"
            type="text" placeholder="Напр: Зарядка, Чтение..."
            class="w-full h-11 px-4 text-sm outline-none appearance-none bg-zinc-50 dark:bg-zinc-800/50 text-zinc-800 dark:text-white border border-zinc-200 dark:border-zinc-700 focus:border-blue-500 dark:focus:border-blue-600 font-mono"
            style="border-radius: 4px !important;" @keyup.enter="handleCreate" />
        </div>

        <div class="flex-1 space-y-6">
          <div class="relative flex p-1 bg-zinc-100 dark:bg-zinc-800 overflow-hidden"
            style="border-radius: 4px !important;">

            <div
              class="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-white dark:bg-zinc-700 shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              :style="{ transform: frequency === 'DAILY' ? 'translateX(0)' : 'translateX(100%)' }"
              style="border-radius: 4px !important;"></div>

            <button @click="frequency = 'DAILY'"
              class="relative z-10 flex-1 h-12 flex items-center justify-center text-[10px] font-black uppercase transition-colors duration-300 tracking-widest"
              :class="frequency === 'DAILY' ? 'text-blue-600' : 'text-zinc-400'">
              Каждый день
            </button>
            <button @click="frequency = 'WEEKLY'"
              class="relative z-10 flex-1 h-12 flex items-center justify-center text-[10px] font-black uppercase transition-colors duration-300 tracking-widest"
              :class="frequency === 'WEEKLY' ? 'text-blue-600' : 'text-zinc-400'">
              По дням
            </button>
          </div>

          <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 translate-y-2"
            enter-to-class="opacity-100 translate-y-0">
            <div v-if="frequency === 'WEEKLY'">
              <div class="flex justify-between gap-1">
                <button v-for="day in weekDaysOrder" :key="day.id" type="button" @click="toggleDay(day.id)"
                  class="w-9 h-9 flex items-center justify-center text-[10px] font-bold transition-all border" :class="selectedDays.includes(day.id)
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-400'"
                  style="border-radius: 4px !important;">
                  {{ day.label }}
                </button>
              </div>
            </div>
          </transition>
        </div>

        <div class="grid grid-cols-2 gap-3 mt-auto">
          <button type="button" @click="$emit('close')"
            class="h-11 text-[10px] font-black uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-500 active:bg-zinc-200 dark:active:bg-zinc-700"
            style="border-radius: 4px !important;">
            ОТМЕНА
          </button>
          <button type="button" @click="handleCreate" :disabled="!isFormValid"
            class="h-11 text-[10px] font-black uppercase bg-blue-600 text-white active:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-30 disabled:grayscale-[0.5]"
            style="border-radius: 4px !important;">
            СОЗДАТЬ
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'add', data: { name: string, frequency: 'DAILY' | 'WEEKLY', weekDays: number[] }): void;
}>();

const habitName = ref('');
const inputRef = ref<HTMLInputElement | null>(null);
const frequency = ref<'DAILY' | 'WEEKLY'>('DAILY');
const selectedDays = ref<number[]>([]);

/**
 * Порядок дней: Пн(1) -> Вс(0) 
 * В JS: 0 - Воскресенье, 1 - Понедельник и т.д.
 */
const weekDaysOrder = [
  { id: 1, label: 'Пн' },
  { id: 2, label: 'Вт' },
  { id: 3, label: 'Ср' },
  { id: 4, label: 'Чт' },
  { id: 5, label: 'Пт' },
  { id: 6, label: 'Сб' },
  { id: 0, label: 'Вс' },
];

const toggleDay = (id: number) => {
  if (selectedDays.value.includes(id)) {
    selectedDays.value = selectedDays.value.filter(d => d !== id);
  } else {
    selectedDays.value.push(id);
  }
};

onMounted(() => {
  // Автофокус при открытии
  setTimeout(() => inputRef.value?.focus(), 100);
});

const handleCreate = () => {
  const nameValue = habitName.value.trim();
  if (nameValue) {
    // Если DAILY — активны все дни, если WEEKLY — только выбранные
    const days = frequency.value === 'DAILY' ? [0, 1, 2, 3, 4, 5, 6] : selectedDays.value;

    emit('add', {
      name: nameValue,
      frequency: frequency.value,
      weekDays: days
    });

    emit('close');

    // Сброс состояния после закрытия
    setTimeout(() => {
      habitName.value = '';
      frequency.value = 'DAILY';
      selectedDays.value = [];
    }, 100);
  }
}

const isFormValid = computed(() => {
  const nameOk = habitName.value && habitName.value.trim().length > 0;

  if (frequency.value === 'DAILY') {
    return !!nameOk; // Превращаем в чистый boolean
  }

  return !!nameOk && selectedDays.value.length > 0;
});
</script>
