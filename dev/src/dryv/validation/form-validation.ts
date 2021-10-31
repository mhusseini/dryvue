import {DryvForm} from "@/dryv/DryvForm";
import {Dryv, DryvFormValidationContext, DryvRule, DryvValidationContext, DryvValidationResult} from "@/dryv";

export async function validate(form: DryvForm, model: unknown): Promise<Array<DryvValidationResult | undefined>> {
    try {
        Object.values(form.groups).forEach(g => g.disableAutoValidate = true);
        Object.values(form.fields).forEach(f => f.validationResult = undefined);

        const fields = Object.values(form.fields);
        const validationContext = await beginValidation(form);

        console.log(`*** Ready to validate: ${fields.map(f => f.path).join(", ")}.`);

        return (await Promise.all(
            fields.map((field) => field
                .validate(model, validationContext))))
            .filter(result => result?.text);
    } finally {
        endValidation(form);
        Object.values(form.groups).forEach(g => g.disableAutoValidate = false);
    }
}

interface PrivateDryvForm {
    contextCount: number;
    disableRecalculation: boolean;
}

export async function beginValidation(form: DryvForm): Promise<DryvFormValidationContext> {
    const _form = form as unknown as PrivateDryvForm;
    _form.contextCount++;

    if (form.validationContext) {
        return form.validationContext;
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

    form.validationContext = validationContext;

    await updateDisabledFields(form);

    return validationContext;
}

export function endValidation(form: DryvForm): void {
    const _form = form as unknown as PrivateDryvForm;
    console.log(`*** contextCount: ${_form.contextCount}`);
    if (--_form.contextCount <= 0) {
        form.validationContext = undefined;
    }
}

async function updateDisabledFields(form: DryvForm): Promise<void> {
    const _form = form as unknown as PrivateDryvForm;
    if (_form.disableRecalculation) {
        return;
    }

    const validationSet = form.validationSet;
    if (!validationSet) {
        return;
    }

    const model = form.model;

    const fields = Object.values(form.fields);

// Disable fields using disabled rules.
    const disabledPaths = fields
        .filter(
            (field) =>
                (field.isDisabled = !!(validationSet.disablers && validationSet.disablers[
                    field.path
                    ]?.find((rule: DryvRule) => rule.validate(model, form.validationContext as DryvValidationContext))))
        )
        .map((field) => field.path + ".");

// Disable child properties.
    fields
        .filter((field) => disabledPaths.find((p) => field.path.indexOf(p) >= 0))
        .forEach((field) => (field.isDisabled = true));
}