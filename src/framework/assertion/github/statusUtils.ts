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
import { allow, AssertOptions, seconds } from "../AssertOptions";
import { verifyGet } from "../util/endpoint";
import { GitHubRemoteHelper, State, Status, statusString } from "./GitHubRemoteHelper";

import * as assert from "power-assert";
import {SmokeTestWorld} from "../../../../smoke-test/features/support/world";
import {goalString, SdmGoalState, waitForGoalOf} from "../goal/goalUtils";
import {AllSdmGoals} from "../../../typings/types";
import SdmGoal = AllSdmGoals.SdmGoal;

export const ApprovalSuffix = "atomist:approve=true";

export async function verifyImmaterial(world: SmokeTestWorld,
                                       repo: { owner: string, repo: string, sha: string }): Promise<SdmGoal> {
    const goal = await waitForGoalOf(
        world,
        repo.sha,
        s => s.name.includes("immaterial"),
        "success",
        allow(seconds(30)).withRetries(6),
    );
    logger.info("Found immaterial success status");
    return goal;
}

export async function verifyCodeReactionState(world: SmokeTestWorld,
                                              repo: { owner: string, repo: string, sha: string },
                                              state: SdmGoalState): Promise<SdmGoal> {
    const goal = await waitForGoalOf(
        world,
        repo.sha,
        s => s.name.includes("react"),
        state,
        allow(seconds(40)).withRetries(20),
    );
    logger.info(`Found code reaction with state = ${state}`);
    return goal;
}

export async function verifyReviewState(world: SmokeTestWorld,
                                        repo: { owner: string, repo: string, sha: string },
                                        state: SdmGoalState): Promise<SdmGoal> {
    const goal = await waitForGoalOf(
        world,
        repo.sha,
        s => s.name.includes("review"),
        state,
        allow(seconds(80)).withRetries(20),
    );
    logger.info(`Found code review with state = ${state}`);
    return goal;
}

export interface DeploymentGoals {
    deployGoal: SdmGoal;
    locateGoal: SdmGoal;
    verifyGoal: SdmGoal;
}

export async function verifySdmDeploySuccess(world: SmokeTestWorld,
                                             repo: { owner: string, repo: string, sha: string },
                                             env: string,
                                             askForApproval: boolean,
                                             deployOptions?: AssertOptions): Promise<DeploymentGoals> {
    const deployGoal = await waitForGoalOf(
        world,
        repo.sha,
        ds => ds.name.includes(`deploy to ${env}`),
        "success",
        deployOptions || allow(seconds(80)).withRetries(15),
    );
    logger.info("Found deploy success goal");

    const locateGoal = await waitForGoalOf(
        world,
        repo.sha,
        ep => ep.name.includes(`locate service endpoint in ${env}`),
        "success",
        allow(seconds(30)).withRetries(5),
    );
    logger.info("Found locate success goal");

    const verifyGoal = await waitForGoalOf(
        world,
        repo.sha,
        ep => ep.name.includes(`verify ${env} deployment`),
        askForApproval ? "waiting_for_approval" : "success",
        allow(seconds(30)).withRetries(5),
    );
    logger.info("Found verify success goal");

    assert(!!locateGoal.url, "URL should be set on endpoint");
    try {
        await verifyGet(locateGoal.url);
        logger.info("Verified endpoint at " + locateGoal.url);
        return {deployGoal, locateGoal, verifyGoal};
    } catch (err) {
        throw new Error(`Failed to verify reported deployment of ${JSON.stringify(repo)} at ${locateGoal.url}: ${err.messageClient}`);
    }
}

export async function verifyLocalDeploySuccess(world: SmokeTestWorld,
                                             repo: { owner: string, repo: string, sha: string },
                                             deployOptions?: AssertOptions): Promise<DeploymentGoals> {
    const deployGoal = await waitForGoalOf(
        world,
        repo.sha,
        ds => ds.name.includes(`deploy-locally`),
        "success",
        deployOptions || allow(seconds(80)).withRetries(15),
    );
    logger.info("Found deploy success goal");

    const locateGoal = await waitForGoalOf(
        world,
        repo.sha,
        ep => ep.name.includes(`locate local service endpoint`),
        "success",
        allow(seconds(30)).withRetries(5),
    );
    logger.info("Found locate success goal");

    assert(!!locateGoal.url, "URL should be set on endpoint");
    try {
        await verifyGet(locateGoal.url);
        logger.info("Verified endpoint at " + locateGoal.url);
        return {deployGoal, locateGoal, verifyGoal: undefined};
    } catch (err) {
        throw new Error(`Failed to verify reported deployment of ${JSON.stringify(repo)} at ${locateGoal.url}: ${err.messageClient}`);
    }
}
