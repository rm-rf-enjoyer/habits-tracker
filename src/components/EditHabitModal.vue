<template>
  <ion-modal :is-open="isOpen" @didDismiss="$emit('close')" :initial-breakpoint="0.75" :breakpoints="[0, 0.5, 0.75, 1]">
    <ion-header>
      <ion-toolbar>
        <ion-title>Управление привычкой</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$emit('close')">Закрыть</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-item lines="none" class="custom-input-item">
        <ion-textarea ref="inputRef" v-model="editedHabitName" placeholder="Название привычки..."
          auto-grow></ion-textarea>
      </ion-item>

      <div class="section-container">
        <ion-label class="custom-label">ИСТОРИЯ И АВАНСЫ</ion-label>
        <div class="history-grid">
          <div v-for="day in lastSevenDays" :key="day.dateStr" class="day-box" :class="{
            'is-done': isDayCompleted(day.dateStr),
            'is-scheduled': weekDaysInternal.includes(day.dayNum)
          }" @click="handleToggleDate(day.dateStr)">
            <span class="day-letter">{{ day.label }}</span>
            <div class="status-indicator"></div>
          </div>
        </div>
      </div>

      <div class="section-container">
        <ion-label class="custom-label">ДНИ ВЫПОЛНЕНИЯ</ion-label>
        <div class="week-selector">
          <button v-for="(label, index) in ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']" :key="index" class="week-btn"
            :class="{ 'active': weekDaysInternal.includes(index) }" @click="toggleDayInPlan(index)">
            {{ label }}
          </button>
        </div>
      </div>

      <ion-item lines="full" class="ion-margin-top">
        <ion-label>Заморозить стрик</ion-label>
        <ion-toggle :checked="isPausedInternal" @ionChange="isPausedInternal = $event.detail.checked"></ion-toggle>
      </ion-item>

      <ion-button expand="block" class="ion-margin-top" @click="handleSave">
        Сохранить изменения
      </ion-button>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import { useHabitStore, type Habit } from '../stores/habitStore';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonButton, IonContent, IonItem, IonTextarea, IonLabel, IonToggle
} from '@ionic/vue';

const props = defineProps<{
  isOpen: boolean;
  habitId: string | null;
}>();

const emit = defineEmits(['close']);
const habitStore = useHabitStore();

const editedHabitName = ref('');
const isPausedInternal = ref(false);
const notificationTimeInternal = ref('');
const weekDaysInternal = ref<number[]>([]);
const inputRef = ref<any>(null);

const isDayCompleted = (dateStr: string) => {
  const habit = habitStore.habits.find(h => h.id === props.habitId);
  return habit?.completedDays?.includes(dateStr) || false;
};

const lastSevenDays = computed(() => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      dateStr: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('ru-RU', { weekday: 'short' }),
      dayNum: d.getDay()
    });
  }
  return days;
});

watch(() => [props.isOpen, props.habitId], ([open, id]) => {
  if (open && id) {
    const habit = habitStore.habits.find(h => h.id === id as string);
    if (habit) {
      editedHabitName.value = habit.name;
      isPausedInternal.value = habit.isPaused;
      notificationTimeInternal.value = habit.notificationTime || '';
      weekDaysInternal.value = [...(habit.weekDays || [])];
    }
    nextTick(() => { setTimeout(() => inputRef.value?.$el.querySelector('textarea')?.focus(), 150); });
  }
}, { immediate: true });

const handleToggleDate = async (dateStr: string) => {
  if (!props.habitId) return;
  await Haptics.impact({ style: ImpactStyle.Light });
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
    notificationTime: notificationTimeInternal.value,
    weekDays: weekDaysInternal.value
  });
  emit('close');
};
</script>

<style scoped>
/* Стили копируем из CreateListModal.vue / CreateTaskModal.vue */
.iosevka-font {
  font-family: 'Iosevka', 'Iosevka NF', monospace;
}

.section-container {
  margin: 20px 0;
}

.custom-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--ion-color-medium);
  letter-spacing: 0.05em;
  margin-bottom: 10px;
  display: block;
}

.history-grid {
  display: flex;
  justify-content: space-between;
  gap: 4px;
}

.day-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
  background: var(--ion-color-light);
  border-radius: 8px;
  transition: 0.2s;
}

.day-box.is-scheduled {
  border: 1px solid var(--ion-color-primary);
  background: transparent;
}

.day-box.is-done .status-indicator {
  background: var(--ion-color-primary);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 8px var(--ion-color-primary);
}

.week-selector {
  display: flex;
  justify-content: space-between;
  gap: 4px;
}

.week-btn {
  flex: 1;
  padding: 8px 0;
  border-radius: 6px;
  border: 1px solid var(--ion-color-light);
  background: white;
  font-size: 0.7rem;
}

.week-btn.active {
  background: var(--ion-color-dark);
  color: white;
}
</style>
