<template>
  <ion-fab vertical="bottom" horizontal="end" slot="fixed" class="mb-6 mr-6">

    <template v-if="mode === 'habits' || mode === 'list'">
      <ion-fab-button class="custom-fab-main" color="primary"
        @click.stop="mode === 'habits' ? $emit('create-habit') : $emit('add-task')">
        <ion-icon :icon="add" class="text-3xl"></ion-icon>
      </ion-fab-button>
    </template>

    <template v-else>
      <ion-fab-button class="custom-fab-main" color="primary">
        <ion-icon :icon="add" class="main-icon text-2xl"></ion-icon>
      </ion-fab-button>

      <ion-fab-list side="top">
        <ion-fab-button class="custom-fab-sub !--background-[#10b981]" @click="handleAction('join-list')">
          <ion-icon :icon="keyOutline"></ion-icon>
        </ion-fab-button>

        <ion-fab-button class="custom-fab-sub" @click="handleAction('create-list')">
          <ion-icon :icon="folderOpen"></ion-icon>
        </ion-fab-button>

        <ion-fab-button class="custom-fab-sub" @click="handleAction('create-single')">
          <ion-icon :icon="documentText"></ion-icon>
        </ion-fab-button>
      </ion-fab-list>
    </template>
  </ion-fab>
</template>

<script setup lang="ts">
import { IonFab, IonFabButton, IonFabList, IonIcon } from '@ionic/vue';
import { add, folderOpen, documentText, keyOutline } from 'ionicons/icons';

defineProps<{ mode: string }>();
// Добавили join-list в эмиты
const emit = defineEmits(['create-single', 'create-list', 'create-habit', 'add-task', 'join-list']);

const handleAction = (action: any) => {
  emit(action);
};
</script>

<style scoped>
ion-fab-button {
  --border-radius: 4px !important;
  --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

ion-fab-button::part(native) {
  border-radius: 4px !important;
  overflow: hidden;
}

.custom-fab-main {
  width: 56px;
  height: 56px;
  margin: 0;
}

.custom-fab-sub {
  width: 48px;
  height: 48px;
  --background: #3b82f6;
  --color: white;
}

/* Специфичный цвет для кнопки ключа (Emerald) */
.--background-\[\#10b981\] {
  --background: #10b981;
}

ion-fab-list {
  margin-bottom: 60px !important;
  display: flex;
  flex-direction: column;
  align-items: center;
}

ion-fab-list ion-fab-button {
  margin: 10px 0 !important;
  transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.main-icon {
  transition: transform 0.3s ease;
}

ion-fab.fab-opened .main-icon {
  transform: rotate(45deg);
}

/* Каскад для 3 кнопок */
ion-fab.fab-opened ion-fab-button:nth-child(1) {
  transition-delay: 0.1s;
}

ion-fab.fab-opened ion-fab-button:nth-child(2) {
  transition-delay: 0.05s;
}

ion-fab.fab-opened ion-fab-button:nth-child(3) {
  transition-delay: 0s;
}
</style>
