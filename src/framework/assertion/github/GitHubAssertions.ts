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

import { RepoBranchTips } from "../../../typings/types";
import Commit = RepoBranchTips.Commit;
import { AxiosRequestConfig } from "axios";
import { logger } from "@atomist/automation-client";
import axios from "axios";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { Dated, GitRemoteAssertions } from "../GitRemoteAssertions";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";

import * as assert from "power-assert";

import * as _ from "lodash";

import { AssertOptions, delayFor } from "../AssertOptions";
import { blowUpInMillis, doWithTimeout, waitMillis } from "../util/wait";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import {
    ProjectOperationCredentials,
    TokenCredentials
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";

export class GitHubAssertions implements GitRemoteAssertions {

    private readonly credentials: TokenCredentials;

    constructor(credentials: ProjectOperationCredentials) {
        this.credentials = credentials as TokenCredentials;
    }

    public async assertRepoExists(params: { owner: string, name: string, opts: AssertOptions }): Promise<any> {
        return null;
    }

    public async lastCommit(id: RemoteRepoRef,
                            opts?: AssertOptions): Promise<Commit & Dated> {
        assert(!!id.branch, "Branch must be provided in " + JSON.stringify(id));

        const url = `${(id as GitHubRepoRef).apiBase}/repos/${id.owner}/${id.repo}/branches/${id.branch}`;
        logger.debug(`Request to '${url}' to get commits`);
        if (!!opts && !!opts.delayForMillis) {
            await waitMillis(opts.delayForMillis);
        }
        const resp = await doWithTimeout(
            () => axios.get(url, authHeaders(this.credentials.token)),
            opts,
        );

        const ghcommit = resp.data.commit;
        const dateString = new Date(_.get(ghcommit, "commit.author.date"));
        logger.debug("Commit is %j", resp.data);
        const date = new Date(dateString);
        return {
            sha: ghcommit.sha,
            message: ghcommit.commit.message,
            committer: {
                login: ghcommit.committer.login,
            },
            date,
        };
    }
}

function authHeaders(token: string): AxiosRequestConfig {
    return token ? {
            headers: {
                Authorization: `token ${token}`,
            },
        }
        : {};
}
