Feature: Try to upgrade Spring Boot version
  Try to upgrade Spring Boot version

  Scenario: Try to upgrade to valid version
    Given existing project losgatos1
    When try to upgrade Spring Boot to 1.5.5.RELEASE
    Then build should succeed
    Then PR should be raised

  Scenario: Try to upgrade to invalid version
    Given existing project losgatos1
    When try to upgrade Spring Boot to 3.1.2
    Then build should fail
    Then issue should be raised

  Scenario: Try to upgrade to same version
    Given existing project losgatos1
    When try to upgrade Spring Boot to 1.5.4.RELEASE
    # Then how do we know nothing happened, without seeing the message?
