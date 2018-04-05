import { Then, When } from "cucumber";
import { logger } from "@atomist/automation-client";
import { editOneInvocation, invokeCommandHandler } from "../../../src/framework/invocation/CommandHandlerInvocation";
import * as assert from "power-assert";
import { SmokeTestWorld } from "../support/world";

When(/run editor (.*) with no parameters/, {timeout: 80 * 1000}, async function (name: string) {
    await doEdit(this as SmokeTestWorld, name, {}, false);
});

When(/run editor (.*) with no parameters and change focus/, {timeout: 80 * 1000}, async function (name: string) {
    await doEdit(this as SmokeTestWorld, name, {}, true);
});

When(/run editor (.*) given parameters/, {timeout: 80 * 1000}, async function (name: string, params) {
    throw new Error("Implement with a data table: https://cucumber.io/docs/reference");
});

Then("enable deploy", {timeout: 80 * 1000}, async function () {
    logger.info(`Invoking enable deploy...`);
    await invokeCommandHandler(this.config, {
        name: "EnableDeploy",
        parameters: {},
        mappedParameters: {
            owner: this.focusRepo.owner,
            repo: this.focusRepo.repo,
            providerId: "github.com",
        },
    });
    logger.info("Handler returned. Waiting for GitHub...");
});

async function doEdit(world: SmokeTestWorld, name: string, params: any, changeFocus: boolean) {
    logger.info(`Invoking editor ${name} with [${JSON.stringify(params)}]...`);

    await invokeCommandHandler(world.config,
        editOneInvocation(name, world.focusRepo, params));
    logger.info("Handler returned. Waiting for GitHub...");

    if (changeFocus) {
        assert(!!world.gitRemoteHelper, "Remote helper must be set");
        const currentProject = await world.gitRemoteHelper.clone(world.focusRepo, {delayForMillis: 1000, retries: 5});
        const gitStatus = await currentProject.gitStatus();
        world.focusRepo.sha = gitStatus.sha;
        world.focusRepo.branch = gitStatus.branch;
    }
}

