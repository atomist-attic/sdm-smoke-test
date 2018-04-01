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
import { Given, Then, When } from "cucumber";
import { GitHubAssertions } from "../../../src/framework/assertion/github/GitHubAssertions";
import { verifySdmBuildSuccess } from "../../../src/framework/assertion/github/statusUtils";
import { SmokeTestConfig } from "../../../src/framework/config";
import { editorOneInvocation, invokeCommandHandler } from "../../../src/framework/invocation/CommandHandlerInvocation";
import { TestConfig } from "../../fixture";
import { edit } from "../../../src/framework/assertion/util/edit";
import { BranchCommit, commitToMaster } from "@atomist/automation-client/operations/edit/editModes";
import { ApacheHeader } from "../support/headers";

const config: SmokeTestConfig = TestConfig;

let focusRepo: { owner: string, repo: string, branch?: string, sha: string };

const gitRemoteHelper = new GitHubAssertions(config.credentials);

Given(/project (.*)/, project => {
    focusRepo = {owner: config.githubOrg, repo: project, sha: undefined};
    logger.info("Focus project is %j", focusRepo);
});

When("README is changed on master", {timeout: 10 * 4000}, async () => {
    const repo = GitHubRepoRef.from(focusRepo);

    const customAffirmation = `Squirrel number ${new Date().getTime()} gnawed industriously`;
    logger.info(`Invoking handler with [${customAffirmation}]...`);

    await invokeCommandHandler(config,
        editorOneInvocation("affirmation", repo,
            {customAffirmation}));
    logger.info("Handler returned. Waiting for GitHub...");

    const currentProject = await gitRemoteHelper.clone(repo, {retries: 5});
    const gitStatus = await currentProject.gitStatus();
    focusRepo.sha = gitStatus.sha;
});

When("README is changed on a new branch", {timeout: 10 * 4000}, async () => {
    const branch = "test-" + new Date().getTime();
    focusRepo.branch = branch;
    const repo = GitHubRepoRef.from(focusRepo);

    const customAffirmation = `Squirrel number ${new Date().getTime()} gnawed industriously`;
    logger.info(`Invoking handler with [${customAffirmation}]...`);

    await invokeCommandHandler(config,
        editorOneInvocation("affirmation", repo,
            {customAffirmation, branch}));
    logger.info("Handler returned. Waiting for GitHub...");

    const currentProject = await gitRemoteHelper.clone(repo, {retries: 5});
    const gitStatus = await currentProject.gitStatus();
    focusRepo.sha = gitStatus.sha;
});

When("Java is changed on master", {timeout: 10 * 4000}, async () => {
    const repo = GitHubRepoRef.from(focusRepo);
    const customAffirmation = `Squirrel number ${new Date().getTime()} gnawed industriously`;
    logger.info(`Invoking handler with [${customAffirmation}]...`);

    await edit(config.credentials,
        repo,
        commitToMaster("Squirrels"),
        async p => p.addFile(
            "src/main/java/Thing.java",
            `${ApacheHeader}\n// ${customAffirmation}\npublic class Thing {}`));

    const currentProject = await gitRemoteHelper.clone(repo, {retries: 5});
    const gitStatus = await currentProject.gitStatus();
    focusRepo.sha = gitStatus.sha;
});

When("Java is changed on a new branch", {timeout: 10 * 4000}, async () => {
    const branch = "test-" + new Date().getTime();
    focusRepo.branch = branch;
    const repo = GitHubRepoRef.from(focusRepo);
    const customAffirmation = `Squirrel number ${new Date().getTime()} gnawed industriously`;
    logger.info(`Invoking editor with [${customAffirmation}]...`);

    await edit(config.credentials,
        repo,
        { message: "Squirrels", branch} as BranchCommit,
        async p => p.addFile(
            "src/main/java/Thing.java",
            `${ApacheHeader}\n// ${customAffirmation}\npublic class Thing {}`));

    const currentProject = await gitRemoteHelper.clone(repo, {retries: 5});
    const gitStatus = await currentProject.gitStatus();
    focusRepo.sha = gitStatus.sha;
});

Then("it should build successfully", {timeout: 60 * 1000}, async () => {
    await verifySdmBuildSuccess(gitRemoteHelper, focusRepo);
});

Then("it should be immaterial", {timeout: 30 * 1000}, () => {
    throw new Error("unimplemented");
});
