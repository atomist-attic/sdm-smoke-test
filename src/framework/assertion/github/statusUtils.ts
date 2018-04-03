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

export const ApprovalSuffix = "atomist:approve=true";

export async function verifyImmaterial(gitRemoteHelper: GitHubRemoteHelper,
                                       repo: { owner: string, repo: string, sha: string }): Promise<Status> {
    const codeReactionStatus = await gitRemoteHelper.waitForStatusOf(
        new GitHubRepoRef(repo.owner, repo.repo, repo.sha),
        s => s.context.includes("immaterial"),
        "success",
        allow(seconds(15)).withRetries(3),
    );
    logger.info("Found code reaction success status");
    return codeReactionStatus;
}

export async function verifyCodeReactionState(gitRemoteHelper: GitHubRemoteHelper,
                                              repo: { owner: string, repo: string, sha: string },
                                              state: State): Promise<Status> {
    const codeReactionStatus = await gitRemoteHelper.waitForStatusOf(
        new GitHubRepoRef(repo.owner, repo.repo, repo.sha),
        s => s.context.includes("react"),
        state,
        allow(seconds(20)).withRetries(10),
    );
    logger.info("Found code reaction success status");
    return codeReactionStatus;
}

export async function verifyReviewState(gitRemoteHelper: GitHubRemoteHelper,
                                        repo: { owner: string, repo: string, sha: string },
                                        state: State): Promise<Status> {
    const reviewStatus = await gitRemoteHelper.waitForStatusOf(
        new GitHubRepoRef(repo.owner, repo.repo, repo.sha),
        s => s.context.includes("review"),
        state,
        allow(seconds(20)).withRetries(10),
    );
    logger.info("Found code review success status");
    return reviewStatus;
}

export async function verifySdmBuildState(gitRemoteHelper: GitHubRemoteHelper,
                                          repo: { owner: string, repo: string, sha: string },
                                          state: State): Promise<Status> {
    const buildStatus = await gitRemoteHelper.waitForStatusOf(
        new GitHubRepoRef(repo.owner, repo.repo, repo.sha),
        s => s.context.includes("build"),
        state,
        allow(seconds(80)).withRetries(15),
    );
    logger.info("Found build success status");
    return buildStatus;
}

export interface DeploymentStatuses {
    deployStatus: Status;
    endpointStatus: Status;
}

export async function verifySdmDeploySuccess(gitRemoteHelper: GitHubRemoteHelper,
                                             repo: { owner: string, repo: string, sha: string },
                                             deployStatusTest: (s: Status) => boolean,
                                             endpointStatusTest: (s: Status) => boolean,
                                             askForApproval: boolean,
                                             deployOptions?: AssertOptions): Promise<DeploymentStatuses> {
    const grr = new GitHubRepoRef(repo.owner, repo.repo, repo.sha);
    const deployStatus = await gitRemoteHelper.waitForStatusOf(
        grr,
        deployStatusTest,
        "success",
        deployOptions || allow(seconds(80)).withRetries(15),
    );
    logger.info("Found deploy success status");

    const endpointStatus = await gitRemoteHelper.waitForStatusOf(
        grr,
        endpointStatusTest,
        "success",
        allow(seconds(30)).withRetries(5),
    );
    logger.info("Found endpoint success status");

    assert(!!endpointStatus.target_url, "Target URL should be set on endpoint");
    if (askForApproval) {
        assert(endpointStatus.target_url.endsWith(ApprovalSuffix),
            `Endpoint status ${statusString(endpointStatus)} should seek approval`);
    } else {
        assert(!endpointStatus.target_url.includes("atomist:approve=true"),
            `Endpoint status ${statusString(endpointStatus)} should not seek approval`);
    }
    try {
        await verifyGet(endpointStatus.target_url);
        logger.info("Verified endpoint at " + endpointStatus.target_url);
        return {deployStatus, endpointStatus};
    } catch (err) {
        throw new Error(`Failed to verify reported deployment of ${JSON.stringify(repo)} at ${endpointStatus.target_url}: ${err.messageClient}`);
    }
}
