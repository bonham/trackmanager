import { defineStore } from 'pinia'
import { ref } from 'vue'

const useSearchStore = defineStore('search', () => {

  const searchText = ref('')

  return {
    searchText
  }

})

export { useSearchStore }

