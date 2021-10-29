import { DryvValidationSet } from ".";

export interface DryvValidationSetProvider {
  get(validationSetName: string): DryvValidationSet;
}

export const windowDryvValidationSetProvider: DryvValidationSetProvider = {
  get(validationSetName) {
    const v = (window as any).dryv?.v;
    return v && v[validationSetName];
  },
};
