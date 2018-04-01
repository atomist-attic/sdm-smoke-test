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
import {
    verifyCodeReactionSuccess,
    verifyReviewSuccess,
    verifySdmBuildSuccess,
    verifySdmDeploy,
    waitForSuccessOf,
} from "../../../src/framework/assertion/github/statusUtils";

import * as assert from "power-assert";

// Note: We cannot use arrow functions as binding doesn't work

/**
 * Definitions to verify GitHub statuses that should have been set by SDM under test
 */

Then("build should succeed", {timeout: 60 * 1000}, async function() {
    await verifySdmBuildSuccess(this.gitRemoteHelper, this.focusRepo);
});

Then("reactions should succeed", {timeout: 60 * 1000}, async function() {
    await verifyCodeReactionSuccess(this.gitRemoteHelper,
        {owner: this.focusRepo.owner, repo: this.focusRepo.repo, sha: this.focusRepo.sha});
});

Then("reviews should succeed", {timeout: 60 * 1000}, async function() {
    await verifyReviewSuccess(this.gitRemoteHelper,
        {owner: this.focusRepo.owner, repo: this.focusRepo.repo, sha: this.focusRepo.sha});
});

Then("it should deploy locally", {timeout: 60 * 1000}, async function() {
    const statuses = await verifySdmDeploy(this.gitRemoteHelper,
        {owner: this.focusRepo.owner, repo: this.focusRepo.repo, sha: this.focusRepo.sha});
    assert(statuses.deployStatus.context.includes("local"),
        `${statuses.deployStatus} does not include 'local'`);
});

Then("it should deploy to staging", {timeout: 60 * 1000}, async function() {
    const statuses = await verifySdmDeploy(this.gitRemoteHelper,
        {owner: this.focusRepo.owner, repo: this.focusRepo.repo, sha: this.focusRepo.sha});
    assert(statuses.deployStatus.context.includes("staging"),
        `${statuses.deployStatus} does not include 'staging'`);
});

Then("it should be immaterial", {timeout: 20 * 1000}, async function() {
    const immaterialStatus = await waitForSuccessOf(this.gitRemoteHelper,
        this.focusRepo.owner, this.focusRepo.repo, this.focusRepo.sha,
        s => s.context.includes("immaterial"));
    logger.info("Found required immaterial status %j", immaterialStatus);
});
