import {DryvFieldOptions, DryvFormValidationContext, DryvRule, DryvValidationResult} from ".";
import {DryvForm} from "./DryvForm";
import {DryvGroup} from "@/dryv/DryvGroup";
import {validate, revalidate} from "@/dryv/validation/field-validation";

export class DryvField {
    isDisabled = false;
    validationResult?: DryvValidationResult | undefined;
    rules: Array<DryvRule> = [];
    model?: unknown;
    validationContext?: DryvFormValidationContext;
    groups: Array<DryvGroup> = [];
    showValidationResult = true;

    private debounceTimer = 0;
    private validationRun = 0;

    constructor(public form: DryvForm, public path: string, public options: DryvFieldOptions) {
        // nop
    }

    async validate(model: unknown, context: DryvFormValidationContext, stack?: Array<string>): Promise<void> {
        await validate(this, model, context, stack);
    }

    async revalidate(): Promise<void> {
        if (this.options.debounce) {
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }
            this.debounceTimer = setTimeout(async () => {
                this.debounceTimer = 0;
                await revalidate(this);
            }, this.options.debounce);
        } else {
            await revalidate(this);
        }
    }

    setValidationResult(validationResult: DryvValidationResult | undefined) {
        this.validationResult = validationResult;
        this.showValidationResult = !this.form.fieldValidated(this);

        if (this.options.validated) {
            this.options.validated(this);
        }
    }
}