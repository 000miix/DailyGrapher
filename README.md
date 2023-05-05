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
## Options:
entity: should be a valid and existing calendar entityid (Tested with google calendar).
hide_full_day_events: (boolean) I recommend not showing full day events.

## How it works
It shows all upcoming events in the current 12 hours. 
It's most likely buggy.


---

# Add a custom repo:
Custom Repositories
Go to any of the sections (integrations, frontend, automation).
Click on the 3 dots in the top right corner.
Select "Custom repositories"
Add the URL to the repository.
Select the correct category.
Click the "ADD" button.
