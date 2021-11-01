import { DryvValidationResult} from "@/dryv//types";
import {DryvField} from "@/dryv/DryvField";
import {DryvForm} from "@/dryv/DryvForm";

export interface DryvGroupOptions {
    handle?: (validationResult?: DryvValidationResult) => boolean | undefined;
    validated?: (validationResult?: DryvValidationResult) => void;
}

export class DryvGroup {
    validationResult?: DryvValidationResult;
    fields: Array<DryvField> = [];
    disableAutoValidate = false;
    private lastHandled = false;

    constructor(public form: DryvForm, public name: string, public options: DryvGroupOptions) {
    }

    fieldValidated(field?: DryvField): boolean {
        const result = field?.validationResult?.group === this.name
            ? field?.validationResult
            : undefined;

        const changed = this.validationResult != result;
        if (!changed) {
            return this.lastHandled;
        }

        this.validationResult = result;

        this.lastHandled = (this.options.handle && this.options.handle(this.validationResult)) ?? false;
        
        if (this.options.validated) {
            this.options.validated(this.validationResult);
        }
        
        return this.lastHandled;

    }
}
