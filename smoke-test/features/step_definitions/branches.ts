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
import { Then } from "cucumber";
import * as assert from "power-assert";
import { waitSeconds } from "../../../src/framework/assertion/util/wait";
import { AllPullRequests, AllPushes } from "../../../src/typings/types";

Then(/focus on branch with name containing (.*)/, {timeout: 80 * 1000}, async function(branchContent: string) {
    const result: AllPushes.Query = await this.world.graphClient.executeQueryFromFile("src/graphql/query/AllPushes", {
        org: this.focusRepo.owner,
        repo: this.focusRepo.repo,
    });
    const pushWeWant = result.Push.find(p => p.branch.includes(branchContent));
    assert(!!pushWeWant, `Must have one push containing '${branchContent}'`);
    this.focusRepo.sha = pushWeWant.commits[0].sha;
    this.focusRepo.branch = pushWeWant.branch;
});

Then(/merge pull request with title containing '(.*)'/, {timeout: 80 * 1000}, async function(titleContent: string) {
    const result: AllPullRequests.Query = await this.graphClient.executeQueryFromFile("src/graphql/query/AllPullRequests", {
        org: this.focusRepo.owner,
        repo: this.focusRepo.repo,
    });
    // TODO this is nasty but may avoid a race condition
    await waitSeconds(10);
    const prWeWant = result.PullRequest.find(p => p.title.includes(titleContent));
    logger.info("Found PR %d (%s) on %j", prWeWant.number, prWeWant.title, this.focusRepo);
    assert(!!prWeWant, `Must have one PR with title containing '${titleContent}'`);
    await this.gitRemoteHelper.mergePullRequest(this.focusRepo, prWeWant);
});
