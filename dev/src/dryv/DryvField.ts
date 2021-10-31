import {DryvFormValidationContext, DryvRule, DryvValidationResult} from ".";
import {DryvForm} from "./DryvForm";
import {DryvGroup} from "@/dryv/DryvGroup";
import {validate, revalidate} from "@/dryv/validation/field-validation";

export class DryvField {
    isDisabled = false;
    validated?: (validationResult: DryvValidationResult | undefined) => void;
    configured?: (rules: Array<DryvRule>) => void;
    validationResult?: DryvValidationResult | undefined;
    rules: Array<DryvRule> = [];
    model?: unknown;
    validationContext?: DryvFormValidationContext;
    groups: Array<DryvGroup> = [];
    showValidationResult = true;
    debounce = 0;

    private debounceTimer = 0;

    constructor(public form: DryvForm, public path: string = "") {
        // nop
    }

    async validate(model: unknown, context: DryvFormValidationContext, stack?: Array<string>): Promise<DryvValidationResult | undefined> {
        return validate(this, model, context, stack);
    }

    async revalidate(): Promise<void> {
        if (this.debounce > 0) {
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }
            this.debounceTimer = setTimeout(async () => {
                this.debounceTimer = 0;
                await revalidate(this);
            }, this.debounce);
        } else {
            await revalidate(this);
        }
    }
}