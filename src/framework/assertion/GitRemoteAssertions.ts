import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { RepoBranchTips } from "../../typings/types";

import { AssertOptions } from "./AssertOptions";
import Commit = RepoBranchTips.Commit;

export interface Dated {
    date: Date;
}

export interface GitRemoteAssertions {

    assertRepoExists(params: { owner: string, name: string, opts?: AssertOptions }): Promise<any>

    lastCommit(id: RemoteRepoRef,
               opts?: AssertOptions): Promise<Commit & Dated>;
}
