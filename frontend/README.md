GeoGrid Dispatch
Overview
When a child goes missing, the initial hours—commonly referred to as the golden hours—are critical for successful recovery. Traditional public alert mechanisms often suffer from wide dissemination gaps and broad broadcasts that induce notification fatigue, causing people outside the immediate area to ignore them.

GeoGrid Dispatch is a real-time emergency coordination platform that connects law enforcement control rooms directly with on-field delivery personnel and local agents. Instead of relying on a city-wide broadcast, the system establishes a localized digital perimeter around an incident location, transmitting multimedia alerts strictly to active units positioned within that specific boundary.

System Architecture
Incident Pinning: Law enforcement selects an exact location on an interactive React and Leaflet command map interface.

Geospatial Querying: The Node.js backend processes the coordinates against a Redis geospatial index utilizing geoSearch to identify active units within a designated radius of 1 to 15 kilometers.

Targeted Dissemination: Real-time communication via Socket.io delivers a high-priority alert containing the child description and photo directly to the targeted devices.

Feedback Loop: When an agent identifies the target, a return socket transmission sends precise coordinates back to the police dashboard in real time.

Technology Stack
Frontend: React.js, Leaflet.js

Backend: Node.js, Express

Real-Time Communication: Socket.io WebSockets

Database & Geospatial Engine: Redis (geoAdd, geoSearch)

Deployment & Hosting: Render Cloud

Live Deployment Links
Police Command Dashboard: https://geogrid-frontend.onrender.com

Driver Simulator Application: https://geogrid-frontend.onrender.com/driver-app.html