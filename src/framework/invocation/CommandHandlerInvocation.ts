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

import { HandlerResult, logger, MappedParameters } from "@atomist/automation-client";
import { Arg, Secret } from "@atomist/automation-client/internal/invoker/Payload";

import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import * as _ from "lodash";
import { SmokeTestConfig } from "../config";

import * as assert from "power-assert";
import { hasOwnProperty } from "tslint/lib/utils";

export interface Params {

    [propName: string]: string | number;
}

export interface CommandHandlerInvocation {
    name: string;
    parameters: Params;
    mappedParameters?: Arg[];
    secrets?: Secret[];
}

export async function invokeCommandHandler(config: SmokeTestConfig,
                                           invocation: CommandHandlerInvocation): Promise<HandlerResult> {
    assert(!!config, "Config must be provided");
    assert(!!config.baseEndpoint, "Base endpoint must be provided: saw " + JSON.stringify(config));
    const url = `/command`;
    const data = {
        command: invocation.name,
        parameters: propertiesToArgs(invocation.parameters),
        mapped_parameters: (invocation.mappedParameters || []).concat([
            {name: "slackTeam", value: config.atomistTeamId},
            // TODO fix this
            {name: "target.webhookUrl", value: "foo"},
            {name: "target.owner", value: config.githubOrg},

        ]),
        secrets: (invocation.secrets || []).concat([
            {uri: "github://user_token?scopes=repo,user:email,read:user", value: process.env.GITHUB_TOKEN},
        ]),
        correlation_id: "test-" + new Date().getTime(),
        api_version: "1",
        team: {
            id: config.atomistTeamId,
            name: config.atomistTeamName,
        },
    };
    logger.info("Hitting %s to test command %s using %j", url, invocation.name, data);
    const resp = await postToSdm(config, url, data);
    assert(resp.data.code === 0,
        "Command handler did not succeed. Returned: " + JSON.stringify(resp.data, null, 2));
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
        logger.debug(`Response from %s was %d, data %j`, url, resp.status, resp.data);
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
                                    parameters: Params): CommandHandlerInvocation {
    return {
        name: editorCommandName,
        parameters,
        mappedParameters: [
            {name: "targets.owner", value: rr.owner},
            {name: "targets.repo", value: rr.repo},
        ],
        secrets: [],
    };
}

export function automationServerAuthHeaders(config: SmokeTestConfig): AxiosRequestConfig {
    return {
        headers: {
            "content-type": "application/json",
            "Cache-Control": "no-cache",
            // Authorization: `Bearer ${config.jwt}`,
        },
        auth: {
            username: config.user,
            password: config.password,
        },
    };
}

function propertiesToArgs(o: any): Arg[] {
    const args = [];
    for (const name in o) {
        if (hasOwnProperty(o, name)) {
            args.push({name, value: o[name]});
        }
    }
    return args;
}
