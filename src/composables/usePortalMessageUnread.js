import { ref } from 'vue'
import { getPortalUnreadCount } from
  'src/utils/portal-messages-api.js'

const unreadCount = ref(0)

export function usePortalMessageUnread() {
  async function refreshUnread() {
    try {
      const result = await getPortalUnreadCount()
      unreadCount.value = result.canSend
        ? result.unreadCount
        : 0
    } catch {
      unreadCount.value = 0
    }
  }

  return { unreadCount, refreshUnread }
}
