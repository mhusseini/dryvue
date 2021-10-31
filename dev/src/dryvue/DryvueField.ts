import Vue from "vue";
import Component from 'vue-class-component'
import {DryvField, DryvRule, DryvValidationResult} from "@/dryv";
import {findParentForm} from "@/dryvue/util/findParentForm";
import {findFieldPath} from "@/dryvue/util/findFieldPath";

@Component
export class DryvueField extends Vue {
    error: string | undefined = "";
    warning: string | undefined = "";
    isValidated = false;
    showValidationResult = true;
    annotations: { [name: string]: any } = {};
    $dryv: {
        field: DryvField,
        validate: () => Promise<DryvValidationResult | undefined>
    } = {field: undefined as any, validate: undefined as any}

    get success(): boolean {
        return !this.error && !this.warning;
    }

    mounted(): void {
        const dryvForm = findParentForm(this);
        if (!dryvForm) {
            return;
        }

        const dryvField = new DryvField(dryvForm);

        dryvField.path = findFieldPath(this);
        dryvField.validated = r => onValidated(this, r);
        dryvField.configured = r => onConfigured(this, r);
        
        dryvForm.registerField(dryvField);

        this.$dryv = {
            field: dryvField,
            validate: () => dryvField.revalidate()
        };
    }
}


function onValidated(vueField: DryvueField, result: DryvValidationResult | undefined): void {
    vueField.error = undefined;
    vueField.warning = undefined;
    vueField.isValidated = true;
    vueField.showValidationResult = vueField.$dryv?.field.showValidationResult !== false;

    if (!result) {
        return;
    }

    if (result.type === "error") {
        vueField.error = result.text;
    } else if (result.type === "warning") {
        vueField.warning = result.text;
    }
}

function onConfigured(vueField: DryvueField, rules: Array<DryvRule>) {
    vueField.annotations = {};
    rules
        .filter(r => (r.annotations?.length ?? 0) > 0)
        .map(r => r.annotations)
        .flat()
        .map(anns => anns && Object.entries(anns).map(x => ({key: x[0], value: x[1]})))
        .filter(ann => ann)
        .flat()
        .forEach(ann => ann && (vueField.annotations[ann.key] = vueField.annotations[ann.value]));
}