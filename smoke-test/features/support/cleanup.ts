import { After } from "cucumber";
import { SmokeTestWorld } from "./world";

/**
 * Cleanup repositories created
 */
After(async function(testCase) {
    const world: SmokeTestWorld = this as SmokeTestWorld;
    return world.cleanup();
});
