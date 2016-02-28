Ext.Loader.setConfig({enabled: true});
Ext.Loader.setPath('Ext.ux', '/lib/ext/ux');
Ext.require([
    'Ext.grid.*',
    'Ext.data.*',
    'Ext.util.*',
    'Ext.Action',
    'Ext.tab.*',
    'Ext.button.*',
    'Ext.form.*',
    'Ext.tip.*',
    'Ext.layout.container.Card',
    'Ext.layout.container.Border'
]);

Ext.onReady(function () {
    Ext.tip.QuickTipManager.init();
    /**
     * Enable the state manager
     */
    Ext.state.Manager.setProvider(
            new Ext.state.CookieProvider({expires: new Date(new Date().getTime() + (1000 * 60 * 60 * 24 * 730))})); // expires in two years
    // setup default settings
    var stateManager = Ext.state.Manager;
    if (stateManager.get('enableNotifications') === undefined) {
        stateManager.set('enableNotifications', true);
    }
    if (stateManager.get('enableChromeNotifications') === undefined) {
        stateManager.set('enableChromeNotifications', true);
    }

    var app = new MailViewer.App();


    /**
     * Poll the server every 5 seconds for unread message count
     * @type {Ext.direct.PollingProvider}
     */
    var poll = new Ext.direct.PollingProvider({
        type: 'polling',
        url: function () {
            Ext.Ajax.request({
                url: '/messages/unread',
                method: 'GET',
                success: function (response) {
                    var json = Ext.util.JSON.decode(response.responseText);
                    if (json.totalCount === 0) {
                        titlenotifier.reset();
                    } else {
                        titlenotifier.set(json.totalCount);
                    }
                }, failure: function () {
                    Ext.toast('Could not fetch unread message count', 'Error', 't');
                }
            });
        },
        interval: 5000
    });
    Ext.Direct.addProvider(poll);

    /**
     * Setup Google Chrome Notifications
     */

    if (!("Notification" in window)) {
        alert('Please use a modern version of Chrome, Firefox, Opera or Firefox to use Notifications');
        return;
    } else {
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    }

    var socketIo = io.connect();
    socketIo.on('new message', function (data) {
        if (stateManager.get('enableChromeNotifications') === true) {
            if ('Notification' in window) {
                if (Notification.permission !== 'denied') {
                    var notification = new Notification('New message received', {
                        icon: '/favicon.ico',
                        body: (data.data.subject) || 'No subject'
                    });
                }
            }
        }

        var messageStore = Ext.StoreMgr.lookup("messageStore");
        messageStore.reload();
        var originStore = Ext.StoreMgr.lookup("originStore");
        originStore.reload();

        if (stateManager.get('enableNotifications') === true) {
            var html = Ext.String.format('<p>{0}</p><b>{1}</b>', data.data.subject || 'No subject', data.data.from.address);
            Ext.toast({
                html: html,
                title: 'New message received',
                width: 400,
                align: 't'
            });
        }
    });

    socketIo.on('delete all', function (data) {
        var messageStore = Ext.StoreMgr.lookup("messageStore");
        messageStore.removeAll();
        var originStore = Ext.StoreMgr.lookup("originStore");
        originStore.removeAll();
    });

    socketIo.on('refresh', function (data) {
        var messageStore = Ext.StoreMgr.lookup("messageStore");
        messageStore.reload();
        var originStore = Ext.StoreMgr.lookup("originStore");
        originStore.reload();
    });


    /**
     * Bind attachment images to magnific popup
     */
    $(document).on("click", ".attachment-image", function (e) {
        var href = $(this).attr('href');
        $.magnificPopup.open({
            items: {
                src: href
            },
            type: 'image',
            image: {
                verticalFit: true,
                titleSrc: function () {
                    return Ext.String.format('<a class="attachment-image-download" href="{0}">Download</a>', href);
                }
            }
        }, 0);
        e.preventDefault();
    });
});
