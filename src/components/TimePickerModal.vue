<template>
  <teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @mousedown.self="$emit('close')">
      <div class="time-card iosevka-font">
        <div class="time-header">
          <ion-icon :icon="notificationsOutline" class="header-icon"></ion-icon>
          <h3>REMINDER</h3>
        </div>

        <div class="time-body">
          <p class="time-desc">Установите дату и время</p>

          <div class="input-wrapper">
            <input type="datetime-local" v-model="selectedTime" :min="minDateTime" class="custom-time-input"
              :class="{ 'input-error': isPast }" />
          </div>

          <p v-if="isPast" class="error-text">Дата уже прошла</p>
        </div>

        <div class="time-footer">
          <button class="btn-clear" @click="$emit('clear')">СБРОСИТЬ</button>
          <div class="main-btns">
            <button class="btn-cancel" @click="$emit('close')">ОТМЕНА</button>
            <button class="btn-confirm" :disabled="isPast || !selectedTime" @click="handleConfirm">OK</button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { notificationsOutline } from 'ionicons/icons';
import { IonIcon } from '@ionic/vue';

const props = defineProps<{ isOpen: boolean, currentTime: string }>();
const emit = defineEmits(['close', 'confirm', 'clear']);

const selectedTime = ref('');

const getNowString = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

const minDateTime = ref(getNowString());

watch(() => props.isOpen, (open) => {
  if (open) {
    minDateTime.value = getNowString();
    selectedTime.value = props.currentTime || minDateTime.value;
  }
});

const isPast = computed(() => {
  if (!selectedTime.value) return false;
  return selectedTime.value < minDateTime.value;
});

const handleConfirm = () => {
  if (!isPast.value) emit('confirm', selectedTime.value);
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000000;
  backdrop-filter: blur(8px);
}

.time-card {
  background: #121212;
  /* Темная тема в стиле Iosevka */
  width: 90%;
  max-width: 300px;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 16px;
  color: #fff;
  font-family: 'Iosevka', 'Iosevka NF', monospace;
}

.time-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.time-header h3 {
  margin: 0;
  font-size: 14px;
  letter-spacing: 2px;
  font-weight: 800;
}

.header-icon {
  color: #3880ff;
  font-size: 18px;
}

.time-desc {
  font-size: 11px;
  color: #888;
  margin-bottom: 12px;
  text-transform: uppercase;
}

.input-wrapper {
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 8px;
}

.custom-time-input {
  width: 100%;
  background: transparent;
  border: none;
  color: #fff;
  font-family: 'Iosevka', monospace;
  font-size: 16px;
  /* Оптимальный размер, чтобы не "вылезало" */
  outline: none;
  appearance: none;
  /* Убираем стандартные иконки в некоторых браузерах */
}

/* Стилизация календаря для Webkit браузеров */
::-webkit-calendar-picker-indicator {
  filter: invert(1);
  /* Делаем иконку календаря белой */
  cursor: pointer;
}

.time-footer {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.main-btns {
  display: flex;
  gap: 8px;
}

button {
  font-family: 'Iosevka', monospace;
  font-size: 11px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.btn-clear {
  background: transparent;
  color: #ff4961;
  padding-left: 0;
}

.btn-cancel {
  background: #333;
  color: #fff;
}

.btn-confirm {
  background: #3880ff;
  color: #fff;
}

.btn-confirm:disabled {
  background: #222;
  color: #555;
  cursor: not-allowed;
}

.error-text {
  color: #ff4961;
  font-size: 10px;
  margin-top: 6px;
}

.input-error {
  color: #ff4961;
}
</style>
