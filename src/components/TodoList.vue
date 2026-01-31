<template>

  <div class="main-container no-select iosevka-font">

    <div v-if="!todoStore.isLoaded" class="loading-state">

      <ion-spinner></ion-spinner>

    </div>


    <div v-if="pinnedItems.length > 0" class="pinned-section">

      <h2 class="section-title">Закреплённые</h2>


      <draggable v-model="pinnedItems" item-key="id" v-bind="pinnedDragOptions" class="drag-area pinned-area"
        @end="onDragEnd">

        <template #item="{ element }">

          <div class="item-wrapper">

            <div v-if="todoStore.deletingIds.includes(element.id)" class="card delete-card">

              <div class="delete-content" @click="todoStore.cancelDeletion(element.id)">

                <span class="delete-text"> Удаление...</span>

                <span class="cancel-label">[ОТМЕНА]</span>

              </div>

              <div class="delete-progress"></div>

            </div>


            <div v-else class="card main-card" :class="{ 'is-selected': todoStore.selectedId === element.id }"
              @touchstart="handleTouchStart($event, element)" @touchend="handleTouchEnd" @touchmove="handleTouchMove"
              @click="handleItemClick($event, element)">

              <div class="card-inner">

                <div v-if="!element.items && !element.title" class="task-content">

                  <span class="item-text" :class="{ 'completed-text': element.completed }">{{ element.text }}</span>

                </div>

                <div v-else class="group-content">

                  <div class="group-header" @click.stop="$emit('open-list', element.id)">

                    <div class="header-left">

                      <ion-icon :icon="folderOpenOutline" class="folder-icon"></ion-icon>

                      <span class="list-title">{{ element.title }}</span>

                    </div>

                    <span class="count-tag">[{{ element.items?.length || 0 }}]</span>

                  </div>

                  <div v-if="!element.isCollapsed && element.items" class="sub-tasks-container">

                    <div v-for="sub in element.items" :key="sub.id" class="sub-item"
                      @click.stop="todoStore.toggleTask(sub.id)">

                      <span class="sub-dot">-</span>

                      <span class="sub-text" :class="{ 'completed-text': sub.completed }">{{ sub.text }}</span>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </template>

      </draggable>

    </div>


    <h2 v-if="pinnedItems.length > 0 && unpinnedItems.length > 0" class="section-title">Остальное</h2>

    <draggable v-model="unpinnedItems" item-key="id" v-bind="unpinnedDragOptions" class="drag-area" @end="onDragEnd">

      <template #item="{ element }">

        <div class="item-wrapper">

          <div v-if="todoStore.deletingIds.includes(element.id)" class="card delete-card">

            <div class="delete-content" @click="todoStore.cancelDeletion(element.id)">

              <span class="delete-text"> Удаление...</span>

              <span class="cancel-label">[ОТМЕНА]</span>

            </div>

            <div class="delete-progress"></div>

          </div>


          <div v-else class="card main-card" :class="{ 'is-selected': todoStore.selectedId === element.id }"
            @touchstart="handleTouchStart($event, element)" @touchend="handleTouchEnd" @touchmove="handleTouchMove"
            @click="handleItemClick($event, element)">

            <div class="card-inner">

              <div v-if="!element.items && !element.title" class="task-content">

                <span class="item-text" :class="{ 'completed-text': element.completed }">{{ element.text }}</span>

              </div>

              <div v-else class="group-content">

                <div class="group-header" @click.stop="$emit('open-list', element.id)">

                  <div class="header-left">

                    <ion-icon :icon="folderOpenOutline" class="folder-icon"></ion-icon>

                    <span class="list-title">{{ element.title }}</span>

                  </div>

                  <span class="count-tag">[{{ element.items?.length || 0 }}]</span>

                </div>

                <div v-if="!element.isCollapsed && element.items" class="sub-tasks-container">

                  <div v-for="sub in element.items" :key="sub.id" class="sub-item"
                    @click.stop="todoStore.toggleTask(sub.id)">

                    <span class="sub-dot">-</span>

                    <span class="sub-text" :class="{ 'completed-text': sub.completed }">{{ sub.text }}</span>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </template>

    </draggable>

  </div>

</template>


<script setup lang="ts">

import { computed, ref } from 'vue';

import { useTodoStore, type TodoItem } from '../stores/todoStore'; // Добавил импорт типа

import draggable from 'vuedraggable';

import { IonSpinner, IonIcon } from '@ionic/vue';

import { folderOpenOutline } from 'ionicons/icons';


const todoStore = useTodoStore();

const emit = defineEmits(['open-list']); // Добавил emit


// Переменные для обработки зажатия

const touchTimer = ref<ReturnType<typeof setTimeout> | null>(null);

const isScrolling = ref(false);


// ГЕТТЕРЫ И СЕТТЕРЫ ДЛЯ ДВУХ СПИСКОВ

const pinnedItems = computed({

  get: () => todoStore.mainItems.filter(i => i.isPinned),

  set: (val: TodoItem[]) => {

    todoStore.mainItems = [...val, ...todoStore.mainItems.filter(i => !i.isPinned)];

  }

});


const unpinnedItems = computed({

  get: () => todoStore.mainItems.filter(i => !i.isPinned),

  set: (val: TodoItem[]) => {

    todoStore.mainItems = [...todoStore.mainItems.filter(i => i.isPinned), ...val];

  }

});


// НАСТРОЙКИ DRAGGABLE

const pinnedDragOptions = {

  animation: 200,

  delay: 400,

  delayOnTouchOnly: true,

  group: 'pinned',

  ghostClass: 'ghost-card',

  forceFallback: true

};


const unpinnedDragOptions = {

  animation: 200,

  delay: 400,

  delayOnTouchOnly: true,

  group: 'unpinned',

  ghostClass: 'ghost-card',

  forceFallback: true

};


// ОБРАБОТЧИКИ

const handleTouchStart = (e: TouchEvent, element: TodoItem) => {

  isScrolling.value = false;

  if (touchTimer.value) clearTimeout(touchTimer.value);


  touchTimer.value = setTimeout(() => {

    if (!isScrolling.value) {

      if (window.navigator.vibrate) window.navigator.vibrate(40);

      todoStore.selectedId = element.id;

    }

  }, 600);

};


const handleTouchMove = () => {

  isScrolling.value = true;

  if (touchTimer.value) {

    clearTimeout(touchTimer.value);

    touchTimer.value = null;

  }

};


const handleTouchEnd = () => {

  if (touchTimer.value) {

    clearTimeout(touchTimer.value);

    touchTimer.value = null;

  }

};


const handleItemClick = (event: Event, element: TodoItem) => {

  if (todoStore.selectedId) {

    todoStore.selectedId = null;

    return;

  }


  if (!element.items || (element.items.length === 0 && !element.title)) {

    todoStore.toggleTask(element.id);

  } else {

    emit('open-list', element.id);

  }

};


const onDragEnd = () => {

  todoStore.selectedId = null;

};

</script>


<style scoped>
/* Твои оригинальные стили TodoList без изменений... */

.no-select {

  -webkit-touch-callout: none;

  -webkit-user-select: none;

  user-select: none;

}


.main-container {

  padding: 6px;

  background: #ffffff;

  min-height: 100vh;

  font-family: 'Iosevka Nerd Font', monospace;

}


.drag-area {

  display: flex;

  flex-direction: column;

  gap: 2px;

}


.card {

  background: #ffffff;

  border-radius: 4px;

  border: 1px solid #f0f0f0;

  transition: background 0.2s;

}


.card-inner {

  padding: 4px 10px;

}


.is-selected {

  background: #f0f7ff;

  border-color: #3880ff;

}


.completed-text {

  text-decoration: line-through;

  color: #a1a1a1;

  opacity: 0.5;

}


.item-text,

.list-title {

  font-size: 0.9rem;

  color: #000;

}


.list-title {

  font-weight: 600;

}


.group-header {

  display: flex;

  align-items: center;

  justify-content: space-between;

}


.header-left {

  display: flex;

  align-items: center;

  gap: 6px;

}


.folder-icon {

  font-size: 14px;

  color: #3880ff;

}


.folder-icon.collapsed {

  transform: rotate(-90deg);

}


.count-tag {

  font-size: 0.8rem;

  color: #3880ff;

  font-weight: bold;

}


.sub-tasks-container {

  margin-top: 2px;

  padding-left: 12px;

  border-left: 1px solid #eee;

}


.sub-item {

  display: flex;

  align-items: center;

  gap: 6px;

  padding: 2px 0;

}


.sub-dot {

  color: #ccc;

}


.sub-text {

  font-size: 0.8rem;

  color: #444;

}


.delete-card {

  background: #000;

  border: 1px solid #000;

  padding: 8px 10px;

  position: relative;

}


.delete-text {

  color: #fff;

  font-size: 0.8rem;

}


.cancel-label {

  color: #3880ff;

  font-weight: bold;

  margin-left: 10px;

}


.delete-progress {

  position: absolute;

  bottom: 0;

  left: 0;

  height: 2px;

  background: #3880ff;

  width: 100%;

  animation: drain 10s linear forwards;

}


@keyframes drain {

  from {

    transform: scaleX(1);

  }


  to {

    transform: scaleX(0);

  }

}


.ghost-card {

  opacity: 0;

}


.section-title {

  font-size: 14px;

  font-weight: 700;

  text-transform: uppercase;

  color: #888;

  margin: 20px 0 10px 16px;

  letter-spacing: 1px;

}


.pinned-card {

  border-left: 4px solid #ffca28;

  /* Золотистая пометка для закрепленных */

}


.iosevka-font {

  font-family: 'Iosevka', 'Iosevka NF', monospace;

}
</style>
