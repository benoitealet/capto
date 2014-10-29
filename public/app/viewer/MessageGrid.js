Ext.define('MailViewer.MessageGrid', {
  extend: 'Ext.grid.Panel',
  alias: 'widget.messagegrid',

  initComponent: function () {

    var MessageStore = Ext.create('Ext.data.Store', {
      storeId: 'messageStore',
      model: "Message",
      pageSize: 50, // items per page
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
      params: {
        start: 0,
        limit: 50
      },
      autoLoad: true,
      listeners: {
        load: this.onLoad,
        scope: this
      }
    });

    Ext.apply(this, {
      store: MessageStore,
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
      dockedItems: [
        {
          title: 'jamie',
          xtype: 'toolbar',
          dock: 'top',
          items: [
            {
              xtype: 'button',
              text: 'Refresh messages',
              icon: '/images/refresh.png',
              handler: function () {
                MessageStore.reload();
              }
            },
            {
              xtype: 'tbfill'
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
          ]
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
          dataIndex: 'fromAddress',
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
          dataIndex: 'humanSize'
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
      ],
      // paging bar on the bottom
      bbar: Ext.create('Ext.PagingToolbar', {
        store: MessageStore,
        displayInfo: true,
        displayMsg: 'Displaying messages {0} - {1} of {2}',
        emptyMsg: "No messages to display",
        listeners: {
          afterrender: function () {
            this.child('#refresh').hide();
          }
        }
      })
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
        /* {
         icon: '/images/code.png',
         text: 'Show message source',
         handler: function () {
         }
         },*/
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
    //this.fireEvent('rowclick', this, this.store.getAt(index));
  },

  deleteMessage: function (view, record) {
    Ext.Ajax.request({
      url: '/messages/' + record.get('id'),
      method: 'DELETE',
      success: function (response) {
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
          url: '/messages/' + record.get('id'),
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
      this.getStore().removeAt(index);
      this.getSelectionModel().select(index++);
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
      this.fireEvent('select', this, selected);
    }
  },

  /**
   * Listens for the store loading
   * @private
   */
  onLoad: function (store, records, success) {
    return;
    /*if (this.getStore().getCount()) {
     //this.getSelectionModel().select(0);
     }*/
  },

  formatTitle: function (value, p, record) {
    if (record.data.read) {
      return value;
    }
    return Ext.String.format('<b>{0}</b>', value);
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
    if (record.data.fromName) {
      return Ext.String.format('{0} &lt;{1}&gt;', record.data.fromName, value);
    }
    return value;
  }
});
