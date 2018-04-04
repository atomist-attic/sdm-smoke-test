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
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { Then, When } from "cucumber";

import * as assert from "power-assert";

// Note: We cannot use arrow functions as binding doesn't work

/**
 * Definitions to make assertions about projects
 */

Then("project should exist", {timeout: 30 * 1000}, async function() {
    logger.info("Checking that focus project %j exists", this.focusRepo);
    await this.gitRemoteHelper.clone(
        new GitHubRepoRef(this.focusRepo.owner, this.focusRepo.repo), {retries: 2});
});

When(/github\.com project (.*) does not exist/, {timeout: 30 * 1000}, async function(name) {
    logger.info("Checking that project %s does not exist", this.focusRepo);
    try {
        await this.gitRemoteHelper.clone(
            new GitHubRepoRef(this.config.githubOrg, name));
        assert.fail(`Project ${name} should not exist`);
    } catch (err) {
        // OK
    }
});

Then(/project should have (.*) topic/, {timeout: 40 * 1000}, async function(topic) {
    const topics = await this.gitRemoteHelper.waitForTopic(this.focusRepo, topic, {retries: 10});
    assert(topics.includes(topic), `Topics [${topics}] did not include [${topic}]`);
});
