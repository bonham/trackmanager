import Vue from 'vue'

// import { BootstrapVue } from 'bootstrap-vue'
import { LayoutPlugin, NavbarPlugin, ButtonPlugin, LinkPlugin } from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import App from './App.vue'
import router from './router'
import store from './store'

Vue.use(LayoutPlugin)
Vue.use(NavbarPlugin)
Vue.use(ButtonPlugin)
Vue.use(LinkPlugin)

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
