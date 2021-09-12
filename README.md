# trackmanager - manage and display gpx tracks and statistics

trackmanager should be a web application to display bicycle gpx tracks which have been uploaded to a database.

Work is in progress. Technologies used are postgis, node, express, vuejs single page application, openlayers

## Planned features

* Mobile friendly
* Authentication
### Start page

* Overview of tracks. A list of tracks with name, lengtj , datetime and ascent
* Each track can have a preview icon of track shape next to it ( immutable small map or png thumbnail)
* Track list is grouped by year. On top of each year , a header card with year to date sum of length, ascent
    * Groups are collapsable
* Klick on track leads to single track detail page
* Klick on group header shows all tracks of year in one page
    * Option to add more years
* When navigating back to start page - restore previous scroll position
* Lazy loading of content ( load on scroll )

### Track Detail page

* Track map 
    * Tracks should not reach to edge
* Track stats
* Elevation profile
* Mousover on elevation profile shows synchronized highlighted point in map
* Navigate to next / prev track
* Optinal: Edit / store track metadata ( Name, participants, etc )

### Multiple tracks page

* Multiple tracks on map with color coding
    * Five colors Round robin
    * Color by length or ascent or start area
    * Select track by klick / tip in convenient way. Highlight selected track and show details in baloon

### Multi tenancy

* Isolate multiple tenants for different users ... probably into schemas
### Statistics page

* Compare years
    * km , ascent per year
    * cumulated km over date of year

## Upload Page

* Bigger drop space
* Check in upload ( multer ) if xml file - otherwise discard
* Disable Browse Button
* Drop on TrackOverview (?)
* Spinner
## Technical todos
* Store retrieve scroll position
* Create small track shape preview in performant way - either openlayers during runtime or pre created thumbnails
    * What is memory consumption and performance of loading all track details?
    * Maybe backend should provide low-res track on demand
    * Does caching help
    * Lazy content loading on overview page
* Load content on scroll
* Mobile navigation - collapsed etc ..
