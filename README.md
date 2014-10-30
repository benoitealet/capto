# capto
Capto runs a simple SMTP server that captures any messages sent to it and displays it in a web interface.

> This project is under active development and may contain bugs. Feedback is very welcome. All contributions are also very welcome.

#### Features

 - Catches all mail and stores it for display.
 - Displays recipients, CCs and BCCs
 - Keyboard navigation between messages
 - Shows HTML, Plain Text and Source version of messages, as applicable.
 - List attachments and download each attachment
 - Download email source
 - Open an email in a new tab (like thunderbird)
 - Post an *eml* file via the API and view it in the interface
 - Mark as read, delete messages and navigate messages via pagination controls

The backend is written in NodeJs using the Express framework and the frontend is driven by ExtJs 5.

#### API

The backend exposes a RESTful API:

Route  | Method  | Description
------------- | ------------- | -----------
/messages  | GET | Get all messages
/messages     | DELETE | Delete all messages
/messages     | POST | Create a message
/messages/{id}|GET | Get a single message
/messages/{id} | DELETE | Delete a message
/messages/{id}/source |GET | Get the source of a message
/messages/{id}/source.eml | GET | Download the source of a message
/messages/{id}/html |GET | Get the html of a message
/messages/{id}/source |GET | Get the plain text of a message
/messages/{id}/attachments |GET | List the attachments for a message (does not include content)
/messages/{id}/attachments/{attachmentId} |GET | Get an attachment (to download append ?download to the URL)


#### To do


 - Write tests in Mocha
 - Implement Google Chrome notification API when a new message is received
 - Implement web sockets for when a new message is received?
 - Open images in a lightviewer


####Installation

TODO

####License

GPLv3. See LICENSE file in the source.