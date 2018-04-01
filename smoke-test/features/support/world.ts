import { TestConfig } from "../../fixture";
import { SmokeTestConfig } from "../../../src/framework/config";
import { GitHubAssertions } from "../../../src/framework/assertion/github/GitHubAssertions";

export class SmokeTestWorld {

    public focusRepo: { owner: string, repo: string, branch?: string, sha: string };

    constructor() {}

    public readonly config: SmokeTestConfig = TestConfig;

    public readonly gitRemoteHelper = new GitHubAssertions(this.config.credentials);

}
