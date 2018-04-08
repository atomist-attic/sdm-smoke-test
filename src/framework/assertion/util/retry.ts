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
import { RetryOptions } from "@atomist/automation-client/util/retry";
import { AssertOptions } from "../AssertOptions";

import * as promiseRetry from "promise-retry";
import { blowUpInMillis, wait } from "./wait";

export class FatalError extends Error {

    public readonly kind = "FatalError";

    constructor(msg: string) {
        super(msg);
    }
}

function isFatal(e: Error): e is FatalError {
    return (e as FatalError).kind === "FatalError";
}

export async function doWithOptions<T>(what: () => Promise<T>,
                                       description: string,
                                       opts: AssertOptions): Promise<T> {
    const withRetryIfNeeded: () => Promise<T> = !!opts && !!opts.retries ?
        () => doWithRetry(what, description, opts) :
        what;
    logger.debug("doWithOptions: %s - %j", description, opts);
    logger.debug("Code: %s", withRetryIfNeeded.toString());
    if (!!opts && !!opts.delayForMillis) {
        await wait(opts.delayForMillis);
    }
    return !!opts && !!opts.allowMillis ?
        Promise.race([
            blowUpInMillis(description, opts.allowMillis),
            withRetryIfNeeded(),
        ]) :
        withRetryIfNeeded();
}

const DefaultRetryOptions: RetryOptions = {
    retries: 5,
    factor: 3,
    minTimeout: 1 * 500,
    maxTimeout: 5 * 1000,
    randomize: true,
};

export function doWithRetry<R>(what: () => Promise<R>, description: string,
                               opts: Partial<RetryOptions> = {}): Promise<R> {
    const retryOptions: RetryOptions = {
        ...DefaultRetryOptions,
        ...opts,
    };
    logger.debug(`${description} with retry options '%j'`, retryOptions);
    return promiseRetry(retryOptions, retry => {
        return what()
            .catch(err => {
                logger.debug(`Error occurred attempting '${description}'. '${err.message}'`);
                if (isFatal(err)) {
                    throw err;
                }
                retry(err);
            });
    });
}
