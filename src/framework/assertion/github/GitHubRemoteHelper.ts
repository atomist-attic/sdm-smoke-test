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
import { GitHubRepoRef, isGitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { RemoteRepoRef, RepoId } from "@atomist/automation-client/operations/common/RepoId";
import axios, { AxiosPromise, AxiosRequestConfig } from "axios";
import { RepoBranchTips } from "../../../typings/types";
import { Dated, GitRemoteHelper } from "../GitRemoteHelper";

import * as assert from "power-assert";

import * as _ from "lodash";

import {
    ProjectOperationCredentials,
    TokenCredentials,
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import Commit = RepoBranchTips.Commit;
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { AssertOptions } from "../AssertOptions";
import { doWithOptions, FatalError } from "../util/retry";
import { doWithRetry } from "@atomist/automation-client/util/retry";

export type State = "error" | "failure" | "pending" | "success";

export interface Status {
    state: State;
    target_url?: string;
    description?: string;
    context?: string;
}

export class GitHubRemoteHelper implements GitRemoteHelper {

    private readonly credentials: TokenCredentials;

    constructor(credentials: ProjectOperationCredentials) {
        assert(!!credentials, "Credentials must be set");
        this.credentials = credentials as TokenCredentials;
    }

    public async assertRepoExists(params: { owner: string, name: string, opts: AssertOptions }): Promise<any> {
        return null;
    }

    public async statuses(id: RemoteRepoRef,
                          opts?: AssertOptions): Promise<Status[]> {
        assert(!!id.sha, "Sha must be provided in " + JSON.stringify(id));
        return doWithOptions(
            () => this.listStatuses(id as GitHubRepoRef),
            `get statuses for ${id.sha}`,
            opts,
        );
    }

    public async requiredStatus(id: RemoteRepoRef,
                                test: (s: Status) => boolean,
                                opts?: AssertOptions): Promise<Status> {
        const statuses = await this.statuses(id, opts);
        const it = statuses.find(test);
        if (!it) {
            throw new Error(`Status satisfying [${test}] required on commit ${id.sha}: Found ` + statusesString(statuses));
        }
        logger.info("Found matching status: %s for %s", statusString(it), test.toString());
        return it;
    }

    public updateStatus(rr: GitHubRepoRef, inputStatus: Status): AxiosPromise {
        const saferStatus = inputStatus; // ensureValidUrl(inputStatus);
        const url = `${rr.apiBase}/repos/${rr.owner}/${rr.repo}/statuses/${rr.sha}`;
        logger.info("Updating github status: %s to %j", url, saferStatus);
        return doWithRetry(() => axios.post(url, saferStatus, this.authHeaders)
            .catch(err =>
                Promise.reject(new Error(`Error hitting ${url} to set status ${JSON.stringify(saferStatus)}: ${err.message}`)),
            ), `Updating github status: ${url} to ${JSON.stringify(saferStatus)}`, {});
    }

    public async waitForStatusOf(id: RemoteRepoRef,
                                 test: (s: Status) => boolean,
                                 state: State,
                                 opts?: AssertOptions): Promise<Status> {
        return doWithOptions(async () => {
                logger.debug(`Looking for status satisfying [${test}] on commit ${id.sha}; options=${JSON.stringify(opts)}...`);
                const statuses = await this.statuses(id);
                const it = statuses.find(s => test(s));
                if (!it) {
                    throw new Error(`Not there: Status satisfying [${test}] required on commit ${id.sha}: Found ` + statusesString(statuses));
                }
                if (it.state === "failure" && state !== "failure") {
                    throw new FatalError(`Failed state: Status satisfying [${test}] required on commit ${id.sha}: Found ` + statusesString(statuses));
                }
                if (it.state !== state) {
                    throw new Error(`Keeping looking: Status satisfying [${test}] required on commit ${id.sha}: Found ` + statusesString(statuses));
                }
                return it;
            }, `Waiting for status satisfying [${test}] and state [${state}] on commit ${id.sha}`,
            opts);
    }

    public clone(id: RemoteRepoRef, opts?: AssertOptions): Promise<GitProject> {
        return doWithOptions(
            () => GitCommandGitProject.cloned(this.credentials, id),
            `clone ${JSON.stringify(id)})`,
            opts);
    }

    public async lastCommit(id: RemoteRepoRef,
                            opts?: AssertOptions): Promise<(Commit & Dated) | undefined> {
        try {
            assert(!!id.branch, "Branch must be provided in " + JSON.stringify(id));
            const url = `${(id as GitHubRepoRef).apiBase}/repos/${id.owner}/${id.repo}/branches/${id.branch}`;
            logger.debug(`Request to '${url}' to get commits`);
            const resp = await doWithOptions(
                () => axios.get(url, this.authHeaders),
                `get commits for ${JSON.stringify(id)} d `,
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

    public async deleteRepo(id: RepoId): Promise<boolean> {
        // TODO what about GHE
        const grr = new GitHubRepoRef(id.owner, id.repo);
        try {
            await axios.delete(`${grr.apiBase}/repos/${grr.owner}/${grr.repo}`, this.authHeaders);
            return true;
        } catch (err) {
            logger.warn("Error deleting repo %j: %s", id, err.message);
            return false;
        }
    }

    public async waitForTopic(rr: RemoteRepoRef, topic: string, opts?: AssertOptions): Promise<boolean> {
        const headers = {
            headers: {
                ...this.authHeaders.headers,
                Accept: "application/vnd.github.mercy-preview+json",
            },
        };
        const grr = isGitHubRepoRef(rr) ? rr : new GitHubRepoRef(rr.owner, rr.repo, rr.sha);
        const url = `${grr.apiBase}/repos/${grr.owner}/${grr.repo}/topics`;
        return doWithOptions(
            async () => {
                const topics = await axios.get(url, headers);
                if (!topics.data.names.includes(topic)) {
                    throw new Error(`Cannot see topic '${topic}' yet on ${JSON.stringify(rr)}`);
                }
                return topics.data.names;
            },
            `look for topic '${topic}' on ${JSON.stringify(rr)})`,
            opts);
    }

    private get authHeaders(): AxiosRequestConfig {
        return {
            headers: {
                Authorization:
                    `token ${this.credentials.token}`,
            },
        };
    }

    private listStatuses(rr: GitHubRepoRef): Promise<Status[]> {
        const url = `${rr.apiBase}/repos/${rr.owner}/${rr.repo}/commits/${rr.sha}/statuses`;
        return axios.get(url, this.authHeaders)
            .then(ap => ap.data);
    }

}

function statusesString(statuses: Status[]) {
    return `${statuses.length} statuses: \n${statuses
        .map(statusString).join("\n\t")}`;
}

export function statusString(s: Status) {
    return `context='${s.context}';state='${s.state}';target_url=${s.target_url};description='${s.description}'`;
}
