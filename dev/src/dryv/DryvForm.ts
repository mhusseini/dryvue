import {Dryv, DryvRule, DryvValidationContext, DryvValidationResult, DryvValidationSet} from "./index";
import {DryvFormValidationResult, DryvFormValidationContext} from ".";
import {windowDryvValidationSetProvider} from "./DryvValidationSetProvider";
import DryvField from "@/dryv/DryvField";
import DryvGroup from "@/dryv/DryvGroup";

// function groupBy<TItem extends { [key: string]: any }, TOut = TItem>(
//     xs: Array<TItem>,
//     key: string,
//     map?: (input: TItem) => TOut):
//     { [key: string]: Array<TOut | TItem> } {
//     return xs.reduce(function (rv: { [key: string]: Array<TOut | TItem> }, x: TItem) {
//         (rv[x[key]] = rv[x[key]] || []).push(map ? map(x) : x);
//         return rv;
//     }, {});
// }

export default class DryvForm {
    private disableRecalculation = false;
    private model: unknown;
    fields: { [path: string]: DryvField };
    groups: { [name: string]: DryvGroup } = {};
    errors: Array<DryvField> = [];
    warnings: Array<DryvField> = [];
    validated?: (errors?: Array<DryvField>, warnings?: Array<DryvField>) => void;
    validationContext?: DryvFormValidationContext = undefined;
    private contextCount = 0;
    private validationSet?: DryvValidationSet;

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

    async $beginValidation(): Promise<DryvFormValidationContext> {
        this.contextCount++;
        if (this.validationContext) {
            return this.validationContext;
        }

        const validationContext: DryvFormValidationContext = {
            get: Dryv.config.get,
            post: Dryv.config.post,
            callServer: Dryv.config.callServer,
            fieldValidationPromises: {},
            groupValidationPromises: {},
            validatedFields: {},
            groupValidatingField: {},
            groupResults: {}
        };

        this.validationContext = validationContext;

        await this.updateDisabledFields();

        return validationContext;
    }

    $endValidation(): void {
        if (--this.contextCount <= 0) {
            this.validationContext = undefined;
        }
    }

    private async updateDisabledFields(): Promise<void> {
        if (this.disableRecalculation) {
            return;
        }

        const validationSet = this.validationSet;
        if (!validationSet) {
            return;
        }

        const model = this.model;

        const fields = Object.values(this.fields);

        // Disable fields using disabled rules.
        const disabledPaths = fields
            .filter(
                (field) =>
                    (field.isDisabled = !!(validationSet.disablers && validationSet.disablers[
                        field.path
                        ]?.find((rule: DryvRule) => rule.validate(model, this.validationContext as DryvValidationContext))))
            )
            .map((field) => field.path + ".");

        // Disable child properties.
        fields
            .filter((field) => disabledPaths.find((p) => field.path.indexOf(p) >= 0))
            .forEach((field) => (field.isDisabled = true));
    }

    /**
     * Invoked by fields to inform the form that the field was validated.
     * @param field The field that was validated.
     * @returns true when the form handles the validateion result. When false, the field is responsible to handle (e.g. display) the validation result.
     */
    fieldValidated(field: DryvField): boolean {
        const state = field.validationResult?.type;

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
            .forEach(group => group.fieldValidated())

        if (state) {
            const arr = state === "error" ? this.errors : this.warnings;
            const i = arr.indexOf(field);
            if (i <= 0) {
                arr.splice(i, 1);
            }
        }

        if (state) {
            const arr = state === "error" ? this.errors : this.warnings;
            arr.push(field);
        }

        if (this.validated) {
            this.validated(this.errors, this.warnings);
        }

        this.lastHandled = handled;
        return handled;
    }

    async validate(
        validationSetInput: DryvValidationSet | string,
        model: unknown
    ): Promise<DryvFormValidationResult> {
        const validationSet = DryvForm.findValidationSet(validationSetInput);

        if (!validationSet) {
            return {};
        }

        if (this.validationSet !== validationSet) {
            this.registerValidationSet(validationSet);
        }

        this.model = model;

        const resultTypes: { [type: string]: Array<DryvValidationResult> } = {};
        this.disableRecalculation = true;
        Object.values(this.groups).forEach(g => g.disableAutoValidate = true);
        Object.values(this.fields).forEach(f => f.validationResult = undefined);

        const fields = Object.values(this.fields);
        const validationContext = await this.$beginValidation();

        try {
            const fieldResults = await Promise.all(fields
                .map((field) => field
                    .validate(model, validationContext)));

            fieldResults.forEach(r => r && r.type && (
                resultTypes[r.type]
                    ? resultTypes[r.type].push(r)
                    : (resultTypes[r.type] = [r])
            ));
        } finally {
            this.$endValidation();
            Object.values(this.groups).forEach(g => g.disableAutoValidate = false);
            this.disableRecalculation = false;
        }

        const errors = resultTypes["error"];
        const warnings = resultTypes["warning"];

        return {
            errors: errors && errors.length ? errors : undefined,
            warnings: warnings && warnings.length ? warnings : undefined,
        };
    }

    public $getRelatedFields(field: Array<DryvField> | DryvField, ...fields: Array<DryvField>): Array<DryvField> {
        fields = Array.isArray(field)
            ? (fields ? field.concat(fields) : field)
            : (fields ? [field].concat(fields) : [field])

        const relatedFields: Array<DryvField> = [];
        const processedFields: { [path: string]: boolean } = {};

        while (fields.length) {
            const field = fields[0];
            fields.splice(0, 1);

            relatedFields.push(field);

            if (field.$relatedFields) {
                relatedFields.push(...field.$relatedFields);
                continue;
            }

            fields = fields.concat(field.rules
                .filter(rule => rule.related)
                .map(rule => rule.related)
                .flat()
                .filter(path => path && !processedFields[path]
                    ? (processedFields[field.path] = true)
                    : false)
                .map(path => this.fields[path as string])
            );
        }

        return relatedFields.reverse();
    }

    private registerValidationSet(validationSet: DryvValidationSet) {
        this.registerFieldsWithGroups(validationSet);
        this.registerRulesWithFields(validationSet);
        //this.detectFieldHierarchy(validationSet)

        this.validationSet = validationSet;
    }

    // private detectFieldHierarchy(validationSet: DryvValidationSet) {
    //     const inputEdges: { [to: string]: boolean } = {};
    //     const fields = Object.values(this.fields);
    //     fields.forEach(field => field.$relatedFields = undefined);
    //     fields.forEach(field => {
    //         field.$relatedFields = this.$getRelatedFields(field);
    //         field.$relatedFields.forEach(to => inputEdges[to.path] = true);
    //     });
    //
    //     this.entryFields = fields.filter(field => !inputEdges[field.path]);
    // }

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
