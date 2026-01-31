<template>
  <ion-fab vertical="bottom" horizontal="end" slot="fixed">

    <template v-if="mode === 'habits'">
      <ion-fab-button color="success" @click.stop="$emit('create-habit')">
        <ion-icon :icon="add"></ion-icon>
      </ion-fab-button>
    </template>

    <template v-else-if="mode === 'list'">
      <ion-fab-button color="primary" @click.stop="$emit('add-task')">
        <ion-icon :icon="add"></ion-icon>
      </ion-fab-button>
    </template>

    <template v-else>
      <ion-fab-button color="primary">
        <ion-icon :icon="add"></ion-icon>
      </ion-fab-button>

      <ion-fab-list side="top">
        <ion-fab-button @click="handleAction('create-single')" class="sub-fab">
          <ion-icon :icon="documentText"></ion-icon>
          <ion-label>Задача</ion-label>
        </ion-fab-button>
        <ion-fab-button @click="handleAction('create-list')" class="sub-fab">
          <ion-icon :icon="folderOpen"></ion-icon>
          <ion-label>Список</ion-label>
        </ion-fab-button>
      </ion-fab-list>
    </template>
  </ion-fab>
</template>

<script setup lang="ts">
import { IonFab, IonFabButton, IonFabList, IonIcon, IonLabel } from '@ionic/vue';
import { add, folderOpen, documentText } from 'ionicons/icons';

// Используем 'mode', чтобы совпадало с HomePage
defineProps<{ mode: string }>();
const emit = defineEmits(['create-single', 'create-list', 'create-habit', 'add-task']);

const handleAction = (action: any) => {
  emit(action);
};
</script>

<style scoped>
ion-fab-button {
  --overflow: visible;
  /* Позволяет меткам выходить за пределы круга */
}

/* Стили для подписей к маленьким кнопкам (FAB List) */
.sub-fab {
  position: relative;
}

ion-label {
  position: absolute;
  right: 54px;
  /* Дистанция от кнопки влево */
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.7);
  /* Темный фон для читаемости */
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 14px;
  white-space: nowrap;
  /* Чтобы текст не переносился */
  pointer-events: none;
  /* Чтобы клик проходил сквозь текст на кнопку */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

/* Убираем стандартные стили Ionic, если они мешают */
ion-fab-list ion-fab-button {
  margin: 8px 0;
}

ion-fab-button {
  position: relative;
}

.fab-label {
  position: absolute;
  right: 58px;
  /* Сдвиг влево */
  background: #ffffff;
  color: #000000;
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  white-space: nowrap;
  pointer-events: none;
  /* Чтобы клик шел на кнопку */
}
</style>
