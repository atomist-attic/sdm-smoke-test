
Feature: Spring Boot project creation
  SDM should create, build and deploy Spring Boot projects

  Scenario: Create a new Spring Boot project
    When we create a new Spring Boot Project
    Then project should exist
