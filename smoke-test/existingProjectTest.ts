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
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import * as assert from "power-assert";
import { allow, delayFor, seconds } from "../src/framework/assertion/AssertOptions";
import { GitHubAssertions } from "../src/framework/assertion/github/GitHubAssertions";
import { GitRemoteAssertions } from "../src/framework/assertion/GitRemoteAssertions";
import { waitMillis } from "../src/framework/assertion/util/wait";
import { editorOneInvocation, invokeCommandHandler } from "../src/framework/invocation/CommandHandlerInvocation";

const RepoToTest = "losgatos1";

const config = TestConfig;

describe("test against existing project", () => {

    const gitRemoteHelper: GitHubAssertions = new GitHubAssertions(config.credentials);

    it("changes readme and judges immaterial", async () => {
        const repo = GitHubRepoRef.from({owner: config.githubOrg, repo: RepoToTest, branch: "master"});

        const previousTipOfMaster = await gitRemoteHelper.lastCommit(repo);

        const customAffirmation = `Squirrel number ${new Date().getTime()} gnawed industriously`;
        logger.info(`Invoking handler with [${customAffirmation}]...`);

        const handlerResult = await invokeCommandHandler(config,
            editorOneInvocation("affirmation", repo,
                // TODO simplify parameter passing
                [{name: "customAffirmation", value: customAffirmation}]));
        assert(handlerResult.success, "Affirmation handler should have succeeded");
        logger.info("Handler returned. Waiting for GitHub...");

        await waitMillis(seconds(5));
        const currentProject = await gitRemoteHelper.clone(repo);
        const newReadme = currentProject.findFileSync("README.md").getContentSync();
        const gitStatus = await currentProject.gitStatus();
        assert(gitStatus.sha !== previousTipOfMaster.sha);
        logger.info(`Verified new sha ${gitStatus.sha} is not old of ${previousTipOfMaster.sha}`);
        assert(newReadme.includes(customAffirmation));
        logger.info(`Found [${customAffirmation}] in new README`);

        // Now verify context
        const status = await gitRemoteHelper.requiredStatus({
                ...repo,
                sha: gitStatus.sha,
            } as GitHubRepoRef,
            s => s.context.includes("immaterial"),
            allow(seconds(40)).withRetries(10),
        );
        logger.info("Found required status %j", status);
    }).timeout(100000);

});
