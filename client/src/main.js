import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import { createStore } from 'vuex'
import { createPinia } from 'pinia'

import { store } from './store'

// import { BootstrapVue } from 'bootstrap-vue-next'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'
// import './assets/main.css'

const storeInstance = createStore(store)
const pinia = createPinia()
const app = createApp(App)

app.use(router)
app.use(storeInstance)
app.use(pinia)

app.mount('#app')
