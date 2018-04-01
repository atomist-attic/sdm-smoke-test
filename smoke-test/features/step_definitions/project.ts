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
import { BranchCommit, commitToMaster } from "@atomist/automation-client/operations/edit/editModes";
import { defineSupportCode, Given, Then, When } from "cucumber";
import { verifySdmBuildSuccess } from "../../../src/framework/assertion/github/statusUtils";
import { edit } from "../../../src/framework/assertion/util/edit";
import { editorOneInvocation, invokeCommandHandler } from "../../../src/framework/invocation/CommandHandlerInvocation";
import { ApacheHeader } from "../support/headers";
import { SmokeTestWorld } from "../support/world";

import * as assert from "power-assert";

// TODO pull this out
defineSupportCode( ({setWorldConstructor: world}) => {
    world(SmokeTestWorld);
});

// Note: We cannot use arrow functions as binding doesn't work

Given(/project (.*)/, function(project) {
    this.focusRepo = {owner: this.config.githubOrg, repo: project, sha: undefined};
    logger.info("Focus project is %j", this.focusRepo);
});

When("README is changed on master", {timeout: 10 * 4000}, async function() {
    const repo = GitHubRepoRef.from(this.focusRepo);

    const customAffirmation = `Squirrel number ${new Date().getTime()} gnawed industriously`;
    logger.info(`Invoking handler with [${customAffirmation}]...`);

    await invokeCommandHandler(this.config,
        editorOneInvocation("affirmation", repo,
            {customAffirmation}));
    logger.info("Handler returned. Waiting for GitHub...");

    assert(!!this.gitRemoteHelper, "Remote helper must be set");
    const currentProject = await this.gitRemoteHelper.clone(repo, {retries: 5});
    const gitStatus = await currentProject.gitStatus();
    this.focusRepo.sha = gitStatus.sha;
});

When("README is changed on a new branch", {timeout: 10 * 4000}, async function() {
    const branch = "test-" + new Date().getTime();
    this.focusRepo.branch = branch;
    const repo = GitHubRepoRef.from(this.focusRepo);

    const customAffirmation = `Squirrel number ${new Date().getTime()} gnawed industriously`;
    logger.info(`Invoking handler with [${customAffirmation}]...`);

    await invokeCommandHandler(this.config,
        editorOneInvocation("affirmation", repo,
            {customAffirmation, branch}));
    logger.info("Handler returned. Waiting for GitHub...");

    const currentProject = await this.gitRemoteHelper.clone(repo, {retries: 5});
    const gitStatus = await currentProject.gitStatus();
    this.focusRepo.sha = gitStatus.sha;
});

When("Java is changed on master", {timeout: 10 * 4000}, async function() {
    const repo = GitHubRepoRef.from(this.focusRepo);
    const customAffirmation = `Squirrel number ${new Date().getTime()} gnawed industriously`;
    logger.info(`Invoking editor with [${customAffirmation}]...`);

    await edit(this.config.credentials,
        repo,
        commitToMaster("Squirrels"),
        async p => p.addFile(
            "src/main/java/Thing.java",
            `${ApacheHeader}\n// ${customAffirmation}\npublic class Thing {}`));

    const currentProject = await this.gitRemoteHelper.clone(repo, {retries: 5});
    const gitStatus = await currentProject.gitStatus();
    this.focusRepo.sha = gitStatus.sha;
});

When("Java is changed on a new branch", {timeout: 10 * 4000}, async function() {
    const branch = "test-" + new Date().getTime();
    const customAffirmation = `Squirrel number ${new Date().getTime()} gnawed industriously`;
    logger.info(`Invoking editor with [${customAffirmation}]...`);
    const repo = GitHubRepoRef.from(this.focusRepo);
    this.focusRepo.branch = branch;

    await edit(this.config.credentials,
        repo,
        { message: "Squirrels", branch} as BranchCommit,
        async p => p.addFile(
            "src/main/java/Thing.java",
            `${ApacheHeader}\n// ${customAffirmation}\npublic class Thing {}`));

    const currentProject = await this.gitRemoteHelper.clone(repo, {retries: 5});
    const gitStatus = await currentProject.gitStatus();
    this.focusRepo.sha = gitStatus.sha;
});

Then("it should build successfully", {timeout: 60 * 1000}, async function() {
    await verifySdmBuildSuccess(this.gitRemoteHelper, this.focusRepo);
});

Then("it should be immaterial", {timeout: 30 * 1000}, async function() {
    throw new Error("unimplemented");
});
