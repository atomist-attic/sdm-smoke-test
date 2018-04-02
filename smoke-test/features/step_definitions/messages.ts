
import { Then } from "cucumber";
import { sdmGet } from "../../../src/framework/invocation/httpInvoker";
import { logger } from "@atomist/automation-client";

Then(/last message should include .*/, async function() {
    const messages = await sdmGet(this.config, "log/messages");
    logger.info(messages.data);
});
