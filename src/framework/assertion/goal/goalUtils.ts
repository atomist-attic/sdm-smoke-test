/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { AssertOptions } from "../AssertOptions";
import { doWithOptions, FatalError } from "../util/retry";
import { SmokeTestWorld } from "../../../../smoke-test/features/support/world";
import { AllSdmGoals } from "../../../typings/types";
import { logger } from "@atomist/automation-client";
import SdmGoal = AllSdmGoals.SdmGoal;

export type SdmGoalState =
    "planned"
    | "requested"
    | "in_process"
    | "waiting_for_approval"
    | "success"
    | "failure"
    | "skipped";

export async function waitForGoalOf(world: SmokeTestWorld,
                                    sha: string,
                                    test: (g: SdmGoal) => boolean,
                                    state: SdmGoalState,
                                    opts?: AssertOptions): Promise<SdmGoal> {
    return doWithOptions(async () => {
            logger.debug(`Looking for goal satisfying [${test}] on commit ${sha}; options=${JSON.stringify(opts)}...`);
            const result = await world.graphClient.executeQueryFromFile<AllSdmGoals.Query, AllSdmGoals.Variables>(
                "src/graphql/query/AllSdmGoals", {
                    sha: [sha],
                });
            const goals: AllSdmGoals.SdmGoal[] = result.SdmGoal;
            const testedGoals = goals.filter(test);
            logger.info(`Looking for goal satisfying [${test}] with state '${state}' on commit ${sha}.`);
            const foundGoal = testedGoals.find(g => g.state === state);
            if (foundGoal) {
                return foundGoal;
            }
            if (testedGoals.find(g => g.state === "failure")) {
                const msg = `Failed state: Status satisfying [${test}] required on commit ${sha}.`;
                logger.error(msg + `\n Found ${goalsString(goals)}`);
                throw new FatalError(msg + goalsString(goals));
            }
            const msg = `Keep looking for Goal satisfying [${test}] required on commit ${sha}.`;
            logger.error(msg + `\n Found ${goalsString(goals)}`);
            throw new Error(msg + goalsString(goals));
        }, `Waiting for status satisfying [${test}] and state [${state}] on commit ${sha}`,
        opts);
}

function goalsString(goals: SdmGoal[]) {
    return `\n${goals.length} goals: \n\t${goals.map(goalString).join("\n\t")}`;
}

export function goalString(s: SdmGoal) {
    return `${s.name} - ${s.environment} : ${s.state} (${s.url})`;
}
