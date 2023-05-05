# DailyGrapher
A Hacs Custom Card that shows a calendar on a clock

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=for-the-badge)](https://github.com/hacs/integration)


![grapher](https://user-images.githubusercontent.com/132680575/236479315-7daaa0fb-3be2-41cb-abde-8fd94f37f595.png)

## Usage
Add a custom card with the following settings:

```yaml
type: custom:dailygrapher-card
entity: calendar.calendar_id
hide_full_day_events: true
```
### Options:
entity: should be a valid and existing calendar entityid (Tested with google calendar).

hide_full_day_events: (boolean) I recommend not showing full day events.


### How it works
It shows all upcoming events in the current 12 hours. 
It's most likely buggy.

* Add events to your calendar of choice.

## Troubleshooting
The card uses the calendar events, If events don't show up, first refresh the calendars, and ensure you can see the event in the calendar.


---

# Add a custom repo to HACS:
Custom Repositories
1. Go to any of the sections (integrations, frontend, automation).
1. Click on the 3 dots in the top right corner.
1. Select "Custom repositories"
1. Add the URL to the repository. (https://github.com/000miix/DailyGrapher)
1. Select the correct category.
1. Click the "ADD" button.
