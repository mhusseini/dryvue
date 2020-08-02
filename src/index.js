import config from "./src/config";
import mixin from "./src/mixin";
import dryvGroupComponent from "./src/components/dryv-group";
import dryvSetDirective from "./src/directives/dryv-set";
import dryvDirective from "./src/directives/dryv";

export default {
    mixin,
    install(Vue, options) {
        Vue.component(config.dryvGroupTag, dryvGroupComponent(options));
        Vue.directive(config.dryvSetDirective, dryvSetDirective(options));
        Vue.directive(config.dryvFieldDirective, dryvDirective(options));
    }
};