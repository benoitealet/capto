Ext.define('MailViewer.MessageContainer', {

  extend: 'Ext.tab.Panel',
  alias: 'widget.messagecontainer',
  cls: 'header',
  title: '<img src="/images/logo.png" style="height: 30px">',
  maxTabWidth: 230,
  border: false,
  tabBar: {
    border: true
  },
  initComponent: function () {
    this.callParent(arguments);
    var active = this.items.first();
    if (!active) {
      active = this.add({
        xtype: 'messagedetail',
        title: '<b><i class="fa fa-inbox"></i> Messages</b>',
        itemId: 'messages',
        closable: false,
        listeners: {
          scope: this,
          opentab: this.onTabOpen,
          rowdblclick: this.onRowDblClick
        }
      });
    } else {
      active.tab.setText('Messages');
    }
    this.setActiveTab(active);
  },
  /**
   * Listens for a new tab request
   */
  onTabOpen: function (post, rec) {
    var item;
    if (rec) {
      item = this.getTabById(rec.get('id'));
      if (!item) {
        item = this.add({
          inTab: true,
          xtype: 'message',
          itemId: 'message_' + rec.get('id'),
          title: rec.get('subject'),
          closable: true,
          data: rec.data,
          active: rec
        });
      }
      this.setActiveTab(item);
    }
  },
  getTabById: function (id) {
    var index = this.items.findIndexBy(function (item) {
      return item.itemId === 'message_' + id;
    });
    return (index < 0) ? null : this.items.getAt(index);
  },
  onRowDblClick: function (info, rec) {
    this.onTabOpen(null, rec);
  }
});