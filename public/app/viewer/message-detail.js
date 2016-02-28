Ext.define('MailViewer.MessageDetail', {
  extend: 'Ext.panel.Panel',
  alias: 'widget.messagedetail',
  border: false,
  initComponent: function () {
    this.display = Ext.create('widget.message', {
      id: 'messagedisplay'
    });
    Ext.apply(this, {
      layout: 'border',
      items: [this.createGrid(), this.createSouth()]
    });
    this.relayEvents(this.display, ['opentab']);
    this.relayEvents(this.grid, ['rowdblclick']);
    this.callParent(arguments);
  },
  createGrid: function () {
    this.grid = Ext.create('widget.messagegrid', {
      region: 'center',
      flex: 2,
      minHeight: 200,
      minWidth: 150,
      listeners: {
        scope: this,
        select: this.onSelect
      }
    });
    return this.grid;
  },
  /**
   * Fires when a grid row is selected
   */
  onSelect: function (grid, rec) {
    this.display.setActive(rec);
  },
  createSouth: function () {
    this.south = Ext.create('Ext.panel.Panel', {
      layout: 'fit',
      region: 'south',
      border: false,
      split: true,
      flex: 2,
      minHeight: 150,
      items: this.display
    });
    return this.south;
  }
});