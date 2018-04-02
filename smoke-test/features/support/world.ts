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

import { setWorldConstructor } from "cucumber";
import { GitHubAssertions } from "../../../src/framework/assertion/github/GitHubAssertions";
import { SmokeTestConfig } from "../../../src/framework/config";
import { EnvironmentSmokeTestConfig } from "../../../src/framework/EnvironmentSmokeTestConfig";

import { logger } from "@atomist/automation-client";
import * as assert from "power-assert";

export interface Repo {
    owner: string;
    repo: string;
    branch?: string;
    sha: string;
}

/**
 * World with basic setup and enabling focus repo to be set,
 * saved and loaded.
 */
export class SmokeTestWorld {

    public focusRepo: Repo;

    public readonly config: SmokeTestConfig = EnvironmentSmokeTestConfig;

    public readonly gitRemoteHelper = new GitHubAssertions(this.config.credentials);

    /**
     * Set the focus repo
     * @param {Repo} repo
     */
    public setFocus(repo: Repo): Repo {
        this.focusRepo = repo;
        logger.info("Set focus project to %j", repo);
        return this.focusRepo;
    }

    /**
     * Save the current SHA
     * @param {string} name
     */
    public save(name: string) {
        assert(!!this.focusRepo, `Focus repo must be set to save as [${name}]`);
        this[key(name)] = this.focusRepo;
        logger.info("Saved focus repo %j as %s", this.focusRepo, name);
    }

    public load(name: string): Repo {
        const focus = this[key(name)];
        assert(!!focus, `No repo saved as [${name}]`);
        return this.setFocus(focus);
    }

}

function key(name: string): string {
    return "focus_" + name;
}

setWorldConstructor(SmokeTestWorld);
