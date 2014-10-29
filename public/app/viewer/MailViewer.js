/**
 * Create a new Mail Viewer app
 * @param {Object} config The config object
 */
Ext.define('MailViewer.App', {
  extend: 'Ext.container.Viewport',
  alias: 'viewport',
  initComponent: function () {

    Ext.define('MessageRecipient', {
      extend: 'Ext.data.Model',
      fields: [
        'name',
        'address'
      ]
    });

    Ext.define('MessageCC', {
      extend: 'Ext.data.Model',
      fields: [
        'name',
        'address'
      ]
    });

    Ext.define('MailViewer.model.MessageAttachment', {
      extend: 'Ext.data.Model',
      fields: [
        { name: 'id', type: 'int' },
        { name: 'name', 'type': 'string' },
        { name: 'size', type: 'int' },
        { name: 'contentType', type: 'string' },
        { name: 'checksum', type: 'string' },
        { name: 'contentId', type: 'string'}
      ]
    });

    Ext.define('Message', {
      extend: "Ext.data.Model",
      idProperty: 'id',
      fields: [
        { name: 'id', type: 'int' },
        { name: 'subject', type: 'string' },
        { name: 'received', type: 'date' },
        { name: 'fromName', type: 'string' },
        { name: 'fromAddress', type: 'string' },
        { name: 'read', type: 'boolean' },
        { name: 'size', type: 'int'},
        { name: 'humanSize', type: 'string' }
      ],
      hasMany: [
        {
          name: 'recipients',
          model: 'MailViewer.model.MessageRecipient',
          associationKey: 'recipients'
        },
        {
          name: 'ccs',
          model: 'MailViewer.model.MessageCC',
          associationKey: 'ccs'
        },
        {
          name: 'attachments',
          model: 'MailViewer.model.MessageAttachment',
          associationKey: 'attachments'
        }
      ]
    });

    Ext.apply(this, {
      layout: {
        type: 'border',
        padding: 0
      },
      items: [this.createMessageContainer()]
    });
    this.callParent(arguments);
  },
  createMessageContainer: function () {
    this.messageContainer = Ext.create('widget.messagecontainer', {
      region: 'center',
      minWidth: 300
    });

    return this.messageContainer;
  },
  setupApplication: function () {
    this.remove(this.loginWindow);
  }
});
