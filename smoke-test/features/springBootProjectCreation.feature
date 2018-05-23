
@java @spring
Feature: Spring Boot project creation
  SDM should create, build and deploy Spring Boot projects

    @staging @production
  Scenario: Create a new Spring Boot project and deploy to staging and production
    When we create a new Spring Boot Project
    Then project should exist
#    And project should have spring topic
#    And project should have spring-boot topic
#    And project should have java topic
    And reactions should succeed
    And it should deploy locally
    # And we should see cloud foundry manifest prompt
    And run editor AddCloudFoundryManifest with no parameters
    And enable deploy
    And merge pull request with title containing 'Add Cloud Foundry manifest'
    Then build should succeed
    And reviews should succeed
    And reactions should succeed
    And it should deploy to staging
    And approve gate endpoint
    And it should deploy to production