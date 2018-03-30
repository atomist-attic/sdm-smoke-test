import { allow, AssertOptions, seconds } from "../AssertOptions";
import { GitHubAssertions, Status } from "./GitHubAssertions";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";

/**
 * Block for a certain period of time for immaterial status
 * @param {GitHubAssertions} gitRemoteHelper
 * @param {string} owner
 * @param {string} repo
 * @param {string} sha
 * @return {Promise<Status>}
 */
export function waitForImmaterialSuccess(gitRemoteHelper: GitHubAssertions,
                                         owner: string, repo: string,
                                         sha: string,
                                         opts?: AssertOptions): Promise<Status> {
    return gitRemoteHelper.waitForStatusOf(
        new GitHubRepoRef(owner, repo, sha),
        s => s.context.includes("immaterial"),
        "success",
        opts || allow(seconds(40)).withRetries(10),
    );
}