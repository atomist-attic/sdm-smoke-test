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
import { GitHubAssertions, Status } from "./GitHubAssertions";

import * as assert from "power-assert";

/**
 * Block for a certain period of time for a successful status
 * @param {GitHubAssertions} gitRemoteHelper
 * @param {string} owner
 * @param {string} repo
 * @param {string} sha
 * @return {Promise<Status>}
 */
export function waitForSuccessOf(gitRemoteHelper: GitHubAssertions,
                                 owner: string, repo: string,
                                 sha: string,
                                 test: (s: Status) => boolean,
                                 opts?: AssertOptions): Promise<Status> {
    return gitRemoteHelper.waitForStatusOf(
        new GitHubRepoRef(owner, repo, sha),
        test,
        "success",
        opts || allow(seconds(40)).withRetries(10),
    );
}

export async function verifyCodeReactionSuccess(gitRemoteHelper: GitHubAssertions,
                                                repo: { owner: string, repo: string, sha: string }): Promise<Status> {
    const codeReactionStatus = await waitForSuccessOf(gitRemoteHelper, repo.owner, repo.repo, repo.sha,
        s => s.context.includes("react"),
        allow(seconds(15)).withRetries(8),
    );
    logger.info("Found code reaction success status");
    return codeReactionStatus;
}

export async function verifySdmBuildSuccess(gitRemoteHelper: GitHubAssertions,
                                            repo: { owner: string, repo: string, sha: string }): Promise<Status> {
    const buildStatus = await waitForSuccessOf(gitRemoteHelper, repo.owner, repo.repo, repo.sha,
        s => s.context.includes("build"),
        allow(seconds(80)).withRetries(10),
    );
    logger.info("Found build success status");
    return buildStatus;
}

export async function verifySdmDeploy(gitRemoteHelper: GitHubAssertions,
                                      repo: { owner: string, repo: string, sha: string }): Promise<Status> {

    const deployStatus = await waitForSuccessOf(gitRemoteHelper, repo.owner, repo.repo, repo.sha,
        s => s.context.includes("deploy"),
        allow(seconds(80)).withRetries(10),
    );
    logger.info("Found deploy success status");

    const endpointStatus = await waitForSuccessOf(gitRemoteHelper, repo.owner, repo.repo, repo.sha,
        s => s.context.includes("endpoint"),
        allow(seconds(5)).withRetries(2),
    );
    logger.info("Found endpoint success status");

    assert(!!endpointStatus.target_url, "Target URL should be set on endpoint");
    const resp = await verifyGet(endpointStatus.target_url);
    logger.info("Verified endpoint at " + endpointStatus.target_url);
    return endpointStatus;
}
