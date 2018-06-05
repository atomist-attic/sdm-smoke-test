
@node @build
Feature: Node build support
  Node builds should be reported

  Scenario: Create a new Node project and break build
    When we create a new Node project
    Then project should exist
    And project should have node topic
    And reviews should succeed
    And build should succeed
    Then run editor breakNodeBuild with no parameters
    Then reviews should succeed
    And build should fail