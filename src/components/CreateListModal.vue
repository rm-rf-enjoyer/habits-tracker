<template>
  <teleport to="body">
    <div class="fixed inset-0 w-screen h-screen flex items-start justify-center z-[9999999] p-4 
                bg-black/40 backdrop-blur-[4px]" @mousedown.self="$emit('close')">

      <div class="w-full max-w-[400px] mt-[calc(env(safe-area-inset-top,20px)+35px)] 
                  p-5 flex flex-col shadow-2xl transition-all duration-300 font-mono
                  bg-white dark:bg-zinc-900 
                  border border-zinc-200 dark:border-zinc-800" style="border-radius: 6px !important;">

        <div class="mb-3">
          <h3 class="text-[10px] font-black tracking-[0.2em] text-center uppercase
                     text-zinc-400 dark:text-zinc-500">
            НОВЫЙ СПИСОК
          </h3>
        </div>

        <div class="h-[20vh] min-h-[120px] mb-4">
          <textarea ref="inputRef" v-model="listTitle" placeholder="Введите название списка..." class="w-full h-full p-3 text-sm leading-relaxed outline-none transition-all resize-none
                   appearance-none bg-zinc-50 dark:bg-zinc-800/50
                   text-zinc-800 dark:text-white
                   border border-zinc-200 dark:border-zinc-700
                   focus:border-blue-500 dark:focus:border-blue-600" style="border-radius: 6px !important;"
            @keyup.enter="handleCreate">
          </textarea>
        </div>

        <div class="mb-4">
          <button @click="isShared = !isShared"
            class="w-full h-9 flex items-center justify-between px-3 transition-all border group" :class="isShared
              ? 'border-blue-500 bg-blue-500/5 text-blue-600'
              : 'border-zinc-200 dark:border-zinc-700 text-zinc-400'" style="border-radius: 6px !important;">
            <span class="text-[9px] font-black tracking-widest uppercase">Групповой доступ</span>
            <div class="w-8 h-4 relative flex items-center">
              <div class="absolute inset-0 rounded-full transition-colors"
                :class="isShared ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'"></div>
              <div class="absolute w-3 h-3 bg-white rounded-full transition-transform shadow-sm"
                :style="{ transform: isShared ? 'translateX(18px)' : 'translateX(2px)' }"></div>
            </div>
          </button>
          <p v-if="isShared" class="text-[8px] mt-1.5 text-blue-500 opacity-70 uppercase tracking-tighter">
            * Список будет синхронизирован с сервером
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button type="button" class="h-11 text-[11px] font-bold tracking-wider uppercase transition-all
                   bg-zinc-100 dark:bg-zinc-800 
                   text-zinc-500 dark:text-zinc-400
                   active:bg-zinc-200 dark:active:bg-zinc-700" style="border-radius: 6px !important;"
            @click="$emit('close')">
            ОТМЕНА
          </button>

          <button type="button" :disabled="isLoading" class="h-11 text-[11px] font-bold tracking-wider uppercase transition-all
                   bg-blue-600 dark:bg-blue-600 
                   text-white 
                   active:bg-blue-700 dark:active:bg-blue-700 shadow-md shadow-blue-500/20
                   disabled:opacity-50 disabled:grayscale" style="border-radius: 6px !important;"
            @click="handleCreate">
            {{ isLoading ? 'СОЗДАНИЕ...' : 'СОЗДАТЬ' }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useTodoStore, type TodoItem } from '../stores/todoStore';
import { generateSafeId } from '../utils/uuid'; // Добавь импорт, если он нужен для локальных списков

const emit = defineEmits(['close']);
const todoStore = useTodoStore();

const listTitle = ref('');
const isShared = ref(false);
const isLoading = ref(false);
const inputRef = ref<HTMLTextAreaElement | null>(null);

onMounted(() => setTimeout(() => inputRef.value?.focus(), 150));

const handleCreate = async () => {
  const titleValue = listTitle.value.trim();
  if (!titleValue || isLoading.value) { // Защита от повторного нажатия
    if (!titleValue) emit('close');
    return;
  }

  isLoading.value = true;

  try {
    if (isShared.value) {
      // ГРУППОВОЙ СПИСОК:
      // Просто вызываем метод стора. Стор САМ создаст объект и запушит его в массив.
      await todoStore.createCloudList(titleValue);
    } else {
      // ЛОКАЛЬНЫЙ СПИСОК:
      // Создаем вручную и пушим, так как в сторе нет метода для простых списков
      const newList: TodoItem = {
        id: generateSafeId(),
        title: titleValue,
        completed: false,
        items: [],
        isCollapsed: false,
        isCloud: false
      };
      todoStore.mainItems.push(newList);
    }

    emit('close');
  } catch (error: any) {
    alert(`Ошибка сервера: ${error.message}`);
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};
</script>
<style scoped></style>
