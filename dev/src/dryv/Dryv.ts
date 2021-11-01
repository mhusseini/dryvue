import {DryvConfiguration, DryvFormValidationContext, DryvValidationResult} from "@/dryv/types";

export interface DryvOptions {
    get?: (url: string, data: unknown) => Promise<unknown>;
    post?: (url: string, data: unknown) => Promise<unknown>;
    handleResult?: (context: DryvFormValidationContext, model: unknown, path: string, ruleName: string, result: DryvValidationResult) => void;
    valueOfDate?: (value: string, locale: string, format: string) => unknown;
}

export class Dryv {
    private static _config: DryvConfiguration;
    static get config(): DryvConfiguration {
        return !Dryv._config ? Dryv.configure({}) : Dryv._config;
    }

    static configure(options: DryvOptions): DryvConfiguration {
        Dryv._config = Object.assign({}, {
            get: defaultGet,
            post: defaultPost,
            callServer: defaultCall,
            handleResult: defaultHandleResult,
            valueOfDate: defaultValueOfDate
        } as DryvConfiguration, options);
        return Dryv._config;
    }

    static withDefaults(options: DryvOptions): DryvConfiguration {
        return Object.assign({}, Dryv.config, options);
    }
}

async function defaultGet(data: any, url: string): Promise<any> {
    const query = !data ? "" : "?" + Object.entries(data)
        .map(e => `${encodeURIComponent(e[0])}=${encodeURIComponent(e[1] as any)}`)
        .join("&");

    const result = await fetch(url + query);

    return await result.json();
}

async function defaultPost(url: string, data: any): Promise<any> {
    const result = await fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    return await result.json();
}

async function defaultCall(url: string, method: "GET" | "POST", data: any): Promise<any> {
    try {
        const response = method === "GET"
            ? await Dryv.config.get(url, data)
            : await Dryv.config.post(url, data);

        return response.data;
    } catch (error) {
        console.error(error);
        // Don't let the exception block further validation
        // and let the server validation handle this field correctly.
        return undefined;
    }
}

function defaultHandleResult(context: DryvFormValidationContext, model: unknown, path: string, ruleName: string, result: DryvValidationResult): DryvValidationResult {
    return result;
}

function defaultValueOfDate(value: string, locale: string, format: string) {
    return new Date(value).getTime();
}