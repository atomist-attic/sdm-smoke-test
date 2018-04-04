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

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { Given, Then, When } from "cucumber";

// Note: We cannot use arrow functions as binding doesn't work

/**
 * Definitions to set and capture focus project
 */

Given(/existing github.com project (.*)/, function(project) {
    this.setGitHubFocus( GitHubRepoRef.from({owner: this.config.githubOrg, repo: project, sha: undefined}));
});

// Save the current sha as name
When(/save as (.*)/, function(name) {
    this.save(name);
});

Then(/load (.*)/, function(name) {
    this.load(name);
});
