import Vue from "vue";
import {DryvForm, DryvFormValidationResult, DryvValidationResult, DryvValidationSet} from "@/dryv";
import Component from "vue-class-component";

@Component
export class DryvueForm extends Vue {
    hasErrors = false;
    hasWarnings = false;
    $dryv: {
        form: DryvForm,
        validate: (validationSet: DryvValidationSet | string, model: unknown) => Promise<DryvFormValidationResult | null>,
        sync: (validationResults: { [path: string]: DryvValidationResult | undefined }) => boolean
    } = {form: undefined as any, validate: undefined as any, sync: undefined as any};

    get success(): boolean {
        return !this.hasErrors && !this.hasWarnings;
    }

    created() {
        this.$dryv = {
            form: new DryvForm(),
            validate: (s, m) => validate(this, s, m),
            sync: r => this.$dryv.form.setValidationResult(r)
        };
    }
}

async function validate(vueForm: DryvueForm, validationSet: DryvValidationSet | string, model: unknown): Promise<DryvFormValidationResult | null> {
    vueForm.hasErrors = false;
    vueForm.hasWarnings = false;

    const result = await vueForm.$dryv.form.validate(validationSet, model);

    vueForm.hasErrors = (result.errors?.length ?? 0) > 0;
    vueForm.hasWarnings = (result.warnings?.length ?? 0) > 0;

    return result;
}