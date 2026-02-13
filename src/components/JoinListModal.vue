<template>
  <ion-modal :is-open="isOpen" @didDismiss="$emit('close')" mode="ios" initial-breakpoint="0.4"
    :breakpoints="[0, 0.4, 0.7]">
    <div class="p-6 bg-white dark:bg-zinc-900 h-full font-iosevka">
      <div class="flex flex-col gap-4">
        <h2 class="text-xl font-bold dark:text-white">Присоединиться к списку</h2>
        <p class="text-sm text-zinc-500">Введите уникальный ключ доступа, чтобы получить доступ к общему списку задач.
        </p>

        <div class="relative">
          <input v-model="inviteKey" type="text" placeholder="Напр: 8A2B-X9Z1"
            class="w-full p-4 rounded-xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:border-blue-500 outline-none transition-all uppercase tracking-widest text-center font-bold"
            :disabled="isLoading" />
        </div>

        <button @click="handleJoin" :disabled="!inviteKey || isLoading"
          class="w-full p-4 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-300 disabled:opacity-50 text-white rounded-xl font-bold transition-all flex justify-center items-center gap-2 shadow-lg shadow-blue-500/20">
          <span v-if="isLoading" class="animate-spin text-xl">◌</span>
          {{ isLoading ? 'Подключение...' : 'Подключиться' }}
        </button>
      </div>
    </div>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonModal, toastController } from '@ionic/vue';
import { useTodoStore } from '../stores/todoStore';

defineProps<{ isOpen: boolean }>();
const emit = defineEmits(['close']);
const todoStore = useTodoStore();

const inviteKey = ref('');
const isLoading = ref(false);

const handleJoin = async () => {
  if (!inviteKey.value) return;
  isLoading.value = true;

  try {
    await todoStore.joinCloudList(inviteKey.value.trim());

    const toast = await toastController.create({
      message: 'Вы успешно присоединились!',
      duration: 2000,
      color: 'success',
      mode: 'ios'
    });
    await toast.present();
    emit('close');
  } catch (error: any) {
    const status = error.response?.status;
    let message = 'Произошла ошибка при подключении';

    if (status === 404) message = 'Ключ не найден. Проверьте правильность.';
    else if (status === 401) message = 'Ошибка идентификации устройства';

    const toast = await toastController.create({
      message,
      duration: 3000,
      color: 'danger',
      mode: 'ios'
    });
    await toast.present();
  } finally {
    isLoading.value = false;
  }
};
</script>
