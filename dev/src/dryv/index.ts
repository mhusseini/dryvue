import Dryv_ from "@/dryv/Dryv";
import DryvField from "@/dryv/DryvField";

export const Dryv = Dryv_;

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

// export class LazyPromise<T> extends Promise<T> {
//     private promise?: Promise<T | undefined> = undefined;
//
//     constructor(private executor: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void) {
//         super(resolve => {
//             resolve(undefined as any);
//         });
//     }
//
//     static from<T>(function_: () => T | PromiseLike<T>): LazyPromise<T> {
//         return new LazyPromise<T>(resolve => {
//             resolve(function_());
//         });
//     }
//
//     static resolve<T>(value?: T | PromiseLike<T>): Promise<T> {
//         return new LazyPromise<T>(resolve => {
//             resolve(value);
//         });
//     }
//
//     static reject<T>(error?: any): Promise<T> {
//         return new LazyPromise<T>((resolve, reject) => {
//             reject(error);
//         });
//     }
//
//     then<TResult1 = T, TResult2 = never>(onFulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
//                                          onRejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null)
//         : Promise<TResult1 | TResult2> {
//         this.promise = this.promise || new Promise(this.executor);
//         // eslint-disable-next-line promise/prefer-await-to-then
//         return this.promise.then(onFulfilled as any, onRejected);
//     }
//
//     catch<TResult = never>(onRejected: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult> {
//         this.promise = this.promise || new Promise(this.executor);
//         return this.promise.catch(onRejected) as any;
//     }
// }