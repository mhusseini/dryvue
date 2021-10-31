import {
    DryvForm, DryvGroup,
    DryvValidationSet,
} from "@/dryv";

describe("DryvForm", () => {
    const validate = (m: any): any => Promise.resolve(m.field1 && m.field2 ? null : "This is an error");
    const validationSet: DryvValidationSet = {
            validators: {
                field1: [{group: "g", validate, related: ["field2"]}],
                field2: [{group: "g", validate, related: ["field1"]}],
            },
        }
    ;

    it("executes group validations only once.", async () => {
        const validate = jest.fn();
        const validationSet: DryvValidationSet = {
            validators: {
                field1: [{group: "g", validate}],
                field2: [{group: "g", validate}],
                field3: [{group: "g", validate}],
            },
        };

        const form = new DryvForm({validationSet}, "field1", "field2", "field3");

        await form.validate({});
        expect(validate).toHaveBeenCalledTimes(1);
    });

    it("validates group rule when grouped fields have no other errors.", async () => {
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

        const form = new DryvForm({validationSet}, "field1", "field2");

        await form.validate({field2: "text"});
        expect(validate).toHaveBeenCalledTimes(1);
    });

    it("ignores group rule when grouped fields have other errors.", async () => {
        const validate = jest.fn();
        validate.mockReturnValue(Promise.resolve({group: "g", text: "error"}));

        const validationSet: DryvValidationSet = {
            validators: {
                field1: [{group: "g", validate, related: ["field2"]}],
                field2: [
                    {validate: m => Promise.resolve("error")},
                    {group: "g", validate, related: ["field1"]}],
            },
        };

        const form = new DryvForm({validationSet}, "field1", "field2");
        await form.validate({});

        expect(validate).toHaveBeenCalledTimes(0);
    });

    it("returns no errors when grouped fields are valid.", async () => {
        const model = {
            field1: "value1",
            field2: "value2",
        };

        const form = new DryvForm({validationSet}, "field1", "field2");

        await form.validate(model);

        expect(form.fields.field1.validationResult).toBeUndefined()
        expect(form.fields.field2.validationResult).toBeUndefined();
    });

    it("returns an error when grouped field has error.", async () => {
        const model = {
            field1: "value1",
            field2: "",
        };

        const form = new DryvForm({validationSet}, "field1", "field2");

        await form.validate(model);

        expect(form.fields.field1.validationResult).not.toBeUndefined()
        expect(form.fields.field2.validationResult).not.toBeUndefined();
    });

    it("revalidates valid fields with no error.", async () => {
        const model = {
            field1: "X",
            field2: "",
        };

        const validate1 = (m: any): any => Promise.resolve(m.field1 === m.field2 ? null : "error1");
        const validate2 = (m: any): any => Promise.resolve(m.field2 ? null : "error2");

        const validationSet: DryvValidationSet = {
                validators: {
                    field1: [{group: "g", validate: validate1, related: ["field2"]}],
                    field2: [
                        {validate: validate2},
                        {group: "g", validate: validate1, related: ["field1"]}],
                },
            }
        ;
        const form = new DryvForm({validationSet}, "field1", "field2");
        await form.validate(model);

        expect(form.fields.field1.validationResult).toBeUndefined()
        expect(form.fields.field2.validationResult).not.toBeUndefined();

        model.field2 = "X";

        await form.fields.field2.revalidate();

        expect(form.fields.field1.validationResult).toBeUndefined()
        expect(form.fields.field2.validationResult).toBeUndefined();

        model.field1 = "";

        await form.fields.field2.revalidate();

        expect(form.fields.field1.validationResult).not.toBeUndefined()
        expect(form.fields.field2.validationResult).not.toBeUndefined();
    });

    it("calls events when (re)validated.", async () => {
        const model = {
            field1: "X",
            field2: "",
        };

        const validate1 = (m: any): any => Promise.resolve(m.field1 === m.field2 ? null : "error1");
        const validate2 = (m: any): any => Promise.resolve(m.field2 ? null : "error2");

        const validationSet: DryvValidationSet = {
            validators: {
                field1: [{group: "g", validate: validate1, related: ["field2"]}],
                field2: [
                    {validate: validate2},
                    {group: "g", validate: validate1, related: ["field1"]}],
            },
        };
        let field1Error: string | undefined;
        let field2Error: string | undefined;
        let groupError: string | undefined;

        const form = new DryvForm({validationSet}, "field1", "field2");
        form.fields.field1.validated = () => field1Error = form.fields.field1.validationResult?.text;
        form.fields.field2.validated = () => field2Error = form.fields.field2.validationResult?.text;
        form.registerGroup("g").handle = () => {
            groupError = form.groups.g.validationResult?.text;
            return true;
        };

        await form.validate(model);

        expect(form.fields.field1.showValidationResult).not.toBeFalsy();
        expect(form.fields.field2.showValidationResult).not.toBeFalsy();
        expect(field1Error).toBeUndefined();
        expect(field2Error).not.toBeUndefined();
        expect(groupError).toBeUndefined();

        model.field2 = "X";

        await form.fields.field2.revalidate();

        expect(form.fields.field1.showValidationResult).not.toBeFalsy();
        expect(form.fields.field2.showValidationResult).not.toBeFalsy();
        expect(field1Error).toBeUndefined();
        expect(field2Error).toBeUndefined();
        expect(groupError).toBeUndefined();

        model.field1 = "";

        await form.fields.field2.revalidate();

        expect(form.fields.field1.showValidationResult).toBeFalsy();
        expect(form.fields.field2.showValidationResult).toBeTruthy();
        expect(field1Error).not.toBeUndefined();
        expect(field2Error).not.toBeUndefined();
        expect(groupError).not.toBeUndefined();
    });
});
