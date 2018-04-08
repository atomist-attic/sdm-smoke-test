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
import { When } from "cucumber";
import { editOneInvocation, invokeCommandHandler } from "../../../src/framework/invocation/CommandHandlerInvocation";

// Note: We cannot use arrow functions as binding doesn't work

/**
 * Definitions to handle Spring Boot version upgrade
 */

When(/try to upgrade Spring Boot to (.*)/, {timeout: 45 * 1000},async function (version) {
    logger.info("Upgrading Spring boot to %s on %s...", version, this.focusRepo.repo);
    await invokeCommandHandler(this.config,
        editOneInvocation(
            "boot-upgrade",
            this.focusRepo,
            {
                desiredBootVersion: version,
            }));
    logger.info("Handler returned. Waiting for GitHub...");
});
