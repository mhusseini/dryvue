import {DryvFormValidationContext, DryvRule, DryvValidationResult} from ".";
import DryvForm from "./DryvForm";
import DryvGroup from "@/dryv/DryvGroup";

export default class DryvField {
    isDisabled = false;
    validated?: (validationResult: DryvValidationResult | undefined) => void;
    validationResult?: DryvValidationResult | undefined;
    rules: DryvRule[] = [];
    private model?: unknown;
    validationContext?: DryvFormValidationContext;
    groups: Array<DryvGroup> = [];
    $relatedFields?: Array<DryvField>;

    constructor(public form: DryvForm, public path: string = "") {
        // nop
    }

    async validate(
        model: unknown,
        context: DryvFormValidationContext,
        stack?: Array<string>
    ): Promise<DryvValidationResult | undefined> {
        if (context.fieldValidationPromises[this.path]) {
            return await context.fieldValidationPromises[this.path] as Promise<DryvValidationResult | undefined>;
        }

        this.model = model;
        this.validationContext = context;
        context.validatedFields[this.path] = true;

        const promise = this.validateUntilFirstError(model, context, stack ?? []);
        context.fieldValidationPromises[this.path] = promise;
        this.validationResult = await promise;
        
        if (this.validated) {
            this.validated(this.validationResult);
        }

        this.form.fieldValidated(this);

        return this.validationResult;
    }

    async revalidate(): Promise<DryvValidationResult | undefined> {
        if (!this.rules.length || !this.model) {
            return undefined;
        }

        const validationContext = await this.form.$beginValidation();

        try {
            return await this.validate(
                this.model,
                validationContext,
                [this.path]
            );
        } finally {
            this.form.$endValidation();
        }
    }

    private async validateUntilFirstError(model: unknown,
                                          context: DryvFormValidationContext,
                                          stack: Array<string>
    ): Promise<DryvValidationResult | undefined> {
        if (this.isDisabled || !this.rules) {
            return undefined;
        }

        const nextStack = stack.concat([this.path]);

        for (const rule of this.rules) {
            if (rule.related) {
                const promises = rule.related
                    .filter(path => stack.indexOf(path) < 0);
                await Promise.all(promises
                    .map(path => this.form.fields[path]?.validate(model, context, nextStack)))
            }

            // If any related field has an error unrelated to the current group, skip this rule.
            if (rule.group && this.form.groups[rule.group]
                ?.fields
                ?.map(field => field.validationResult)
                .filter(result => result?.type === "error" && result.group !== rule.group)
                .length) {
                continue;
            }

            const promiseF = () => DryvField.validateRule(rule, model, context);
            const promise =
                rule.group
                    ? context.groupValidations[rule.group] ?? (context.groupValidations[rule.group] = promiseF())
                    : promiseF();

            const result = await promise;
            if (result) {
                return result;
            }
        }

        return undefined;
    }

    private static async validateRule(rule: DryvRule,
                                      model: unknown,
                                      context: DryvFormValidationContext
    ): Promise<DryvValidationResult | undefined> {
        {
            const result = await rule.validate(model, context);

            switch (typeof result) {
                case "string": {
                    if (!result) {
                        break;
                    }

                    return {
                        type: "error",
                        text: result,
                        group: rule.group,
                    };
                }
                case "object": {
                    const obj: DryvValidationResult = result;
                    if (!obj?.text) {
                        break;
                    }

                    if (!obj.type) {
                        obj.type = "error";
                    }

                    if (!obj.group) {
                        obj.group = rule.group;
                    }

                    return obj;
                }
            }
        }

        return undefined;
    }
}