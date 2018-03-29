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

import { DefaultReviewComment } from "@atomist/automation-client/operations/review/ReviewResult";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import { saveFromFiles } from "@atomist/automation-client/project/util/projectUtils";
import "mocha";
import { ReviewerRegistration } from "../../../../../src/common/delivery/code/codeActionRegistrations";
import { executeReview } from "../../../../../src/common/delivery/code/review/executeReview";
import { TruePushTest } from "../../../listener/support/pushTestUtilsTest";
import { SingleProjectLoader } from "../../../SingleProjectLoader";

const HatesTheWorld: ReviewerRegistration = {
    name: "hatred",
    pushTest: TruePushTest,
    action: async p => ({
        repoId: p.id,
        comments: await saveFromFiles(p, "**/*.*", f =>
            new DefaultReviewComment("info", "hater",
                `Found a file at \`${f.path}\`: We hate all files`,
                {
                    path: f.path,
                    lineFrom1: 1,
                    offset: -1,
                })),
    }),
    options: { reviewOnlyChangedFiles: false},
};

describe("executeReview", () => {

    // it("should be clean on empty", async () => {
    //     const p = InMemoryProject.of();
    //     const ge = executeReview(new SingleProjectLoader(p), [HatesTheWorld]);
    //     await ge(null, null, null);
    // });

});
