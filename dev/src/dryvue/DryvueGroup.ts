import Vue from "vue";
import {DryvGroup, DryvGroupOptions} from "@/dryv";
import Component from "vue-class-component";
import {findParentForm} from "@/dryvue/util/findParentForm";
import {DryvValidationResult} from "@/dryv/types";

const DryvueGroupProps = Vue.extend({
    props: {
        name: String
    }
})

@Component
export class DryvueGroup extends DryvueGroupProps {
    error: string | undefined = "";
    warning: string | undefined = "";
    $dryv: {
        group: DryvGroup
    } = {group: {} as any}
    private options?: DryvGroupOptions;

    get success(): boolean {
        return !this.error && !this.warning;
    }

    configureDryv(options: DryvGroupOptions) {
        this.options = options;
    }

    mounted() {
        const dryvForm = findParentForm(this);
        if (!dryvForm) {
            return;
        }

        if (!this.options) {
            this.options = {};
        }

        if (!this.options.handle) {
            this.options.handle = r => DryvueGroup.handleValidation(this, r);
        }

        const dryvGroup = dryvForm.registerGroup(this.name, this.options);
        this.$dryv = {group: dryvGroup};
    }

    static handleValidation(group: DryvueGroup, result?: DryvValidationResult) {
        switch (result?.type) {
            case "error":
                group.error = result?.text;
                group.warning = undefined;
                break;
            case "warning":
                group.error = undefined;
                group.warning = result?.text;
                break;
            default:
                group.error = undefined;
                group.warning = undefined;
                break;
        }
        return true;
    }
}