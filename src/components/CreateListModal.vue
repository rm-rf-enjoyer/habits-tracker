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

        <div class="grid grid-cols-2 gap-3">
          <button type="button" class="h-11 text-[11px] font-bold tracking-wider uppercase transition-all
                   bg-zinc-100 dark:bg-zinc-800 
                   text-zinc-500 dark:text-zinc-400
                   active:bg-zinc-200 dark:active:bg-zinc-700" style="border-radius: 6px !important;"
            @click="$emit('close')">
            ОТМЕНА
          </button>

          <button type="button" class="h-11 text-[11px] font-bold tracking-wider uppercase transition-all
                   bg-blue-600 dark:bg-blue-600 
                   text-white 
                   active:bg-blue-700 dark:active:bg-blue-700 shadow-md shadow-blue-500/20"
            style="border-radius: 6px !important;" @click="handleCreate">
            СОЗДАТЬ
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useTodoStore, type TodoItem } from '../stores/todoStore';

const emit = defineEmits(['close']);
const todoStore = useTodoStore();
const listTitle = ref('');
const inputRef = ref<HTMLTextAreaElement | null>(null);

onMounted(() => setTimeout(() => inputRef.value?.focus(), 150));

const handleCreate = () => {
  const titleValue = listTitle.value.trim();
  if (!titleValue) { emit('close'); return; }

  const newList: TodoItem = {
    id: Date.now().toString(),
    title: titleValue,
    completed: false,
    items: [],
    isCollapsed: false
  };

  todoStore.mainItems.push(newList);
  emit('close');
};
</script>

<style scoped></style>
