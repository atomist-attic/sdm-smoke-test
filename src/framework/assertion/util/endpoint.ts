
import axios, { AxiosPromise } from "axios";
import * as https from "https";

export function verifyGet(url: string): AxiosPromise {
    const agent = new https.Agent({
        rejectUnauthorized: false,
    });
    return axios.get(url, {httpsAgent: agent});
}
