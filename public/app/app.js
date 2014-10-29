Ext.Loader.setConfig({ enabled: true });
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
  var app = new MailViewer.App();
});