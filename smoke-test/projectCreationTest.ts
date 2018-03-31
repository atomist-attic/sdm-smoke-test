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

import "mocha";

import { logger } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import * as assert from "power-assert";
import { GitHubAssertions } from "../src/framework/assertion/github/GitHubAssertions";
import { waitForSuccessOf } from "../src/framework/assertion/github/statusUtils";
import { invokeCommandHandler } from "../src/framework/invocation/CommandHandlerInvocation";
import { TestConfig } from "./fixture";

const config = TestConfig;

const RepoToCreate = "foo1";

describe("project creation", () => {

    describe("spring boot project creation", () => {

        const gitRemoteHelper: GitHubAssertions = new GitHubAssertions(config.credentials);

        it("create a project and verify it exists", async () => {
            const repo = GitHubRepoRef.from({owner: config.githubOrg, repo: RepoToCreate});
            await invokeCommandHandler(config,
                {
                    name: "springBootGenerator",
                    parameters: { "target.repo": RepoToCreate, "rootPackage": "com.atomist"},
                });
            logger.info("Handler returned. Waiting for GitHub...");

            const createdProject = await gitRemoteHelper.clone(repo, {retries: 5});

            // // Now verify context
            // const immaterialStatus = await waitForSuccessOf(gitRemoteHelper, repo.owner, repo.repo, gitStatus.sha,
            //     s => s.context.includes("immaterial"));
            // logger.info("Found required immaterial status %j", immaterialStatus);
        }).timeout(100000);

    });

});
