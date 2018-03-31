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
import { TestConfig } from "./fixture";

import { logger } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { BranchCommit } from "@atomist/automation-client/operations/edit/editModes";
import * as assert from "power-assert";
import { GitHubAssertions } from "../src/framework/assertion/github/GitHubAssertions";
import { verifySdmBuildSuccess } from "../src/framework/assertion/github/statusUtils";
import { edit } from "../src/framework/assertion/util/edit";
import { editorOneInvocation, invokeCommandHandler } from "../src/framework/invocation/CommandHandlerInvocation";

const RepoToTest = "java-hello-world-maven";

const config = TestConfig;

describe("test against existing Java library", () => {

    const gitRemoteHelper: GitHubAssertions = new GitHubAssertions(config.credentials);

    describe("immaterial changes", () => {

        it("changes README and rebuilds", async () => {
            const repo = GitHubRepoRef.from({owner: config.githubOrg, repo: RepoToTest, branch: "master"});
            const previousTipOfMaster = await gitRemoteHelper.lastCommit(repo);

            const customAffirmation = `Squirrel number ${new Date().getTime()} gnawed industriously`;
            logger.info(`Invoking handler with [${customAffirmation}]...`);

            await invokeCommandHandler(config,
                editorOneInvocation("affirmation", repo,
                    {customAffirmation}));
            logger.info("Handler returned. Waiting for GitHub...");

            const currentProject = await gitRemoteHelper.clone(repo, {retries: 5});
            const newReadme = currentProject.findFileSync("README.md").getContentSync();
            const gitStatus = await currentProject.gitStatus();
            assert(gitStatus.sha !== previousTipOfMaster.sha);
            logger.info(`Verified new sha ${gitStatus.sha} is not old of ${previousTipOfMaster.sha}`);
            assert(newReadme.includes(customAffirmation));
            logger.info(`Found [${customAffirmation}] in new README`);

            await verifySdmBuildSuccess(gitRemoteHelper,
                { owner: repo.owner, repo: repo.repo, sha: gitStatus.sha});
        }).timeout(100000);

        it("changes README on a branch and rebuilds", async () => {
            const branch = "test-" + new Date().getTime();
            const repo = GitHubRepoRef.from({owner: config.githubOrg, repo: RepoToTest, branch});

            const customAffirmation = `Squirrel number ${new Date().getTime()} gnawed industriously`;
            logger.info(`Invoking handler with [${customAffirmation}]...`);

            await invokeCommandHandler(config,
                editorOneInvocation("affirmation", repo,
                    {customAffirmation, branch},
                ));
            logger.info("Handler returned. Waiting for GitHub...");

            const currentProject = await gitRemoteHelper.clone(repo, {retries: 5});
            const newReadme = currentProject.findFileSync("README.md").getContentSync();
            const gitStatus = await currentProject.gitStatus();
            assert(newReadme.includes(customAffirmation));
            logger.info(`Found [${customAffirmation}] in new README`);

            await verifySdmBuildSuccess(gitRemoteHelper,
                { owner: repo.owner, repo: repo.repo, sha: gitStatus.sha});
        }).timeout(100000);

    });

    describe("material changes", () => {

        it("changes Java on a branch and sees build", async () => {
            const branch = "test-" + new Date().getTime();
            const master = GitHubRepoRef.from({owner: config.githubOrg, repo: RepoToTest});

            const customAffirmation = `Squirrel number ${new Date().getTime()} gnawed industriously`;

            await edit(config.credentials,
                master,
                {branch, message: "Squirrels"} as BranchCommit,
                async p => p.addFile(
                    "src/main/java/Thing.java",
                    `// ${customAffirmation}\n// ${branch}\npublic class Thing {}`));

            logger.info("Edit made. Waiting for GitHub...");
            const repo = GitHubRepoRef.from({owner: config.githubOrg, repo: RepoToTest, branch});

            const currentProject = await gitRemoteHelper.clone(repo, {retries: 5});
            const gitStatus = await currentProject.gitStatus();

            await verifySdmBuildSuccess(gitRemoteHelper,
                { owner: repo.owner, repo: repo.repo, sha: gitStatus.sha});
        }).timeout(100000);

    });

});
