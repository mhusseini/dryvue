import Vue from "vue";
import {DryvueFormVue} from "../dryvue";
import {DryvValidationResult} from "@/dryv";
import DryvGroup from "@/dryv/DryvGroup";

export default Vue.extend({
    props: ["name"],
    data() {
        return {
            error: undefined as string | undefined,
            warning: undefined as string | undefined,
        };
    },
    computed: {
        success(): boolean {
            return !this.error && !this.warning;
        },
    },
    mounted() {
        let parent = this.$parent as DryvueFormVue;
        while (!parent.$dryvForm) {
            if (!parent.$parent) {
                return;
            }
            parent = parent.$parent as DryvueFormVue;
        }

        const dryvForm = parent.$dryvForm;
        const dryvGroup = new DryvGroup(this.name, dryvForm);

        dryvGroup.handle = result => this.handleValidation(result);

        dryvForm.registerGroup(dryvGroup);
    },
    methods: {
        handleValidation: function (result?: DryvValidationResult) {
            switch (result?.type) {
                case "error":
                    this.error = result?.text;
                    this.warning = undefined;
                    break;
                case "warning":
                    this.error = undefined;
                    this.warning = result?.text;
                    break;
                default:
                    this.error = undefined;
                    this.warning = undefined;
                    break;
            }
            return true;
        },
    }
});
