<template>
  <teleport to="body">
    <div class="custom-modal-overlay" @mousedown.self="$emit('close')">
      <div class="custom-card iosevka-font">
        <div class="card-header">
          <h3>{{ listId ? 'НОВАЯ ПОДЗАДАЧА' : 'НОВАЯ ЗАДАЧА' }}</h3>
        </div>

        <div class="card-body">
          <textarea ref="inputRef" v-model="taskText" placeholder="Что нужно сделать?" class="simple-input"
            @keyup.enter.ctrl="handleCreate"></textarea>
        </div>

        <div class="card-footer">
          <button type="button" class="btn-cancel" @click="$emit('close')">ОТМЕНА</button>
          <button type="button" class="btn-save" @click="handleCreate">СОЗДАТЬ</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useTodoStore, type TodoItem } from '../stores/todoStore';
import { useRoute } from 'vue-router';

const props = defineProps<{ listId: string | null }>();
const emit = defineEmits(['close']);
const todoStore = useTodoStore();
const route = useRoute();

const taskText = ref('');
const inputRef = ref<HTMLTextAreaElement | null>(null);

onMounted(() => setTimeout(() => inputRef.value?.focus(), 150));

const handleCreate = () => {
  const textValue = taskText.value.trim();
  if (!textValue) { emit('close'); return; }

  const currentListId = props.listId || (route.params.id as string);

  const newTask: TodoItem = {
    id: Date.now().toString(),
    text: textValue,
    completed: false,
    isPinned: false
  };

  if (currentListId) {
    const parent = todoStore.mainItems.find(i => i.id === currentListId);
    if (parent) {
      if (!parent.items) parent.items = [];
      parent.items.push(newTask);
    }
  } else {
    todoStore.mainItems.push(newTask);
  }

  taskText.value = '';
  emit('close');
};
</script>

<style scoped>
.custom-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  /* ТОТ САМЫЙ КРАСИВЫЙ БЛЮР */
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 9999999 !important;
}

.custom-card {
  width: 92%;
  height: auto;
  max-height: 75vh;
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  /* ОТСТУП ОТ БАРА */
  margin-top: calc(env(safe-area-inset-top, 20px) + 40px);
}

h3 {
  margin: 0 0 12px 0;
  font-weight: 800;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #888;
  text-align: center;
}

.card-body {
  height: 35vh;
  display: flex;
  margin-bottom: 15px;
}

.simple-input {
  width: 100%;
  height: 100%;
  border: 1px solid #3880ff;
  /* Синяя обводка выделения */
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
  font-size: 0.85rem;
  outline: none;
  font-family: 'Iosevka', monospace;
  resize: none;
  color: #333;
  line-height: 1.4;
}

.card-footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.btn-cancel,
.btn-save {
  height: 48px;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.75rem;
  font-family: 'Iosevka', monospace;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn-cancel {
  background: #f0f0f0;
  color: #666;
}

.btn-save {
  background: #3880ff;
  color: white;
}

.iosevka-font {
  font-family: 'Iosevka', 'Iosevka NF', monospace;
}
</style>
