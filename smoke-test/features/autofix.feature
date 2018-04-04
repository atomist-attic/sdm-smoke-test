
Feature: Autofix support
  Autofixes should work

  Scenario: Add Java file without header
    Given existing github.com project java-hello-world-maven
    When add Java file without header
    Then we should see autofix commit
    Then all Java files have header
    Then build should succeed

  Scenario: Add java file with header
    Given existing github.com project java-hello-world-maven
    When add Java file with header
    Then build should succeed

    