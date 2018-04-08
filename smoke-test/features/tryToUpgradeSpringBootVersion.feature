
@java @spring @build @dry-run
Feature: Try to upgrade Spring Boot version
  Try to upgrade Spring Boot version

  Scenario: Try to upgrade to valid version
    Given existing github.com project losgatos1
    When try to upgrade Spring Boot to 1.5.5.RELEASE
    Then focus on branch with name containing 1.5.5
    Then build should succeed
    Then should have pull request with title containing 'Boot'

  Scenario: Try to upgrade to invalid version
    Given existing github.com project losgatos1
    When try to upgrade Spring Boot to 3.1.2
    Then focus on branch with name containing 3.1.2
    Then build should fail
    Then should have issue with title containing 'Boot'

  Scenario: Try to upgrade to same version
    Given existing github.com project losgatos1
    When try to upgrade Spring Boot to 1.5.4.RELEASE
    # Then how do we know nothing happened, without seeing the message?
