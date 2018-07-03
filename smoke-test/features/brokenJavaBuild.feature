
@java @build
Feature: Java build breakage support
  Failed Java builds should be reported

  Scenario: Create a new Java library project and break build
    When we create a new Java library project
    Then project should exist
    And project should have java topic
#    And reviews should succeed
    And build should succeed
    Then run editor breakJavaBuild with no parameters
#    Then reviews should succeed
    And build should fail