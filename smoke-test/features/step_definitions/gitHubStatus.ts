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
import { GitHubRemoteHelper, State, Status } from "../../../src/framework/assertion/github/GitHubRemoteHelper";
import {
    ApprovalSuffix,
    verifyCodeReactionState,
    verifyImmaterial, verifyLocalDeploySuccess,
    verifyReviewState,
    verifySdmDeploySuccess,
} from "../../../src/framework/assertion/github/statusUtils";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { SdmGoalState, waitForGoalOf } from "../../../src/framework/assertion/goal/goalUtils";
import { SmokeTestWorld } from "../support/world";
import { AllSdmGoals } from "../../../src/typings/types";
import SdmGoal = AllSdmGoals.SdmGoal;
import {invokeCommandHandler} from "../../../src/framework/invocation/CommandHandlerInvocation";

// Note: We cannot use arrow functions as binding doesn't work

/**
 * Definitions to verify GitHub statuses that should have been set by SDM under test
 */

Then("build should succeed", {timeout: 240 * 1000}, async function() {
    await verifySdmBuildGoalState(this as SmokeTestWorld, this.focusRepo, "success");
});

Then("build should fail", {timeout: 240 * 1000}, async function() {
    await verifySdmBuildGoalState(this as SmokeTestWorld, this.focusRepo, "failure");
});

Then("reactions should succeed", {timeout: 60 * 1000}, async function() {
    await verifyCodeReactionState(this as SmokeTestWorld,
        this.focusRepo,
        "success");
});

Then("reviews should succeed", {timeout: 60 * 1000}, async function() {
    await verifyReviewState(this as SmokeTestWorld,
        this.focusRepo,
        "success");
});

Then("it should deploy locally", {timeout: 60 * 1000}, async function() {
    await verifyLocalDeploySuccess(this as SmokeTestWorld,
        {owner: this.focusRepo.owner, repo: this.focusRepo.repo, sha: this.focusRepo.sha});
});

Then("it should deploy to staging", {timeout: 600 * 1000}, async function() {
    await verifySdmDeploySuccess(this as SmokeTestWorld,
        {owner: this.focusRepo.owner, repo: this.focusRepo.repo, sha: this.focusRepo.sha},
        "Test",
        true,
        allow(seconds(600)).withRetries(100));
});

Then("it should deploy to production", {timeout: 600 * 1000}, async function() {
    await verifySdmDeploySuccess(this as SmokeTestWorld,
        {owner: this.focusRepo.owner, repo: this.focusRepo.repo, sha: this.focusRepo.sha},
        "Prod",
        false,
        allow(seconds(600)).withRetries(100),
        false);
});

Then("it should be immaterial", {timeout: 20 * 1000}, async function() {
    const immaterialStatus = await verifyImmaterial(this as SmokeTestWorld, this.focusRepo);
    logger.info("Found required immaterial status %j", immaterialStatus);
});

// Perform approval of endpoint, resetting context
Then(/approve gate (.*)/, {timeout: 40 * 1000}, async function(name) {
    // really should be pushing the button on the card.
    logger.info("About to set approval gate on %j", this.focusRepo);
    const goal = await waitForGoalOf(
        this as SmokeTestWorld,
        this.focusRepo.sha,
        s => s.name.includes(name),
        "waiting_for_approval",
        allow(seconds(60)).withRetries(6),
    );
    await invokeCommandHandler(this.config, {
        name: "UpdateSdmGoalState",
        parameters: {
            "id": goal.id,
            "state": "success",
        },
        mappedParameters: {},
        secrets: [],
    });
});

export async function verifySdmBuildGoalState(world: SmokeTestWorld,
                                              repo: { owner: string, repo: string, sha: string },
                                              state: SdmGoalState): Promise<SdmGoal> {
    const buildStatus = waitForGoalOf(
        world,
        repo.sha,
        s => s.name.includes("build") && s.state === state,
        state,
        allow(seconds(160)).withRetries(30),
    );
    logger.info("Found build success status");
    return buildStatus;
}
