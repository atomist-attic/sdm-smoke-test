import { Then } from "cucumber";
import { TestConfig } from "../../fixture";
import { stringify } from "querystring";
import { invokeCommandHandler } from "../../../src/framework/invocation/CommandHandlerInvocation";

import * as assert from "power-assert";

Then("SDM should describe itself", async function() {
    const handlerResult = await invokeCommandHandler(TestConfig, {
        name: "SelfDescribe",
        parameters: {},
    });
    assert(handlerResult.message.includes("brilliant"), "Not brilliant: " + stringify(handlerResult));
});
