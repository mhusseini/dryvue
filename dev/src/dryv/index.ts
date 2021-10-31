import {DryvField} from "@/dryv/DryvField";

export {Dryv} from "@/dryv/Dryv";
export {DryvField} from "@/dryv/DryvField";
export {DryvGroup} from "@/dryv/DryvGroup";
export {DryvForm} from "@/dryv/DryvForm";

export interface DryvValidationContext {
    get: (url: string, data: any) => Promise<any>;
    post: (url: string, data: any) => Promise<any>;
    callServer: (url: string, method: "GET" | "POST", data: any) => Promise<any>;
}

export interface DryvFormValidationResult {
    errors?: DryvValidationResult[];
    warnings?: DryvValidationResult[];
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
}

export interface DryvOptions {
    get?: (url: string, data: any) => Promise<any>;
    post?: (url: string, data: any) => Promise<any>;
}

export interface DryvConfiguration {
    get: (url: string, data: any) => Promise<any>;
    post: (url: string, data: any) => Promise<any>;
    callServer: (url: string, method: "GET" | "POST", data: any) => Promise<any>;
}

export interface DryvValidationSetProvider {
    get(validationSetName: string): DryvValidationSet;
}