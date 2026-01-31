<template>
  <teleport to="body">
    <transition name="slide-down">
      <div v-if="isOpen" class="panel-wrapper">
        <div class="panel-body">

          <div v-if="isHabit" class="btn" @click.stop="$emit('action', 'edit')">
            <ion-icon :icon="pencilOutline"></ion-icon> <span>EDIT</span>
          </div>
          <div v-else class="btn" @click.stop="$emit('action', 'pin')">
            <ion-icon :icon="pinOutline"></ion-icon>
            <span>PIN</span>
          </div>

          <div class="btn" @click.stop="$emit('action', 'remind')">
            <ion-icon :icon="notificationsOutline"></ion-icon>
            <span>NOTIF</span>
          </div>

          <div class="btn del" @click.stop="$emit('action', 'delete')">
            <ion-icon :icon="trashOutline"></ion-icon>
            <span>DEL</span>
          </div>

          <div class="divider"></div>

          <div class="btn close" @click.stop="$emit('close')">
            <ion-icon :icon="closeOutline"></ion-icon>
            <span>EXIT</span>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import {
  pinOutline,
  notificationsOutline,
  trashOutline,
  closeOutline,
  pencilOutline // ИМПОРТИРУЕМ КАРАНДАШ
} from 'ionicons/icons';

defineProps<{
  isOpen: boolean,
  isHabit?: boolean
}>();

defineEmits(['action', 'close']);
</script>

<style scoped>
/* Стили остаются без изменений */
.panel-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  z-index: 999999;
  padding-top: calc(env(safe-area-inset-top, 20px) + 25px);
  pointer-events: none;
  font-family: 'Iosevka', 'Iosevka NF', monospace;
}

.panel-body {
  pointer-events: auto;
  background: #000000;
  height: 52px;
  width: 94%;
  max-width: 360px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  border: 1px solid #333;
}

.btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #ffffff;
  gap: 2px;
  flex: 1;
  font-family: 'Iosevka Nerd Font', monospace;
  cursor: pointer;
}

.btn ion-icon {
  font-size: 18px;
}

.btn span {
  font-size: 10px;
  font-weight: 800;
  margin-top: 2px;
}

.btn.del {
  color: #ff4961;
}

.btn.close {
  color: #888;
}

.divider {
  width: 1px;
  height: 20px;
  background: #333;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-120%);
  opacity: 0;
}
</style>
