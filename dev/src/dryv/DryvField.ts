import { DryvFormValidationContext, DryvRule, DryvValidationResult} from "./types";
import {DryvForm} from "./DryvForm";
import {DryvGroup} from "@/dryv/DryvGroup";
import {validate, revalidate} from "@/dryv/validation/field-validation";

export interface DryvFieldOptions {
    validated?: (field: DryvField) => void;
    debounce?: number;
    handleResult?: (context: DryvFormValidationContext, model: unknown, path: string, ruleName: string, result: DryvValidationResult) => void;
    valueOfDate?: (value: string, locale: string, format: string) => unknown;
}

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