import {DryvValidationResult, DryvValidationSet} from "./index";
import {DryvFormValidationContext, DryvFormValidationResult} from ".";
import {windowDryvValidationSetProvider} from "./DryvValidationSetProvider";
import {DryvField} from "@/dryv/DryvField";
import {DryvGroup} from "@/dryv/DryvGroup";
import {validate} from "@/dryv/validation/form-validation";
import {calculateHash} from "@/dryv/util/calculateHash";

export class DryvForm {
    private disableRecalculation = false;
    // noinspection JSUnusedLocalSymbols
    private contextCount = 0;
    model: unknown;
    fields: { [path: string]: DryvField };
    groups: { [name: string]: DryvGroup } = {};
    validationContext?: DryvFormValidationContext = undefined;
    validationSet?: DryvValidationSet;
    errors?: Array<DryvField>;
    warnings?: Array<DryvField>;
    warningHash?: number;
    errorHash?: number;

    get success(): boolean {
        return !(this.errors?.length) && !(this.warnings?.length)
    }

    //private entryFields: DryvField[] = [];
    private lastHandled = false;

    constructor(...fields: Array<string>) {
        this.fields = {};
        fields.forEach(path => this.registerField(new DryvField(this, path)))
    }

    registerField(field: DryvField): DryvField {
        return this.fields[field.path] = field;
    }

    registerGroup(group: DryvGroup): DryvGroup {
        return this.groups[group.name] = group;
    }

    /**
     * Invoked by fields to inform the form that the field was validated.
     * @param field The field that was validated.
     * @returns true when the form handles the validateion result. When false, the field is responsible to handle (e.g. display) the validation result.
     */
    fieldValidated(field: DryvField): boolean {
        let handled = false;
        const groupName = field.validationResult?.group;
        if (groupName) {
            const group = this.groups[groupName];
            if (group) {
                if (this.validationContext) {
                    this.validationContext.groupResults[groupName] = field.validationResult as DryvValidationResult;
                }
                handled = group.fieldValidated(field)
            }
        }

        // reset groups.
        field.groups
            .filter(group => group.validationResult && this.validationContext && !this.validationContext.groupResults[group.name])
            .forEach(group => group.fieldValidated());

        this.lastHandled = handled;
        return handled;
    }

    async validate(
        validationSetInput: DryvValidationSet | string,
        model: unknown
    ): Promise<DryvFormValidationResult> {
        const validationSet = DryvForm.findValidationSet(validationSetInput);
        if (!validationSet) {
            return {success: true};
        }

        if (this.validationSet !== validationSet) {
            this.registerValidationSet(validationSet);
        }

        this.model = model;
        this.disableRecalculation = true;

        try {
            await validate(this, model);
        } finally {
            this.disableRecalculation = false;
        }

        const fields = Object.values(this.fields);
        this.errors = fields.filter(field => field.validationResult?.type === "error");
        this.warnings = fields.filter(field => field.validationResult?.type === "warning");
        this.warningHash = calculateHash(this.warnings.map(w => w.path + "|" + w.validationResult?.text).join("|"));
        this.errorHash = calculateHash(this.errors.map(w => w.path + "|" + w.validationResult?.text).join("|"));

        return {
            errors: this.errors,
            warnings: this.warnings,
            success: this.success,
            warningHash: this.warningHash,
            errorHash: this.errorHash
        };
    }

    setValidationResult(validationResults: { [path: string]: DryvValidationResult | undefined }): boolean {
        Object.entries(validationResults)
            .forEach(entry => {
                    const field = this.fields[entry[0]];
                    if (!field) {
                        return;
                    }

                    field.setValidationResult(entry[1]);
                }
            )

        return this.success;
    }

    registerValidationSet(validationSet: DryvValidationSet) {
        this.registerFieldsWithGroups(validationSet);
        this.registerRulesWithFields(validationSet);

        this.validationSet = validationSet;

        Object
            .values(this.fields)
            .forEach(field => field.configured && field.configured(field.rules));
    }

    /**
     Map fields to groups, depending the validation set.
     @param validationSet The Dryv validation set to get the mapping from.
     */
    private registerFieldsWithGroups(validationSet: DryvValidationSet) {
        Object.values(this.fields).forEach(field => field.groups = []);
        Object.values(this.groups).forEach(group => group.fields = []);
        Object.values(validationSet.validators)
            .map(rules => rules
                .filter(rule => rule.group && !this.groups[rule.group])
                .forEach(rule => this.registerGroup(new DryvGroup(rule.group as string, this))))
        Object.entries(validationSet.validators)
            .map(item => ({path: item[0], rule: item[1]}))
            .map(item => item.rule
                .filter(v => v.group)
                .map(v => ({group: this.groups[v.group ?? ""], field: this.fields[item.path]}))
                .filter(v => v.group && v.field))
            .flat()
            .forEach(v => {
                v.field.groups.push(v.group);
                v.group.fields.push(v.field);
            });
    }

    /**
     Map validation rules to fields, depending the validation set.
     @param validationSet The Dryv validation set to get the mapping from.
     */
    private registerRulesWithFields(validationSet: DryvValidationSet) {
        Object.values(this.fields).forEach(field => field.rules = validationSet.validators[field.path] ?? []);
    }

    private static findValidationSet(validationSetInput: DryvValidationSet | string) {
        return typeof validationSetInput === "string"
            ? windowDryvValidationSetProvider.get(validationSetInput)
            : validationSetInput;
    }
}


