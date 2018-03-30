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

import {HandlerResult, logger} from "@atomist/automation-client";
import {Arg, Secret} from "@atomist/automation-client/internal/invoker/Payload";

import {RemoteRepoRef} from "@atomist/automation-client/operations/common/RepoId";
import axios, {AxiosError, AxiosResponse} from "axios";
import * as _ from "lodash";
import {automationServerAuthHeaders, SmokeTestConfig} from "../config";

import * as assert from "power-assert";

export interface CommandHandlerInvocation {
    name: string;
    parameters: Arg[];
    mappedParameters?: Arg[];
    secrets?: Secret[];
}

export async function invokeCommandHandler(config: SmokeTestConfig,
                                           invocation: CommandHandlerInvocation): Promise<HandlerResult> {
    const url = `/command/${_.kebabCase(invocation.name)}`;
    const data = {
        parameters: invocation.parameters,
        mapped_parameters: invocation.mappedParameters,
        secrets: invocation.secrets,
        command: invocation.name,
    };
    logger.debug(`Hitting ${url} to test command ${invocation.name}`);
    const resp = await postToSdm(config, url, data);
    assert(resp.data.success, "Affirmation handler should have succeeded");
    return resp.data;
}

function postToSdm(config: SmokeTestConfig, relativePath: string, data: any) {
    let url = `${config.baseEndpoint}/${relativePath}`;
    if (relativePath.startsWith("/")) {
        url = `${config.baseEndpoint}${relativePath}`;
    }
    logger.debug("Posting to %s with payload %j", url, data);
    return axios.post(url, data, automationServerAuthHeaders(config))
        .then(logResponse(url), interpretSdmResponse(config, url));
}

function logResponse(url: string) {
    return (resp: AxiosResponse): AxiosResponse => {
        logger.debug(`Response from ${url} was ${resp.status}`);
        return resp;
    };
}

function interpretSdmResponse(config: SmokeTestConfig, url: string) {
    return (err: AxiosError): never => {
        logger.error("Error posting to %s: %s", url, err.message);
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

export function editorOneInvocation(editorCommandName: string,
                                    rr: RemoteRepoRef,
                                    parameters: Arg[] = []): CommandHandlerInvocation {
    return {
        name: editorCommandName,
        parameters,
        mappedParameters: [
            {name: "targets.owner", value: rr.owner},
            {name: "targets.repo", value: rr.repo},
        ],
        secrets: [
            {uri: "github://user_token?scopes=repo,user:email,read:user", value: process.env.GITHUB_TOKEN},
        ],
    };
}
