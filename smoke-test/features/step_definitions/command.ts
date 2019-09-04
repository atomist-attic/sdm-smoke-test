/*
 * Copyright © 2019 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { logger } from "@atomist/automation-client";
import {
    Then,
    When,
} from "cucumber";
import * as assert from "power-assert";
import {
    editOneInvocation,
    invokeCommandHandler,
} from "../../../src/framework/invocation/CommandHandlerInvocation";
import { SmokeTestWorld } from "../support/world";

When(/run editor (.*) with no parameters/, {timeout: 80 * 1000}, async function(name: string) {
    await doEdit(this as SmokeTestWorld, name, {}, true);
});

When(/run editor (.*) given parameters/, {timeout: 80 * 1000}, async function(name: string, params) {
    throw new Error("Implement with a data table: https://cucumber.io/docs/reference");
});

Then("enable deploy", {timeout: 80 * 1000}, async function() {
    logger.info(`Invoking enable deploy...`);
    await invokeCommandHandler(this.config, {
        name: "EnableDeploy",
        parameters: {},
        mappedParameters: {
            owner: this.focusRepo.owner,
            repo: this.focusRepo.repo,
            providerId: "github.com",
        },
    });
    logger.info("Handler returned. Waiting for GitHub...");
});

async function doEdit(world: SmokeTestWorld, name: string, params: any, changeFocus: boolean) {
    logger.info(`Invoking editor ${name} with [${JSON.stringify(params)}]...`);

    await invokeCommandHandler(world.config,
        editOneInvocation(name, world.focusRepo, params));
    logger.info("Handler returned. Waiting for GitHub...");

    if (changeFocus) {
        assert(!!world.gitRemoteHelper, "Remote helper must be set");
        world.focusRepo.sha = "master";
        const currentProject = await world.gitRemoteHelper.clone(world.focusRepo, {delayForMillis: 1000, retries: 5});
        const gitStatus = await currentProject.gitStatus();
        world.focusRepo.sha = gitStatus.sha;
        world.focusRepo.branch = gitStatus.branch;
    }
}
