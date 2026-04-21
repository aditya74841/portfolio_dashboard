import { create } from 'zustand'

interface ProjectState {
  activeProjectId: string | null
  setActiveProject: (id: string) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  activeProjectId: null,
  setActiveProject: (id) => set({ activeProjectId: id }),
}))