
import { Given, When } from "cucumber";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { invokeCommandHandler } from "../../../src/framework/invocation/CommandHandlerInvocation";
import { logger } from "@atomist/automation-client";

// When("create a project", async function() {
//     const RepoToCreate = "x"
//     const repo = GitHubRepoRef.from({owner: config.githubOrg, repo: RepoToCreate});
//     await invokeCommandHandler(config,
//         {
//             name: "springBootGenerator",
//             parameters: { "target.repo": RepoToCreate, "rootPackage": "com.atomist"},
//         });
//     logger.info("Handler returned. Waiting for GitHub...");
//
//     const createdProject = await gitRemoteHelper.clone(repo, {retries: 5});
//
//     // // Now verify context
//     // const immaterialStatus = await waitForSuccessOf(gitRemoteHelper, repo.owner, repo.repo, gitStatus.sha,
//     //     s => s.context.includes("immaterial"));
//     // logger.info("Found required immaterial status %j", immaterialStatus);
// });
