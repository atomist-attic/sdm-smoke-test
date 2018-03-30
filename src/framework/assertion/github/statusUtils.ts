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

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { allow, AssertOptions, seconds } from "../AssertOptions";
import { GitHubAssertions, Status } from "./GitHubAssertions";

/**
 * Block for a certain period of time for immaterial status
 * @param {GitHubAssertions} gitRemoteHelper
 * @param {string} owner
 * @param {string} repo
 * @param {string} sha
 * @return {Promise<Status>}
 */
export function waitForImmaterialSuccess(gitRemoteHelper: GitHubAssertions,
                                         owner: string, repo: string,
                                         sha: string,
                                         opts?: AssertOptions): Promise<Status> {
    return gitRemoteHelper.waitForStatusOf(
        new GitHubRepoRef(owner, repo, sha),
        s => s.context.includes("immaterial"),
        "success",
        opts || allow(seconds(40)).withRetries(10),
    );
}
