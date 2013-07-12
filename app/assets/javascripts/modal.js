//-- copyright
// OpenProject is a project management system.
//
// Copyright (C) 2012-2013 the OpenProject Team
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 3.
//
// See doc/COPYRIGHT.rdoc for more details.
//++

var ModalHelper = (function() {

  var ModalHelper = function() {
    var modalHelper = this;
    var modalDiv, modalIframe;

    function modalFunction(e) {
      if (!event.ctrlKey && !event.metaKey) {
        if (jQuery(e.target).attr("href")) {
          url = jQuery(e.target).attr("href");
        }

        if (url) {
          e.preventDefault();

          modalHelper.createModal(url, function (modalDiv) {});
        }
      }
    }

    jQuery(document).ready(function () {
      var body = jQuery(document.body);
      // whatever globals there are, they need to be added to the
      // prototype, so that all ModalHelper instances can share them.
      if (ModalHelper.prototype.done !== true) {
        // one time initialization
        modalDiv = jQuery('<div/>').css('hidden', true).attr('id', 'modalDiv');
        modalIframe = jQuery('<iframe/>').attr('id', 'modalIframe').attr('width', '100%').attr('height', '100%');
        modalDiv.append(modalIframe);
        body.append(modalDiv);

        /** replace all data-modal links and all inside modal links */
        body.on("click", "[data-modal]", modalFunction);
        modalDiv.on("click", "a", modalFunction);

        // close when body is clicked
        body.on("click", ".ui-widget-overlay", jQuery.proxy(modalHelper.close, modalHelper));

        modalIframe.bind("load", jQuery.proxy(modalHelper.iframeLoadHandler, modalHelper));

        ModalHelper.prototype.done = true;
      } else {
        modalDiv = jQuery('#modalDiv');
        modalIframe = jQuery('#modalIframe');
      }

      modalHelper.modalIframe = modalIframe;
      modalHelper.modalDiv = modalDiv;      
    });

    this.loadingModal = false;
  };

  ModalHelper.prototype.iframeLoadHandler = function () {
    try {
      var modalDiv = this.modalDiv, modalIframe = this.modalIframe, modalHelper = this;
      var content = modalIframe.contents();
      var body = content.find("body");

      if (body.html() !== "") {
        this.hideLoadingModal();
        this.loadingModal = false;

        //add closer
        modalDiv.parent().prepend('<div id="ui-dialog-closer" />').click(jQuery.proxy(this.close, this));
        jQuery('.ui-dialog-titlebar').hide();

        modalDiv.data('changed', false);

        //tweak body.
        body.find("#top-menu").hide();
        body.find("#main-menu").hide();
        body.find("#footnotes_debug").hide();
        body.find("#footer").hide();
        body.find("#content").css("margin", "0px").css("padding", "0px");
        body.find("#main").css("padding-bottom", "0px");
        body.css("min-width", "0px");

        body.find(":input").change(function () {
          modalDiv.data('changed', true);
        });

        jQuery(this).trigger("loaded");

        modalDiv.parent().show();

        /*modalIframe.attr("height", "0px");
        //tweak height
        var height = Math.max(content.height() + 20, modalDiv.height());
        modalDiv.attr("height", height);
        modalIframe.attr("height", height);*/

        modalIframe.attr("height", modalDiv.height());
      } else {
        this.showLoadingModal();
      }
    } catch (e) {
      this.loadingModal = false;
      this.hideLoadingModal();
      this.close();
    }
  };

  /** display the loading modal (spinner in a box)
   * also fix z-index so it is always on top.
   */
  ModalHelper.prototype.showLoadingModal = function() {
    jQuery('#ajax-indicator').show().css('zIndex', 1020);
  };

  /** hide the loading modal */
  ModalHelper.prototype.hideLoadingModal = function() {
    jQuery('#ajax-indicator').hide();
  };

  ModalHelper.prototype.close = function(e) {
    var modalDiv = this.modalDiv;
    if (!this.loadingModal) {
      if (modalDiv.data('changed') !== true || confirm(I18n.t('js.timelines.really_close_dialog'))) {
        modalDiv.data('changed', false);
        modalDiv.dialog('close');

        jQuery(this).trigger("closed");
      }
    }
  };

  ModalHelper.prototype.loading = function() {
    this.modalDiv.parent().hide();

    this.loadingModal = true;
    this.showLoadingModal();
  };

  /** create a modal dialog from url html data
   * @param url url to load html from.
   * @param callback called when done. called with modal div.
   */
  ModalHelper.prototype.createModal = function(url, callback) {
    var modalHelper = this, modalIframe = this.modalIframe, modalDiv = this.modalDiv, counter = 0;

    if (modalHelper.loadingModal) {
      return;
    }

    var calculatedHeight = jQuery(window).height() * 0.8;

    modalDiv.attr("height", calculatedHeight);
    modalIframe.attr("height", calculatedHeight);

    modalDiv.dialog({
      modal: true,
      resizable: false,
      draggable: false,
      width: '900px',
      height: calculatedHeight,
      position: {
        my: 'center',
        at: 'center'
      }
    });

    this.loading();

    modalIframe.attr("src", url);
  };

  return ModalHelper;
})();
