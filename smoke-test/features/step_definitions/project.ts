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

const config: SmokeTestConfig = TestConfig;

let focusRepo: { owner: string, repo: string, sha?: string };

const gitRemoteHelper = new GitHubAssertions(config.credentials);

Given(/project (.*)/, project => {
    focusRepo = {owner: config.githubOrg, repo: project};
    logger.info("Focus project is %j", focusRepo);
});

When("README is changed", {timeout: 10 * 4000}, async () => {
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

Then("it should build", {timeout: 60 * 1000}, async () => {
    await verifySdmBuildSuccess(gitRemoteHelper,
        {owner: focusRepo.owner, repo: focusRepo.repo, sha: focusRepo.sha});
});

Then("it should be immaterial", {timeout: 30 * 1000}, () => {
    throw new Error("unimplemented");
});
