Ext.define('MailViewer.MessageGrid', {
  extend: 'Ext.grid.Panel',
  alias: 'widget.messagegrid',

  initComponent: function () {
    var MessageStore = Ext.create('Ext.data.Store', {
      id: 'messagestore',
      storeId: 'messageStore',
      model: 'Message',
      proxy: {
        type: "ajax",
        appendId: true,
        url: 'messages',
        reader: {
          type: 'json',
          rootProperty: 'data',
          totalProperty: 'totalCount'
        }
      },
      remoteFilter: true,
      autoLoad: true,
      listeners: {
        load: this.onLoad,
        scope: this
      }
    });

    Ext.define('MailViewer.MessageGrid.SearchTrigger', {
      extend: 'Ext.form.field.Text',
      alias: 'widget.messagegridsearchtrigger',
      triggerCls: 'x-form-clear-trigger',
      trigger2Cls: 'x-form-search-trigger',
      width: 300,
      triggers: {
        search: {
          cls: 'x-form-search-trigger',
          handler: function () {
            this.performQuery(this.getValue())
          }
        },
        clear: {
          cls: 'x-form-clear-trigger',
          handler: function () {
            this.setValue('');
            this.performQuery(null);
          }
        }
      },
      performQuery: function (query) {
        var store = MessageStore;
        if (query) {
          if (query.length <= 3) {
            Ext.Msg.alert('Error', 'Search term must be more than 3 characters in length');
            return;
          }
          store.proxy.extraParams.q = query;
          store.reload();
        } else {
          delete store.proxy.extraParams.q;
          store.reload();
        }
      },
      listeners: {
        specialKey: function (textfield, e) {
          if (e.getCharCode() == Ext.EventObject.ENTER) {
            this.performQuery(this.getValue());
          }
        }
      }
    });

    Ext.apply(this, {
      store: MessageStore,
      id: 'messagegrid',
      viewConfig: {
        autoScroll: true,
        trackOver: false,
        columnLines: true,
        itemId: 'view',
        listeners: {
          scope: this,
          itemdblclick: this.onRowDblClick,
          itemclick: this.onRowClick,
          itemkeydown: this.onRowKeyDown,
          itemcontextmenu: this.onContextMenu
        }
      },
      enableColumnMove: false,
      enableColumnHide: false,
      layout: 'fit',
      reserveScrollbar: true,
      sortableColumns: false,
      tbar: [
        {
          xtype: 'button',
          text: 'Refresh messages',
          icon: '/images/refresh.png',
          handler: function () {
            MessageStore.reload();
          }
        },
        {
          xtype: 'messagegridsearchtrigger',
          autoSearch: false,
          emptyText: 'Search for an email...'
        },
        {
          xtype: 'tbfill'
        },
        {
          xtype: 'button',
          text: 'Settings',
          icon: '/images/cog.png',
          handler: function () {
            Ext.create('Ext.window.Window', {
              title: 'Settings',
              width: 600,
              layout: 'fit',
              modal: true,
              items: [
                {
                  xtype: 'form',
                  border: false,
                  bodyPadding: 5,
                  buttons: [
                    {
                      text: 'Save settings',
                      handler: function (button) {
                        var stateManager = Ext.state.Manager;
                        var form = this.up('form').getForm();
                        var values = form.getValues();
                        stateManager.set('enableChromeNotifications', values.enableChromeNotifications);
                        stateManager.set('enableNotifications', values.enableNotifications);
                        button.up('.window').close();
                      }
                    }
                  ],
                  listeners: {
                    afterrender: function (form) {
                      var stateManager = Ext.state.Manager;
                      form.add({
                        xtype: 'checkbox',
                        labelWidth: 150,
                        fieldLabel: 'Chrome notifications',
                        boxLabel: 'Enable chrome notifications when a new message is received',
                        checked: stateManager.get('enableChromeNotifications'),
                        uncheckedValue: false,
                        inputValue: true,
                        name: 'enableChromeNotifications'
                      });
                      form.add({
                        xtype: 'checkbox',
                        labelWidth: 150,
                        fieldLabel: 'Application notifications',
                        boxLabel: 'Enable application notifications when a new message is received',
                        checked: stateManager.get('enableNotifications'),
                        uncheckedValue: false,
                        inputValue: true,
                        name: 'enableNotifications'
                      });
                    }
                  }
                }
              ]
            }).show();
          }
        },
        {
          xtype: 'button',
          text: 'Clear messages',
          icon: '/images/trash.png',
          handler: function () {
            Ext.Msg.show({
              title: 'Delete all messages?',
              message: 'Are you sure you want to delete all the messages? They will be permanently deleted',
              buttons: Ext.Msg.YESNO,
              icon: Ext.Msg.QUESTION,
              fn: function (btn) {
                if (btn === 'yes') {
                  Ext.Ajax.request({
                    url: '/messages',
                    method: 'DELETE',
                    success: function () {
                      // remove any open tabs
                      var messageContainer = Ext.getCmp('messagecontainer');
                      messageContainer.removeAllTabs();

                      // reset message preview panel
                      var messageContainer = Ext.getCmp('messagedisplay');
                      messageContainer.update();

                      MessageStore.reload();
                    }, failure: function () {
                      Ext.Msg.alert('Error', 'Couldn\'t delete the messages :-(');
                    }
                  });
                }
              }
            });
          }
        }
      ],
      columns: [
        {
          text: 'Subject',
          dataIndex: 'subject',
          flex: 3,
          renderer: this.formatTitle,
          sortable: false
        },
        {
          text: 'From',
          dataIndex: 'from',
          renderer: this.formatFrom,
          sortable: false,
          hidden: false,
          flex: 1
        },
        {
          text: 'To',
          dataIndex: 'recipients',
          hidden: false,
          sortable: false,
          flex: 1,
          renderer: this.formatRecipients
        },
        {
          text: 'Received',
          width: 150,
          sortable: false,
          renderer: this.formatDate,
          dataIndex: 'received',
          flex: 1

        },
        {
          text: 'Size',
          width: 100,
          resizable: false,
          sortable: false,
          renderer: function (size) {
            var tb = ((1 << 30) * 1024),
                gb = 1 << 30,
                mb = 1 << 20,
                kb = 1 << 10,
                abs = Math.abs(size);
            if (abs >= tb) return (Math.round(size / tb * 100) / 100) + 'tb';
            if (abs >= gb) return (Math.round(size / gb * 100) / 100) + 'gb';
            if (abs >= mb) return (Math.round(size / mb * 100) / 100) + 'mb';
            if (abs >= kb) return (Math.round(size / kb * 100) / 100) + 'kb';
            return size + 'b';
          },
          dataIndex: 'size'
        },
        {
          width: 40,
          text: '<img src="/images/attachment.png">',
          renderer: this.formatAttachmentsExists,
          sortable: false,
          resizable: false,
          dataIndex: 'attachments',
          menuDisabled: true
        }
      ]
    });
    this.callParent(arguments);
    this.on('selectionchange', this.onSelect, this);
  },

  /**
   * Reacts to a double click
   * @private
   * @param {Object} view The view
   * @param {Object} index The row index
   */
  onRowDblClick: function (view, record, item, index, e) {
    //alert('double clicked');
    //this.fireEvent('rowdblclick', this, this.store.getAt(index));
  },

  onContextMenu: function (view, record, item, index, e) {
    e.stopEvent();
    var _this = this;
    var menu = new Ext.menu.Menu({
      scope: this,
      items: [
        {
          icon: '/images/tab-new.png',
          text: 'Open message in new tab',
          handler: function () {
            view.fireEvent('rowdblclick', view, view.getStore().getAt(index));
          }
        },
        {
          icon: '/images/download.png',
          text: 'Download message',
          handler: function () {
            var url = Ext.String.format('/messages/{0}/source.eml', record.get('id'));
            window.open(url);
          }
        },
        {
          icon: '/images/trash.png',
          text: 'Delete message',
          handler: function () {
            _this.deleteMessage(view, record);
          }
        }
      ]
    }).showAt(e.getXY());

  },
  /**
   * Reacts to a single click
   * @private
   * @param {Object} view The view
   * @param {Object} index The row index
   */
  onRowClick: function (view, record, item, index, e) {
    this.setRead(record);
  },

  deleteMessage: function (view, record) {
    Ext.Ajax.request({
      url: '/messages/' + record.get('id'),
      method: 'DELETE',
      success: function (response) {
        /**
         * Probably a better way to do this....
         */
        var messageContainer = Ext.getCmp('messagecontainer');
        messageContainer.removeTab(record);
        view.getStore().reload();
      }, failure: function () {
        Ext.Msg.alert('Error', 'Couldn\'t delete message :-(');
      }
    });
  },
  /**
   * Mark a message as read.
   * For some reason the PUT request in the store does not work correctly
   */
  setRead: function (record) {
    if (record !== undefined) {
      if (record.get('read') === false) {
        Ext.Ajax.request({
          url: '/messages/' + record.get('_id'),
          method: 'PUT',
          success: function (response) {
            record.set('read', true);
          }, failure: function () {
            Ext.Msg.alert('Error', 'Couldn\'t mark message as read :-(');
          }
        });
      }
    }
  },
  onRowKeyDown: function (view, record, item, index, e) {
    if (e.getKey() === Ext.EventObject.DELETE) {
      this.deleteMessage(view, record);
    }
  },
  /**
   * React to a grid item being selected
   * @private
   * @param {Ext.model.Selection} model The selection model
   * @param {Array} selections An array of selections
   */
  onSelect: function (model, selections) {
    var selected = selections[0];
    this.setRead(selected);
    if (selected) {
      //  this.fireEvent('select', this, selected);
    }
  },

  /**
   * Listens for the store loading
   * @private
   */
  onLoad: function (store, records, success) {
    return;
  },

  formatTitle: function (value, p, record) {
    if (record.data.read) {
      return value;
    }
    // ExtJs overwrites font-weight for strong or bold...
    return Ext.String.format('<strong style="font-weight: bold">{0}</strong>', value);
  },

  formatRecipients: function (value, p, record) {
    var recipients = new Array();
    value.forEach(function (recipient) {
      if (recipient.name) {
        recipients.push(Ext.String.format('{0} &lt;{1}&gt;',
          recipient.name,
          recipient.address));
      } else {
        recipients.push(recipient.address);
      }
    });
    return recipients.join(', ');
  },

  formatAttachmentsExists: function (attachments) {
    if (attachments.length > 0) {
      return '<img src="/images/attachment.png" style="height: 16px" />';
    }
  },
  formatDate: function (date) {
    return Ext.Date.format(date, 'Y/m/d g:i a');
  },
  formatFrom: function (value, p, record) {
    if (value.name) {
      return Ext.String.format('{0} &lt;{1}&gt;', value.name, value.address);
    }
    return value.address;
  }
})
;
