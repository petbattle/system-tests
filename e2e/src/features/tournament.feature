Feature: Tournament features

  Scenario: Should only be prompted to login on navigating to the tournament
    Given I am on the home page
    When I move to the tournament page
    Then I should be redirected to keycloak