<template>
  <ion-fab vertical="bottom" horizontal="end" slot="fixed">
    <template v-if="currentTab === 'habits'">
      <ion-fab-button color="primary" @click="$emit('create-habit')">
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

defineProps<{ currentTab: 'tasks' | 'habits' }>();
const emit = defineEmits(['create-single', 'create-list', 'create-habit']);

const handleAction = (action: any) => {
  emit(action);
};
</script>

<style scoped>
ion-fab {
  margin-bottom: 10px;
  margin-right: 10px;
}

/* Стили для подписей к кнопкам в списке */
ion-label {
  position: absolute;
  right: 60px;
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
  color: black;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
