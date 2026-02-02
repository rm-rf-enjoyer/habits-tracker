<template>
  <ion-page>
    <header
      class="bg-[var(--ion-background-color)] flex flex-col shadow-[0_4px_15px_rgba(0,0,0,0.05)] dark:shadow-none border-b border-transparent dark:border-zinc-800 relative z-[1000]">
      <div class="h-[40px]"></div>

      <div class="flex items-center justify-between px-2.5 pb-2.5 bg-[var(--ion-background-color)]">
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" :icon="chevronBack" class="--color-[#3b82f6]"></ion-back-button>
        </ion-buttons>

        <span class="text-xl font-extrabold text-[var(--ion-text-color)] font-mono tracking-tight">
          {{ currentList?.title }}
        </span>

        <div class="w-[48px]"></div>
      </div>
    </header>

    <ion-content>
      <TaskSubList v-if="currentList" :tasks="currentList.items || []"
        @update:tasks="(val) => currentList && (currentList.items = val)" />

      <UniversalFab mode="list" @add-task="showAddTask = true" />

      <CreateTaskModal v-if="showAddTask && currentList" :listId="currentList.id" @close="showAddTask = false" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
// Скрипт оставляем без изменений, он правильный
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTodoStore } from '../stores/todoStore';
import { IonPage, IonContent, IonButtons, IonBackButton } from '@ionic/vue';
import { chevronBack } from 'ionicons/icons';

import TaskSubList from '../components/TaskSubList.vue';
import CreateTaskModal from '../components/CreateTaskModal.vue';
import UniversalFab from '../components/UniversalFab.vue';

const route = useRoute();
const todoStore = useTodoStore();
const showAddTask = ref(false);

const currentList = computed(() => {
  const id = route.params.id as string;
  return todoStore.mainItems.find(l => l.id === id);
});
</script>

<style scoped>
/* Пробиваем Shadow DOM кнопки назад */
ion-back-button {
  --color: #3b82f6;
  /* Modern Blue */
}

/* Принудительно убираем стандартные фоны Ionic, если они вылезут */
ion-toolbar {
  --background: transparent;
  --border-style: none;
}
</style>
