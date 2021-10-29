import Vue from 'vue'
import App from './App.vue'
import "./validation-rules.js"
import {Dryv} from "@/dryv";

Dryv.configure({});

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
