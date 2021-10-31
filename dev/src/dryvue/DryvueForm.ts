import Vue from "vue";
import {DryvForm, DryvFormValidationResult, DryvValidationSet} from "@/dryv";
import Component from "vue-class-component";

@Component
export class DryvueForm extends Vue {
    hasErrors = false;
    hasWarnings = false;
    $dryv: {
        form: DryvForm,
        validate: (validationSet: DryvValidationSet | string, model: unknown) => Promise<DryvFormValidationResult | null>
    } = {form: undefined as any, validate: undefined as any};

    get success(): boolean {
        return !this.hasErrors && !this.hasWarnings;
    }

    created() {
        this.$dryv = {
            form: new DryvForm(),
            validate: (s, m) => validate(this, s, m)
        };
    }
}

async function validate(vueForm: DryvueForm, validationSet: DryvValidationSet | string, model: unknown): Promise<DryvFormValidationResult | null> {
    vueForm.hasErrors = false;
    vueForm.hasWarnings = false;

    const results = await vueForm.$dryv.form.validate(validationSet, model);

    vueForm.hasErrors = (results?.errors?.length ?? 0) > 0;
    vueForm.hasWarnings = (results?.warnings?.length ?? 0) > 0;

    return results;
}