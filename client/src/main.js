import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// import { BootstrapVue } from 'bootstrap-vue'
import { LayoutPlugin, NavbarPlugin, ButtonPlugin, LinkPlugin, ModalPlugin } from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
// import './assets/main.css'

const app = createApp(App)

app.use(LayoutPlugin)
app.use(NavbarPlugin)
app.use(router)
app.use(store)
app.use(ButtonPlugin)
app.use(LinkPlugin)
app.use(ModalPlugin)

app.mount('#app')
