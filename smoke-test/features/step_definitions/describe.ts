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

import { Then } from "cucumber";
import { stringify } from "querystring";
import { invokeCommandHandler } from "../../../src/framework/invocation/CommandHandlerInvocation";
import { TestConfig } from "../../fixture";

import * as assert from "power-assert";

Then("SDM should describe itself", async function() {
    const handlerResult = await invokeCommandHandler(TestConfig, {
        name: "SelfDescribe",
        parameters: {},
    });
    assert(handlerResult.message.includes("brilliant"), "Not brilliant: " + stringify(handlerResult));
});
