Feature: Go to the PB home page
  Display the title

  Scenario: Home Page
    Given I am on the home page
    When I do nothing
    Then I should see welcome message