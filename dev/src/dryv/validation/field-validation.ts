import {DryvField, DryvFormValidationContext, DryvRule, DryvValidationResult} from "@/dryv";
import {beginValidation, endValidation} from "@/dryv/validation/form-validation";

export async function revalidate(field: DryvField): Promise<DryvValidationResult | undefined> {
    if (!field.rules.length || !field.model) {
        return undefined;
    }

    const validationContext = await beginValidation(field.form);

    try {
        return await validate(field, field.model, validationContext, []);
    } finally {
        endValidation(field.form);
    }
}

export async function validate(field: DryvField,
                               model: unknown,
                               context: DryvFormValidationContext,
                               stack?: Array<string>
): Promise<DryvValidationResult | undefined> {
    if (context.fieldValidationPromises[field.path]) {
        console.log(`*** already validating ${field.path}`);
        return await context.fieldValidationPromises[field.path] as Promise<DryvValidationResult | undefined>;
    }

    console.log(`*** validate ${field.path}`);

    field.model = model;
    field.validationContext = context;
    field.validationResult = undefined;
    context.validatedFields[field.path] = true;

    const promise = validateUntilFirstError(field, model, context, stack ?? []);
    context.fieldValidationPromises[field.path] = promise;

    field.validationResult = await promise;
    field.showValidationResult = !field.form.fieldValidated(field);

    if (field.validated) {
        field.validated(field.validationResult);
    }

    const fields: { [path: string]: DryvField } = {};

    field.groups.forEach(group =>
        group.fields.forEach(field =>
            fields[field.path] = field));

    Object.values(fields)
        .filter(field => !context.validatedFields[field.path])
        .forEach(field => field.validate(model, context, stack ?? []));

    return field.validationResult;
}

async function validateUntilFirstError(field: DryvField,
                                       model: unknown,
                                       context: DryvFormValidationContext,
                                       stack: Array<string>
): Promise<DryvValidationResult | undefined> {
    if (field.isDisabled || !field.rules) {
        return undefined;
    }

    const nextStack = stack.concat([field.path]);

    for (const rule of field.rules) {
        const groupValidatingField = rule.group && context.groupValidatingField[rule.group]?.path;
        const promises = rule.related?.filter(path => path !== groupValidatingField && stack.indexOf(path) < 0);

        if (rule.group) {
            context.groupValidatingField[rule.group] = field;
        }

        await Promise.all(promises
                ?.map(path => field.form.fields[path]?.validate(model, context, nextStack))
            ?? [])

        // If any related field has an error unrelated to the current group, skip field rule.
        if (rule.group && field.form.groups[rule.group]
            ?.fields
            ?.find(f => f.path !== field.path
                && f.validationResult?.type === "error"
                && f.validationResult.group !== rule.group)) {
            console.log(`*** skipping rule ${field.rules.indexOf(rule)}.`);
            continue;
        }

        const promiseF = () => validateRule(rule, model, context);
        const promise = rule.group
            ? context.groupValidationPromises[rule.group] ?? (context.groupValidationPromises[rule.group] = promiseF())
            : promiseF();

        const result = await promise;
        if (result) {
            console.log(`*** rule ${field.rules.indexOf(rule)} matches: ${result.text}.`);
            return result;
        }
    }

    console.log(`*** no rule matches.`);
    return undefined;
}

async function validateRule(rule: DryvRule, model: unknown, context: DryvFormValidationContext): Promise<DryvValidationResult | undefined> {
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

    return undefined;
}
