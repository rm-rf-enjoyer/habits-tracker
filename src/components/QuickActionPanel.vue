<template>
  <teleport to="body">
    <transition enter-active-class="transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
      enter-from-class="-translate-y-full opacity-0" enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in" leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-full opacity-0">

      <div v-if="isOpen"
        class="fixed top-0 left-0 right-0 flex justify-center z-[999999] pointer-events-none pt-[calc(env(safe-area-inset-top,20px)+25px)] font-mono">

        <div
          class="pointer-events-auto bg-black dark:bg-zinc-900 h-[52px] w-[94%] max-w-[380px] rounded-xl flex items-center justify-around shadow-[0_10px_40px_rgba(0,0,0,0.4)] border border-zinc-800">

          <button v-if="isHabit" @click.stop="$emit('action', 'edit')"
            class="flex flex-col items-center justify-center flex-1 text-white active:scale-90 transition-transform">
            <ion-icon :icon="pencilOutline" class="text-[18px]"></ion-icon>
            <span class="text-[9px] font-black mt-0.5 tracking-tighter uppercase">Edit</span>
          </button>

          <button v-else @click.stop="$emit('action', isPinned ? 'unpin' : 'pin')"
            class="flex flex-col items-center justify-center flex-1 active:scale-90 transition-all"
            :class="isPinned ? 'text-blue-400' : 'text-white'">
            <ion-icon :icon="isPinned ? bookmark : bookmarkOutline" class="text-[18px]"></ion-icon>
            <span class="text-[9px] font-black mt-0.5 tracking-tighter uppercase">
              {{ isPinned ? 'Unpin' : 'Pin' }}
            </span>
          </button>

          <button @click.stop="$emit('action', 'remind')"
            class="flex flex-col items-center justify-center flex-1 text-white active:scale-90 transition-transform">
            <ion-icon :icon="notificationsOutline" class="text-[18px]"></ion-icon>
            <span class="text-[9px] font-black mt-0.5 tracking-tighter uppercase">Notif</span>
          </button>

          <button @click.stop="$emit('action', 'delete')"
            class="flex flex-col items-center justify-center flex-1 text-red-500 active:scale-90 transition-transform">
            <ion-icon :icon="trashOutline" class="text-[18px]"></ion-icon>
            <span class="text-[9px] font-black mt-0.5 tracking-tighter uppercase">Del</span>
          </button>

          <div class="w-[1px] h-5 bg-zinc-800 mx-1"></div>

          <button @click.stop="$emit('close')"
            class="flex flex-col items-center justify-center flex-1 text-zinc-500 active:scale-90 transition-transform">
            <ion-icon :icon="closeOutline" class="text-[18px]"></ion-icon>
            <span class="text-[9px] font-black mt-0.5 tracking-tighter uppercase">Exit</span>
          </button>

        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import {
  bookmarkOutline,
  bookmark,
  notificationsOutline,
  trashOutline,
  closeOutline,
  pencilOutline
} from 'ionicons/icons';

defineProps<{
  isOpen: boolean;
  isHabit?: boolean;
  isPinned?: boolean; // Состояние первого выбранного элемента
}>();


defineEmits(['action', 'close']);
</script>
