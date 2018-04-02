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

import { HandlerResult, logger } from "@atomist/automation-client";
import { Arg, Secret } from "@atomist/automation-client/internal/invoker/Payload";

import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { SmokeTestConfig } from "../config";

import * as assert from "power-assert";
import { hasOwnProperty } from "tslint/lib/utils";
import { postToSdm } from "./httpInvoker";

/**
 * Allow params to be expressed in an object for convenience
 */
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

function propertiesToArgs(o: any): Arg[] {
    const args = [];
    for (const name in o) {
        if (hasOwnProperty(o, name)) {
            args.push({name, value: o[name]});
        }
    }
    return args;
}
