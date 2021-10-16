import DryvField from "./DryvField";
import { DryvValidationResult } from "./index";
import { DryvFormValidationResult, DryvValidationContext } from ".";

export default class DryvForm {
  private lastFieldStates: { [path: string]: string | null | undefined } = {};
  private disableEvents = false;
  fields: { [path: string]: DryvField } = {};
  errors: Array<DryvField> = [];
  warnings: Array<DryvField> = [];
  validated?: (errors?: Array<DryvField>, warnings?: Array<DryvField>) => void;

  registerField(field: DryvField): void {
    this.fields[field.path] = field;
  }

  fieldValidated(field: DryvField): void {
    const state = field.validationResult?.type;
    const lastState = this.lastFieldStates[field.path];
    const hasChanegs = lastState !== state;
    if (hasChanegs) {
      this.lastFieldStates[field.path] = state;

      if (lastState) {
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

      if (!this.disableEvents && this.validated) {
        this.validated(this.errors, this.warnings);
      }
    }
  }

  async validate(
    validationSetName: string,
    model: any
  ): Promise<DryvFormValidationResult> {
    const globalDryv = (window as any).dryv;
    if (!globalDryv || !globalDryv.v) {
      return {};
    }

    const validationSet = globalDryv.v[validationSetName];
    if (!validationSet) {
      return {};
    }

    const context: DryvValidationContext = {
      get: () => Promise.resolve(),
      post: () => Promise.resolve(),
    };

    const fieldResults = await Promise.all(
      Object.values(this.fields).map((f) => {
        const rules = validationSet.validators[f.path].map(
          (r: any) => r.validate
        );
        return rules ? f.validate(rules, model, context) : null;
      })
    );

    const resulTypes: any = {};

    fieldResults
      .filter((r) => r && r.type)
      .forEach((r: any) =>
        resulTypes[r.type]
          ? resulTypes[r.type].push(r)
          : (resulTypes[r.type] = [r])
      );

    const errors = resulTypes["error"];
    const warnings = resulTypes["warning"];

    return {
      errors: errors && errors.length ? errors : null,
      warnings: warnings && warnings.length ? warnings : null,
    };
  }
}
