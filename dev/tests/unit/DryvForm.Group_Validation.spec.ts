import DryvForm from "@/dryv/DryvForm";
import {
    DryvValidationSet,
} from "@/dryv";

describe("DryvForm", () => {
    it("executes group validations only once.", async () => {
        const validate = jest.fn();
        const validationSet: DryvValidationSet = {
            validators: {
                field1: [{group: "g", validate}],
                field2: [{group: "g", validate}],
                field3: [{group: "g", validate}],
            },
        };

        const form = new DryvForm("field1", "field2", "field3");

        await form.validate(validationSet, {});
        expect(validate).toHaveBeenCalledTimes(1);
    });

    it("validates group fields when they have no other errors.", async () => {
        const validate = jest.fn();
        validate.mockReturnValue(Promise.resolve({group: "g", text: "error"}));

        const validationSet: DryvValidationSet = {
            validators: {
                field1: [{group: "g", validate}],
                field2: [
                    {validate: m => Promise.resolve(m.field2 ? undefined : "error")},
                    {group: "g", validate}],
            },
        };

        const form = new DryvForm("field1", "field2");

        await form.validate(validationSet, {
            field2: "text"
        });
        expect(validate).toHaveBeenCalledTimes(1);
    });
    
    it("returns no errors when grouped fields are valid.", async () => {
        const validate = (m: any) : any => Promise.resolve(m.field1 && m.field2 ? null : "This is an error");
        const validationSet: DryvValidationSet = {
                validators: {
                    field1: [{group: "g", validate, related: ["field2"]}],
                    field2: [{group: "g", validate, related: ["field1"]}],
                },
            }
        ;

        const model = {
            field1: "value1",
            field2: "value2",
        };

        const form = new DryvForm("field1", "field2");

        await form.validate(
            validationSet,
            model
        );

        expect(form.fields.field1.validationResult).toBeUndefined()
        expect(form.fields.field2.validationResult).toBeUndefined();
    });
    
    it("returns an error when grouped field has error.", async () => {
        const validate = (m: any) : any => Promise.resolve(m.field1 && m.field2 ? null : "This is an error");
        const validationSet: DryvValidationSet = {
                validators: {
                    field1: [{group: "g", validate, related: ["field2"]}],
                    field2: [{group: "g", validate, related: ["field1"]}],
                },
            }
        ;

        const model = {
            field1: "value1",
            field2: "",
        };

        const form = new DryvForm("field1", "field2");
            
        await form.validate(
            validationSet,
            model
        );

        expect(form.fields.field1.validationResult).not.toBeUndefined()
        expect(form.fields.field2.validationResult).not.toBeUndefined();
    });
});
