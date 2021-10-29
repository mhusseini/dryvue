import DryvForm from "@/dryv/DryvForm";
import {
    DryvValidationResult,
    DryvValidationSet,
} from "@/dryv";
import DryvField from "@/dryv/DryvField";
import DryvGroup from "@/dryv/DryvGroup";

describe("DryvForm", () => {
    it("correctly finds related fields.", async () => {
        const validate = jest.fn();
        validate.mockReturnValue(Promise.resolve({group: "g", text: "error"}));
        const validationSet: DryvValidationSet = {
            validators: {
                field1: [{group: "g", validate, related: ["field2"]}],
                field2: [{group: "g", validate, related: ["field1"]}],
                field3: [{group: "g", validate, related: ["field1"]}],
                field4: [{group: "g", validate}],
            },
        };

        const form = new DryvForm();
        const field1 = form.registerField(new DryvField(form, "field1"));
        const field2 = form.registerField(new DryvField(form, "field2"));
        const field3 = form.registerField(new DryvField(form, "field3"));
        const field4 = form.registerField(new DryvField(form, "field4"));

        form["registerValidationSet"](validationSet);

        const relatedFields = form.$getRelatedFields(field1);

        expect(relatedFields.length).toEqual(2);
        expect(relatedFields).toContain(field1);
        expect(relatedFields).toContain(field2);
        expect(relatedFields).not.toContain(field3);
        expect(relatedFields).not.toContain(field4);
    });

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

        form.registerGroup(new DryvGroup("g", form));

        const result = await form.validate(
            validationSet,
            model
        );

        debugger;
        expect(result).not.toBeNull();
        expect(firstNameField.validationResult).not.toBeNull();
        expect(firstNameField.validationResult?.group).not.toBeNull();
        expect(typeof firstNameField.validationResult?.group).not.toBe("string");
    });
});
