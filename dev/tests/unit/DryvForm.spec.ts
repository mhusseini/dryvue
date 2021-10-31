import DryvForm from "@/dryv/DryvForm";
import {
    DryvValidationResult,
    DryvValidationSet,
} from "@/dryv";
import DryvField from "@/dryv/DryvField";

describe("DryvForm", () => {
    it(" returns an error when a rule applies.", async () => {
        const validationSet: DryvValidationSet = {
            validators: {
                firstName: [
                    {
                        validate: async m => m.firstName?.length > 0 ? undefined : "First name is required.",
                    },
                ],
            },
        };

        const model = {
            firstName: "",
            lastName: "",
        };

        const form = new DryvForm("firstName", "lastName");

        const result = await form.validate(
            validationSet,
            model
        );

        expect(result).not.toBeNull();
    });

    it(" returns an error when a rule applies.", async () => {
        const validationSet: DryvValidationSet = {
            validators: {
                firstName: [
                    {
                        group: "g",
                        validate(m) {
                            const result: DryvValidationResult | string | undefined =
                                m.firstName + m.lastName === "AB" ? undefined : "First name and last name must be AB.";
                            return Promise.resolve(result);
                        },
                    },
                ],
                lastName: [
                    {
                        group: "g",
                        validate(m) {
                            const result: DryvValidationResult | string | undefined =
                                m.firstName + m.lastName === "AB" ? undefined : "First name and last name must be AB.";
                            return Promise.resolve(result);
                        },
                    },
                ],
            },
        };

        const model = {
            firstName: "A",
            lastName: "",
        };

        const form = new DryvForm("lastName");
        const firstNameField = form.registerField(new DryvField(form, "firstName"));

        const result = await form.validate(validationSet, model);

        expect(result).not.toBeUndefined();
        expect(firstNameField.validationResult).not.toBeUndefined();
        expect(firstNameField.validationResult?.group).not.toBeUndefined();
        expect(typeof firstNameField.validationResult?.group).not.toBeUndefined();
    });
});
