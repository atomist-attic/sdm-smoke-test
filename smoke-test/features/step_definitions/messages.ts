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
import * as assert from "power-assert";
import { sdmGet } from "../../../src/framework/invocation/httpInvoker";
import { doWithOptions } from "../../../src/framework/assertion/util/retry";

Then(/last text message is (.*)/, {timeout: 30 * 1000}, async function (messageToLookFor: string) {
    const message = messageToLookFor.split("\\n").join("\n");
    const messages = await sdmGet(this.config, "log/messages");
    const lastMessage = messages.data[0];
    assert.equal(typeof lastMessage.value, "string", "Last message is not a text message");
    assert.equal(lastMessage.value, message, `Last message does not include '${message}'`);
});

Then(/recent text message was (.*)/, {timeout: 30 * 1000}, async function (messageToLookFor: string) {
    const message = messageToLookFor.split("\\n").join("\n");
    await doWithOptions(async () => {
        const messages = await sdmGet(this.config, "log/messages");
        assert(messages.data
                .some(m => typeof m.value === "string" && m.value === message),
            `Looked in ${messages.data.length} messages, none included '${message}'`);
    }, "find message", { retries: 20, delayForMillis: 1000});
});
