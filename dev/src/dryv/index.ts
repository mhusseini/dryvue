import DryvForm_ from "./DryvForm";
import DryvField_ from "./DryvField";

export const DryvForm = DryvForm_;
export const DryvField = DryvField_;

export interface DryvValidationContext {
  get: (data: any) => Promise<any>;
  post: (data: any) => Promise<any>;
}

export interface DryvFormValidationResult {
  errors?: DryvForm_[];
  warnings?: DryvField_[];
}

export interface DryvValidationResult {
  type: "error" | "warning" | null;
  text?: string;
  group?: string;
}
