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

import { RetryOptions } from "@atomist/automation-client/util/retry";

export interface AssertOptions extends Partial<RetryOptions> {
    delayForMillis?: number;
    allowMillis?: number;
}

export class BuildingAssertOptions implements AssertOptions {

    constructor(public delayForMillis: number, public allowMillis: number) {
    }

    public thenAllow(allowMillis: number): BuildingAssertOptions {
        return new BuildingAssertOptions(this.delayForMillis, allowMillis);
    }

    public withRetries(retries: number): BuildingAssertOptions {
        const bao: AssertOptions = new BuildingAssertOptions(this.delayForMillis, this.allowMillis);
        bao.retries = retries;
        bao.minTimeout = 1 * 1000;
        bao.maxTimeout = 3 * 1000;
        return bao as BuildingAssertOptions;
    }

}

export function delayFor(delayForMillis: number): BuildingAssertOptions {
    return new BuildingAssertOptions(delayForMillis, undefined);
}

export function allow(allowMillis: number, delayForMillis: number = 0): BuildingAssertOptions {
    return new BuildingAssertOptions(delayForMillis, allowMillis);
}

export function seconds(n: number) {
    return 1000 * n;
}
