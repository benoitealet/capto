Ext.define('FeedViewer.Message', {
  extend: 'Ext.panel.Panel',
  alias: 'widget.message',
  autoScroll: false,
  border: false,
  cls: 'preview',
  listeners: {
    'afterrender': function (panel) {
      /**
       * Putting an iframe in the xtemplate does not work correctly.
       * The iframe height is not set correctly (its too large)
       * so I've put this ugly code here to solve this issue.
       */
      var id = Ext.get(panel.id),
        body = id.select('.x-panel-body').first();

      window.setInterval(function () {
        var messageDetails = id.select('.message-details').first(),
          htmlBody = id.select('.message-content').first();
        if (htmlBody) {
          htmlBody.setHeight(body.getHeight() - messageDetails.getHeight());
        }
      }, 500);

      panel.el.on('click', function (e, t) {
        if (t.id === 'html') {
          panel.data.viewMode = 1;
          panel.update(panel.data);
        } else if (t.id === 'plain') {
          panel.data.viewMode = 2;
          panel.update(panel.data);
        } else if (t.id === 'source') {
          panel.data.viewMode = 3;
          panel.update(panel.data);
        }
      });
    },
    scope: this
  },
  tpl: [
    '<div class="message-details">',
    '<span class="date">{received:this.formatDate}</span>',
    '<h4 class="meta"><b>From:</b> {[this.formatFrom(values.fromAddress, values.fromName)]}</h4>',
    '<h4 class="meta"><b>Subject:</b> {subject}</h4>',
    '<h4 class="meta"><b>To:</b> {recipients:this.formatRecipients} </h4>',
    '<h4 class="meta"><b>CC:</b> {ccs:this.formatRecipients} </h4>',
    '<tpl if="attachments.length &gt; 0">',
    '<h4 class="meta"><b>Attachments: {[this.formatAttachments(values.attachments, values.id)]}</b></h4>',
    '</tpl>',
    '<ul class="tabs">',
    '<tpl if="viewMode == 1">',
    '<li id="html" class="active-tab">HTML</li>',
    '<tpl else>',
    '<li id="html">HTML</li>',
    '</tpl>',
    '<tpl if="viewMode == 2">',
    '<li id="html" class="active-tab">Plain</li>',
    '<tpl else>',
    '<li id="plain">Plain</li>',
    '</tpl>',
    '<tpl if="viewMode == 3">',
    '<li id="source" class="active-tab">Source</li>',
    '<tpl else>',
    '<li id="source">Source</li>',
    '</tpl>',
    '<li class="actions">',
    '<a class="download-button" href="/messages/{id}/source.eml" id="download-message"><i class="fa fa-download"></i> Download message</a>',
    '</li>',
    '</ul>',
    '</div>',
    '<tpl if="viewMode == 1">',
    '<iframe class="message-content" src="/messages/{id}/html" scrolling="yes"></iframe>',
    '</tpl>',
    '<tpl if="viewMode == 2">',
    '<iframe class="message-content" src="/messages/{id}/plain" scrolling="yes"></iframe>',
    '</tpl>',
    '<tpl if="viewMode == 3">',
    '<iframe class="message-content" src="/messages/{id}/source" scrolling="yes"></iframe>',
    '</tpl>',
    {
      defaultValue: function (v) {
        return v ? v : 'Unknown';
      },
      formatDate: function (value) {
        var date = new Date(value);
        return Ext.Date.format(date, 'M j, Y, g:i a');
      },
      formatFrom: function (fromAddress, fromName) {
        if (fromName) {
          return Ext.String.format('{0} &lt;{1}&gt;', fromName, fromAddress);
        }
        return fromAddress;
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
      formatAttachments: function (attachments, id) {
        var html = '';
        attachments.forEach(function (attachment) {
          html += Ext.String.format('<a target="_blank" href="/messages/{0}/attachments/{1}">{2}</a>', id, attachment.id, attachment.name);
        });
        return html;
      }
    }],
  initComponent: function () {
    this.callParent(arguments);
  },
  setActive: function (rec) {
    var me = this;
    me.active = rec;
    rec.data.viewMode = 1;
    me.update(rec.data);
  }
});