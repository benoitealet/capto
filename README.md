# capto

#### Development email testing made easy

Capto runs a simple SMTP server that captures any messages sent to it and displays it in a web interface.  No messages are relayed to any email addresses.

![Screenshot](https://raw.githubusercontent.com/Flukey/capto/master/docs/screenshots/screenshot.png)

> This project is under active development and may contain bugs. Feedback is very welcome. All contributions are also very welcome.

[![NPM](https://nodei.co/npm/capto.png)](https://nodei.co/npm/capto/)

#### Features

 - Catches all mail and stores it for display.
 - Displays recipients and CCs
 - Display headers
 - Keyboard navigation between messages
 - Full text searching for messages
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
 - Open images in a lightbox
 - ~~Implement full text search~~
 - Implement column sorting (received, subject etc.)
 - ~~Implement CLI entry point (.ie. bin/capto)~~

####Installation

> Capto requires a MySQL database. The code project was originally designed to use SQLite, however, due to nodes asynchronous nature,  database writes were failing when multiple requests were sent in quick succession. 

To get started, install capto (may require sudo privileges):

    npm install -g capto

Change directory to the *node modules* directory:

    cd /usr/local/lib/node_modules/capto/app/config/

Copy the *settings.js.example* to *settings.js*

Change the settings to your MySQL database (make sure you've created the database). Then run:

    capto db:setup

Your database should now be ready. To run the HTTP and SMTP server run:

    capto run

Now open: http://localhost:9024 to view the web interface. Send messages to *smtp://127.0.0.1:9025*.

> Please note: The default max message size is 25mb. You can send a message greater than this value and the SMTP server will accept it, however, once processed it will be rejected and will not be persisted to the database. You can increase or decrease this default value in the *settings.js* file or pass in the option *--max-message-length* when running the *capto run* command.

The *capto run* command offers a few options:

      capto run --help
    
      Usage: run [options]
    
      Options:
    
        -h, --help                 output usage information
        --smtp-ip [address]        Set the ip address for the http server
        --http-ip [address]        Set the ip address for the smtp server
        --smtp-port [port]         Set the port of the smtp server
        --http-port [port]         Set the port of the http server
        --max-message-size [size]  Set the max message size the smtp server will accept in bytes

#### Thanks

Many thanks to [sj26](https://github.c/sj26) for his excellent [mailcatcher](https://github.com/sj26/mailcatcher) project for the inspiration for this project.

Many thanks also goes to the many developers who have contributed to the various libraries used in this project.

####License

GPLv3. See LICENSE file in the source.



