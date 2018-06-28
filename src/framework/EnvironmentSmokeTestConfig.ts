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

import { SmokeTestConfig } from "./config";

/**
 * Load config from environment
 */
export const EnvironmentSmokeTestConfig: SmokeTestConfig = {

    atomistTeamId: process.env.ATOMIST_TEAMS || "T5964N9B7",

    atomistTeamName: process.env.ATOMIST_TEAM_NAME || "Atomist",

    baseEndpoint: process.env.SDM_BASE_ENDPOINT || "http://localhost:2866",

    user: "admin",
    password: process.env.LOCAL_ATOMIST_ADMIN_PASSWORD || throwError("Please define LOCAL_ATOMIST_ADMIN_PASSWORD"),

    githubOrg: process.env.SMOKETEST_ORG || "spring-team",

    credentials: {
        token: process.env.GITHUB_TOKEN || throwError("Please define GITHUB_TOKEN"),
    },
};

function throwError(message: string): string {
    throw new Error(message);
}
