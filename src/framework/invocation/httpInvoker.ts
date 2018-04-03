/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { logger } from "@atomist/automation-client";
import axios, { AxiosError, AxiosPromise, AxiosResponse } from "axios";
import { AxiosRequestConfig } from "axios";
import { SmokeTestConfig } from "../config";

/**
 * Make a post to the SDM
 * @param {SmokeTestConfig} config
 * @param {string} relativePath
 * @param data
 * @return {AxiosPromise}
 */
export function postToSdm(config: SmokeTestConfig, relativePath: string, data: any): AxiosPromise {
    let url = `${config.baseEndpoint}/${relativePath}`;
    if (relativePath.startsWith("/")) {
        url = `${config.baseEndpoint}${relativePath}`;
    }
    logger.debug("POST to %s with payload %j", url, data);
    return axios.post(url, data, automationServerAuthHeaders(config))
        .then(logResponse(url), interpretSdmResponse(config, url));
}

export function sdmGet(config: SmokeTestConfig, relativePath: string): AxiosPromise {
    let url = `${config.baseEndpoint}/${relativePath}`;
    if (relativePath.startsWith("/")) {
        url = `${config.baseEndpoint}${relativePath}`;
    }
    logger.debug("GET %s");
    return axios.get(url, automationServerAuthHeaders(config))
        .then(logResponse(url), interpretSdmResponse(config, url));
}

function logResponse(url: string) {
    return (resp: AxiosResponse): AxiosResponse => {
        logger.debug(`Response from %s was %d, data %j`, url, resp.status, resp.data);
        return resp;
    };
}

function interpretSdmResponse(config: SmokeTestConfig, url: string) {
    return (err: AxiosError): never => {
        logger.error("Error accessing %s: %s", url, err.message);
        if (err.message.includes("ECONNREFUSED")) {
            const linkThatDemonstratesWhyTheSdmMightNotBeListening =
                "https://github.com/atomist/github-sdm/blob/acd5f89cb2c3e96fa47ef85b32b2028ea2e045fb/src/atomist.config.ts#L62";
            logger.error("The SDM is not running or is not accepting connections.\n" +
                "If it's running, check its environment variables. See: " + linkThatDemonstratesWhyTheSdmMightNotBeListening);
            throw new Error("Unable to connect to the SDM at " + config.baseEndpoint);
        }
        if (err.response.status === 401) {
            throw new Error(`Status 401 trying to contact the SDM. You are connecting as: [ ${config.user}:${config.password} ]`);
        }
        throw err;
    };
}

function automationServerAuthHeaders(config: SmokeTestConfig): AxiosRequestConfig {
    return {
        headers: {
            "content-type": "application/json",
            "Cache-Control": "no-cache",
        },
        auth: {
            username: config.user,
            password: config.password,
        },
    };
}
