# DailyGrapher
A Hacs Custom Card that shows a calendar on a clock

![grapher](https://user-images.githubusercontent.com/132680575/236479315-7daaa0fb-3be2-41cb-abde-8fd94f37f595.png)

# USAGE
Add a custom card with the following settings:

```yaml
type: custom:dailygrapher-card
entity: calendar.calendar_id
hide_full_day_events: true
```
## OPTIONS:
entity: should be a valid and existing calendar entityid (Tested with google calendar).
hide_full_day_events: (boolean) I recommend not showing full day events.

## How it works
It shows all upcoming events in the current 12 hours. 
It's most likely buggy.
