import {DryvField} from "@/dryv/DryvField";

export {Dryv, DryvOptions} from "@/dryv/Dryv";
export {DryvField, DryvFieldOptions} from "@/dryv/DryvField";
export {DryvGroup, DryvGroupOptions} from "@/dryv/DryvGroup";
export {DryvForm, DryvFormOptions} from "@/dryv/DryvForm";


export interface DryvValidationContext {
    dryv: {
        get: (url: string, data: any) => Promise<any>;
        post: (url: string, data: any) => Promise<any>;
        callServer: (url: string, method: "GET" | "POST", data: any) => Promise<any>;
        handleResult: (context: DryvFormValidationContext, model: unknown, path: string, ruleName: string, result: DryvValidationResult) => void;
        valueOfDate: (value: string, locale: string, format: string) => unknown;
    }
}

export interface DryvFormValidationResult {
    success: boolean;
    errors?: Array<DryvField>;
    warnings?: Array<DryvField>;
    warningHash?: number;
    errorHash?: number;
}

export interface DryvValidationResult {
    type?: "error" | "warning";
    text?: string;
    group?: string;
}

export interface DryvValidationSet {
    validators: {
        [key: string]: Array<DryvRule>;
    };
    disablers?: {
        [key: string]: Array<DryvRule>;
    };
    parameters?: {
        [key: string]: any;
    };
}

export interface DryvRule {
    group?: string;
    related?: Array<string>;
    annotations?: { [name: string]: any };
    validate: DryvValidationFunction;
}

export type DryvValidationFunction = (
    m: any,
    ctx: DryvValidationContext
) => Promise<DryvValidationResult | string | undefined>;

export interface DryvFormValidationContext extends DryvValidationContext {
    groupResults: { [groupName: string]: DryvValidationResult };
    fieldValidationPromises: { [path: string]: Promise<DryvValidationResult | undefined> | undefined };
    validatedFields: { [path: string]: boolean };
    groupValidationPromises: { [path: string]: Promise<DryvValidationResult | undefined> | undefined };
    groupValidatingField: { [path: string]: DryvField };

    awaitedFields: { [path: string]: { [path: string]: boolean } };
}

export interface DryvConfiguration {
    get: (url: string, data: any) => Promise<any>;
    post: (url: string, data: any) => Promise<any>;
    callServer: (url: string, method: "GET" | "POST", data: any) => Promise<any>;
    handleResult: (context: DryvFormValidationContext, model: unknown, path: string, ruleName: string, result: DryvValidationResult) => void;
    valueOfDate: (value: string, locale: string, format: string) => unknown;
}

export interface DryvValidationSetProvider {
    get(validationSetName: string): DryvValidationSet;
}