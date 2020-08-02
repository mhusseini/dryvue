import config from "./config";
import mixin from "./mixin";
import dryvGroupComponent from "./components/dryv-group";
import dryvSetDirective from "./directives/dryv-set";
import dryvFieldDirective from "./directives/dryv-field";

export default {
    mixin,
    install(Vue, options) {
        Vue.component(config.dryvGroupTag, dryvGroupComponent(options));
        Vue.directive(config.dryvSetDirective, dryvSetDirective(options));
        Vue.directive(config.dryvFieldDirective, dryvFieldDirective(options));
    }
};