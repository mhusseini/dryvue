import Vue, {VNode} from "vue";
import {DryvueFormVue} from "../dryvue";
import {DryvValidationResult} from "@/dryv";
import DryvField from "@/dryv/DryvField";
import DryvGroup from "@/dryv/DryvGroup";

export default Vue.extend({
    props: ["name"],
    data() {
        return {
            error: null as string | null | undefined,
            warning: null as string | null | undefined,
            isDirty: false,
            isValidated: false,
            $dryvGroupName: null,
            $dryvForm: null,
            $dryvGroup: null as DryvGroup | null,
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

        this.$dryvForm = dryvForm as any;
        this.$dryvGroup = dryvGroup as any;

        dryvForm.registerGroup(dryvGroup);
    }
});
