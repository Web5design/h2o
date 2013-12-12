var st_annotator;
var recorded_annotations;
var unlayered_count = 0;
var new_annotation_start = '';
var new_annotation_end = '';
var just_hidden = 0;
var layer_info = {};
var last_annotation = 0;
var annotation_position = 0;
var head_offset;
var clean_annotations = {};
var clean_collage_links = {};
var unlayered_tts;
var update_unlayered_end = 0;
var collage_id;
var heatmap_display = false;
var original_annotations;

$.extend({
  highlightHeatmap: function() {
    $('.layered-empty').removeClass('layered-empty');

	  $.rule('.annotator-wrapper .annotator-hl { background-color: rgba(255,0,0,0.3); }').appendTo('#additional_styles');
  },
  rehighlight: function() {
	  $('.layered-empty').removeClass('layered-empty');
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
	      $.each(unique_layers, function(key, value) {
	        key_length++;
	      });
	      var opacity = 0.4 / key_length;
	      $.each(unique_layers, function(key, value) {
	        var color_combine = $.xcolor.opacity(current_hex, layer_data[key], opacity);
	        current_hex = color_combine.getHex();
	      });
	      $.rule(selector + ' { background-color: ' + current_hex + '; }').appendTo('#additional_styles');
	      updated[selector] = 1;
	    }
	  }
	  var keys_arr = new Array();
	  $.each(updated, function(key, value) {
	    keys_arr.push(key);
	  });
    if(keys_arr.length > 0) {
	    $('.annotator-hl:not(' + keys_arr.join(',') + '):not(' + keys_arr.join(',') + '> .annotator-hl)').addClass('layered-empty');
    } else {
      $('.annotator-hl').addClass('layered-empty');
    }
  },
  observeDeleteInheritedAnnotations: function () {
    $('#delete_inherited_annotations').live('click', function(e) {
      e.preventDefault();

      $.ajax({
        type: 'GET',
        cache: false,
        dataType: 'JSON',
        url: $.rootPath() + 'collages/' + $.getItemId() + '/delete_inherited_annotations',
        beforeSend: function(){
          $.showGlobalSpinnerNode();
        },
        success: function(data){
          var stored_annotations = st_annotator.dumpAnnotations();
          $.each(stored_annotations, function(_i, a) {
            if(a.cloned) {
              st_annotator.specialDeleteAnnotation(a);
            }
          });
          $.updateWordCount();
          $.hideGlobalSpinnerNode();
          $('#inherited_h,#inherited_span').remove();
        },
        error: function() {
          $.hideGlobalSpinnerNode();
        }
      });
    });
  },
  initiate_annotator: function(can_edit) {
    collage_id = $.getItemId(); 
    $('div.article').annotator({ readOnly: !can_edit }).annotator('addPlugin', 'H2O', layer_data).annotator('addPlugin', 'Store', {
      prefix: '/annotations',
      urls: {
        create: '/create',
        read: '/annotations/:id',
        update: '/:id',
        destroy: '/:id',
        search: '/search'
      }
    });
  },
  collage_afterload: function(results) {
    last_data = $.parseJSON(results.readable_state);
    if(results.can_edit_annotations) {
      $.initiate_annotator(true);  
      $('.requires_edit').animate({ opacity: 1.0 });
    } else {
      $.initiate_annotator(false);  
      $('.requires_edit').remove();
    }
    if(results.can_edit_description) {
      $('.edit-action').animate({ opacity: 1.0 });
    } else {
      $('.edit-action').remove();
    }
  },
  slideToParagraph: function() {
    if(document.location.hash.match(/^#p[0-9]+/)) {
      var p = document.location.hash.match(/[0-9]+/);
      var paragraph = $('#paragraph' + p);
      var pos = paragraph.offset().top;
      $(window).scrollTop(pos);
    }
  },
  observeStatsHighlights: function() {
    $('#stats').hover(function() {
      $(this).addClass('stats_hover');
    }, function() {
      $(this).removeClass('stats_hover');
    });
  },
  updateLayerCount: function() {
    $('#stats_layer_size').html($('#layers li').size());
  },
  updateAnnotationCount: function() {
    //$('#stats_annotation_size').html(# of annotations);
  },
  observeFootnoteLinks: function() {
    $.each($('.article a.footnote'), function(i, el) {
      $(el).attr('href', unescape($(el).attr('href')));
      $(el).attr('name', unescape($(el).attr('name')));
    });
    $('.article a.footnote').click(function() {
      var href = $(this).attr('href').replace('#', '');
      var link = $("article a[name='" + href + "']");
      if(link.size()) {
        var pos = link.offset().top;
        $(window).scrollTop(pos - 150);
      }
      return false;
    });
  },
  getHexes: function() {
    var hexes = $('<div class="hexes"></div>');
    $.each(color_list, function(i, item) {
      var node = $('<a href="#"></a>').data('value', item.hex).css({ 'background' : '#' + item.hex });
      if($('#layers_highlights li[data-hex="' + item.hex + '"]').size()) {
        node = $('<span>').addClass('inactive').css({ 'background' : '#' + item.hex });
      }
      hexes.append(node);
    });
    return hexes;
  },
  observeLayerColorMapping: function() {
    $('.hexes a').live('click', function() {
      if($(this).hasClass('inactive')) {
        return false;
      }
      $(this).parent().siblings('.hex_input').find('input').val($(this).data('value'));
      $(this).siblings('a.active').removeClass('active');
      $(this).addClass('active');
      return false;
    });
    $('#add_new_layer').live('click', function() {
      var new_layer = $('<li class="annotator-item annotator-h2o_layer"><p>Enter Layer Name <input type="text" name="new_layer" /></p><p class="hex_input">Choose a Color<input type="hidden" name="new_layer_list[][hex]" /></p><a href="#" class="remove_layer">Cancel &raquo;</a></div>');
      var hexes = $.getHexes();
      hexes.insertBefore(new_layer.find('.remove_layer'));
      new_layer.insertBefore($('.annotator-h2o_layer_button'));
      return false;
    });
    $('.remove_layer').live('click', function() {
      $(this).parent().remove();
      return false;
    });
  },
  observeHeatmap: function() {
    $('#heatmap_toggle:not(.inactive,.disabled)').live('click', function(e) {
      e.preventDefault();
      $.showGlobalSpinnerNode();
      $('.unlayered,.annotator-hl').show();
      $('.unlayered-border-start,.unlayered-border-end,.unlayered-ellipsis,.layered-control,.layered-ellipsis').remove();
      last_data = $.retrieveState();
      $.each($('#layers_highlights a'), function(i, el) {
        if($(el).text().match(/^UNHIGHLIGHT/)) {
          $(el).click();
        }
      });
      $('span.unlayered-added').contents().unwrap();
      $('.unlayered').removeClass('unlayered');
      $('#text-layer-tools').addClass('inactive').css('opacity', 0.3);
      original_annotations = annotations;
      annotations = heatmap;
      heatmap_display = true;
      st_annotator.plugins.Store.loadAnnotationsH2O();
      $.highlightHeatmap();
      $('#heatmap_toggle').addClass('disabled');
      $.hideGlobalSpinnerNode();
    });
    $('#heatmap_toggle.disabled').live('click', function(e) {
      e.preventDefault();
      $.showGlobalSpinnerNode();
      var stored_annotations = st_annotator.dumpAnnotations();
      var collage_id = $.getItemId();
      $.each(stored_annotations, function(_i, a) {
        if(a.collage_id != collage_id) {
          st_annotator.specialDeleteAnnotation(a);
        }
      });
      annotations = original_annotations; 
      heatmap_display = false;
      $('#text-layer-tools').removeClass('inactive').css('opacity', 1.0);
      $('#heatmap_toggle').removeClass('disabled');
	    $.rule('.annotator-wrapper .annotator-hl', '#additional_styles').remove();
      st_annotator.plugins.H2O.setUnlayeredAll();
      $.rehighlight();
      $.loadState();
      $.hideGlobalSpinnerNode();
    });
  },
  hideShowUnlayeredOptions: function() {
    var total = $('.unlayered-ellipsis').size();
    var shown = $('.unlayered-ellipsis').filter(':visible').size();
    if(total == shown) {
      $('#hide_unlayered').hide();
      $('#show_unlayered').show();
    } else if(shown == 0) {
      $('#hide_unlayered').show();
      $('#show_unlayered').hide();
    } else {
      $('#show_unlayered,#hide_unlayered').show();
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
    $("#buttons a.btn-a:not(.btn-a-active)").live('click', function(e) {
      e.preventDefault();
      if($(this).hasClass('inactive')) {
        return;
      }
      var top_pos = $(this).position().top + $(this).height() + 10;
      var left_pos = $(this).width() - 208;
      $('.text-layers-popup').css({ position: 'absolute', top: top_pos, left: left_pos, "z-index": 1 }).fadeIn(200);
      $(this).addClass("btn-a-active");
    });
    $("#buttons a.btn-a-active").live('click', function(e) {
      e.preventDefault();
      $('.text-layers-popup').fadeOut(200);
      $(this).removeClass("btn-a-active");
    });
    $('#quickbar_tools:not(.active)').live('click', function(e) {
      e.preventDefault();
      var top_pos = $(this).position().top + $(this).height() + 8;
      var left_pos = $(this).position().left - 198 + $(this).width();
      $('.text-layers-popup').css({ position: 'fixed', top: top_pos, left: left_pos, "z-index": 5 }).fadeIn(200);
      $(this).addClass('active');
    });
    $('#quickbar_tools.active').live('click', function(e) {
      e.preventDefault();
      $('.text-layers-popup').fadeOut(200);
      $(this).removeClass('active');
    });
    $('#layers li').each(function(i, el) {
      layer_info[$(el).data('id')] = {
        'hex' : $(el).data('hex'),
        'name' : $(el).data('name')
      };
      $('span.annotation-control-' + $(el).data('id')).css('background', '#' + $(el).data('hex'));
    });
    $('#author_edits').click(function(e) {
      e.preventDefault();
      last_data = original_data;
      $('.unlayered,.annotator-hl').show();
      $.loadState();
    });
    $('#full_text').click(function(e) {
      e.preventDefault();
      $.showGlobalSpinnerNode();
      $('.unlayered,.annotator-hl').show();
      $('.unlayered-border-start,.unlayered-border-end,.unlayered-ellipsis,.layered-control,.layered-ellipsis').hide();
      $.each($('#layers a.hide_show'), function(i, el) {
        $(el).html('HIDE "' + $(el).parent().data('name') + '"');
      });
      //$('#layers a.shown').removeClass('shown');
      $.hideShowUnlayeredOptions();
      $.hideGlobalSpinnerNode();
    });

    $('#show_unlayered a').click(function(e) {
      e.preventDefault();
      $.showGlobalSpinnerNode();
      $('.unlayered,.unlayered-border-start,.unlayered-border-end').show();
      $('.unlayered-ellipsis').hide();
      $.hideShowUnlayeredOptions();
      $.hideGlobalSpinnerNode();
    });
    $('#hide_unlayered a').click(function(e) {
      e.preventDefault();
      $.showGlobalSpinnerNode();
      $('.unlayered,.unlayered-border-start,.unlayered-border-end').hide();
      $('.unlayered-ellipsis').show();
      $.hideShowUnlayeredOptions();
      $.hideGlobalSpinnerNode();
    });

    $('#layers .hide_show').live('click', function(e) {
      e.preventDefault();
      $.showGlobalSpinnerNode();

      var el = $(this);
      var layer = $(this).parent().data('name');;
      if(el.html().match("SHOW ")) {
        $('.layer-' + layer).show();
        $('.layered-ellipsis.layer-' + layer).hide();
        el.html('HIDE "' + layer + '"');
      } else {
        $('.layer-' + layer).hide();
        $('.layered-ellipsis.layer-' + layer).css('display', 'inline-block');
        el.html('SHOW "' + layer + '"');
      }

      $.hideGlobalSpinnerNode();
    });

    $('#layers_highlights .link-o').live('click', function(e) {
      e.preventDefault();
      var layer = $(this).parent().data('name');
      var hex = $(this).parent().data('hex');
        
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
      $.rehighlight();
    });
  },
  observePrintListeners: function() {
    $('#fixed_print,#quickbar_print').click(function(e) {
      e.preventDefault();
      $('#collage_print').submit();
    });
    $('form#collage_print').submit(function() {
      var data = $.retrieveState();
 
      //Note: is:visible not working here
      if($('a#hide_heatmap').css('display') == 'block' && !$('a#hide_heatmap:first').is('.inactive')) {
        data.load_heatmap = true;
      }

      data.font_size = $('#fontsize a.active').data('value');
      data.font_face = $('#fontface a.active').data('value');
      $('#state').val(JSON.stringify(data));
    });
  },
  recordCollageState: function(data, show_message) {
    var words_shown = 0;
    var b = $('.unlayered:not(.unlayered > .unlayered):not(.paragraph-numbering):not(:empty):visible').text().replace(/[^\w ]/g, "");
    if(b != '') {
      words_shown += b.split( /\s+/ ).length;
    }

    var c = $('.annotator-hl:not(.annotator-hl > .annotator-hl):not(.paragraph-numbering):not(:empty):visible').text().replace(/[^\w ]/g, "");
    if(c != '') {
      words_shown += c.split( /\s+/ ).length;
    }

    $.ajax({
      type: 'POST',
      cache: false,
      data: {
        readable_state: data,
        words_shown: words_shown
      },
      url: $.rootPath() + 'collages/' + $.getItemId() + '/save_readable_state',
      success: function(results){
        //if(show_message) {
          //$('#autosave').html('Updated at: ' + results.time);
        //}
      }
    });
  },
  updateWordCount: function() {
    var unlayered = 0;
    var b = $('.unlayered:not(.unlayered > .unlayered):not(.paragraph-numbering):not(:empty)').text().replace(/[^\w ]/g, "");
    if(b != '') {
      unlayered = b.split( /\s+/ ).length;
    }

    var layered = 0;
    var c = $('.annotator-hl:not(.annotator-hl > .annotator-hl):not(.paragraph-numbering):not(:empty)').text().replace(/[^\w ]/g, "");
    if(c != '') {
      layered = c.split( /\s+/ ).length;
    }

    $('#word_stats').html(layered + ' layered, ' + unlayered + ' unlayered');
  },
  retrieveState: function() {
    var data = { highlights: {} };
    $('.unlayered-ellipsis:visible').each(function(i, el) {
      data['unlayered_' + $(el).data('unlayered')] = $(el).data('unlayered');
    });
    $('.layered-ellipsis:visible').each(function(i, el) {
      data['layered_' + $(el).data('layered')] = $(el).data('layered');
    });
    $.each($('.link-o'), function(i, el) {
      if($(el).text().match('UNHIGHLIGHT')) {
        data.highlights[$(el).parent().data('name')] = $(el).parent().data('hex');
      }
    });

    return data;
  },
  listenToRecordCollageState: function() {
    setInterval(function(i) {
      if(heatmap_display) {
        return;
      }
      var data = $.retrieveState();
      if(JSON.stringify(data) != JSON.stringify(last_data)) {
        last_data = data;
        $.recordCollageState(JSON.stringify(data), true);
      }
    }, 1000); 
  },
  loadState: function() {
    $.each(last_data, function(i, e) {
      if(i.match(/^unlayered/)) {
        $('.unlayered-' + e).hide();
        $('.unlayered-ellipsis-' + e).show();
      } else if(i.match(/^layered/)) {
        $('.annotation-' + e).hide();
        $('.layered-ellipsis-' + e).show();
      } else if(i.match(/^highlights/)) {
        $.each(e, function(j, k) {
          $("ul#layers_highlights li[data-name='" + j + "'] a").click();
        });
      }
    });
    $.hideShowUnlayeredOptions();
    if(access_results.can_edit_annotations) {
      $('#edit_toggle').click();
      $('.default-hidden').css('color', '#000');
    } else {
      $.checkForPanelAdjust();
    }
    if($.cookie('scroll_pos')) {
      $(window).scrollTop($.cookie('scroll_pos'));
      $.cookie('scroll_pos', null);
    }
  }, 
  markupCollageLink: function(collage_link) {
    var nodes = new Array();
    var previous_element = $('tt#' + collage_link.link_text_start).prev();
    var current_node = $('tt#' + collage_link.link_text_start);
    var link_node = $('<a class="collage-link" href="/collages/' + collage_link.linked_collage_id + '"></a>');
    var i = 0;
    //all_tts.size() is used to prevent infinite loop here
    while(current_node.attr('id') != collage_link.link_text_end && i < all_tts.size()) {
      nodes.push(current_node);
      current_node = current_node.next();
      i++;
    }
    nodes.push(current_node); //Last element
    $.each(nodes, function(i, el) {
      el.detach;
      link_node.append(el);
    });
    link_node.insertAfter(previous_element);

    clean_collage_links["c" + collage_link.id] = collage_link;
  },
  resetParentDisplay: function(els) {
    var parents = els.parentsUntil('div.article');
    parents.removeClass('no_visible_children');
    parents.filter(':not(:has(.layered-control,.control-divider,.unlayered-ellipsis:visible,tt:visible))').addClass('no_visible_children');
  },
  initPlaylistItemAddButton: function(){
    $('.add-collage-button').live('click', function(e) {
      e.preventDefault();
      var link_start = $('input[name=link_start]').val();
      var link_end = $('input[name=link_end]').val();
      var host_collage = $('input[name=host_collage]').val();
      var itemId = $(this).attr('id').split('-')[1];
      $.submitCollageLink(itemId, link_start, link_end, host_collage);
    });
  },
  initKeywordSearch: function(){
    $('#link_search').live('click', function(e) {
      e.preventDefault();
      $.ajax({
        method: 'GET',
        url: $.rootPath() + 'collage_links/embedded_pager',
        beforeSend: function(){
           $.showGlobalSpinnerNode();
        },
        data: {
            keywords: $('#collage-keyword-search').val(),
            link_start: $('#edit_item input[name=link_start]').val(),
            link_end: $('#edit_item input[name=link_end]').val(),
            host_collage: $('#edit_item input[name=host_collage]').val(),
            text: $('#edit_item input[name=text]').val()
        },
        dataType: 'html',
        success: function(html){
          $.hideGlobalSpinnerNode();
          $('#link_edit .dynamic').html(html);
        },
        error: function(xhr){
          $.hideGlobalSpinnerNode();
        }
      });
    });
  },
  
  submitCollageLink: function(linked_collage, link_start, link_end, host_collage){
    $.ajax({
      type: 'POST',
      cache: false,
      data: {collage_link: {
        linked_collage_id: linked_collage,
        host_collage_id: host_collage,
        link_text_start: link_start,
        link_text_end: link_end
        }
      },
      url: $.rootPath() + 'collage_links/create',
      success: function(results){
        $.hideGlobalSpinnerNode();
        $('#link_edit .dynamic,#annotation_edit .dynamic').hide().html('');
        $('#link_edit #search_wrapper_outer').hide();
        $('#edit_item').append($('<div>').attr('id', 'status_message').html('Link Created'));
        $.markupCollageLink(results.collage_link);
      }
    });
  },

  openCollageLinkForm: function(url_path, data){
    $.ajax({
      type: 'GET',
      url: $.rootPath() + url_path,
      cache: false,
      beforeSend: function(){
         $.showGlobalSpinnerNode();
      },
      data: data,
      dataType: 'html',
      success: function(html){
        $.hideGlobalSpinnerNode();
        $('#link_edit .dynamic').html(html).show();
      }
    });
  }
});

$(document).ready(function(){
  if($('.singleitem').length > 0){
    $.showGlobalSpinnerNode();

    $.each(collage_links, function(i, el) {
      clean_collage_links[i] = el.collage_link;
      $.markupCollageLink(clean_collage_links[i]);
    });

    $('.toolbar, #buttons').css('visibility', 'visible');
    $.observeToolListeners();
    $.observeLayerColorMapping();
    $.observePrintListeners();
    $.observeHeatmap();
    $.observeDeleteInheritedAnnotations();
    $.initKeywordSearch();
    $.initPlaylistItemAddButton();

    $.observeFootnoteLinks();
    $.hideGlobalSpinnerNode();
    $.observeStatsHighlights();
    $.slideToParagraph();
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

