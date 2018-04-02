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
import { When } from "cucumber";
import { invokeCommandHandler } from "../../../src/framework/invocation/CommandHandlerInvocation";

When(/we create a new Spring Boot Project named (.*)/, {timeout: 45 * 1000}, async function(repo) {
    const grr = GitHubRepoRef.from({owner: this.config.githubOrg, repo});
    logger.info("Creating project named %s...", repo);
    this.registerCreated(grr);
    await invokeCommandHandler(this.config,
        {
            name: "springBootGenerator",
            parameters: {
                "target.repo": repo,
                "rootPackage": "com.atomist"},
        });
    logger.info("Handler returned. Waiting for GitHub...");
});
