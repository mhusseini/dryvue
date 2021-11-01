import Vue from "vue";
import Component from 'vue-class-component'
import {DryvField,} from "@/dryv";
import {DryvFieldOptions, DryvValidationResult} from "@/dryv/types";
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
        validate: () => Promise<void>
    } = {field: undefined as any, validate: undefined as any}
    private options?: DryvFieldOptions;

    get success(): boolean {
        return !this.error && !this.warning;
    }

    configureDryv(options: DryvFieldOptions) {
        this.options = options;
    }

    mounted(): void {
        const dryvForm = findParentForm(this);
        if (!dryvForm) {
            return;
        }

        if (!this.options) {
            this.options = {};
        }

        const callback = this.options.validated;
        this.options.validated = f => {
            onValidated(this, f.validationResult);
            if (callback) {
                callback(f);
            }
        }

        const dryvField = dryvForm.registerField(findFieldPath(this), this.options);

        dryvField.rules
            .filter(r => r.annotations)
            .map(r => r.annotations)
            .flat()
            .map(anns => anns && Object.entries(anns).map(x => ({key: x[0], value: x[1]})))
            .filter(ann => ann)
            .flat()
            .forEach(ann => ann && this.$set(this.annotations, ann.key, ann.value));

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