# [Page] <a id="api_doc_table_overview">https://api-v2.swissunihockey.ch/api/doc/table/overview</a>

Table API
=========

| URL |  | Access |
| --- | --- | --- |
| `/api/calendars` | [documentation](#api_calendars_doc) | public |
| `/api/clubs` | [documentation](#api_clubs_doc) | public |
| `/api/cups` | [documentation](#api_cups_doc) | public |
| `/api/games` | [documentation](#api_games_doc) | public |
| `/api/game_events` | [documentation](#api_game_events_doc) | public |
| `/api/groups` | [documentation](#api_groups_doc) | public |
| `/api/leagues` | [documentation](#api_leagues_doc) | public |
| `/api/national_players` | [documentation](#api_national_players_doc) | public |
| `/api/players` | [documentation](#api_players_doc) | public |
| `/api/rankings` | [documentation](#api_rankings_doc) | public |
| `/api/teams` | [documentation](#api_teams_doc) | public |
| `/api/topscorers` | [documentation](#api_topscorers_doc) | public |
| `/api/seasons` | [documentation](#api_seasons_doc) | public |
| `/api/sessions` | [documentation](#api_sessions_doc) | private |
| `/api/ui/players` | [documentation](#api_ui_players_doc) | private |

All texts returned in objects are localized to either the default locale or the locale specified with the parameter `locale`. This parameter applies to all API calls. To specify the locale, use the ISO 639\-1 code. The following locales are currently supported:

| Code | Variant |
| --- | --- |
| en | English |
| de\-CH | German (Switzerland) |
| fr\-CH | French (Switzerland) |
| it\-CH | Italian (Switzerland) |

Dates and numbers are formatted as would be expected for the given locale, except where

* A number is used as an identifier. This is indicated by the data type 'string'.
* A number is special for other reasons, such as the number of goals a team makes. Whereever possible, we apply rules inherent in the domain first.

> NOTE the current version of the API defaults to de\-CH and only has texts for this locale.

Answers from the API are in JSON format. These answer types exist:

* [TABLE](#api_doc/table/table)
* [ATTRIBUTE\_LIST](#api_doc_table_attribute_list)
* [MULTI\_TABLE](#api_doc/table/multi)
* [DROPDOWN](#api_doc/table/dropdown)

Informal conventions used in these JSON format specifications are described in [this document](#api_doc/json_schemas).

# [Page] <a id="api_topscorers_doc">https://api-v2.swissunihockey.ch/api/topscorers/doc</a>

* [Topscorers](#api_topscorers_doc)
* [Retrieve Swiss Unihockey Topscorers](#api_topscorers_doc)
* [Retrieve Mobiliar Topscorers](#api_topscorers_doc)
* [Retrieve highest\-ranking Mobiliar Topscorer(s)](#api_topscorers_doc)

Returns a TABLE object containing the Swiss Unihockey Topscorers. These parameters can be given to the request:

season
*integer*
season to query, by first year (ie: `season=2013`)
phase
*one of {`"group"` or `"finals"`}*
whether to return group phase topscorers or finals topscorers
amount
*integer*
how many ranks to load \- 'all' loads all.

By default, you will get gentlemans NLA league first; you can navigate using the tab links to all national leagues. Currently, you will only get the first 20 entries to the list by default.

Returns a TABLE object containing the Mobiliar Topscorers. These parameters can be given to the request:

By default, you will get gentlemans NLA league first; you can navigate using the tab links to all national leagues. Currently, you will only get the first 20 entries to the list.

Returns a TABLE object containing the highest ranking Mobiliar Topscorer(s).

You may request a table containing the male and female topscorer of all clubs or
retrieve the topscorer(s) of a single club.

For a single club only one topscorer is returned if the club sends only a female or only a male team to NLA.

These parameters can be given to the request:

season
*integer*
Season to query, by first year (ie: `season=2013`)
club\_id
*integer*
Id of the club to display topscorers for. Defaults to all clubs.
view\_type
*string*
Optional, sets the response TABLE subtype as specified. Valid values: "table", "attribute\_list", defaults to "attribute\_list"

The first example below shows specifies no club id, the second one does.

# [Page] <a id="api_ui_players_doc">https://api-v2.swissunihockey.ch/api/ui/players/doc</a>

Returns a multi\-table with information about the player. This should be rendered on a typical player overview page.

# [Page] <a id="api_doc_table_attribute_list">https://api-v2.swissunihockey.ch/api/doc/table/attribute_list</a>

The table object is a generalized attribute list. It is a [table](#api_doc/table) object that has only one row and where headers are identified by keys.

```
  {
     "type" : "table",
     "subtype" : "attribute_list",
     "data" : {
        "tabs" : [],
        "headers" : [
           {
              "text" : "Header 1",
              "key" : "header_key"
           },
           // ...
        ],
        "regions" : [
           {
              "rows" : [
                 {
                    "cells" : [
                       {
                          "text" : [
                             "Value 1"
                          ]
                       },
                    // ...
                 }
              ]
           }
        ],
        "title" : "Title"
     },
     "doc" : "#api_doc/attribute_list",
  }

Attribute lists can be rendered as a table where headers are printed as row headers and values follow the headers horizontally.

Alternatively, you can query the json structure for a given header key and extract values from the structure to place them in custom locations in your application.

# [Page] <a id="api_calendars_doc">https://api-v2.swissunihockey.ch/api/calendars/doc</a>

Calendar
========

Produces an up\-to\-date calendar in [iCalendar](https://en.wikipedia.org/wiki/ICalendar) (`.ics`) format ([RFC 5545](http://tools.ietf.org/html/rfc5545)). This file can either be downloaded for import into an external calendar or it can be subscribed to using the [Webcal URI\-scheme](https://en.wikipedia.org/wiki/Webcal) ([provisional](http://www.iana.org/assignments/uri-schemes/prov/webcal)).

To get a calendar for a team, use the `team_id` argument; for a club, use the `club_id` argument. To get a calendar for a group, use `season`, `league`, `game_class` and `group` arguments.

```
http://api-v2.swissunihockey.ch/api/calendars?team_id=TEAMID
webcal://api-v2.swissunihockey.ch/api/calendars?team_id=TEAMID

Here's the above link as webcal sample: [webcal://localhost:5000/api/calendars?club\_id\=341](webcal://localhost:5000/api/calendars?club_id=341).

If used with either `team_id` or `club_id`, events from the range of 1 month in the past and 12 months in the future will be returned. If used with `season`, `league`, `game_class` and `group`, events from the season indicated will be returned, regardless of request time.

club\_id
*string*
Identifier of a club.
team\_id
*string*
Identifier of a team.
season
*integer*
Season identifier, in the form of `2015` (4 digits).
league
*string*
League identifier, example: `"1"`
game\_class
*string*
Game class identifier, example: `"11"`
group
*string*
Group identifier, example: `"Gruppe 1"`

Webserver answers in iCalendar format with the Mime\-Type `"text/calendar"`.

# [Page] <a id="api_teams_doc">https://api-v2.swissunihockey.ch/api/teams/doc</a>

* [Team](#api_teams_doc)
* [Team List](#api_teams_doc)
* [League and Game Class](#api_teams_doc)
* [Season and Club](#api_teams_doc)
* [Team Visitors](#api_teams_doc)
* [Team Details](#api_teams_doc)
* [Team Players](#api_teams_doc)
* [Team Statistics](#api_teams_doc)

Team
====

Team List
---------

`GET #api/teams`

If `mode` is set to `'by_club'`, then the list needs a `season` and `club_id` parameter, and will return a list of teams for a given season and club id (see below).

### League and Game Class

league
*integer*
identifier of the league to list, defaults to NLA.
game\_class
*integer*
identifier of the game class to list, defaults to gentlement GF.

`GET #api/teams`

Returns a list with all teams and their average visitors numbers for a season.

season
*text*
Season
league
*text*
League or leagues the team has played in that season
game\_class
*integer*
identifier of the game class to list, defaults to gentlemen GF.
*league* is required if you use this parameter.

rank
*text*
rank of the team regarding average number of visitors
team\_name
*text*
name of the team
average\_visitors
*text*
average number of visitors
percent\_of\_top
*image*
data uri containing base64 encoded png image

Returns the details for the team as an [attribute list](#api_doc/attribute_list) (`type='table', subtype='attribute_list'`).

logo\_url
*image*
logo of the team
teamname
*text*
name of the team
website\_url
*url*
link to the web page of the team
portrait
*object*
team portrait
liga
*text*
league that the team plays in

Returns a list of players that play in the team and their statistics for the current season. (aka 'Kaderliste') The answer is formatted as a table object.

Displays a list of past achievements for a given team. Returned table contains:

season
*text*
Season
league
*text*
League or leagues the team has played in that season
playoff\_out
*text*
Playoff or Playout qualifications the team has reached, if any
qualification
*text*
Qualification phase rank
cup
*text*
Cup participations and ranking

# [Page] <a id="api_national_players_doc">https://api-v2.swissunihockey.ch/api/national_players/doc</a>

Returns the following fields in a TABLE.

number
*string*
Players number (on the back) or `'-'`.
position
*string*
Play position or an empty string.
name
*string*
The players name.

Returns a table with statistics for all national players that have played at least one game during their career. This view is also called the 'Ewiges Kader'.

selection\_id
*one of {`1`, `2`}*
A selection id of 1 returns all male national players, 2 returns all female national players.
order
*string*
Order criterion, see header for possible values.
direction
*one of {`"desc"`, `"asc"`}*
Order direction

# [Page] <a id="api_seasons_doc">https://api-v2.swissunihockey.ch/api/seasons/doc</a>

Season
======

`GET #api/seasons`

# [Page] <a id="api_doc">https://api-v2.swissunihockey.ch/api/doc</a>

* [The swiss unihockey APIs](#api_doc)
* [Authentication](#api_doc)
* [Errors](#api_doc)
* [Staging environment](#api_doc)
* [Versioning](#api_doc)

Version
0\.0\.0

Swiss unihockey offers REST APIs with the base url of `https://api-v2.swissunihockey.ch`.

Some of the resources will only be available to registered partners of Swiss Unihockey. These resources are marked as 'private'.

For details on versioning, please see the [changelog](#api_doc/changes).

All consumers of this API need a consumer key and a consumer secret. You can
obtain these by applying for access at this
[address](mailto:it@swissunihockey.ch).

To authenticate your requests when accessing private endponts, you need to provide an authorization token. Acquire a token by sending your api key and secret to `/bo/session/auth`. 
Do not forget to urlencode both key and secret (any '\+' in your Token should be converted into '%20' and so on)! See the example on how to do this in your shell.

```
KEY="<your api key>"
SECRET="<your api secret>"
curl -v -v --data-urlencode "api_key=$KEY" \
  --data-urlencode "secret=$SECRET" -X POST \
  "http://127.0.0.1:5000/bo/session/auth"

Include this token as parameter auth\_token on all of your further requests.

Errors
------

If an API call results in an error on the server, a corresponding http status code is returned with an error message. Error codes will be from the 4xx or 5xx range, depending on whether we consider the client or the server to be in error.

```
{
  "object": "error", 
  "data": {
    "message": "ERROR MESSAGE", 
    "code": 123
  }
}

The error code `data/code` will correspond to the HTTP status code that was returned. The error message (`data/message`) will \- as far as possible \- be a localized message that can be displayed to the user. If localisation of the message is not possible, the message will be in the main language.

Version information is kept as `MAJOR.MINOR` where major version number is increased on breaking changes and minor version number is increased on all visible changes.

*Major* versions will be announced to all partners of Swiss Unihockey. We will give implementors time to prepare for the switch to the new version. The old version will continue running for some time. (end of life)

*Minor* versions will not be announced. Here's a list of things that can change in minor versions:

* **Existing calls** can return a different amount of data, reflected by TABLE/ATTRIBUTE LIST header information changing and the data changing accordingly. Mostly these changes will mean *more* columns appear. If you render the TABLE structure correctly, no change to your code will be needed.
* **New calls** can be added.

Current version is kept current at the top of this document and as part of the return value of [`/api`](#api). Major version number is also kept as part of the DNS name.

# [Page] <a id="api_doc_table_multi">https://api-v2.swissunihockey.ch/api/doc/table/multi</a>

* [MULTI\_TABLE Object](#api_doc_table_multi)

A multi table looks like a table object, except that its rows contain other objects. You should hand the value you find in each row under the `"table"` attribute to a generalized renderer.

# [Page] <a id="api_groups_doc">https://api-v2.swissunihockey.ch/api/groups/doc</a>

Group
=====

`GET #api/groups`

season
*e.g. `2014`*
Season selector.
league
*e.g. `1`*
League selector.
game\_class
*e.g. `11`*
Game class selector.
format
*e.g. `"dropdown"`*
Format selector.

text
*string*
The name of the dropdown.
resource
*string*
The path of the resource.
entries
*array(object)*
Dropdown selections with set\_in\_content where group is set, and a textual representation of a saison.
levels
*array(string)*
There is only one level, "Gruppe".
highlight
*boolean*
Always false.

```
{
  "type": "dropdown",
  "text": "Group",
  "resource": "/groups",
  "entries": [
    {"text"=>"Gruppe 1",
      "set_in_context"=>{"group"=>"Gruppe 1"},
      "entries"=>[],
      "highlight"=>true},
     {"text"=>"Gruppe 2",
      "set_in_context"=>{"group"=>"Gruppe 5"},
      "entries"=>[],
      "highlight"=>false},
     {"text"=>"Gruppe 3",
      "set_in_context"=>{"group"=>"Gruppe 3"},
      "entries"=>[],
      "highlight"=>false}
  ],
  "levels": ["Gruppe"],
  "highlight": false
}

# [Page] <a id="api_doc_json_schemas">https://api-v2.swissunihockey.ch/api/doc/json_schemas</a>

* [Types used](#api_doc_json_schemas)

```
# Comment
SYNOPSIS = {
  field_name: 'text', 
  sub_object: SUBOBJECT
}
SUBOBJECT = {
  array_of_things: [THINGS]
}

* CAPS for subobjects that are described below/above
* `'type'` for type references.
* Arrays are generally unbounded, except where mentioned.

| Type | Description |
| --- | --- |
| `text` | A simple UTF\-8 encoded string of characters. |
| `one of "a", "b", ...` | Field will always contain one of the values given. Explanation should follow in the text. |
| `bool` | Either `true` or `false`; boolean. |
| `integer` | An integer number |
| `object` | Any data type at all. Used in places where the interface implementor doesn't need to worry about the content of a variable. |

# [Page] <a id="api_doc_table_dropdown">https://api-v2.swissunihockey.ch/api/doc/table/dropdown</a>

The dropdown object represents a list of entries. Each entry contains a text to display, what to set in the context, and whether it is highlighted.
Each entry can also contain subentries.

The dropdown object is implicitly contained in a TAB entry of a [TABLE](#api_doc/table/table)

The dropdown object should be used to construct an e.g. select interface element.

```
  {
     "type" : "dropdown",
     "text" : "Team",
     "resource" : "/teams",
     "entries" : [
       {
         "text" : "Herren NLA Gruppe 1",
         "set_in_context" : {
           "team_id" : 429494
         },
         "entries" : [],
         "highlight" : true
       },
       {
         "text" : "Herren 3. Liga Gruppe 5",
         "set_in_context" : {
           "team_id" : 428293
         },
         "entries" : [],
         "highlight" : false
       }
     ],
     "levels" : ["Team"],
     "highlight" : false
  }

Use the entries to construct a dropdown (in HTML: select) interface element where the `text` data is used for the actual list and the `set_in_context` data to enact changes when an entry is selected.

The dropdown object does not come with a context of its own.
But it contains `set_in_context` data that should be used to modify the current context, should an entry of the dropdown be selected.

For example, in a results search, there could be multiple dropdowns, `season`, `club`, and `team`. And each dropdown would set `season`, `club_id`, and `team_id`, respectively, in the context. The context can then be used to perform a results search.

# [Page] <a id="api_leagues_doc">https://api-v2.swissunihockey.ch/api/leagues/doc</a>

League
======

`GET #api/leagues`

```
{
  "type": "dropdown",
  "text": "League",
  "resource": "/leagues",
  "entries"=> [
    {"text"=>"Herren NLA",
     "set_in_context"=>{"league"=>1, "game_class"=>11},
     "entries"=>[],
     "highlight"=>true},
    {"text"=>"Damen NLA",
     "set_in_context"=>{"league"=>1, "game_class"=>21},
     "entries"=>[],
     "highlight"=>false},
    {"text"=>"Herren NLB",
     "set_in_context"=>{"league"=>2, "game_class"=>11},
     "entries"=>[],
     "highlight"=>false},
  ],
  "levels": ["League"],
  "highlight": false
}

# [Page] <a id="api_doc_table_table">https://api-v2.swissunihockey.ch/api/doc/table/table</a>

* [TITLE](#api_doc_table_table)
* [CONTEXT](#api_doc_table_table)
* [LINK](#api_doc_table_table)
* [TABS](#api_doc_table_table)
* [Function add\_dropdown\_tab()](#api_doc_table_table)
* [Function dropdown.add\_entry()](#api_doc_table_table)
* [SLIDER](#api_doc_table_table)
* [REGIONS](#api_doc_table_table)
* [ROW](#api_doc_table_table)
* [HEADERS](#api_doc_table_table)

The table object is a generalized table that appears all over the interface. It contains data ready for display and allows interaction with the user. The implementor doesn't need to understand the business domain of floorball.

```
{
  type: "table",
  data: {
    context: CONTEXT,
    title: TITLE, 
    tabs: TABS, 
    slider: SLIDER, 
    header: HEADERS, 
    regions: REGIONS
  }, 
  reload_link: LINK
}

See documentation on page 27 (point 5\.5\) for a good example. An example for multiple regions can be found on page 30 (bottom) (point 5\.6\.2\).

TITLE
-----

Title of the table, will be displayed in some sort of header

```
TITLE = 'text'

CONTEXT
-------

Context in which the current data has been fetched.

Basically it's a hash containing all the values necessary for the API to reproduce the current result, i.e. the variables accepted by the current method to select the data provided for this call.

Currently the only usage of the context is to build navigation links, the view doesn't presently use this information, and the view implementor does not need to understand the contents of context.

LINK
----

Navigation links are built using the gen\_reload\_link() function. The URL is generated based on the current context modified as per the *context difference* passed as an argument. This links will call the API anew, hence generating a full reload.

```
RELOAD_LINK = { 
  type: "reload", 
  set_in_context: OBJECT, 
  resource: 'text'
}

The term *reload* stands for loading new data for the same table with a (possibly) new context. To reload the current table using a reload link, you should expand the tables context by setting all the keys present in `set_in_context` to the values given. Then encode the request as usual (either by expanding the resource url using the base url or by bundling it with other requests) and redisplay the result of this operation.

TABS
----

Set of navigation links in the form of clickable tabs with a reference text. The currently displayed one is highlighted. Built with add\_tab() providing text, link and highlighting value. Links are built with gen\_reload\_links().

```
TABS = [TAB]
# TAB is one of LINK_TAB, DROPDOWN_TAB 
LINK_TAB  = {
  text: 'text', 
  link: LINK, 
  type: "link", 
  highlight: 'bool'
}

### Function `add_dropdown_tab()`

A dropdown tab is a way to integrate a hierarchical expandable dropdown navigation menu into the table's tab system. A call to add\_dropdown\_tab() will add a dropdown menu in the place of a tab. This is built passing the tab text, the API method base, and the list of *headers* (?) for the entries nested under it. The API method base is the particular way used to build links in the dropdown: each entry will contribute with a part of the context, to be based on the parent hierarchy \- hence the add\_dropdown\_tab() being the root requires the base of the call (the API method to be called).

```
DROPDOWN_TAB = {
  type: "dropdown",
  levels: ['text'], 
  entries: [ENTRY], 
  resource: 'text', 
  highlight: 'bool'
}

`levels` contains the labels to show on each of the dropdown levels when no element is selected. Data is tree\-like to a maximum depth equal to the size of `levels`.

### Function `dropdown.add_entry()`

Adds an entry to a dropdown. The entry is built through dropdown.entry() (just an hash builder/setter). Each entry is expected to have a text, a context diff, an highlighted boolean, and an optional set of entries to be nested under it.

```
ENTRY = {
  text: 'text', 
  set_in_context: 'object', 
  highlight: 'bool', 
  entries: [ENTRY]
}

`highlight` on all levels is set if the current request *could* have come from selecting the tab. Whether it really did is a matter of UI state and cannot be handled in the backend.

SLIDER
------

* :slider
Sliders provide navigation links along a dimension. They're implemented as two arrow links to the side of a text, moving the context earlier (resp. later) along the dimension. The text should be descriptive of the dimension (es. season, but also a set of categories), the links can/should be generated again with gen\_reload\_link (see :tabs). Clicking an arrow will send a new call to the api (hence "reload"). Passing an empty link object will disable the arrow.

```
SLIDER = {
  text: 'text', 
  links: {
    # All keys optional: 
    prev: LINK, 
    next: LINK, 
    across: { text: 'text', link: LINK }
  }
}

REGIONS
-------

* :regions
A region is a set of rows composing (part of) the body table. Simpler tables will have only one region, while more complex ones may use multiple regions to provide data subdivision. All regions are sent together to the view without reloading, then the view is expected to manage them \- e.g. by collapsing them and provide the user with controls over the expansion.
Each region has an optional text corresponding to a region\-title, useful in case of multiple regions but usually left empty with single region tables.

```
REGIONS = [REGION]
REGION = {
  text: 'text',   # (1)
  rows: [ROW]
}

ROW
---

A row is a list of cells, at most as long as the header.

Text lines inside cells indicate layout entities that should not be line wrapped inside. For example, if a cell contains two lines, care should be taken to output two lines. If lines are too long, each of the lines should be abbreviated using an ellipsis ('…').

```
ROW   = {
  highlight: 'bool'
  cells: [CELL]
}

```
CELL  = {
  text: ['text'], 
  link: LINK
}

HEADERS
-------

Table headers contain labels for all table columns, provide alignment and table proportions, and will control allowed sorting for the table.

The same headers are common for all regions in the view. They could be repeated in each region for eye candy, but they're defined only once, globally, at table level. 
Alignment can be either 'l' for 'left', 'r' for 'right', or 'c' for 'center'.

Headers should be clickable to sort data based on that column. TBD: clicking and sorting behaviors are managed at view level.

```
HEADERS = [HEADER]
HEADER  = {
  text: 'text', 
  long: 'text', 
  short: 'text', 
  prefer: 'one of "short", "long", "fit"',
  align: 'one of "r", "l", "c"', 
  width: 'integer'
}

The width is proportional over the sum of all header widths: if three headers have widths 1, 2 and 1 respectively, the second header will take 50% of the rendered table width (1\+2\+1 \=\= 4, 2/4 \=\= 0\.5\), with the other two occupying 25% each.

You should look at `prefer` to know which of {`long`, `short`} to use as a header text. If `prefer` has the value `"fit"`, you should use long if possible and short if you must.

Abbreviated headers (using `short`) should be explained in a legend of the form 'SHORT: LONG' below the table.

# [Page] <a id="api_cups_doc">https://api-v2.swissunihockey.ch/api/cups/doc</a>

Cup
===

title
*string*
The title of the table `Schweizer Cup …`

# [Page] <a id="api_games_doc">https://api-v2.swissunihockey.ch/api/games/doc</a>

* [Game](#api_games_doc)
* [Retrieve a list of (current) games](#api_games_doc)
* [Cup games](#api_games_doc)
* [Current games](#api_games_doc)
* [Direct meetings of two teams](#api_games_doc)
* [Favorite games](#api_games_doc)
* [Overview list](#api_games_doc)
* [Club games](#api_games_doc)
* [Team games](#api_games_doc)
* [Lineup for a Team (during the game)](#api_games_doc)
* [Game details](#api_games_doc)
* [Game Summary](#api_games_doc)

There are several distinct table configurations:

* A list of games with detail information (navigable via league).
* A list of recent games of two teams (navigable via a game id).
* A list of cup games for a given round (navigable via a round id).
* A list of games for a given session (not navigable).
* A list of current games (navigable via date).
* A list of games for a season and a club (navigable via list pages).

* Cup games for a round: `mode` is set to `"cup"`.
* Current games: `mode` is set to `"current"`.
* Direct meetings of two teams: `mode` is set to `"direct"`.
* Next games for all favorites: `mode` is set to `"favorite"`.
* Overview list: `mode` is set to `"list"`.
* Club list: `mode` is set to `"club"`.
* Team list: `mode` is set to `"team"`.

### Cup games

`GET #api/games`

mode
*should be `"cup"`*
Mode selector.
tournament\_id
*string*
A tournament id. Uses that id to find the requested tournament.
round
*string*
A round id. Uses that id to find the requested round.
side
*one of {`left`, `right`}*
Either `left` or `right`. Format the data for the left or right side of a cup view request.

context
*object*
The current context (which on\_date \- the currently shown date \- it displays).
title
*string*
The title of the table, corresponding to the name of the cup
headers
*array(object)*
A list of header columns. Contains the text to display,
how it is aligned, and how wide it is.
regions
*array(object)*
Table regions with table data. Each region in a left\-side request contains
a pair of games, whose winners compete in a game in a later round.
A right\-side request returns a single region with a list of games.
Games order between left\-side regions and right\-side games is guaranteed
consistent.

### Current games

`GET #api/games`

Arguments are:

mode
*should be `"current"`*
Mode selector.
league\_ids
*string*
Optional. Comma separated list of league ids.
E.g. if you want to filter for just NLA and NLB, provide `league_ids=1,2`
game\_class\_ids
*string*
Optional. Comma separated list of game class ids.
tournament\_ids
*string*
Optional. Comma separated list of tournament ids. Use this to filter for cups.
only\_video\_streamed
*bool*
Optional, defaults to false. Display only games where a video stream
is available if set to true.

A note about **filtering**: If you provide

* None of `game_class_ids`, `league_ids`, `tournament_ids`, all matching games will be shown.
* Only `game_class_ids`, `league_ids` or both, no cup games will be shown.
* Only `tournament_ids`, only cup games will be shown
* All of `game_class_ids`, `league_ids`, `tournament_ids`
	+ Cup games matching the `tournament_ids` will be shown
	+ Non\-cup games matching `game_class_ids` and `league_ids` will be shown.

context
*object*
The current context (which on\_date \- the currently shown date \- it displays).
title
*string*
The title of the table `Aktuelle Spiele`
headers
*array(object)*
A list of header columns. Contains the text to display,
how it is aligned, and how wide it is.
slider
*object*
A slider text with prev/next link (previous game day/next game day).
regions
*array(object)*
Table regions with table data. Each region is a separate league.

`GET #api/games`

mode
*should be `"direct"`*
Mode selector.
game\_id
*string*
A game id. Uses that id to find recent games of the two teams playing in that game.
amount
*integer*
Maximum number of games to return.

context
*object*
The current context.
title
*string*
The title of the table `Direktbegegnungen`
headers
*array(object)*
A list of header columns. Contains the text to display,
how it is aligned, and how wide it is.
regions
*array(object)*
One table region with table data.

### Favorite games

`GET #api/games`

Displays the next game for each of the favorites in session identified by `sid`.
If a date is passed in `on_date`, that date is considered as starting point,
otherwise the default of the request time will apply.

mode
*should be `"favorite"`*
Mode selector.
sid
*string*
The id of the session where the favorites have been added.
on\_date
*date*
A date of interest, defaulting to the current date. In the form 'YYYY\-MM\-DD', ie: `"2013-12-31"`.
mode
*string `"favorite"`*
Needs to be set to the string `"favorite"`.

context
*object*
The current context (which `on_date` \- the currently shown date \- it displays).
title
*string*
The title of the table ("Favorite")
headers
*array(object)*
A list of header columns. Contains the text to display,
how it is aligned, and how wide it is.
regions
*array(object)*
Table regions with table data. Each region contains one game referring to a favorite.

### Overview list

`GET #api/games`

Returns an overview over the current games in a given league. Several methods of retrieving such a list are supported:

* Using `mode=list` only. Defaults to display of NLA gentlemen. Use the dropdown to navigate further.
* Using a combination of `mode=list`, `league`, `game_class` and `season`, displays the selected combination. This is also what should happen when users select from the drop down.
* Using a combination of `mode=list`, `team_id` and `season`. Will display the league and group the team was in the given season.
* Using a combination of `mode=list`, `player_id` and `season`. Will display the league and group the player was in the given season.

View options are:
 \* view: `short` or `full` (default). Short shows reduced result entries.

Arguments are:

mode
*should be `"list"`*
Mode selector.
season
*integer*
Identifies the season to display, use for example `2013` to display season 13/14\.
league
*integer*
League to display.
game\_class
*integer*
Game class to display.
group
*string or empty*
Chooses the group to display. Defaults to the first group in the tournament.
team\_id
*integer*
Selects `league`, `game_class` and `group` according to the teams participation in the given `season`.
player\_id
*integer*
Selects `league`, `game_class` and `group` according to the players participation in the given `season`.
use\_streaming\_logos
*boolean*
Defaults to false. Returns logos in bigger format suitable for streaming purposes if set to true.

The list returned will display the currently played round or the last round of the tournament.

context
*object*
The current context.
title
*string*
The title of the table, i.e. the name of the season.
headers
*array(object)*
A list of header columns. Contains the text to display,
how it is aligned, and how wide it is.
slider
*object*
A slider text with prev/next link (previous game day/next game day).
regions
*array(object)*
Table regions with table data. Each region is a separate league.

### Club games

`GET #api/games`

Displays all games for a given club (by `club_id`) for a given season in a list. 
The list is navigable by means of the header slider links which will display 
'prev' or 'next', according to circumstances.

The list is in order of occurrence of these games. If two games occur on the same
date, they are ordered by internal index. Using the sort options defined on the
'Liga/Gruppe'\-header, you can sort by league and group as first criterion. Inside
of these groups, order will be chronological ascending.

Each row of the list contains a link to the game detail (`type: "page", page:
"game_detail"`). The league/group column contains a link to the league/group 
detail page (`type: "page", page: "league_group_detail"`); ids are (in order): 
`season, league, game_class, group`. The last column giving the gym location has
a google maps link attached to it.

mode
*should be `"club"`*
Mode selector.
club\_id
*integer*
ID of the club to display a game list for.
season
*integer*
Season to display.

### Team games

`GET #api/games`

Displays all games for a given team (by `team_id`) for a given season in a list. 
The list is navigable by means of the header slider links which will display 
'prev' or 'next', according to circumstances.

The list is in order of occurrence of these games. If two games occur on the same
date, they are ordered by internal index.

Each row of the list contains a link to the game detail (`type: "page", page:
"game_detail"`).
Ids are (in order): 
`season, league, game_class, group`. The second column giving the gym location has
a google maps link attached to it.

mode
*should be `"team"`*
Mode selector.
team\_id
*integer*
ID of the team to display a game list for.
season
*integer*
Season to display.

view
*string*
choose between complete data ("full") and a shorter version ("short")
hide\_empty
*boolean*
default: `true`. if lineup is unknown, when `true` returns a blank response, when `false` returns an empty table

home\_logo
*url*
link to logo of home team
home\_name
*string*
name of the home team
away\_logo
*url*
link to logo of away team
away\_name
*string*
name of the away team
result
*string*
result of the match
date
*string*
date of the match
time
*string*
starting time for the match
location
*map*
coordinates of game location
first\_referee
*string*
name of the first referee \- displayed not earlier than 48h
before thegame starts
second\_referee
*string*
name of the second referee \- displayed not earlier than 48h
before thegame starts
spectators
*string*
number of spectators present (if available)

Returns a textual summary of the game as an attribute list. The following attributes will be defined:

title
*string*
title
subtitle
*string*
subtitle
text
*list*
a number of paragraphs that describes the game

# [Page] <a id="api_rankings_doc">https://api-v2.swissunihockey.ch/api/rankings/doc</a>

Ranking
=======

`GET #api/rankings`

Retrieves rankings for a season, a league and a game class. If the method is called with no arguments, the current ranking for NLA league in the current season is returned.

The parameter `view` can be used to get a `short` or a `full` (default) table.

Rankings are only computed for the qualification phase. To show the state of a playoff phase, use the `/games` overview.

season
*integer*
season to retrieve rankings for
league
*integer*
league to retrieve rankings for
game\_class
*integer*
game class to retrieve rankings for
group
*integer*
group to retrieve rankings for

The return value will be in the form of a TABLE response. Please refer to that [documentation](#api_doc/table) for details.

# [Page] <a id="api_players_doc">https://api-v2.swissunihockey.ch/api/players/doc</a>

Returns a **Table** for a given player with an overview of the player's teams' games and other games the player has been playing (not with their team).

date
*text*
Date of the game.
location
*text*
Place the game has been played.
time
*text*
Time the game started.
home
*text*
Home team name.
away
*text*
Away team name.
score
*text*
Score of the game.
goals
*text*
Amount of goals the player has scored in the game.
Can also contain a text if the player has not scored.
assists
*text*
Amount of assists the player has scored in the game.
points
*text*
Amount of points the player has scored in the game.
match\_penalties
*text*
Amount of match penalties.

# [Page] <a id="api_game_events_doc">https://api-v2.swissunihockey.ch/api/game_events/doc</a>

GameEvent
=========

Returns events from a game as a table. Some games will not have events available.

team
*string*
selector for home team (`'home'`) or away team (`'away'`). A value of `nil` (default) shows no preference, thus selecting both.

# [Page] <a id="api_sessions_doc">https://api-v2.swissunihockey.ch/api/sessions/doc</a>

* [Session](#api_sessions_doc)
* [Add a favorite](#api_sessions_doc)
* [Remove a favorite](#api_sessions_doc)
* [Matchcenter](#api_sessions_doc)

The following table contains a list of favorites that can be set and the arguments needed for each type of favorite:

| Type | Arguments needed |
| --- | --- |
| `league` | `game_class`, `league` |
| `league` | `game_class`, `league`, `group` |
| `club` | `club_id` |
| `team` | `team_id` |
| `player` | `player_id` |

The type argument is always needed and must be set to the first column above. The second `league` favorite is a variant, limiting also to a single group.

`POST #api/sessions/add_favorite`

Add a favorite to this users list of favorites. A favorite is a JSON encoded string; here's a typical favorite:

The body of your POST should contain the following fields:

sid
*string*
session reference that was obtained at the last call or `null`.
favorites\[]
*json\_string*
json string of favorite to add

Favorites are attached to sessions. These expire after 30 days.

To obtain a new session, you don't need to do anything special, just call this method with either `null` or an invalid session reference as argument.

This function returns a structure that has two fields:

You should always use the *returned* session id in subsequent calls \- it is guaranteed to be valid and to contain the favorite you just added.

`POST #api/sessions/remove_favorite`

Removes a favorite from this users list of favorites, identified by session id.

The body of your POST should contain the following fields:

sid
*string*
session reference that was obtained at the last call or `null`.
favorites\[]
*json\_string*
json string of favorite to add

This function returns a structure that has two fields:

You should always use the *returned* session id in subsequent calls \- it is guaranteed to be valid and to **NOT** contain the favorite you just removed.

`GET #api/sessions/matchcenter`

Returns all data necessary for the display of the matchcenter. Please pass the following arguments to the request:

sid
*string*
session reference that was obtained at the last call or `null`.

All known favorite types in the session passed as argument will be turned into sections in the return value that looks like this:

```
{
    "type": "matchcenter", 
    "data": {
        "sections": [
            {
                "type": "league",
                "title": "Section Title"
                "context": { 
                    "type": "league", 
                    "game_class": 11, 
                    "league": 1
                }
            }
        ]
    }
}

To use this return value, you should iterate over the sections of the matchcenter and then perform further calls on the sections that you want to output. For example, given the context above, you could call `/games` and retrieve a list of upcoming games for the context. This table can then be rendered in a section that has the title returned in the matchcenter return value.

# [Page] <a id="api_clubs_doc">https://api-v2.swissunihockey.ch/api/clubs/doc</a>

* [Club](#api_clubs_doc)
* [List](#api_clubs_doc)
* [Team overview](#api_clubs_doc)

Club
====

`GET #api/clubs`

Lists all clubs that have played in a given season.

Lists all teams of the club that have played in a given season and their achievements. If no season is specified, the current season is assumed.

team
*text*
League the team plays in
tournament
*text*
Current position in the tournament
cup
*text*
Current position in Cup tournament, if any.

# [Page] <a id="api_doc_table">https://api-v2.swissunihockey.ch/api/doc/table</a>



# [Page] <a id="api_doc_attribute_list">https://api-v2.swissunihockey.ch/api/doc/attribute_list</a>



# [Page] <a id="api_doc_business_overview">https://api-v2.swissunihockey.ch/api/doc/business/overview</a>

Provides functionality around game reporting.

| URL |  | Access |
| --- | --- | --- |
| `/bo/session` | [documentation](#bo_session_doc) | public |
| `/bo/games` | [documentation](#bo_games_doc) | public |
| `/bo/players` | [documentation](#bo_players_doc) | private |
| `/bo/people` | [documentation](#bo_people_doc) | private |

# [Page] <a id="api_doc_changes">https://api-v2.swissunihockey.ch/api/doc/changes</a>

* [2\.28 (9Sep16\)](#api_doc_changes)
* [2\.27 (30Aug16\)](#api_doc_changes)
* [2\.26 (5Jul16\)](#api_doc_changes)
* [2\.25 (3May16\)](#api_doc_changes)
* [2\.24 (3Feb15\)](#api_doc_changes)
* [2\.23 (21Aug15\)](#api_doc_changes)
* [2\.22](#api_doc_changes)
* [2\.21](#api_doc_changes)
* [2\.20](#api_doc_changes)
* [2\.19 (8Apr15\)](#api_doc_changes)
* [2\.18 (23Jan15\)](#api_doc_changes)
* [2\.17 (15Dez14\)](#api_doc_changes)
* [2\.16 (8Dez14\)](#api_doc_changes)
* [2\.15 (7Nov14, 13Nov14\)](#api_doc_changes)
* [2\.14 (31Okt14\)](#api_doc_changes)
* [2\.12 (24Okt14\)](#api_doc_changes)
* [2\.11 (17Okt14\)](#api_doc_changes)
* [2\.10 (30Sep14\-10Okt14\)](#api_doc_changes)
* [2\.9 (19Sep14\)](#api_doc_changes)
* [2\.8 (17Sep14\)](#api_doc_changes)
* [2\.7 (11Sep14\)](#api_doc_changes)
* [2\.6 (9Sep14\)](#api_doc_changes)
* [2\.5 (05Sep15\)](#api_doc_changes)
* [2\.4 (01Sep14\)](#api_doc_changes)
* [2\.3 (29Aug14\)](#api_doc_changes)
* [2\.2 (26Aug14\)](#api_doc_changes)
* [2\.1 (20Aug14\)](#api_doc_changes)
* [2\.0\.0 (18Aug14\)](#api_doc_changes)
* [1\.3 (23Jul14\)](#api_doc_changes)
* [1\.2 (17Jul14\)](#api_doc_changes)

* Fix wrongly linked penalty end events in /bo/games/:id
* Add topscorer flag to /bo/games/:id \#refs SU\-1281
* Use game phase flags as set on spiel in /bo/games/status \#refs SU\-1246

* Various bugfixes for /bo/games/:id/lineups
* Various bugfixes for /bo/games/:id/status
* Improve change poller stability

* Switched from HMAC to token based authentication
* Added people endpoint to business API
* Added param league\_ids to /api/games/current
* Added team visitors api
* Added /bo/people
* Stabilized change poller (retry on network timeouts)
* Improved /bo/games
	+ May undo game state changes
	+ May change transition times

* Released new business API

* Use 'U18A' and other concise league names in player statistics and team detail view
* Homogenization of and improvements on tables
	+ Ranking
	+ Games overview
	+ Game list
* Bugfix: Display tentative games without teams in rounds and calendar entries

* Adds endpoints for retrieving leagues and groups. (`/leagues`, `/groups`)
* Adds a textual summary for games. (`/games/:id/summary`)

2\.22
-----

* Adds a list of games by team. (`/games?mode=team`)

2\.21
-----

* New business API (only in staging currently).

2\.20
-----

* Adds a list of games by club. (`/games?mode=club`)
* Adds support for a "dropdown" return type.
* Adds lists of dropdown data for:
	+ Seasons (`/seasons?return_type=dropdown`)
	+ Clubs (`/clubs?return_type=dropdown`)
	+ Teams (`/teams?mode=by_club&return_type=dropdown`)

* Don't render games that won't be played in playoff series.
* Adds 'Superfinal' rendering.
* Extend the definition of current round for the new season.

* Adds `/calendars` iCalendar calendar feeds.
* Adds a parameter `amount` to `/topscorers/su`. Passing 'all' returns all topscorers.
* Abgesagte/Forfait/Abgebrochene games are marked beforehand in overviews.
* Time Verlängerung is not shown.
* n.P. overrides n.V.
* Ordering of league/game\_class \-\> game\_class/league

* Adds `/games?mode=favorite` for retrieving favorites' games.
* Many small tickets closed.
* `cupGames(...)` changes signature.
* Improved event handling, statistics are now updated immediately.

* Many small changes, closing the gap to specification.

* Adds `/national_players/statistics` for a statistical overview on national players.
* Adds `/national_players/:player_id/statistics` for a statistical overview on a single national player.
* Adds `/games?mode=cup` for retrieving games at every step of a cup tournament.
* Improves `/games` (default mode) for release:
	+ Event display now much improved and more informative
	+ Season display corrected
	+ Result display now reflects reality of forfait games, live results, …

* Adds `/ui/players/:player_id` returning a multi table with information about a player.
* Adds header legends to all tables. Take a look at `/api/games/812625/teams/0/players` to see a sample of this.
* Small fixes and changes.

* Adds `/games?mode=current` that displays current games and returns a date\-based games list.
* A lot of small fixes to various calls.
* Internal version of the new cups timeline.
* Matchcenter search now finds items via their hierarchical chain. Example: Searching for `NLB` will find players, teams, clubs, groups in the NLB.
* Matchcenter search prefers finding text in the item category first. Example: Searching for `Lyss` in players will find a player called Lyss before finding a team called `Lyss`.
* Fixes various current\_games issues described in OT\-105\.

* Adds `/teams/:team_id/statistics` that displays past seasons and the successes of a team.
* Adds `/clubs/:club_id/statistics` that displays an overview over the teams of a club.
* Adds `/players/:player_id/overview` for an overview over the games of a player and some statistics.

* OT\-50: 'short' view in `/games` fixed.
* OT\-24: 'full' and 'short' view of lineup (`/games/:id/teams/{0,1}/lineup`) fixed.
* Adds `/search` for searching leagues, groups, clubs, teams, players.

* Turns `/games/:game_id` into an attribute list.
* Adds `/sessions/add_favorite`, `/sessions/remove_favorite` and `/sessions/matchcenter`.

* Turns '/players/:player\_id' into an attribute list.

* Adds `/players/:player_id` for retrieving player details.
* Adds `/players/:player_id/statistics` for retrieving player statistics.
* Adds `/teams/:team_id/players` for retrieving player information of a team.
* Turns `/teams/:team_id` into an attribute list.

* Adds `/teams/:team_id` for retrieving team details.
* Adds `/teams` for retrieving a list of teams.

* Adds `/cups/:championship_id` for retrieving cup details.

* Adds `/rankings` for retrieving a table of rankings for a given set of games.
* Adds `/game_events` for retrieving a list of events relating to a game.
* `/games/:game_id` now has a title and a subtitle. Also, the teams structure has changed slightly.

* Adds `/games/:game_id` for retrieving a games details.
* Updates `/games` to provide actual data.

Version jump because there is already a version 1 of the API online at api.swissunihockey.ch. We'll version the api using DNS names in the future.

* Adds `/games/:game_id/teams/:is_home/players` for retrieving the lineup of a given game.

* Added a `text` attribute to dropdown tabs in tables. Also, the `levels` attribute has changed from a number to an array of texts, each one giving the label to show if the dropdown has no selected value.
* Fixes slider links to set previous / next rounds.
* dropdowndown entries are now subobjects instead of arrays. This is for better readability.
* Added `highlight` attribute to tabs; this will be set to true if the tabs correspond to the current selection.

* Removed all simulated API objects. For now, only '/games' exists, which returns simulated games overview data.
* Fixed a few bugs with the first version of that pilot.

# [Page] <a id="api_v3_doc">https://api-v2.swissunihockey.ch/api/v3/doc</a>

/api/v3
=======

The youngest of the swiss unihockey APIs. It is a work in progress and built according to the [JSON:API Specification](http://jsonapi.org/).

Supply the token obtained according to [Authentication](#api_doc) as parameter `auth_token`.

```
GET /api/v3/<some-endpoint>?auth_token=<your-token>

* /api/v3/games \- [Documentation](#api/v3/games/doc)
* /api/v3/games/teams [Documentation](#api/v3/games/teams/doc)
* /api/v3/teams \- [Documentation](#api/v3/teams/doc)

# [Page] <a id="api">https://api-v2.swissunihockey.ch/api</a>

```
{"type":"version","data":{"description":"Business Server API. Call /api/doc for documentation.","full_version":"0.0.0","authentication":"none","version":{"major":"0","minor":"0","patch":"0"}}}
```

# [Page] <a id="bo_games_doc">https://api-v2.swissunihockey.ch/bo/games/doc</a>

* [Game](#bo_games_doc)
* [Accessing a game list that you can report on](#bo_games_doc)
* [Access to a single game](#bo_games_doc)
* [Response](#bo_games_doc)
* [Creating a lineup](#bo_games_doc)
* [Handling of position numbers](#bo_games_doc)
* [Events](#bo_games_doc)
* [Creating an event for a game](#bo_games_doc)
* [Deleting an event of a game](#bo_games_doc)
* [Status](#bo_games_doc)
* [Setting status of a game](#bo_games_doc)
* [Modifying past state transitions](#bo_games_doc)

```
  curl -v -v  \
    "http://127.0.0.1:5000/bo/games?set=game_report&auth_token=TOKEN"

Displays a comprehensive list of game details including referees, scores, game events and the lineup.

```
  curl -v -v  \
    "http://127.0.0.1:5000/bo/games/812625?set=game_report&auth_token=TOKEN"

* *list:*
	+ *phases:* List of phases that will be played in this game (e.g `['third1', 'third2', 'third3', 'prolongation', 'penalty_shootout']`),
	+ *spectators* Number of spectators.
	+ *total\_seconds\_played* Game playtime duration in seconds.
	+ *player\_inspection\_ordered* Whether a player inspection has been ordered.
	+ *started\_at\_worldtime* When the game started playing (time of last *start* event, see [status](#bo_games_doc)).
	+ *finished\_at\_worldtime* When the game finished playing (time of last *game\_over* event, see [status](#bo_games_doc)).
	+ *penalty\_shootout\_played* Whether a penalty shootout has been played.
	+ *prolongation\_played* Whether the prolongation has been played.
* *references:*
	+ *positions/…:* Lineup positions.
		- *topscorer:* Whether or not the player is the highest scoring player in the lineup according to the current mobiliar ranking.
	+ *events/…:* Events that happened during the game
		- *when .type \= Event, .subtype \= PlayerInspection*
			* *attrs.done* Whether the player inspection was performed. If this is false, the inspection was intentionally skipped.

You may provide `license_ids` instead of `player_ids` to specify the players.

### Handling of position numbers

* If no number is given, and the system knows the shirt number the player usually wears,
the position will default to said number.
* The system will remember the shirt number assigned to a player to provide the functionality above if 
it doesn't yet know a number for the player.
You may prevent the system from remembering the shirt number used in a position by specifying `do_not_remember_number: 'yes'` for the position

Events
------

Issue a POST request to /bo/games/:game\_id/events.

There are 7 game events.

* Goal
* Penalty
* Penalty End
* Team
* Player
* Misc (miscellanous non\-sportive events that may occur during a game)
* PlayerInspection

Each type needs a different set of attributes with the request to be created.

#### Goal (Adding a goal to a game)

Request attribute set:

* category\_id: 1
* time: Time of the goal in game time relative to the start of the game.
* world\_time: Absolute time of the event in format 'YYYY\-MM\-DDThh:mm:ss\+hh:mm', e.g. '2015\-10\-28T12:34:45\+01:00'
* team\_id: ID of the team that made the goal.
* player\_id: ID of the player who made the goal.
* assister\_id: ID of the player who assisted (optional).

```
  curl -X POST -v -v  \
    "http://127.0.0.1:5000/bo/games/812625/events" \
    -d 'time=0:23:00' \
    -d 'world_time=2015-10-28T12:34:45+01:00' \
    -d "category_id=1" -d "player_id=413841" \
    -d "assister_id=463912" -d "team_id=429631" \
    -d 'auth_token=TOKEN'

#### Game Penalty (Straffstoss)

A `GamePenalty` event has the same attributes a s `Goal` event, with the following differences:
\* category\_id: 164, other than that same attributes as `Goal` event
\* ***no** assister\_id*

#### Penalty

There are 17 penalty events:

| id | meaning |
| --- | --- |
| 3 | 2' penalty |
| 4 | 5' penalty |
| 5 | 10' penalty |
| 49 | 2\+2' penalty |
| 6 | Match penalty I |
| 7 | Match penalty II |
| 8 | Match penalty III |
| 167 | Undefined match penalty |
| 9 | Penalty |
| 153 | Assist 2' penalty |
| 154 | Assist 5' penalty |
| 155 | Assist 10' penalty |
| 156 | Assist match penalty I |
| 157 | Assist match penalty II |
| 158 | Assist match penalty III |
| 161 | Deputy penalty home |
| 162 | Deputy penalty away. |

Attributes:

* category\_id: One of 3\-9, 153\-158, 161, 162, 167\.
* code: Optional. A penalty code from 0\-999\. See "Codes"
* time: Time of the penalty event in game time relative to the start of the game.
* world\_time: Absolute time of the event in format 'YYYY\-MM\-DDThh:mm:ss\+hh:mm', e.g. '2015\-10\-28T12:34:45\+01:00'
* game\_id: ID of the game.
* team\_id: ID of the team the player is in.
* player\_id: ID of the player who got the penalty.

```
  curl -X POST -v -v  \
    "http://127.0.0.1:5000/bo/games/812625/events" \
    -d 'time=0:42:00' \
    -d "category_id=3" -d "team_id=429631" -d "player_id=413841" \
    -d 'auth_token=TOKEN'

#### Penalty End

Records a players' last penalty as having ended.

Attributes:

* category\_id: 151\.
* time: Time of the penalty event in game time relative to the start of the game.
* world\_time: Absolute time of the event in format 'YYYY\-MM\-DDThh:mm:ss\+hh:mm', e.g. '2015\-10\-28T12:34:45\+01:00'
* game\_id: ID of the game.
* team\_id: ID of the team the player is in.
* player\_id: ID of the player who got the penalty.

```
  curl -X POST -v -v  \
    "http://127.0.0.1:5000/bo/games/812625/events" \
    -d 'time=0:42:00' \
    -d "category_id=151" -d "team_id=429631" -d "player_id=413841" \
    -d 'auth_token=TOKEN'

#### Team

There are 4 team events:

| id | meaning |
| --- | --- |
| 10 | Timeout home |
| 11 | Timeout away |
| 15 | Goalie has left goal |
| 16 | Goalie is back in goal |

Attributes:

* category\_id: One of 10,11,15,16\.
* time: Time of the team event in game time relative to the start of the game.
* world\_time: Absolute time of the event in Format 'YYYY\-MM\-DDThh:mm:ss\+hh:mm', e.g. '2015\-10\-28T12:34:45\+01:00'
* game\_id: ID of the game.
* team\_id: ID of the team.

```
  curl -X POST -v -v  \
    "http://127.0.0.1:5000/bo/games/812625/events" \
    -d 'world_time=2015-10-28T12:34:45+01:00' \
    -d 'time=0:42:00' \
    -d "category_id=10" -d "team_id=429631" \
    -d 'auth_token=TOKEN'

#### Player

There are 7 player events:

| id | meaning |
| --- | --- |
| 12 | Top player |
| 13 | Change of goalie |
| 14 | Injury |
| 17 | Crossbar hit |
| 18 | Post hit |
| 19 | Penalty missed |
| 20 | Own goal (Eigentor) |
| 29 | Penalty hit |

Attributes:

* category\_id: One of 12\-14,17\-20,29\.
* time: Time of the player event in game time relative to the start of the game.
* world\_time: Absolute time of the event in Format 'YYYY\-MM\-DDThh:mm:ss\+hh:mm', e.g. '2015\-10\-28T12:34:45\+01:00'
* team\_id: ID of the team the player is in.
* player\_id: ID of the player.

```
  curl -X POST -v -v  \
    "http://127.0.0.1:5000/bo/games/812625/events" \
    -d 'world_time=2015-10-28T12:34:45+01:00' \
    -d 'time=0:42:00' \
    -d "category_id=20" -d "team_id=429631" -d "player_id=413841" \
    -d 'auth_token=TOKEN'

#### Misc

Attributes:

* category\_id: 39\.
* code: The code from 0\-999 detailing which kind of miscellanous event happened. See "Codes"
* time: Time of the player event in game time relative to the start of the game.
* world\_time: Absolute time of the event in Format 'YYYY\-MM\-DDThh:mm:ss\+hh:mm', e.g. '2015\-10\-28T12:34:45\+01:00'
* player\_id: ID of the player (optional).

```
    curl -X POST -v -v \
    "http://127.0.0.1:5000/bo/games/852878/events" \
    -d 'time=0:23:00' \
    -d 'world_time=2015-10-28T12:34:45+01:00' \
    -d "category_id=39" \
    -d "code=123" \
    -d "auth_token=TOKEN"

#### PlayerInspection

Store the fact that a player inspection was performed or intentionally skipped.

Attributes:

* category\_id: 165 if the inspection was done, 166 if it was skipped.
* time: Time of the player event in game time relative to the start of the game.
* world\_time: Absolute time of the event in Format 'YYYY\-MM\-DDThh:mm:ss\+hh:mm', e.g. '2015\-10\-28T12:34:45\+01:00'

```
    curl -X POST -v -v \
    "http://127.0.0.1:5000/bo/games/852878/events" \
    -d 'time=0:00:00' \
    -d 'world_time=2015-10-28T12:34:45+01:00' \
    -d "category_id=165" \
    -d "auth_token=$TOKEN"

##### Codes

A list of accepted event codes is maintained in Opacc, contact swiss unihockey to get the latest valid codes.

* OpaccERP, BC 87700, Table 501, "Strafencodes/ Event\-Codes"
* OXAS Business\-Server, Service "GEvents", see Documentation "su neue Anwendungen OpaccXOAS"

Issue a DELETE request to /bo/games/:game\_id/events/:event\_id.

* game\_id: ID of the game the event is part of.
* event\_id: ID of the event to be deleted.

```
  curl -X DELETE -v -v  \
    "http://127.0.0.1:5000/bo/games/812625/events/1080631"
    -d 'auth_token=TOKEN'

Status
------

You can send the game any of these messages:

* start
* start\_third
* end\_third
* report\_result
* game\_over
* start\_penalty\_shootout
* forfait
* abort
* undo

#### Valid messages

The state diagram illustrates when it may be legal to send what message.
Which messages are usable depends on the game phases \- if a game doesn't have a third third,
you won't be able to start it. If a game has three thirds, you won't be able to start prolongation
when in the second third.

The game information page will display the messages that can be sent to the game at any given time, taking the games' phases into account (see "Access to a single game", response description).

#### Sending a message

Here's how the typical status json message looks:

Here's how this message would look when dispatching through 'curl':

Note that throughout the API, PUT and POST messages can be sent using a 'Body' with the content type 'application/json'. This might be easier to do in your framework than url\-encoded POSTs. Also, some messages that are deeply nested can only be formulated as url\-encoded message with difficulty.

Depending on the message you're sending, more attributes need to be attached:

#### Event "start"

`event: "start"`, No additional attributes. See above.

#### Event "start\_third"

`event: "start_third"`, No additional attributes. See above.

#### Event "end\_third"

`event: "end_third"`, No additional attributes. See above.

#### Event "start\_penalty\_shootout"

`event: "start_penalty_shootout"`, No additional attributes. See above.

#### Event "forfait"

Reports the game as being forfaited, with the home team carrying the win.

#### Event "game\_over"

The game ended, no more playing is going on.

#### Event "report\_result"

```
{
  "event": "report_result", 
  "auth_token": "TOKEN", 
  "home": 3, 
  "away": 4,
  "spectators": 230,
  "second": 3600,
  "penalty_shootout": "yes", 
  "prolongation": "yes"
}

This reports the game as finished after an hour of effective play time, 3:4\. 230 people spectated. Penalty shootout and prolongation fields are important mostly when the game is reported as finished directly from the start node, without reporting intermediate game states.

#### Event "abort"

`event: "abort"`, No additional attributes.

#### Event "undo"

The undo event will undo the last status change.

An example scenario:

1. Game is in first third.
2. Call to `/bo/games/:id/status` with `start_third`, putting game in the second third
3. Record a goal via `/bo/games/:id/events`
4. Call to `/bo/games/:id/status` with `undo`

The game will now again be in the first third. Events recorded in the second third (such as the goal in 3\.) are deleted.

To reduce visual clutter, this event is not represented in the state diagram above.

### Modifying past state transitions

You may modify a transition that already happened \- as of now, this is limited to modifying the second it happened at.

To do this, you issue a PUT to /bo/:game\_id/status/history/transitions

* to: Name of the state the game changed to. Any of the state names in the state diagram shown in the section *Setting status of a game*. See table below for their names.
* second: An integer. New value for the second the event happened at.

| Name | Caption in state diagram |
| --- | --- |
| prolongation | Verlängerung |
| penalty\_shootout | Penaltyschiessen |
| game\_over | Fertiggespielt |
| finished | Durchgeführt |
| forfait | Forfait |
| aborted | Abbruch |

Limitations:

You may not change the starting time for any of the thirds (as they're fixed by the rules to start at 0:00, 20:00 and 40:00\).

Example:

Change the penalty shootout to have started 1 hour into the game:

```
curl -X PUT -v -v \
  "http://127.0.0.1:5000/bo/games/854222/status/history/transitions" \
  -d 'second=3600' \
  -d 'to=penalty_shootout' \
  -d "auth_token=$TOKEN"

# [Page] <a id="bo_session_doc">https://api-v2.swissunihockey.ch/bo/session/doc</a>

* [Session](#bo_session_doc)
* [The token mechanism](#bo_session_doc)
* [Logging in with partner credentials](#bo_session_doc)
* [Logging in with anlass credentials](#bo_session_doc)
* [Validate token](#bo_session_doc)
* [Performing further requests](#bo_session_doc)

To authenticate your requests, you need a token to send alongside those requests.
In order to receive such a token, you have to present your credentials to the
system.

The system will answer with a token, which is valid for **4 hours**. Use it as
the value of the `auth_token` parameter for your further requests.

```
  curl -v -v -d "api_key=<api key placeholder>" \
    -d "secret=<secret placholder>" -X POST \
    "https://api-v2.swissunihockey.ch/bo/session/auth"

Anlass with a game that has already been played:

```
  curl -v -v -d 'anlass_id=473798' \
    -d "password=<password placeholder>" -X POST \
    "http://127.0.0.1:5000/bo/session/auth_anlass"

Here's a game that will be played some time from now:

```
  curl -v -v -d 'anlass_id=483837' \
    -d "password=<password placeholder>" -X POST \
    "http://127.0.0.1:5000/bo/session/auth_anlass"

auth\_token
*string*
anlass\_id
*integer*

Sample request with curl:

```
  curl -v -v -d "auth_token=<auth_token>" \
    -d "anlass_id=<anlass id>" -X POST \
    "https://api-v2.swissunihockey.ch/bo/session/validate"

Provide the parameter `auth_token=<your received token>` so the API knows you are allowed to perform the request.

# [Page] <a id="bo_players_doc">https://api-v2.swissunihockey.ch/bo/players/doc</a>

Lookup
------

This returns a list of players where the license\_number matches "license\_number\*". If for example 45472 is passed, 454720\-454729 will be found. If 454729 is passed, exactly that one player is found with license number 454729\.

Clients who don't support HTTP Body during a `GET` request use a `POST` request instead.

# [Page] <a id="bo_people_doc">https://api-v2.swissunihockey.ch/bo/people/doc</a>

* [Person](#bo_people_doc)
* [List](#bo_people_doc)
* [Fetching role info](#bo_people_doc)
* [An example](#bo_people_doc)
* [Validate Password](#bo_people_doc)

Person
======

Internal use only.

List people, their roles and the roles' attributes.

You need `people_reader` rights in order to use this.

You may request multiple people by their id (aka PNr) using the parameters

ids
*comma\-separated list of user ids*

or filter the returned people by date of last modification using

changed\_since
*Required. Date in ISO\-compatible format (e.g. 2016\-12\-23\).*
People with changes that happened since the beginning of the given day will be returned.
changed\_until
*Optional. Date in ISO\-compatible format (e.g. 2016\-12\-24\).*
People with changes that happened no later than the given day will be returned.

Various representations are available:

set
*minimal or with\_roles*

### Fetching role info

If you provide `set=with_roles`, the `roles` array will contain references to the different roles a person exercises.
Depending on the type of the role, the provided details change.

All roles share a `bo_role_status`, one of the following values:

|  |  |
| --- | --- |
| *Value* | *Status name in german* |
| active | aktiv |
| inactive | inaktiv |
| demissioned | zurückgetreten |
| dispensed | dispensiert |
| deleted | gelöscht |
| suspended | suspendiert |
| announced\_demission | Rücktritt angekündigt |
| announced\_dispensation | Dispensation angekündigt |

### An example

Sample response:

{
  "list": [
    {
      "attrs": {
        "roles": [
          "players/7295"
        ],
        "addresses": [
          "addresses/7295"
        ],
        "first_name": "Max",
        "last_name": "Muster",
        "email": "max.muster@muster.example",
        "email_2": null,
        "language": "de",
        "phone_mobile": "0791234567",
        "phone_private": "0311234567",
        "phone_business": null,
        "phone_business_headquarters": null,
        "phone_contact": null,
        "website": null,
        "name_contact": null,
        "birth_date": "1990-01-01"
      },
      "set": "with_roles",
      "type": "Person",
      "id": 7295
    }
  ],
  "references": {
    "players/7295": {
      "attrs": {
        "identification": "SP7295",
        "bo_role_status": "inactive",
        "club_name": "UHC Goal",
        "club_id": 351,
        "number": 0,
        "position": null,
        "captain": false,
        "weight": 0,
        "name": "Max Muster",
        "first": "Max",
        "last": "Muster",
        "license_number": 4518,
        "portrait": null,
        "entered_at": "1999-09-23",
        "left_at": "2004-06-30",
        "height": 0
      },
      "set": "for_role",
      "type": "Player",
      "id": 7295
    },
    "addresses/7295": {
      "attrs": {
        "public_address": true,
        "postal_address": true,
        "additional": null,
        "country": "CH",
        "canton": "BE",
        "location": "Ort",
        "zip_code": "3000",
        "street": "Strasse 1"
      },
      "set": "minimal",
      "type": "Address",
      "id": 7295
    }
  },
  "status": {
    "msg": "ok.",
    "code": 0
  }
}

You need `password_validator` rights in order to use this.

password
*string*

# [Page] <a id="api_v3_games_doc">https://api-v2.swissunihockey.ch/api/v3/games/doc</a>

You **must** provide at least one filter, because there are a lot of games and you can not fetch them all at once.

`from_date` will yield all games played on or after the given date.

```
GET /api/v3/games?filter[from_date]=2017-05-03

`to_date` will yield all games played on or before the given date.

```
GET /api/v3/games?filter[to_date]=2017-05-05

`with_live_stream` will yield only games where at least one of the participating teams streams their games.

```
GET /api/v3/games?filter[with_live_stream]=1

### Includes

To save requests, you may include the following resources via the [include request parameter](http://jsonapi.org/format/#fetching-includes):

E.g

```
GET /api/v3/games?filter[with_live_stream]=1&include=home_team,away_team

### Parameters

Provide the games' `id` to fetch it's details

```
GET /api/v3/games/876785

Adds an extra goal. Currently we do this to add a goal to the score for won penalty shootouts.

A note on **authorization**: This endpoint requires a valid anlass token obtained by [Logging in with anlass credentials](https://api-v2-dev.swissunihockey.ch/bo/session/doc#logging-in-with-anlass-credentials).

### Parameters

* `team_id` \- The id of the team to add a goal for.

E.g

```
POST /api/v3/games/876785/add_extra_goal

Data:
team_id=429561

### Includes

To save requests, you may include the following resources via the [include request parameter](http://jsonapi.org/format/#fetching-includes):

# [Page] <a id="api_v3_teams_doc">https://api-v2.swissunihockey.ch/api/v3/teams/doc</a>

This will find the last started game (status *Durchgeführt* or *Abgebrochen*) of all games that

* were started in the past
* had the team participating on either away or home side.

# [Page] <a id="api_v3_games_teams_doc">https://api-v2.swissunihockey.ch/api/v3/games/teams/doc</a>

Retrieves all team members that are eligible to play in the given game.

To be eligible, the following has to be satisfied:

* The member has any type of license that allows him to participate in games on behalf of this team.
* The license is valid at the day the game is played.
* If this is a game that happens outside "Meisterschaft Qualifikation", the license must not be a multi license (Doppelspiellizenz).

Find out whether your chosen lineup is valid.

To be, it has to satisfy the following:

* Only eligible team members' licenses used. To find those, use `/api/v3/games/:game_id/teams/:id/lineup_candidates`.
* No lineup quota exceeded.
	+ There may not be more than 22 players in a lineup.
	+ There are limits in place for each league/game class combination that govern many players one can draft from other leagues and game classes.

`licenses` determines which licenses to use for the lineup. It is a comma\-joined string of license ids. Mandatory.

```
GET /api/v3/games/:game_id/teams/:id/lineup_candidates?filter[licenses]=1,2

# [Page] <a id="images_doc_business_game_state_diagram.png">https://api-v2.swissunihockey.ch/images/doc/business/game/state_diagram.png</a>



# [Page] <a id="api_v3_resources_team_doc">https://api-v2.swissunihockey.ch/api/v3/resources/team/doc</a>

* `id` \- Unique identifier of this team
* `name` \- Full name of the team
* `slangname` \- Short name of the team
* URLs of team logo, multiple sizes
	+ `logo`
	+ `logo_small`
	+ `logo_streaming`
* `portrait` \- URL of team portrait

None so far.

# [Page] <a id="api_v3_resources_game_doc">https://api-v2.swissunihockey.ch/api/v3/resources/game/doc</a>

* `id` \- Unique identifier of this game
* `season_id` \- Id of the season this game is played in. This will always equal the seasons' starting year.
* `starts_at` \- Date and time the game will start.

# [Page] <a id="api_v3_resources_lineup_doc">https://api-v2.swissunihockey.ch/api/v3/resources/lineup/doc</a>

* `id` \- Unique identifier of this lineup
* `quota_exceeded` \- Whether this lineup is valid according to the rules.
* `quota_messages` \- Human readable messages describing the nature of the quota violations, if any.

# [Page] <a id="api_v3_resources_team_member_doc">https://api-v2.swissunihockey.ch/api/v3/resources/team_member/doc</a>

* `id` \- Unique identifier of this member
* `licensing` \- How the members license matches for the given team. Values:
	+ *regular* \- Licensed for league and game class of the team.
	+ *other* \- Licensed for a league and game class other than those of the team. The player is allowed to play for the team according to the current rules (Memorandum).
	+ *multi* \- Player has a multi\-license (Doppelte Spielberechtigung) that allows him to play for the team.
* `last_name`
* `first_name`
* `shirt_number` \- Shirt number of the player
* `position` \- Position the player plays in (*goalkeeper, forward, defender, forward\_left, forward\_center, forward\_right, defender\_left, defender\_right, staff*)
* `captain` \- Whether or not the player is the team's captain.
* `license_competition_description` \- A string describing the league and game class of the license, e.g. *Herren GF \- NLA*
* `license_disabled` \- Whether or not the license is disabled (see [license](#api/v3/resources/license/doc)).

* `player` \- A [player](#api/v3/resources/player/doc) resource object.
* `person` \- A [person](#api/v3/resources/person/doc) resource object.
* `license` \- A [license](#api/v3/resources/license/doc) resource object.

# [Page] <a id="api_v3_resources_license_doc">https://api-v2.swissunihockey.ch/api/v3/resources/license/doc</a>

* `id` \- Unique identifier of this license
* `locked` \- Whether or not the license is currently locked (e.g. because of a "Matchstrafe" penalty)
* `competition_description` \- A string describing the competition the license is for, e.g. "Damen KF 1\. Liga"

# [Page] <a id="api_v3_resources_player_doc">https://api-v2.swissunihockey.ch/api/v3/resources/player/doc</a>



# [Page] <a id="api_v3_resources_person_doc">https://api-v2.swissunihockey.ch/api/v3/resources/person/doc</a>



# Common Sections

Business Server API documentation

* [Endpoints](#api_doc_table_overview)
* [Localisation (L10N / I18N)](#api_doc_table_overview)
* [Return Types](#api_doc_table_overview)

* `home_team` \- the [teams](#api_v3_resources_team_doc) that plays at home.
* `away_team` \- the [teams](#api_v3_resources_team_doc) that plays as guest.

GET /api/v3/games/:game\_id/teams/:id/lineup\_candidates \- Who is allowed to play for a team?
----------------------------------------------------------------------------------------------

Endpoints
---------

A [resource object](http://jsonapi.org/format/#document-resource-objects) representing a lineup one of the [teams](#api_v3_resources_team_doc) in a [game](#api_v3_resources_game_doc).

Please get in contact with our IT ([it@swissunihockey.ch](mailto:it@swissunihockey.ch)) if you want to use this API in your own apps.

![100%](/images/doc/business/game/state_diagram.png)
[(Open big version)](#images_doc_business_game_state_diagram.png)

A [game](#api/v3/resources/game/doc). It's `home_team` and `away_team` are included.

/api/v3/games/:game\_id/teams
=============================

```
{
  "event": "forfait", 
  "second": 13, 
  "auth_token": "TOKEN", 
  "winner": "home"
}

Definition
==========

#### Sample Response: `"finals"` phase

Run Sample Request!

* Adds `/national_players/:id` to get details of national players.

season
*integer*
season to query, by first year (ie: `season=2013`)

The error document returned looks like this:

Player
======

* [Sample](#api_doc_table_attribute_list)
* [Usage](#api_doc_table_attribute_list)

Sample
------

```

Usage
-----

* [GameEvent](#api_game_events_doc)
* [Game detailed events](#api_game_events_doc)

* [Calendar](#api_calendars_doc)
* [Team, Club or Group calendar](#api_calendars_doc)

Parameters apart from `:club_id`:

`PUT https://api-v2.swissunihockey.ch/bo/people/:id/validate_password`

Tells whether the provided password is valid for the specified person.

Returns a list of players for a given selection that is currently actively playing.

Sample response with *invalid* token for anlass\_id:

text
*string*
The name of the dropdown.
resource
*array(object)*
A list of header columns. Contains the text to display,
how it is aligned, and how wide it is.
entries
*array(object)*
Dropdown selections with `set_in_content` where `league` and `game_class` are set, and a textual representation of a league.
levels
*array(string)*
There is only one level, `"Liga"`.
highlight
*boolean*
Always `false`.

Returns a structure of type `dropdown`:

```
{
  "type": "dropdown",
  "text": "Saison",
  "resource": "/seasons",
  "entries": [
    {"text": "2015/16", "set_in_context": {"saison_id": 2015}, "entries": [], "highlight": true},
    {"text": "2014/15", "set_in_context": {"saison_id": 2014}, "entries": [], "highlight": false},
    {"text": "2013/14", "set_in_context": {"saison_id": 2013}, "entries": [], "highlight": false}
  ],
  "levels": ["Saison"],
  "highlight": false
}

Session
=======

### Response

```
  curl -H "Content-Type: application/json" -X PUT \
    -d "{\"positions\":[{\"player_id\":423520, \"captain\":\"yes\", \
    \"number\":\"13\"},{\"player_id\":433056}],\"auth_token\":\"TOKEN\"}" \
    "http://127.0.0.1:5000/bo/games/852878/lineups/428977"

The following parameters must be given:

```
{
  "status": {
    "code": 0,
    "msg": "ok"
  },
  "payload": {
    "password": "invalid"
  }
}

These fields are returned:

### Direct meetings of two teams

game\_id
*string*
unique identifier for the game, obtained through other means
is\_home
*integer*
0 returns the lineup for the home team, 1 for the away team

Takes:

* [National Player](#api_national_players_doc)
* [Player List](#api_national_players_doc)
* [Player Details](#api_national_players_doc)
* [Player Statistics](#api_national_players_doc)
* [Player National Team Statistics](#api_national_players_doc)

### Filtering

Game
====

List
----

club
*string*
Current club
number
*string*
Player number
position
*string*
Player position
year\_of\_birth
*string*
Year of birth of player
height
*string*
Height of the player in cm
weight
*string*
Weight of the player in kg
selection
*string*
What national selection this player plays in.

Parameters:

![](#api/__sinatra__/404.png)

Returns a **Table** containing "Spielerstatistik Nationalteam" data for a given player with the following columns.

saison
*integer*
Identifier of the Saison when the statistics were taken.
liga
*text*
Name of the Liga the player was in at the time.
verein
*text*
Name of the Verein the player was in at the time.
games
*text*
Amount of games played.
goals
*text*
Amount of goals scored.
assists
*text*
Amount of assists made.
points
*text*
Amount of points scored.
2\-minute\-penalty
*text*
Amount of 2 minute penalties.
5\-minute\-penalty
*text*
Amount of 5 minute penalties.
10\-minute\-penalty
*text*
Amount of 10 minute penalties.
matchpenalty
*text*
Amount of match penalties.

* [Season](#api_seasons_doc)
* [Retrieve the list of seasons](#api_seasons_doc)
* [Seasons with format "dropdown"](#api_seasons_doc)

Retrieves info on games.

The following [filters](http://jsonapi.org/recommendations/#filtering) are available:

Retrieves the list of groups (for a season and league/game\_class) as an e.g. Dropdown object.

Which results are returned is defined by the provided parameter `mode`:

* Season list as dropdown: `format` is set to `"dropdown"`.

Try this:
 
```
# in api_controller.rb
class Web::ApiController
  get '/doc/attribute_list' do
    "Hello World"
  end
end

[Back to API overview](#api_doc_business_overview)

format
*e.g. `"dropdown"`*
Format selector.
season
*e.g. `2013`*
Season selector.
