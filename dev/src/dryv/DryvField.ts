import { DryvValidationContext, DryvValidationResult } from ".";
import DryvForm from "./DryvForm";
export interface DryvRuleInfo {
  validate: (
    m: any,
    ctx: DryvValidationContext
  ) => DryvValidationResult | string | null;
}
// export interface DryvRule {
//   (m: any, ctx: DryvValidationContext): DryvValidationResult | string | null;
// }

export type DryvRule = (
  m: any,
  ctx: DryvValidationContext
) => Promise<DryvValidationResult | string | null>;

export default class DryvField {
  path = "";
  validated?: (validationResult: DryvValidationResult | null) => void;
  validationResult?: DryvValidationResult | null;
  private recentRules?: DryvRule[];
  private recentModel?: any;
  private recentContext?: DryvValidationContext;
  constructor(public form: DryvForm) {
    // nop
  }
  
  async validate(
    rules: Array<DryvRule>,
    model: any,
    context: DryvValidationContext
  ): Promise<DryvValidationResult | null> {
    this.recentRules = rules;
    this.recentModel = model;
    this.recentContext = context;

    this.validationResult = await this.validateInternal(rules, model, context);

    if (this.validated) {
      this.validated(this.validationResult);
    }

    this.form.fieldValidated(this);

    return this.validationResult;
  }

  revalidate(): Promise<DryvValidationResult | null> {
    return !this.recentRules || !this.recentModel || !this.recentContext
      ? Promise.resolve(null)
      : this.validate(this.recentRules, this.recentModel, this.recentContext);
  }

  private async validateInternal(
    rules: Array<DryvRule>,
    model: any,
    context: DryvValidationContext
  ): Promise<DryvValidationResult | null> {
    for (const rule of rules) {
      const result = await rule(model, context);
      const obj: DryvValidationResult = result as any;

      switch (typeof result) {
        case "string":
          if (!result) {
            break;
          }
          return {
            type: "error",
            text: result,
          };
        case "object":
          if (!obj?.text) {
            break;
          }

          if (obj.type) {
            obj.type = obj.type.toLowerCase() as any;
          } else {
            obj.type = "error";
          }

          return obj;
      }
    }

    return null;
  }
}
