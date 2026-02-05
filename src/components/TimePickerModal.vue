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
              Время уведомления
            </h3>
          </div>

          <div class="space-y-2 mb-4">
            <div class="relative border transition-all duration-200 px-3 py-2
                        bg-zinc-100 border-zinc-200 focus-within:border-blue-500
                        dark:bg-zinc-800 dark:border-zinc-700 dark:focus-within:border-blue-600"
              style="border-radius: 6px !important;">

              <input type="time" v-model="selectedTime" class="w-full bg-transparent border-none font-mono text-2xl text-center outline-none appearance-none
                       text-zinc-900 dark:text-white" />
            </div>
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
                               bg-blue-600 active:bg-blue-700 disabled:opacity-30"
                style="border-radius: 6px !important;" :disabled="!selectedTime" @click="handleConfirm">
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
import { ref, watch, nextTick } from 'vue';
import { notificationsOutline } from 'ionicons/icons';
import { IonIcon } from '@ionic/vue';

const props = defineProps<{ isOpen: boolean, currentTime: string }>();
const emit = defineEmits(['close', 'confirm', 'clear']);

const selectedTime = ref('');

// Превращает ISO дату или пустую строку в формат "HH:mm"
const formatToTime = (dateStr: string) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

watch(() => props.isOpen, async (val) => {
  if (val) {
    await nextTick();
    // Инициализируем временем из пропсов или текущим системным
    selectedTime.value = formatToTime(props.currentTime);
  }
}, { immediate: true });

const handleConfirm = () => {
  if (selectedTime.value) {
    // Создаем объект даты на сегодня и подставляем выбранное время
    const [hours, minutes] = selectedTime.value.split(':');
    const d = new Date();
    d.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Эмитим ISO строку, чтобы стор мог создать из нее объект Date
    emit('confirm', d.toISOString());
  }
};

const handleCancel = () => {
  emit('close');
};

const handleClear = () => {
  emit('clear');
};

</script>

<style scoped>
/* Убираем лишние стили инпута, оставляем только нужные */
input[type="time"]::-webkit-calendar-picker-indicator {
  display: none;
  /* Скрываем стандартную иконку часов, если мешает */
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>
