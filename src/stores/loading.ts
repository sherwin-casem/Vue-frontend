import { defineStore } from 'pinia'

export const useLoadingStore = defineStore('loading', {
  state: () => ({
    isRouteLoading: false
  }),
  actions: {
    start() {
      this.isRouteLoading = true
    },
    stop() {
      this.isRouteLoading = false
    }
  }
})
