<script setup lang="ts">
import { ref, onMounted } from 'vue';

// Определяем события: закрытие и передача объекта привычки
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'add', data: { name: string, frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' }): void;
}>();

const habitName = ref('');
const inputRef = ref<HTMLInputElement | null>(null);
const frequency = ref<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
const selectedDays = ref<number[]>([]);

const toggleDay = (index: number) => {
  if (selectedDays.value.includes(index)) {
    selectedDays.value = selectedDays.value.filter(d => d !== index);
  } else {
    selectedDays.value.push(index);
  }
};

onMounted(() => {
  // Автофокус при открытии модалки
  setTimeout(() => {
    inputRef.value?.focus();
  }, 100);
});

const handleCreate = () => {
  const nameValue = habitName.value.trim();
  if (nameValue) {
    emit('add', { name: nameValue, frequency: frequency.value }); // Отправили данные
    emit('close'); // Сразу закрываем
    // Очистку можно сделать в setTimeout или оставить на совести жизненного цикла
    setTimeout(() => { habitName.value = ''; frequency.value = 'DAILY'; }, 100);
  }
}

</script>

<template>
  <div class="custom-modal-overlay" @click.self="$emit('close')">
    <div class="custom-card">
      <div class="card-header">
        <h3>Новая привычка</h3>
      </div>

      <div class="card-body">
        <input ref="inputRef" v-model="habitName" type="text" placeholder="Напр: Зарядка, Чтение..."
          class="simple-input" @keyup.enter="handleCreate" />
      </div>

      <div class="option-row">
        <label class="option-label">ПОВТОРЕНИЕ</label>
        <select v-model="frequency" class="custom-select iosevka-font">
          <option value="DAILY">Каждый день</option>
          <option value="WEEKLY">Раз в неделю</option>
          <option value="MONTHLY">Раз в месяц</option>
        </select>
      </div>

      <div v-if="frequency === 'WEEKLY'" class="option-row">
        <label class="option-label">ДНИ ВЫПОЛНЕНИЯ</label>
        <div class="weekdays-grid">
          <button v-for="(day, index) in ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']" :key="index" type="button"
            class="day-circle" :class="{ 'active': selectedDays.includes(index) }" @click="toggleDay(index)">
            {{ day }}
          </button>
        </div>
      </div>

      <div class="card-footer">
        <button type="button" class="btn-cancel" @click="$emit('close')">
          Отмена
        </button>
        <button type="button" class="btn-save" @click="handleCreate">
          Создать
        </button>
      </div>
    </div>
  </div>

</template>

<style scoped>
.custom-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  /* Используйте vw/vh для гарантии */
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999 !important;
  /* Максимальный приоритет */
}


.custom-card {
  width: 90%;
  max-width: 400px;
  background: #fff;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  margin-bottom: 120px;
}

h3 {
  margin: 0 0 12px 0;
  font-weight: 800;
  font-size: 0.9rem;
  text-transform: uppercase;
}

.simple-input {
  width: 100%;
  height: 50px;
  border: 1px solid #eee;
  background: #f5f5f5;
  border-radius: 12px;
  padding: 0 12px;
  font-size: 1.1rem;
  outline: none;
}

.card-footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 20px;
}

.btn-cancel,
.btn-save {
  height: 50px;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
}

.btn-cancel {
  background: #f0f0f0;
  color: #666;
}

.btn-save {
  background: #3880ff;
  color: white;
}

.weekdays-grid {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  gap: 4px;
}

.day-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #1a1a1a;
  border: 1px solid #333;
  color: #666;
  font-size: 11px;
  font-family: 'Iosevka', monospace;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-circle.active {
  background: #3880ff;
  color: white;
  border-color: #4c8dff;
  box-shadow: 0 0 12px rgba(56, 128, 255, 0.3);
}
</style>
