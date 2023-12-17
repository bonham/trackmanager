import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserLoginStore = defineStore('userlogin', () => {

  const loggedIn = ref(false)
  const username = ref("")

  return {
    loggedIn,
    username
  }

})

