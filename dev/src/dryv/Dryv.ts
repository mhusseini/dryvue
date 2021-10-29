import {DryvConfiguration, DryvOptions} from "@/dryv/index";

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

async function defaultCall(method: "GET" | "POST", url: string, data: any): Promise<any> {
    const response = method === "GET"
        ? await Dryv.config.get(url, data)
        : await Dryv.config.post(url, data);

    return response.data;
}

export default class Dryv {
    static _config: DryvConfiguration;
    static get config(): DryvConfiguration {
        return !Dryv._config ? Dryv.configure({}) : Dryv._config;
    }

    static configure(options: DryvOptions): DryvConfiguration {
        return Dryv._config = Object.assign({}, options, {
            get: defaultGet,
            post: defaultPost,
            callServer: defaultCall
        } as DryvConfiguration);
    }
}