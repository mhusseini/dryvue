import {DryvValidationResult} from "@/dryv/index";
import DryvField from "@/dryv/DryvField";
import DryvForm from "@/dryv/DryvForm";

export default class DryvGroup {
    handle?: (validationResult?: DryvValidationResult) => boolean | undefined;
    validationResult?: DryvValidationResult;
    fields: Array<DryvField> = [];
    disableAutoValidate = false;
    private lastHandled = false;

    constructor(public name: string, public form: DryvForm) {
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

        this.lastHandled = (this.handle && this.handle(this.validationResult)) ?? false;
        return this.lastHandled;

    }
}
