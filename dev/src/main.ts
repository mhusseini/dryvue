import Vue from 'vue'
import App from './App.vue'
import "./validation-rules.js"
import "./person.rules.js"
import {Dryv} from "@/dryv";
import axios from "axios";
import moment from "moment";

moment.locale("de");
moment.defaultFormat = "DD.MM.YYYY HH:mm";

Dryv.configure({
    get: (url: string, data: unknown) => axios.get(url),
    post: (url: string, data: unknown) => axios.post(url, data),
    valueOfDate(value: string | moment.Moment, locale: string, format: string): moment.Moment | undefined {
        return !value ? undefined : typeof value === "string" ? moment(value, format) : value;
    }
});

Vue.config.productionTip = false

new Vue({
    render: h => h(App),
}).$mount('#app')
