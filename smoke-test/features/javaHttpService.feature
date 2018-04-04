
Feature: Java HTTP service support
  Java HTTP services should be reviewed and deploy

  Scenario: Immaterial change on master
    Given existing github.com project losgatos1
    When README is changed on master
    Then it should be immaterial

  Scenario: Immaterial change on new branch
    Given existing github.com project losgatos1
    When README is changed on a new branch
    Then it should be immaterial

  Scenario: Java change on master
    Given existing github.com project losgatos1
    When Java is changed on master
    Then build should succeed
    Then reviews should succeed
    Then reactions should succeed
    Then it should deploy to staging
    Then approve gate endpoint
    Then it should deploy to production

  Scenario: Java change on new branch
    Given existing github.com project losgatos1
    When Java is changed on a new branch
    Then reactions should succeed
    Then it should deploy locally

  Scenario: Concurrent branch deploys
    Given existing github.com project losgatos1
    When Java is changed on a new branch
    When save as b1
    When Java is changed on a new branch
    When save as b2
    Then load b1
    Then reactions should succeed
    Then it should deploy locally
    Then load b2
    Then reactions should succeed
    Then it should deploy locally
