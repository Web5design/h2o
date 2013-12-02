var new_annotation_start = '';
var new_annotation_end = '';
var just_hidden = 0;
var layer_info = {};
var last_annotation = 0;
var highlight_history = {};
var annotation_position = 0;
var head_offset;
var heatmap;
var clean_annotations = {};
var clean_collage_links = {};
var unlayered_tts;
var update_unlayered_end = 0;

jQuery.extend({
  rehighlight: function() {
	  jQuery('.layered-empty').removeClass('layered-empty');
	  var total_selectors = new Array();
	  $.each($('.annotator-wrapper .annotator-hl'), function(i, child) {
	    var this_selector = '';
	    var parent_class = '';
	    var classes = $(child).attr('class').split(' ');
	    for(var j = 0; j<classes.length; j++) {
	      if(classes[j].match(/^highlight/)) {
	        parent_class += '.' + classes[j];
	      }
	    }
	    if(parent_class != '') {
	      this_selector = parent_class;
	    }
	    $.each($(child).parentsUntil('.annotator-wrapper'), function(j, node) {
	      if($(node).is('span.annotator-hl')) {
	        var selector_class = '';
	        var classes = $(node).attr('class').split(' ');
	        for(var j = 0; j<classes.length; j++) {
	          if(classes[j].match(/^highlight/)) {
	            selector_class += '.' + classes[j];
	         }
	        }
	        if(selector_class != '') {
	          this_selector = selector_class + ' ' + this_selector;
	        }
	      }
	    });
	    if(this_selector != '') {
	      total_selectors.push(this_selector.replace(/ $/, ''));
	    }
	  });
	  var updated = {};
	  for(var i = 0; i<total_selectors.length; i++) {
	    updated[total_selectors[i]] = 0;
	  }
	  for(var i = 0; i<total_selectors.length; i++) {
	    var selector = total_selectors[i];
	    if(updated[selector] == 0) {
	      var unique_layers = {};
	      var layer_count = 0;
	      var x = selector.split(' ');
	      for(var a = 0; a < x.length; a++) {
	        var y = x[a].split('.');
	        for(var b = 0; b < y.length; b++) {
	          var key = y[b].replace(/^highlight-/, '');
	          if(key != '') {
	            unique_layers[key] = 1;
	          }
	        }
	      }
	      var current_hex = '#FFFFFF';
	      var key_length = 0;
	      jQuery.each(unique_layers, function(key, value) {
	        key_length++;
	      });
	      var opacity = 0.4 / key_length;
	      jQuery.each(unique_layers, function(key, value) {
	        var color_combine = jQuery.xcolor.opacity(current_hex, layer_data[key], opacity);
	        current_hex = color_combine.getHex();
	      });
	      jQuery.rule(selector + ' { background-color: ' + current_hex + '; }').appendTo('#test_test');
	      updated[selector] = 1;
	    }
	  }
	  var keys_arr = new Array();
	  jQuery.each(updated, function(key, value) {
	    keys_arr.push(key);
	  });
    if(keys_arr.length > 0) {
	    jQuery('.annotator-hl:not(' + keys_arr.join(',') + ')').addClass('layered-empty');
    } else {
      jQuery('.annotator-hl').addClass('layered-empty');
    }
  },
  observeDeleteInheritedAnnotations: function () {
    jQuery('#delete_inherited_annotations').live('click', function(e) {
      e.preventDefault();
      jQuery.ajax({
        type: 'GET',
        cache: false,
        dataType: 'JSON',
        url: jQuery.rootPath() + 'collages/' + jQuery.getItemId() + '/delete_inherited_annotations',
        beforeSend: function(){
          jQuery.showGlobalSpinnerNode();
        },
        success: function(data){
          //console.log('reload page here instead');
          /* 
          jQuery('.unlayered-ellipsis:visible').click();
          jQuery('#collage div.article').removeClass('hide_unlayered').addClass('show_unlayered');
          jQuery.hideShowUnlayeredOptions();
          var deleted_annotations = jQuery.parseJSON(data.deleted);
          jQuery.each(deleted_annotations, function(i, a) {
            jQuery.deleteAnnotationMarkup(clean_annotations["a" + a.annotation.id]);
          });
          jQuery('#inherited_h,#inherited_span').remove();
          jQuery('.unlayered-control').hide();
          */
          jQuery.hideGlobalSpinnerNode();
        },
        error: function() {
          jQuery.hideGlobalSpinnerNode();
        }
      });
    });
  },
  collage_afterload: function(results) {
    last_data = jQuery.parseJSON(results.readable_state);
    jQuery.loadState();
    if(results.can_edit_annotations) {
      jQuery.listenToRecordCollageState();
      jQuery('.requires_edit').animate({ opacity: 1.0 });
    } else {
      jQuery('.requires_edit').remove();
    }
    if(results.can_edit_description) {
      jQuery('.edit-action').animate({ opacity: 1.0 });
    } else {
      jQuery('.edit-action').remove();
    }
  },
  slideToParagraph: function() {
    if(document.location.hash.match(/^#p[0-9]+/)) {
      var p = document.location.hash.match(/[0-9]+/);
      var paragraph = jQuery('#paragraph' + p);
      var pos = paragraph.offset().top;
      jQuery(window).scrollTop(pos);
    }
  },
  observeStatsHighlights: function() {
    jQuery('#stats').hover(function() {
      jQuery(this).addClass('stats_hover');
    }, function() {
      jQuery(this).removeClass('stats_hover');
    });
  },
  updateLayerCount: function() {
    jQuery('#stats_layer_size').html(jQuery('#layers li').size());
  },
  updateAnnotationCount: function() {
    var count = 0;
    jQuery.each(clean_annotations, function(i, el) {
      count++;
    });
    jQuery('#stats_annotation_size').html(count);
  },
  observeViewerToggleEdit: function() {
    jQuery('#edit_toggle,#quickbar_edit_toggle').click(function(e) {
      e.preventDefault();
      jQuery('#edit_item #status_message').remove();
      var el = jQuery(this);
      if(jQuery(this).hasClass('edit_mode')) {
        jQuery('#cancel-annotation').click();
        jQuery('#edit_toggle,#quickbar_edit_toggle').removeClass('edit_mode');
        if(jQuery('#collapse_toggle').hasClass('expanded')) {
          jQuery('#edit_item').hide();
          jQuery('.singleitem').addClass('expanded_singleitem');
          jQuery.checkForPanelAdjust();
        } else {
          jQuery('#edit_item').hide();
          jQuery('#stats').show();
          jQuery.resetRightPanelThreshold();
          jQuery.checkForPanelAdjust();
        }
        jQuery.toggleEditMode(false);
        jQuery('#heatmap_toggle').removeClass('inactive');

        /* Forcing an autosave to save in READ mode */
        var data = jQuery.retrieveState();  
        last_data = data;
        jQuery.recordCollageState(JSON.stringify(data), false);
      } else {
        jQuery('#edit_toggle,#quickbar_edit_toggle').addClass('edit_mode');
        if(jQuery('#collapse_toggle').hasClass('expanded') || jQuery('#collapse_toggle').hasClass('special_hide')) {
          jQuery('#collapse_toggle').removeClass('expanded');
          jQuery('.singleitem').removeClass('expanded_singleitem');
          jQuery('#edit_item').show();
          jQuery.resetRightPanelThreshold();
        } else {
          jQuery('#stats').hide();
          jQuery('#edit_item').show();
          jQuery.resetRightPanelThreshold();
        }
        jQuery.toggleEditMode(true);
        if(jQuery('#hide_heatmap:visible').size()) {
          jQuery.removeHeatmapHighlights();
        }
        jQuery('#heatmap_toggle').removeClass('disabled').addClass('inactive');
        jQuery.checkForPanelAdjust();
      }
    });
  },
  observeFootnoteLinks: function() {
    jQuery.each(jQuery('.article a.footnote'), function(i, el) {
      jQuery(el).attr('href', unescape(jQuery(el).attr('href')));
      jQuery(el).attr('name', unescape(jQuery(el).attr('name')));
    });
    jQuery('.article a.footnote').click(function() {
      var href = jQuery(this).attr('href').replace('#', '');
      var link = jQuery("article a[name='" + href + "']");
      if(link.size()) {
        var pos = link.offset().top;
        jQuery(window).scrollTop(pos - 150);
      }
      return false;
    });
  },
  getHexes: function() {
    var hexes = jQuery('<div class="hexes"></div>');
    jQuery.each(color_list, function(i, item) {
      var node = jQuery('<a href="#"></a>').data('value', item.hex).css({ 'background' : '#' + item.hex });
      if(jQuery(".layer_check [data-value='" + item.hex + "']").length) {
        node.addClass('inactive');
      }
      hexes.append(node);
    });
    if(hexes.find('a').length == hexes.find('a.inactive').length) {
      hexes.find('a.inactive').removeClass('inactive');
    }
    return hexes;
  },
  observeLayerColorMapping: function() {
    jQuery('.hexes a').live('click', function() {
      if(jQuery(this).hasClass('inactive')) {
        return false;
      }
      jQuery(this).parent().siblings('.hex_input').find('input').val(jQuery(this).data('value'));
      jQuery(this).siblings('a.active').removeClass('active');
      jQuery(this).addClass('active');
      return false;
    });
    jQuery('#add_new_layer').live('click', function() {
      var new_layer = jQuery('<li class="annotator-item annotator-h2o_layer"><p>Enter Layer Name <input type="text" name="new_layer" /></p><p class="hex_input">Choose a Color<input type="hidden" name="new_layer_list[][hex]" /></p><a href="#" class="remove_layer">Cancel &raquo;</a></div>');
      var hexes = jQuery.getHexes();
      hexes.insertBefore(new_layer.find('.remove_layer'));
      new_layer.insertBefore($('.annotator-h2o_layer_button'));
      return false;
    });
    jQuery('.remove_layer').live('click', function() {
      jQuery(this).parent().remove();
      return false;
    });
  },
  removeHeatmapHighlights: function() {
    jQuery.each(heatmap.data, function(i, e) {
      jQuery('tt#' + i + '.heatmapped').css('background-color', '#FFFFFF').removeClass('heatmapped');
    });
  },
  applyHeatmapHighlights: function() {
    jQuery.each(heatmap.data, function(i, e) {
      var opacity = e / (heatmap.max+1);
      var color_combine = jQuery.xcolor.opacity('#FFFFFF', '#FE2A2A', opacity);
      var hex = color_combine.getHex();
      jQuery('tt#' + i).css('background-color', hex).addClass('heatmapped').data('collage_count', e);
    });
  },
  observeHeatmap: function() {
    jQuery('tt.heatmapped').live('mouseover', function(e) {
      var el = jQuery(this);
      el.css('position', 'relative');
      var heatmap_tip = jQuery('<a>')
        .addClass('heatmap_tip')
        .attr('title', 'Layered in ' + el.data('collage_count') + ' Collage(s)')
        .tipsy({ trigger: 'manual', gravity: 's', opacity: 1.0 });
      el.prepend(heatmap_tip);
      heatmap_tip.tipsy("show");
    }).live('mouseout', function(e) {
      var el = jQuery(this);
      el.css('position', 'static');
      el.find('a.heatmap_tip').tipsy("hide");
      el.find('a.heatmap_tip').remove();
    });
    jQuery('#heatmap_toggle:not(.inactive,.disabled)').live('click', function(e) {
      e.preventDefault();
      if(heatmap === undefined) {
        jQuery.ajax({
          type: 'GET',
          cache: false,
          dataType: 'JSON',
          url: jQuery.rootPath() + 'collages/' + jQuery.getItemId() + '/heatmap',
          beforeSend: function(){
            jQuery.showGlobalSpinnerNode();
          },
          success: function(data){
            jQuery('.popup .highlighted').click();
            heatmap = data.heatmap;
            jQuery.applyHeatmapHighlights();
            jQuery('#heatmap_toggle').addClass('disabled');
            jQuery.hideGlobalSpinnerNode();
          },
          error: function() {
            jQuery.hideGlobalSpinnerNode();
          }
        });
      } else {
        jQuery('.popup .highlighted').click();
        jQuery.applyHeatmapHighlights();
        jQuery('#heatmap_toggle').addClass('disabled');
        jQuery.hideGlobalSpinnerNode();
      }
    });
    jQuery('#heatmap_toggle.disabled').live('click', function(e) {
      e.preventDefault();
      if(jQuery(this).hasClass('inactive')) {
        return false;
      }
      jQuery.removeHeatmapHighlights();
      jQuery('#heatmap_toggle').removeClass('disabled');
    });
  },
  hideShowUnlayeredOptions: function() {
    var total = jQuery('.unlayered-ellipsis').size();
    var shown = jQuery('.unlayered-ellipsis').filter(':visible').size();
    if(total == shown) {
      jQuery('#hide_unlayered').hide();
      jQuery('#show_unlayered').show();
    } else if(shown == 0) {
      jQuery('#hide_unlayered').show();
      jQuery('#show_unlayered').hide();
    } else {
      jQuery('#show_unlayered,#hide_unlayered').show();
    } 
  },
  addCommas: function(str) {
    str += '';
    x = str.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while(rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
  },
  observeToolListeners: function () {
    jQuery("#collage #buttons a.btn-a:not(.btn-a-active)").live('click', function(e) {
      e.preventDefault();
      var top_pos = jQuery(this).position().top + jQuery(this).height() + 10;
      var left_pos = jQuery(this).width() - 208;
      jQuery('.text-layers-popup').css({ position: 'absolute', top: top_pos, left: left_pos, "z-index": 1 }).fadeIn(200);
      jQuery(this).addClass("btn-a-active");
    });
    jQuery("#collage #buttons a.btn-a-active").live('click', function(e) {
      e.preventDefault();
      jQuery('.text-layers-popup').fadeOut(200);
      jQuery(this).removeClass("btn-a-active");
    });
    jQuery('#quickbar_tools:not(.active)').live('click', function(e) {
      e.preventDefault();
      var top_pos = jQuery(this).position().top + jQuery(this).height() + 8;
      var left_pos = jQuery(this).position().left - 198 + jQuery(this).width();
      jQuery('.text-layers-popup').css({ position: 'fixed', top: top_pos, left: left_pos, "z-index": 5 }).fadeIn(200);
      jQuery(this).addClass('active');
    });
    jQuery('#quickbar_tools.active').live('click', function(e) {
      e.preventDefault();
      jQuery('.text-layers-popup').fadeOut(200);
      jQuery(this).removeClass('active');
    });
    jQuery('#layers li').each(function(i, el) {
      layer_info[jQuery(el).data('id')] = {
        'hex' : jQuery(el).data('hex'),
        'name' : jQuery(el).data('name')
      };
      jQuery('span.annotation-control-' + jQuery(el).data('id')).css('background', '#' + jQuery(el).data('hex'));
    });
    jQuery('#author_edits').click(function(e) {
      e.preventDefault();
      last_data = original_data;
      jQuery.loadState();
    });
    jQuery('#full_text').click(function(e) {
      e.preventDefault();
      jQuery.showGlobalSpinnerNode();
      jQuery('.unlayered').css('display', 'inline');
      jQuery('.unlayered-border-start,.unlayered-border-end,.unlayered-ellipsis').hide();
      jQuery('.annotator-hl').show();
      jQuery('.layered-control,.layered-ellipsis').hide();
      jQuery.each(jQuery('#layers a.hide_show'), function(i, el) {
        jQuery(el).html('HIDE "' + jQuery(el).parent().data('name') + '"');
      });
      //jQuery('#layers a.shown').removeClass('shown');
      jQuery.hideShowUnlayeredOptions();
      jQuery.hideGlobalSpinnerNode();
    });

    jQuery('#show_unlayered a').click(function(e) {
      e.preventDefault();
      jQuery.showGlobalSpinnerNode();
      $('.unlayered,.unlayered-border-start,.unlayered-border-end').css('display', 'inline');
      $('.unlayered-ellipsis').hide();
      jQuery.hideShowUnlayeredOptions();
      jQuery.hideGlobalSpinnerNode();
    });
    jQuery('#hide_unlayered a').click(function(e) {
      e.preventDefault();
      jQuery.showGlobalSpinnerNode();
      $('.unlayered,.unlayered-border-start,.unlayered-border-end').hide();
      $('.unlayered-ellipsis').show();
      jQuery.hideShowUnlayeredOptions();
      jQuery.hideGlobalSpinnerNode();
    });

    jQuery('#layers .hide_show').live('click', function(e) {
      e.preventDefault();
      jQuery.showGlobalSpinnerNode();

      var el = $(this);
      var layer = jQuery(this).parent().data('name');;
      if(el.html().match("SHOW ")) {
        $('.layer-' + layer).show();
        $('.layered-ellipsis.layer-' + layer).hide();
        el.html('HIDE "' + layer + '"');
      } else {
        $('.layer-' + layer).hide();
        $('.layered-ellipsis.layer-' + layer).css('display', 'inline-block');
        el.html('SHOW "' + layer + '"');
      }

      jQuery.hideGlobalSpinnerNode();
    });

    jQuery('#layers_highlights .link-o').live('click', function(e) {
      e.preventDefault();
      var layer = jQuery(this).parent().data('name');
      var hex = jQuery(this).parent().data('hex');
        
      var text_node = $(($(this).contents())[0]);
      var new_node;
      if($(this).data('highlight') === undefined || $(this).data('highlight') == false) {
        $('span.layer-' + layer).addClass('highlight-' + layer);
        $(this).data('highlight', true);
        new_node = document.createTextNode('UNHIGHLIGHT "' + layer + '"');
      } else {
        $('span.layer-' + layer).removeClass('highlight-' + layer);
        $(this).data('highlight', false);
        new_node = document.createTextNode('HIGHLIGHT "' + layer + '"');
      }
      text_node.replaceWith(new_node);
      jQuery.rehighlight();
    });
  },
  observePrintListeners: function() {
    jQuery('#fixed_print,#quickbar_print').click(function(e) {
      e.preventDefault();
      jQuery('#collage_print').submit();
    });
    jQuery('form#collage_print').submit(function() {
      var data = jQuery.retrieveState();
  
      data.highlights = {};
      jQuery.each(jQuery('.link-o.highlighted'), function(i, el) {
        data.highlights[jQuery(el).parent().data('id')] = jQuery(el).parent().data('hex');
      });

      //Note: is:visible not working here
      if(jQuery('a#hide_heatmap').css('display') == 'block' && !jQuery('a#hide_heatmap:first').is('.inactive')) {
        data.load_heatmap = true;
      }

      data.font_size = jQuery('#fontsize a.active').data('value');
      data.font_face = jQuery('#fontface a.active').data('value');
      jQuery('#state').val(JSON.stringify(data));
    });
  },
  recordCollageState: function(data, show_message) {
    var words_shown = jQuery('#collage div.article tt').filter(':visible').size();
    jQuery.ajax({
      type: 'POST',
      cache: false,
      data: {
        readable_state: data,
        words_shown: words_shown
      },
      url: jQuery.rootPath() + 'collages/' + jQuery.getItemId() + '/save_readable_state',
      success: function(results){
        if(show_message) {
          jQuery('#autosave').html('Updated at: ' + results.time);
          jQuery.updateWordCount();
        }
      }
    });
  },
  updateWordCount: function() {
    /* var layered = all_tts.size() - unlayered_tts.size();
    jQuery('#word_stats').html(layered + ' layered, ' + unlayered_tts.size() + ' unlayered');
    */
  },
  retrieveState: function() {
    var data = {};
    jQuery('.unlayered-ellipsis:visible').each(function(i, el) {
      data['#' + jQuery(el).attr('id')] = jQuery(el).css('display');  
    });
    jQuery('.annotation-ellipsis:visible').each(function(i, el) {
      data['#' + jQuery(el).attr('id')] = jQuery(el).css('display');  
    });
    return data;
  },
  listenToRecordCollageState: function() {
    setInterval(function(i) {
      var data = jQuery.retrieveState();
      if(jQuery('#edit_toggle').hasClass('edit_mode') && (JSON.stringify(data) != JSON.stringify(last_data))) {
        last_data = data;
        jQuery.recordCollageState(JSON.stringify(data), true);
      }
    }, 1000); 
  },
  loadState: function() {
    jQuery.each(last_data, function(i, e) {
      if(i.match(/#unlayered-ellipsis/)) {
        var id = i.replace(/#unlayered-ellipsis-/, '');
        jQuery('.unlayered-control-' + id + ':first').click();
      } else if(i.match(/#annotation-ellipsis/) && e != 'none') {
        jQuery(i).css('display', 'inline');
        var annotation_id = i.replace(/#annotation-ellipsis-/, '');
        var subset = jQuery('tt.a' + annotation_id);
        subset.css('display', 'none');
        jQuery.resetParentDisplay(subset);
      } else if(i.match(/^\.a/)) { //Backwards compatibility update
        jQuery(i).css('display', 'inline');
        var annotation_id = i.replace(/^\.a/, '');
        jQuery('#annotation-ellipsis-' + annotation_id).hide();
      } else {
        jQuery(i).css('display', e);
      }
    });
    if(access_results.can_edit_annotations) {
      jQuery('#edit_toggle').click();
      jQuery.toggleEditMode(true);
      jQuery('.default-hidden').css('color', '#000');
      jQuery('#heatmap_toggle').addClass('inactive');
    } else {
      jQuery('#heatmap_toggle').removeClass('inactive');
      jQuery.toggleEditMode(false);
      jQuery.checkForPanelAdjust();
    }
    if(jQuery.cookie('scroll_pos')) {
      jQuery(window).scrollTop(jQuery.cookie('scroll_pos'));
      jQuery.cookie('scroll_pos', null);
    }
    jQuery.hideShowUnlayeredOptions();
  }, 
  markupCollageLink: function(collage_link) {
    var nodes = new Array();
    var previous_element = jQuery('tt#' + collage_link.link_text_start).prev();
    var current_node = jQuery('tt#' + collage_link.link_text_start);
    var link_node = jQuery('<a href="/collages/' + collage_link.linked_collage_id + '"></a>');
    var i = 0;
    //all_tts.size() is used to prevent infinite loop here
    while(current_node.attr('id') != collage_link.link_text_end && i < all_tts.size()) {
      nodes.push(current_node);
      current_node = current_node.next();
      i++;
    }
    nodes.push(current_node); //Last element
    jQuery.each(nodes, function(i, el) {
      el.detach;
      link_node.append(el);
    });
    link_node.insertAfter(previous_element);

    clean_collage_links["c" + collage_link.id] = collage_link;
  },
  resetParentDisplay: function(els) {
    var parents = els.parentsUntil('#collage div.article');
    parents.removeClass('no_visible_children');
    parents.filter(':not(:has(.layered-control,.control-divider,.unlayered-ellipsis:visible,tt:visible))').addClass('no_visible_children');
  },
  submitAnnotation: function(){
    var values = new Array();
    jQuery(".layer_check input").each(function(i, el) {
      if(jQuery(el).attr('checked')) {
        values.push(jQuery(el).data('value'));
      }
    });
    jQuery('#annotation_layer_list').val(jQuery('#new_layers input').val() + ',' + values.join(','));

    jQuery('form.annotation').ajaxSubmit({
      error: function(xhr){
        jQuery.hideGlobalSpinnerNode();
        jQuery('#new-annotation-error').show().append(xhr.responseText);
      },
      beforeSend: function(){
        jQuery.cookie('scroll_pos', annotation_position);
        jQuery.showGlobalSpinnerNode();
        jQuery('div.ajax-error').html('').hide();
        jQuery('#new-annotation-error').html('').hide();
      },
      success: function(response){
        jQuery.hideGlobalSpinnerNode();
        var annotation = jQuery.parseJSON(response.annotation);
        var color_map = jQuery.parseJSON(response.color_map);
        jQuery('#edit_item div.dynamic').html('').hide();
        if(response.type == "update") {
          jQuery.editAnnotationMarkup(annotation.annotation, color_map);
        } else {
          jQuery.markupAnnotation(annotation.annotation, color_map, false);
        }
        jQuery('#edit_item').append(jQuery('<div>').attr('id', 'status_message').html('Collage Edited'));
      }
    });
  },

  toggleAnnotation: function(id) {
    if(jQuery('#annotation-content-' + id).css('display') == 'inline-block') {
      jQuery('#annotation-content-' + id).css('display', 'none');
    } else {
      jQuery('#annotation-content-' + id).css('display', 'inline-block');
    }
  },

  annotationButton: function(annotationId){
    var collageId = jQuery.getItemId();
    if(jQuery('#annotation-details-' + annotationId).length == 0){
      jQuery.ajax({
        type: 'GET',
        cache: false,
        url: jQuery.rootPath() + 'annotations/' + annotationId,
        beforeSend: function(){
          jQuery.showGlobalSpinnerNode();
          jQuery('div.ajax-error').html('').hide();
        },
        error: function(xhr){
          jQuery.hideGlobalSpinnerNode();
          jQuery('div.ajax-error').show().append(xhr.responseText);
        },
        success: function(html){
          jQuery('#edit_item #status_message').remove();
          jQuery.hideGlobalSpinnerNode();
          jQuery('#annotation_edit .dynamic').css('padding', '2px 0px 0px 0px').html(html).show();

          if(access_results.can_edit_annotations) {
            jQuery('#edit_item #annotation_edit .tabs a').show();
          }
        }
      });
    } else {
      jQuery('#annotation-details-' + annotationId).dialog('open');
    }
  },
  observeStatsListener: function() {
    jQuery('#collage-stats').click(function() {
      jQuery(this).toggleClass("active");
      if(jQuery('#collage-stats-popup').height() < 400) {
        jQuery('#collage-stats-popup').css('overflow', 'hidden');
      } else {
        jQuery('#collage-stats-popup').css('height', 400);
      }
      jQuery('#collage-stats-popup').slideToggle('fast');
      return false;
    });
  },
  toggleEditMode: function(highlight) {
    if(highlight) {
      jQuery('#collage div.article').addClass('edit_mode');
    } else {
      jQuery('#collage div.article').removeClass('edit_mode');
    }
  },

  initPlaylistItemAddButton: function(){
    jQuery('.add-collage-button').live('click', function(e) {
      e.preventDefault();
      var link_start = jQuery('input[name=link_start]').val();
      var link_end = jQuery('input[name=link_end]').val();
      var host_collage = jQuery('input[name=host_collage]').val();
      var itemId = jQuery(this).attr('id').split('-')[1];
      jQuery.submitCollageLink(itemId, link_start, link_end, host_collage);
    });
  },

  initKeywordSearch: function(){
    jQuery('#link_search').live('click', function(e) {
      e.preventDefault();
      jQuery.ajax({
        method: 'GET',
        url: jQuery.rootPath() + 'collage_links/embedded_pager',
        beforeSend: function(){
           jQuery.showGlobalSpinnerNode();
        },
        data: {
            keywords: jQuery('#collage-keyword-search').val(),
            link_start: jQuery('#edit_item input[name=link_start]').val(),
            link_end: jQuery('#edit_item input[name=link_end]').val(),
            host_collage: jQuery('#edit_item input[name=host_collage]').val(),
            text: jQuery('#edit_item input[name=text]').val()
        },
        dataType: 'html',
        success: function(html){
          jQuery.hideGlobalSpinnerNode();
          jQuery('#link_edit .dynamic').html(html);
        },
        error: function(xhr){
          jQuery.hideGlobalSpinnerNode();
        }
      });
    });
  },
  
  submitCollageLink: function(linked_collage, link_start, link_end, host_collage){
    jQuery.ajax({
      type: 'POST',
      cache: false,
      data: {collage_link: {
        linked_collage_id: linked_collage,
        host_collage_id: host_collage,
        link_text_start: link_start,
        link_text_end: link_end
        }
      },
      url: jQuery.rootPath() + 'collage_links/create',
      success: function(results){
        jQuery.hideGlobalSpinnerNode();
        jQuery('#link_edit .dynamic,#annotation_edit .dynamic').hide().html('');
        jQuery('#link_edit #search_wrapper_outer').hide();
        jQuery('#edit_item').append(jQuery('<div>').attr('id', 'status_message').html('Link Created'));
        jQuery.markupCollageLink(results.collage_link);
      }
    });
  },

  openCollageLinkForm: function(url_path, data){
    jQuery.ajax({
      type: 'GET',
      url: jQuery.rootPath() + url_path,
      cache: false,
      beforeSend: function(){
         jQuery.showGlobalSpinnerNode();
      },
      data: data,
      dataType: 'html',
      success: function(html){
        jQuery.hideGlobalSpinnerNode();
        jQuery('#link_edit .dynamic').html(html).show();
      }
    });
  }
});

jQuery(document).ready(function(){
  if(jQuery('.singleitem').length > 0){
    jQuery.showGlobalSpinnerNode();

console.log('here');
    var b = jQuery('div.article').annotator().annotator('addPlugin', 'H2O', layer_data).annotator('addPlugin', 'Store', {
      prefix: '/annotations',
      urls: {
        create: '/create',
        read: '/annotations/:id',
        update: '/:id',
        destroy: '/:id',
        search: '/search'
      }
    });
    jQuery('.toolbar, #buttons').css('visibility', 'visible');
    jQuery.observeToolListeners();
    jQuery.observeLayerColorMapping();

    /*
    //TODO: Possibly move this before annotator
    jQuery.each(collage_links, function(i, el) {
      clean_collage_links[i] = el.collage_link;
      jQuery.markupCollageLink(clean_collage_links[i]);
    });

    jQuery.observePrintListeners();
    jQuery.observeHeatmap();
  
    jQuery.observeStatsListener();
    jQuery.observeViewerToggleEdit();
    jQuery.observeDeleteInheritedAnnotations();
    jQuery.updateWordCount();
*/

    /* Collage Search */
    jQuery.initKeywordSearch();
    jQuery.initPlaylistItemAddButton();

    jQuery.observeFootnoteLinks();
    jQuery.hideGlobalSpinnerNode();
    jQuery.observeStatsHighlights();
          

    jQuery.slideToParagraph();

/*
    //Must be after onclicks initiated
    if(jQuery.cookie('user_id') == null) {
      access_results = { 'can_edit_annotations' : false };
      last_data = original_data;
      jQuery.loadState();
    }
*/
  }
});

var layer_tools_visibility = '\
<li data-hex="{{hex}}" data-name="{{layer}}" data-id="l{{id}}">\
<a class="hide_show shown tooltip l{{id}}" href="#" original-title="Hide the {{layer}} layer">HIDE "{{layer}}"</a>\
</li>';

var layer_tools_highlights = '\
<li data-hex="{{hex}}" data-name="{{layer}}" data-id="l{{id}}">\
<a class="tooltip link-o l{{id}}" href="#" original-title="Highlight the {{layer}} Layer">HIGHLIGHT "{{layer}}" <span style="background:#{{hex}}" class="indicator"></span></a>\
</li>';
