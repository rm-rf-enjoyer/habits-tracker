<template>
  <teleport to="body">
    <transition name="fade">
      <div v-if="isOpen"
        class="fixed inset-0 flex items-center justify-center z-[1000000] p-4 bg-black/60 backdrop-blur-sm"
        @mousedown.self="handleCancel">

        <div class="w-full max-w-[310px] shadow-2xl font-mono p-4 border transition-colors duration-300
                    bg-white text-zinc-900 border-zinc-200
                    dark:bg-zinc-900 dark:text-white dark:border-zinc-800" style="border-radius: 6px !important;">

          <div class="flex flex-col items-center justify-center mb-3 text-center">
            <ion-icon :icon="notificationsOutline" class="text-blue-500 text-lg mb-1"></ion-icon>
            <h3 class="text-[9px] font-black tracking-[0.2em] uppercase opacity-60">
              Напоминание
            </h3>
          </div>

          <div class="space-y-2 mb-4">
            <div class="relative border transition-all duration-200 px-3 py-1.5
                        bg-zinc-100 border-zinc-200 focus-within:border-blue-500
                        dark:bg-zinc-800 dark:border-zinc-700 dark:focus-within:border-blue-600"
              style="border-radius: 6px !important;" :class="{ 'border-red-500/50': isPast }">

              <input :key="isOpen ? 'open' : 'closed'" type="datetime-local" v-model="selectedTime" :min="minDateTime"
                class="w-full bg-transparent border-none font-mono text-sm outline-none appearance-none
                       text-zinc-900 dark:text-white" :class="{ 'text-red-500 dark:text-red-400': isPast }" />
            </div>
            <p v-if="isPast" class="text-[9px] text-red-500 font-bold text-center leading-none italic">
              ⚠️ Время уже прошло
            </p>
          </div>

          <div class="flex flex-col gap-1.5">
            <div class="flex gap-1.5">
              <button class="flex-1 h-10 flex items-center justify-center text-[10px] font-bold uppercase transition-all
                       bg-zinc-200 text-zinc-700 active:bg-zinc-300
                       dark:bg-zinc-800 dark:text-zinc-300 dark:active:bg-zinc-700"
                style="border-radius: 6px !important;" @click="handleCancel">
                Отмена
              </button>
              <button class="flex-1 h-10 flex items-center justify-center text-[10px] font-bold text-white uppercase transition-all
                       bg-blue-600 active:bg-blue-700 disabled:opacity-30" style="border-radius: 6px !important;"
                :disabled="isPast || !selectedTime" @click="handleConfirm">
                ОК
              </button>
            </div>

            <button class="w-full h-10 flex items-center justify-center text-[10px] font-bold uppercase transition-all
                     bg-red-50 text-red-600 border border-red-100 active:bg-red-100
                     dark:bg-zinc-800/40 dark:text-red-500/70 dark:border-red-500/10 dark:active:bg-red-500/10"
              style="border-radius: 6px !important;" @click="handleClear">
              Сбросить
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue';
import { notificationsOutline } from 'ionicons/icons';
import { IonIcon } from '@ionic/vue';

const props = defineProps<{ isOpen: boolean, currentTime: string }>();
const emit = defineEmits(['close', 'confirm', 'clear']);

const selectedTime = ref('');

const toLocalISO = (dateStr: any) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
};

const minDateTime = ref(toLocalISO(null));

watch(() => props.isOpen, async (val) => {
  if (val) {
    minDateTime.value = toLocalISO(null);
    await nextTick();
    // Если в currentTime пусто, ставим текущее время
    selectedTime.value = props.currentTime ? toLocalISO(props.currentTime) : minDateTime.value;
  }
}, { immediate: true });

const isPast = computed(() => {
  if (!selectedTime.value) return false;
  if (props.currentTime && selectedTime.value === toLocalISO(props.currentTime)) return false;
  return selectedTime.value < minDateTime.value;
});

const handleConfirm = () => {
  if (!isPast.value && selectedTime.value) {
    emit('confirm', selectedTime.value);
  }
};

const handleCancel = () => {
  emit('close');
};

// ЭТА ФУНКЦИЯ ИСПРАВЛЯЕТ ПРОБЛЕМУ
const handleClear = () => {
  // Сбрасываем визуально инпут в текущее время (минимальное)
  selectedTime.value = toLocalISO(null);

  // Шлем событие родителю, чтобы он почистил Store
  emit('clear');

  // ТУТ НЕ ДОЛЖНО БЫТЬ emit('close')
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

input[type="datetime-local"] {
  color-scheme: dark;
  min-height: 1.5rem;
}

::-webkit-calendar-picker-indicator {
  filter: invert(0.7);
  cursor: pointer;
}

input[type="datetime-local"] {
  color-scheme: light dark;
}

/* Фикс инверсии иконки для темной темы */
@media (prefers-color-scheme: dark) {
  ::-webkit-calendar-picker-indicator {
    filter: invert(0.7);
  }
}
</style>
