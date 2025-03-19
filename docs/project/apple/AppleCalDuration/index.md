# AppleCalDuration

> **[repo link:https://github.com/catwithtudou/AppleCalDuration](https://github.com/catwithtudou/AppleCalDuration)**

**(Calendar Event Duration Labeling Script)**


## Overview

This AppleScript automatically adds duration labels to calendar events. It scans through your personal calendars, identifies events for the current day that don't have time markings, and appends the event duration to the end of the event title.

<img src="https://img.zhengyua.cn/blog/202503190935427.png" alt="Image" style="height: auto; width:200px; object-fit: contain;">


For example:
- "Project Discussion" → "Project Discussion 60min"
- "Team Meeting" → "Team Meeting 1.5h"

## Features

- Automatically detects and processes only personal writable calendars
- Smart time formatting: short events shown in minutes (min), longer events in hours (h)
- Automatically skips events that already contain time information
- Configurable logging for troubleshooting
- Displays processing statistics upon completion

## Configuration Options

Several configuration options at the top of the script can be adjusted as needed:

```applescript
-- Configuration options
set enableDetailedLogging to false -- Enable detailed logging (set to true to enable)
set timeFormat to "auto" -- Time format: "minutes", "hours", or "auto"
set hourThreshold to 300 -- Minute threshold for using hours (when timeFormat is "auto")
```

### Configuration Details

1. **enableDetailedLogging**
   - `true`: Enables detailed logging, saving logs to a file on your desktop
   - `false`: Disables detailed logging (default)

2. **timeFormat**
   - `"minutes"`: Always use minutes as the time unit (e.g., 90min)
   - `"hours"`: Always use hours as the time unit (e.g., 1.5h)
   - `"auto"`: Automatically select the appropriate unit based on event duration (default)

3. **hourThreshold**
   - When `timeFormat` is set to `"auto"`, events exceeding this minute threshold will use hours
   - Default value is 300 (5 hours)

## How to Use

1. Open the "Script Editor" application (located in the "Applications/Utilities" folder)
2. Copy and paste the script content
3. Adjust configuration options as needed
4. Click the "Run" button to execute the script
5. Upon completion, the script will display processing statistics

## How It Works

The script performs the following steps:

1. **Calendar Identification**:
   - Checks all accessible calendars
   - Identifies personal calendars based on writability and other characteristics
   - Excludes system preset calendars like "Birthdays", "Holidays", etc.

2. **Event Processing**:
   - Only processes events for the current day (midnight to midnight)
   - Calculates the duration of each event (in minutes)
   - Checks if the event title already contains time information
   - For events requiring processing, formats the time and adds it to the end of the title

3. **Time Formatting**:
   - Short events are displayed in minutes (e.g., 45min)
   - Longer events are converted to hours with one decimal place (e.g., 2.5h)
   - Whole hours are displayed in x.0h format (e.g., 2.0h)

## Troubleshooting

If the script doesn't work as expected:

1. Set `enableDetailedLogging` to `true`
2. Run the script again
3. Check the `calendar_script_log.txt` file generated on your desktop for detailed execution information and error messages

## Safety Notes

- The script only modifies event titles, it will not delete events or change time information
- It only processes writable personal calendars, not shared or subscribed calendars
- Events that already contain time information will be automatically skipped to avoid duplicate time markings

## Regular Usage

You can:
- Save this script as an application and add it to your login items to run each time you log in
- Use "Automator" or the "Calendar" app to create an automation that runs this script regularly
- Run the script manually when needed to mark the day's events with time information

----

Hope this script helps you better manage and view your calendar event timing! If you have questions or need additional features, you can further modify the script.