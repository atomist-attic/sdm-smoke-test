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
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import axios, { AxiosRequestConfig } from "axios";
import { RepoBranchTips } from "../../../typings/types";
import { Dated, GitRemoteAssertions } from "../GitRemoteAssertions";

import * as assert from "power-assert";

import * as _ from "lodash";

import {
    ProjectOperationCredentials,
    TokenCredentials,
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { AssertOptions } from "../AssertOptions";
import { doWithOptions, waitMillis } from "../util/wait";
import Commit = RepoBranchTips.Commit;
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";

export type State = "error" | "failure" | "pending" | "success";

export interface Status {
    state: State;
    target_url?: string;
    description?: string;
    context?: string;
}

export class GitHubAssertions implements GitRemoteAssertions {

    private readonly credentials: TokenCredentials;

    constructor(credentials: ProjectOperationCredentials) {
        this.credentials = credentials as TokenCredentials;
    }

    public async assertRepoExists(params: { owner: string, name: string, opts: AssertOptions }): Promise<any> {
        return null;
    }

    public async statuses(id: RemoteRepoRef,
                          opts?: AssertOptions): Promise<Status[]> {
        assert(!!id.sha, "Sha must be provided in " + JSON.stringify(id));
        return doWithOptions(
            () => listStatuses(this.credentials.token, id as GitHubRepoRef),
            opts,
        );
    }

    public async requiredStatus(id: RemoteRepoRef,
                                test: (s: Status) => boolean,
                                opts?: AssertOptions): Promise<Status> {
        const statuses = await this.statuses(id, opts);
        const it = statuses.find(test);
        assert(!!it, `Status with context [${context}] required on commit ${id.sha}: Found ` + JSON.stringify(statuses));
        return it;
    }

    public clone(id: RemoteRepoRef, opts?: AssertOptions): Promise<GitProject> {
        return doWithOptions(
            () => GitCommandGitProject.cloned(this.credentials, id),
            opts);
    }

    public async lastCommit(id: RemoteRepoRef,
                            opts?: AssertOptions): Promise<(Commit & Dated) | undefined> {
        try {
            assert(!!id.branch, "Branch must be provided in " + JSON.stringify(id));
            const url = `${(id as GitHubRepoRef).apiBase}/repos/${id.owner}/${id.repo}/branches/${id.branch}`;
            logger.debug(`Request to '${url}' to get commits`);
            const resp = await doWithOptions(
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
        } catch (err) {
            return undefined;
        }
    }
}

function  authHeaders(token: string): AxiosRequestConfig {
    return token ? {
            headers: {
                Authorization: `token ${token}`,
            },
        }
        : {};
}

export function listStatuses(token: string, rr: GitHubRepoRef): Promise<Status[]> {
    const config = authHeaders(token);
    const url = `${rr.apiBase}/repos/${rr.owner}/${rr.repo}/commits/${rr.sha}/statuses`;
    return axios.get(url, config)
        .then(ap => ap.data);
}