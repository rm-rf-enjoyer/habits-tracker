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
            {{ listId ? 'НОВАЯ ПОДЗАДАЧА' : 'НОВАЯ ЗАДАЧА' }}
          </h3>
        </div>

        <div class="h-[20vh] min-h-[120px] mb-4">
          <textarea ref="inputRef" v-model="taskText" placeholder="Что нужно сделать?" class="w-full h-full p-3 text-sm leading-relaxed outline-none transition-all resize-none
                   appearance-none bg-zinc-50 dark:bg-zinc-800/50
                   text-zinc-800 dark:text-white
                   border border-zinc-200 dark:border-zinc-700
                   focus:border-blue-500 dark:focus:border-blue-600" style="border-radius: 6px !important;"
            @keyup.enter.ctrl="handleCreate">
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
import { useTodoStore } from '../stores/todoStore';
import { useRoute } from 'vue-router';

const props = defineProps<{ listId: string | null }>();
const emit = defineEmits(['close']);
const todoStore = useTodoStore();
const route = useRoute();

const taskText = ref('');
const inputRef = ref<HTMLTextAreaElement | null>(null);

onMounted(() => setTimeout(() => inputRef.value?.focus(), 150));

const handleCreate = async () => {
  const textValue = taskText.value.trim();

  // Если текста нет — просто закрываем
  if (!textValue) {
    emit('close');
    return;
  }

  // Определяем ID родительского списка (из пропсов или из URL)
  const currentListId = props.listId || (route.params.id as string) || null;

  try {
    // ВАЖНО: Вызываем метод из стора, который умеет работать с API
    // Мы передаем ID списка и текст. Стор сам решит, слать это в облако или нет.
    await todoStore.addTask(currentListId, textValue);

    console.log("✅ Задача обработана стором");
  } catch (e) {
    console.error("❌ Ошибка при создании задачи:", e);
  }

  // Очищаем и закрываем
  taskText.value = '';
  emit('close');
};
</script>
<style scoped></style>
