
Feature: Liveness
  SDM should respond

  Scenario: Self description
    Then SDM should describe itself
    Then last text message is I am a brilliant SDM, eager to work for you.\nMy name is _CloudFoundry software delivery machine_
