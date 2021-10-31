import {
    Dryv,
    DryvConfiguration,
    DryvFormOptions,
    DryvGroupOptions,
    DryvOptions,
    DryvValidationResult,
    DryvValidationSet
} from "./index";
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
    validationSet: DryvValidationSet;
    errors?: Array<DryvField>;
    warnings?: Array<DryvField>;
    warningHash?: number;
    errorHash?: number;
    options: DryvConfiguration;

    get success(): boolean {
        return !(this.errors?.length) && !(this.warnings?.length)
    }

    constructor(options: DryvFormOptions, ...fields: Array<string>) {
        this.fields = {};
        this.options = Dryv.withDefaults(options);

        const validationSet = typeof options.validationSet === "string"
            ? DryvForm.findValidationSet(options.validationSet)
            : options.validationSet;

        if (validationSet) {
            this.validationSet = validationSet;
        } else {
            throw new Error("A validation set must be specified.");
        }

        fields.forEach(path => this.registerField(path))
    }

    registerField(path: string, options?: DryvOptions): DryvField {
        options = Object.assign({}, this.options, options);

        let field = this.fields[path];
        if (field) {
            field.options = options;
            return field;
        }

        field = this.fields[path] = new DryvField(this, path, options);
        field.path = path;
        field.rules = this.validationSet.validators[field.path] ?? [];
        field.rules
            .filter(rule => rule.group)
            .map(rule => this.registerGroup(rule.group as string))
            .forEach(group => {
                field.groups.push(group);
                group.fields.push(field);
            });

        return field;
    }

    registerGroup(name: string, options?: DryvGroupOptions): DryvGroup {
        options = Object.assign({}, this.options, options);

        if (this.groups[name]) {
            const group = this.groups[name];
            group.options = options;
            return group;
        }

        return this.groups[name] = new DryvGroup(this, name, options);
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

        return handled;
    }

    async validate(model: unknown): Promise<DryvFormValidationResult> {
        this.model = model;
        this.disableRecalculation = true;

        try {
            await validate(this, model);
        } finally {
            this.disableRecalculation = false;
        }

        this.updateState();

        return {
            errors: this.errors,
            warnings: this.warnings,
            success: this.success,
            warningHash: this.warningHash,
            errorHash: this.errorHash
        };
    }

    setValidationResult(validationResults: { [path: string]: DryvValidationResult | undefined }): boolean {
        Object.values(this.fields)
            .forEach(field => field
                .setValidationResult(validationResults[field.path]));

        this.updateState();

        return this.success;
    }

    private updateState() {
        const fields = Object.values(this.fields);
        this.errors = fields.filter(field => field.validationResult?.type === "error");
        this.warnings = fields.filter(field => field.validationResult?.type === "warning");
        this.warningHash = calculateHash(this.warnings.map(w => w.path + "|" + w.validationResult?.text).join("|"));
        this.errorHash = calculateHash(this.errors.map(w => w.path + "|" + w.validationResult?.text).join("|"));
    }

    static findValidationSet(validationSetInput: DryvValidationSet | string) {
        return typeof validationSetInput === "string"
            ? windowDryvValidationSetProvider.get(validationSetInput)
            : validationSetInput;
    }
}