
Feature: Spring Boot project creation
  SDM should create, build and deploy Spring Boot projects

  Scenario: Create a new Spring Boot project
    When github.com project x33 does not exist
    When we create a new Spring Boot Project named x33
    Then project should exist
    Then project should have spring topic
    Then project should have spring-boot topic
    Then project should have java topic
    Then reactions should succeed
    Then it should deploy locally
    Then we should see cloud foundry manifest prompt
