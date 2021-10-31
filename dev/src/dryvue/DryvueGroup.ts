import Vue from "vue";
import {DryvGroup, DryvValidationResult} from "@/dryv";
import Component from "vue-class-component";
import {findParentForm} from "@/dryvue/util/findParentForm";

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


    get success(): boolean {
        return !this.error && !this.warning;
    }

    mounted() {
        const dryvForm = findParentForm(this);
        if (!dryvForm) {
            return;
        }

        const dryvGroup = new DryvGroup(this.name, dryvForm);
        dryvForm.registerGroup(dryvGroup);

        dryvGroup.handle = r => handleValidation(this, r);
        this.$dryv = {group: dryvGroup};
    }
}

function handleValidation(group: DryvueGroup, result?: DryvValidationResult) {
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