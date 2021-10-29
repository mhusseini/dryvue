import {DryvValidationResult} from "@/dryv/index";
import DryvField from "@/dryv/DryvField";
import DryvForm from "@/dryv/DryvForm";

export default class DryvGroup {
    validated?: (validationResult?: DryvValidationResult) => void;
    validationResult?: DryvValidationResult;
    fields: Array<DryvField> = [];
    disableAutoValidate = false;

    constructor(public name: string, public form: DryvForm) {
    }

    fieldValidated(field: DryvField): void {
        const changed = this.validationResult != field?.validationResult;
        this.validationResult = field?.validationResult;

        if (!changed) {
            return;
        }

        if (this.validated) {
            this.validated(this.validationResult);
        }

        if (!this.disableAutoValidate) {
            this.validateGroupFields(field).then(() => {/* nop */
            });
        }
    }

    private async validateGroupFields(field: DryvField): Promise<void> {
        this.disableAutoValidate = true;
        try {
            await Promise.all(this.fields
                .filter(f => f !== field)
                .map((f) => f.revalidate()));
        } finally {
            this.disableAutoValidate = false;
        }
    }
}
