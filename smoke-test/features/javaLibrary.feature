
Feature: Java library support
  Java libraries should compile

  Scenario: Immaterial change
    Given project java-hello-world-maven
    When README is changed
    Then it should build
    