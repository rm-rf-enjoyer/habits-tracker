<template>
  <ion-page>
    <div class="header-container">
      <div class="status-bar-spacer"></div>
      <div class="custom-top-bar-list">
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" :icon="chevronBack"></ion-back-button>
        </ion-buttons>
        <span class="list-title-text">{{ currentList?.title }}</span>
        <div style="width: 48px"></div>
      </div>
    </div>

    <ion-content>
      <TaskSubList v-if="currentList" :tasks="currentList.items || []"
        @update:tasks="(val) => currentList && (currentList.items = val)" />
      <UniversalFab mode="list" @add-task="showAddTask = true" />
      <CreateTaskModal v-if="showAddTask && currentList" :listId="currentList.id" @close="showAddTask = false" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTodoStore } from '../stores/todoStore';
import { IonPage, IonContent, IonButtons, IonBackButton } from '@ionic/vue';
import { chevronBack } from 'ionicons/icons';

import TaskSubList from '../components/TaskSubList.vue';
import CreateTaskModal from '../components/CreateTaskModal.vue';
import UniversalFab from '../components/UniversalFab.vue'; // Общая кнопка

const route = useRoute();
const todoStore = useTodoStore();
const showAddTask = ref(false);

const currentList = computed(() => {
  const id = route.params.id as string;
  return todoStore.mainItems.find(l => l.id === id);
});
</script>

<style scoped>
/* Копируем стили из HomePage для идентичности */
.header-container {
  background: #ffffff;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 1000;
}

.status-bar-spacer {
  height: 30px !important;
}

.custom-top-bar-list {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px 10px 10px;
  background: #ffffff;
}

.list-title-text {
  font-family: 'Iosevka Nerd Font', monospace;
  font-size: 1.2rem;
  font-weight: 800;
  color: #000;
}

/* Настройка кнопки назад, чтобы не ломала высоту */
ion-back-button {
  --color: #3880ff;
}
</style>
