import { Then } from "cucumber";
import * as assert from "power-assert";
import { AllPullRequests, AllPushes } from "../../../src/typings/types";
import { logger } from "@atomist/automation-client";

Then(/focus on branch with name containing (.*)/, {timeout: 80 * 1000}, async function (branchContent: string) {
    const result: AllPushes.Query = await this.world.graphClient.executeQueryFromFile("src/graphql/query/AllPushes", {
        org: this.focusRepo.owner,
        repo: this.focusRepo.repo,
    });
    const pushWeWant = result.Push.find(p => p.branch.includes(branchContent));
    assert(!!pushWeWant, `Must have one push containing '${branchContent}'`);
    this.focusRepo.sha = pushWeWant.commits[0].sha;
    this.focusRepo.branch = pushWeWant.branch;
});

Then(/merge pull request with title containing '(.*)'/, {timeout: 80 * 1000}, async function (titleContent: string) {
    const result: AllPullRequests.Query = await this.graphClient.executeQueryFromFile("src/graphql/query/AllPullRequests", {
        org: this.focusRepo.owner,
        repo: this.focusRepo.repo,
    });
    const prWeWant = result.PullRequest.find(p => p.title.includes(titleContent));
    logger.info("Found PR %d (%s) on %j", prWeWant.number, prWeWant.title, this.focusRepo);
    assert(!!prWeWant, `Must have one PR with title containing '${titleContent}'`);
    await this.gitRemoteHelper.mergePullRequest(this.focusRepo, prWeWant);
});
