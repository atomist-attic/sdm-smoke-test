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
import { allow, seconds } from "../AssertOptions";
import { verifyGet } from "../util/endpoint";
import { GitHubRemoteHelper, State, Status } from "./GitHubRemoteHelper";

import * as assert from "power-assert";

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
                                             repo: { owner: string, repo: string, sha: string }): Promise<DeploymentStatuses> {
    const grr = new GitHubRepoRef(repo.owner, repo.repo, repo.sha);
    const deployStatus = await gitRemoteHelper.waitForStatusOf(
        grr,
        s => s.context.includes("deploy"),
        "success",
        allow(seconds(80)).withRetries(15),
    );
    logger.info("Found deploy success status");

    const endpointStatus = await await gitRemoteHelper.waitForStatusOf(
        grr,
        s => s.context.includes("endpoint"),
        "success",
        allow(seconds(5)).withRetries(5),
    );
    logger.info("Found endpoint success status");

    assert(!!endpointStatus.target_url, "Target URL should be set on endpoint");
    const resp = await verifyGet(endpointStatus.target_url);
    logger.info("Verified endpoint at " + endpointStatus.target_url);
    return {deployStatus, endpointStatus};
}
