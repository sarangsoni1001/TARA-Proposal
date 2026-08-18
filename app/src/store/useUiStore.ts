import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  taraPanelOpen: boolean
  taraPanelTab: 'ask' | 'fill' | 'help'
  activeConversationId: string | null
  whatsNewDismissed: boolean
  openTaraPanel: (tab?: UiState['taraPanelTab']) => void
  closeTaraPanel: () => void
  setActiveConversationId: (id: string | null) => void
  dismissWhatsNew: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      taraPanelOpen: false,
      taraPanelTab: 'ask',
      activeConversationId: null,
      whatsNewDismissed: false,
      openTaraPanel: (tab) => set((s) => ({ taraPanelOpen: true, taraPanelTab: tab ?? s.taraPanelTab })),
      closeTaraPanel: () => set({ taraPanelOpen: false }),
      setActiveConversationId: (id) => set({ activeConversationId: id }),
      dismissWhatsNew: () => set({ whatsNewDismissed: true }),
    }),
    { name: 'tara-proposal-demo-ui', version: 1 },
  ),
)
