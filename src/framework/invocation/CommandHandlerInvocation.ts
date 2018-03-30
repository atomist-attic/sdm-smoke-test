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
import { Arg, Secret } from "@atomist/automation-client/internal/invoker/Payload";

import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import axios from "axios";
import * as _ from "lodash";
import { automationServerAuthHeaders, SmokeTestConfig } from "../config";

export interface CommandHandlerInvocation {
    name: string;
    parameters: Arg[];
    mappedParameters?: Arg[];
    secrets?: Secret[];
}

export async function invokeCommandHandler(config: SmokeTestConfig,
                                           invocation: CommandHandlerInvocation) {
    const url = `${config.baseEndpoint}/command/${_.kebabCase(invocation.name)}`;
    const data = {
        parameters: invocation.parameters,
        mapped_parameters: invocation.mappedParameters,
        secrets: invocation.secrets,
        command: invocation.name,
    };
    logger.debug(`Hitting ${url} to test command ${invocation.name} with payload ${JSON.stringify(data)}`);
    const resp = await axios.post(url, data, automationServerAuthHeaders(config));
    logger.debug(`Response from ${url} was ${resp.status}`);
    return resp.data;
}

export function editorOneInvocation(editorCommandName: string,
                                    rr: RemoteRepoRef,
                                    parameters: Arg[] = []): CommandHandlerInvocation {
    return {
        name: editorCommandName,
        parameters,
        mappedParameters: [
            {name: "targets.owner", value: rr.owner },
            {name: "targets.repo", value: rr.repo},
        ],
        secrets: [
            {uri: "github://user_token?scopes=repo,user:email,read:user", value: process.env.GITHUB_TOKEN},
        ],
    };
}
