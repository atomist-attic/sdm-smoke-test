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
import { allow, seconds } from "../../../src/framework/assertion/AssertOptions";
import { Status } from "../../../src/framework/assertion/github/GitHubRemoteHelper";
import {
    ApprovalSuffix,
    verifyCodeReactionState,
    verifyImmaterial,
    verifyReviewState,
    verifySdmBuildState,
    verifySdmDeploySuccess,
} from "../../../src/framework/assertion/github/statusUtils";

// Note: We cannot use arrow functions as binding doesn't work

/**
 * Definitions to verify GitHub statuses that should have been set by SDM under test
 */

Then("build should succeed", {timeout: 60 * 1000}, async function() {
    await verifySdmBuildState(this.gitRemoteHelper, this.focusRepo, "success");
});

Then("build should fail", {timeout: 60 * 1000}, async function() {
    await verifySdmBuildState(this.gitRemoteHelper, this.focusRepo, "failure");
});

Then("reactions should succeed", {timeout: 60 * 1000}, async function() {
    await verifyCodeReactionState(this.gitRemoteHelper,
        this.focusRepo,
        "success");
});

Then("reviews should succeed", {timeout: 60 * 1000}, async function() {
    await verifyReviewState(this.gitRemoteHelper,
        this.focusRepo,
        "success");
});

Then("it should deploy locally", {timeout: 60 * 1000}, async function() {
    await verifySdmDeploySuccess(this.gitRemoteHelper,
        {owner: this.focusRepo.owner, repo: this.focusRepo.repo, sha: this.focusRepo.sha},
        ds => ds.context.includes("deploy-local"),
        ep => ep.context.includes("2-endpoint"),
        false);
});

Then("it should deploy to staging", {timeout: 60 * 1000}, async function() {
    await verifySdmDeploySuccess(this.gitRemoteHelper,
        {owner: this.focusRepo.owner, repo: this.focusRepo.repo, sha: this.focusRepo.sha},
        ds => ds.context.includes("4-endpoint"),
        ep => ep.context.includes("5-verifyEndpoint"),
        true);
});

Then("it should deploy to production", {timeout: 420 * 1000}, async function() {
    await verifySdmDeploySuccess(this.gitRemoteHelper,
        {owner: this.focusRepo.owner, repo: this.focusRepo.repo, sha: this.focusRepo.sha},
        ds => ds.context.includes("prod-deploy"),
        ep => ep.description.includes("service endpoint in Prod"),
        false,
        allow(seconds(300)).withRetries(100));
});

Then("it should be immaterial", {timeout: 20 * 1000}, async function() {
    const immaterialStatus = await verifyImmaterial(this.gitRemoteHelper, this.focusRepo);
    logger.info("Found required immaterial status %j", immaterialStatus);
});

// Perform approval of endpoint, resetting context
Then(/approve gate (.*)/, {timeout: 20 * 1000}, async function(name) {
    logger.info("About to set approval gate on %j", this.focusRepo);
    const forApprovalStatus = await this.gitRemoteHelper.requiredStatus(this.focusRepo,
        s => !!s && s.context.toLowerCase().includes(name.toLowerCase()) && !!s.target_url && s.target_url.includes(ApprovalSuffix));
    logger.info("Updating approval state %j to approved and proceed", forApprovalStatus);
    const approvedStatus: Status = {
        state: forApprovalStatus.state,
        context: forApprovalStatus.context,
        description: forApprovalStatus.description,
        target_url: forApprovalStatus.target_url.replace(ApprovalSuffix, ""),
    };
    await this.gitRemoteHelper.updateStatus(this.focusRepo, approvedStatus);
});
