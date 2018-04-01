
Feature: Java HTTP service support
  Java HTTP services should be reviewed and deploy

  Scenario: Immaterial change on master
    Given project losgatos1
    When README is changed on master
    Then it should be immaterial

  Scenario: Immaterial change on new branch
    Given project losgatos1
    When README is changed on a new branch
    Then it should be immaterial

  Scenario: Java change on master
    Given project losgatos1
    When Java is changed on master
    Then build should succeed
    Then reviews should succeed
    Then reactions should succeed
    Then it should deploy to staging

  Scenario: Java change on new branch
    Given project losgatos1
    When Java is changed on a new branch
    Then build should succeed
    Then reviews should succeed
    Then reactions should succeed
    Then it should deploy locally
    