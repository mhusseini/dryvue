import {DryvValidationSetProvider} from "./types";

export const windowDryvValidationSetProvider: DryvValidationSetProvider = {
  get(validationSetName) {
    const v = (window as any).dryv?.v;
    return v && v[validationSetName];
  },
};
