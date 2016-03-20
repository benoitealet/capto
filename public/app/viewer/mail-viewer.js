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
      idProperty: '_id',
      fields: [
        'name',
        'address'
      ],
      belongsTo: 'Message'
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
      idProperty: '_id',
      fields: [
        {name: 'id', type: 'int'},
        {name: 'name', 'type': 'string'},
        {name: 'size', type: 'int'},
        {name: 'contentType', type: 'string'},
        {name: 'checksum', type: 'string'},
        {name: 'contentId', type: 'string'}
      ]
    });

    Ext.define('Message', {
      extend: "Ext.data.Model",
      idProperty: '_id',
      fields: [
        {name: 'subject', type: 'string'},
        {name: 'received', type: 'date'},
        {name: 'from', type: 'auto'},
        {name: 'size', type: 'int'},
        {name: 'hasHtml', type: 'boolean'},
        {name: 'hasPlain', type: 'boolean'},
        {name: 'humanSize', type: 'string'},
        {name: 'deliveryDate', type: 'date'},
        {name: '_deliveryMail', type: 'string'}, // not persisted, only to send destination to nodejs while saving
      ],
      hasMany: {
        model: 'MailViewer.model.MessageRecipient', name: 'recipients'
      }
    });

    Ext.define('Origin', {
      extend: "Ext.data.Model",
      idProperty: '_id',
      fields: [
        {name: '_id', type: 'string'},
        {name: 'value', type: 'int'},
      ],
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
  }
});
