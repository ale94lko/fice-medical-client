import { ref } from 'vue'

const open = ref(false)

export function usePortalChatPanel() {
  function openChat() {
    open.value = true
  }

  function closeChat() {
    open.value = false
  }

  return { open, openChat, closeChat }
}
