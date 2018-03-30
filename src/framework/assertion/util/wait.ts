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
import { doWithRetry } from "@atomist/automation-client/util/retry";
import { AssertOptions } from "../AssertOptions";

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sleep(fn, ...args) {
    await timeout(3000);
    return fn(...args);
}

export async function waitSeconds(n: number) {
    await timeout(n * 1000);
}

export async function wait(n: number) {
    await timeout(n);
}

export async function blowUpInMillis(what: string, n: number): Promise<any> {
    await wait(n);
    throw new Error(`${what} timed out after ${n} milliseconds`);
}

export async function doWithOptions<T>(what: () => Promise<T>,
                                       description: string,
                                       opts: AssertOptions): Promise<T> {
    const withRetryIfNeeded: () => Promise<T> = (!!opts && !!opts.retries) ?
        () => doWithRetry(what, description, opts) :
        what;
    logger.info("doWithOptions: %s - %j", description, opts);
    // logger.info("Code: %s", withRetryIfNeeded.toString());
    if (!!opts && !!opts.delayForMillis) {
        await wait(opts.delayForMillis);
    }
    return !!opts && !!opts.allowMillis ?
        Promise.race([
            blowUpInMillis("Get commit", opts.allowMillis),
            withRetryIfNeeded(),
        ]) :
        withRetryIfNeeded();
}
