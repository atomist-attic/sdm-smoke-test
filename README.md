# SDM Smoke Tests

Tests for github-sdm

## Running

## Environment Configuration
(incomplete)
You need an Atomist team of your own, with a github org.

Fork spring-team/java-hello-world-maven.

Run `create spring` and enter losgatos1 for the new repo name, and add a cloud foundry manifest. (Or fork spring-team/losgatos1)


## Test Syntax
These tests use Cucumber.js. 

## Asssumptions
- No other processes are working on the repositories that these smoke tests work with

## Running one test

- `TEST` (required): Name of the feature file (without `.feature`) to run
- `CLEANUP_DELAY` (optional): Number of seconds to wait before cleaning up. Useful to allow manual
inspection of temporary repos.

```
TEST=nodeBuild CLEANUP_DELAY=45 npm run smoke-test:one
```
