import { Given, Then, When } from "cucumber";
import { logger } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { SmokeTestConfig } from "../../../src/framework/config";
import { TestConfig } from "../../fixture";
import { GitHubAssertions } from "../../../src/framework/assertion/github/GitHubAssertions";
import { editorOneInvocation, invokeCommandHandler } from "../../../src/framework/invocation/CommandHandlerInvocation";
import { verifySdmBuildSuccess } from "../../../src/framework/assertion/github/statusUtils";

const config: SmokeTestConfig = TestConfig;

let focusRepo: { owner: string, repo: string, sha?: string };

const gitRemoteHelper = new GitHubAssertions(config.credentials);

Given(/project (.*)/, project => {
    focusRepo = {owner: config.githubOrg, repo: project};
    logger.info("Focus project is %j", focusRepo);
});

When("README is changed", {timeout: 10 * 4000}, async () => {
    const repo = GitHubRepoRef.from(focusRepo);

    const customAffirmation = `Squirrel number ${new Date().getTime()} gnawed industriously`;
    logger.info(`Invoking handler with [${customAffirmation}]...`);

    await invokeCommandHandler(config,
        editorOneInvocation("affirmation", repo,
            {customAffirmation}));
    logger.info("Handler returned. Waiting for GitHub...");

    const currentProject = await gitRemoteHelper.clone(repo, {retries: 5});
    const gitStatus = await currentProject.gitStatus();
    focusRepo.sha = gitStatus.sha;
});

Then("it should build", {timeout: 60 * 1000}, async () => {
    await verifySdmBuildSuccess(gitRemoteHelper,
        {owner: focusRepo.owner, repo: focusRepo.repo, sha: focusRepo.sha});
});

Then("it should be immaterial", {timeout: 30 * 1000}, () => {
    throw new Error("unimplemented");
});
