<template>
  <ion-fab vertical="bottom" horizontal="end" slot="fixed" class="mb-6 mr-6">

    <template v-if="mode === 'habits' || mode === 'list'">
      <ion-fab-button class="custom-fab-main" :color="mode === 'habits' ? 'primary' : 'primary'"
        @click.stop="mode === 'habits' ? $emit('create-habit') : $emit('add-task')">
        <ion-icon :icon="add" class="text-3xl"></ion-icon>
      </ion-fab-button>
    </template>

    <template v-else>
      <ion-fab-button class="custom-fab-main" color="primary">
        <ion-icon :icon="add" class="main-icon text-2xl"></ion-icon>
      </ion-fab-button>

      <ion-fab-list side="top">
        <ion-fab-button class="custom-fab-sub" @click="handleAction('create-single')">
          <ion-icon :icon="documentText"></ion-icon>
        </ion-fab-button>

        <ion-fab-button class="custom-fab-sub" @click="handleAction('create-list')">
          <ion-icon :icon="folderOpen"></ion-icon>
        </ion-fab-button>
      </ion-fab-list>
    </template>
  </ion-fab>
</template>

<script setup lang="ts">
import { IonFab, IonFabButton, IonFabList, IonIcon } from '@ionic/vue';
import { add, folderOpen, documentText } from 'ionicons/icons';

defineProps<{ mode: string }>();
const emit = defineEmits(['create-single', 'create-list', 'create-habit', 'add-task']);

const handleAction = (action: any) => {
  emit(action);
};
</script>

<style scoped>
/* 1. Глобальная фиксация формы для ВСЕХ FAB кнопок в этом компоненте */
ion-fab-button {
  --border-radius: 4px !important;
  --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  /* Анимация нажатия (Ripple effect) в Ionic привязана к --border-radius, 
     но иногда нужно явно указать его для внутреннего контейнера */
}

/* 2. Пробиваем Shadow DOM для сохранения радиуса во всех состояниях */
ion-fab-button::part(native) {
  border-radius: 4px !important;
  overflow: hidden;
  /* Важно для обрезки эффекта волны (ripple) по углам */
}

/* 3. Размеры основной кнопки */
.custom-fab-main {
  width: 56px;
  height: 56px;
  margin: 0;
  --padding-start: 0;
  --padding-end: 0;
}

/* 4. Размеры и цвет подкнопок */
.custom-fab-sub {
  width: 48px;
  height: 48px;
  --background: #3b82f6;
  --color: white;
}

/* 5. Позиционирование списка */
ion-fab-list {
  margin-bottom: 60px !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}

ion-fab-list ion-fab-button {
  pointer-events: auto;
  margin: 10px 0 !important;
  transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* 6. Анимация иконки */
.main-icon {
  transition: transform 0.3s ease;
}

ion-fab.fab-opened .main-icon {
  transform: rotate(45deg);
}

/* 7. Каскадный вылет */
ion-fab.fab-opened ion-fab-button:nth-child(1) {
  transition-delay: 0.05s;
}

ion-fab.fab-opened ion-fab-button:nth-child(2) {
  transition-delay: 0s;
}
</style>
