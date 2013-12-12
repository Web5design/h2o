var all_tts;
var stored_heatmap = {};
var loaded_heatmaps = false;
var annotations;
var original_data = {};
var layer_data;
var collage_id;

jQuery.extend({
  rehighlight: function() {
    //do nothing
  },
  hideShowUnlayeredOptions: function() {
    //do nothing
  },
  updateWordCount: function() {
    //do nothing
  },
  loadState: function() {
    //do nothing
  }
});

var export_functions = {
  init: function() {
	  jQuery('#fontface').selectbox({
	    className: "jsb", replaceInvisible: true
	  }).change(function() {
	    export_functions.setFontPrint();
	  });
	  jQuery('#fontsize').selectbox({
	    className: "jsb", replaceInvisible: true
	  }).change(function() {
	    export_functions.setFontPrint();
	  });
	
	  jQuery('#printtitle').selectbox({
	    className: "jsb", replaceInvisible: true
	  }).change(function() {
	    var choice = jQuery(this).val();
	    if (choice == 'yes') {
	      jQuery('h1').show();
	      jQuery('.playlists h3').show();
	    }
	    else {
	      jQuery('h1').hide();
	      jQuery('.playlists h3').hide();
	    }
	  });
	  jQuery('#printdetails').selectbox({
	    className: "jsb", replaceInvisible: true
	  }).change(function() {
	    var choice = jQuery(this).val();
	    if (choice == 'yes') {
	      jQuery('.details').show();
	    }
	    else {
	      jQuery('.details').hide();
	    }
	  });
	  jQuery('#printfontdetails').selectbox({
	    className: "jsb", replaceInvisible: true
	  }).change(function() {
	    var choice = jQuery(this).val();
	    if (choice == 'yes') {
	      jQuery('.fontdetails').show();
	    }
	    else {
	      jQuery('.fontdetails').hide();
	    }
	  });
	  jQuery('#printparagraphnumbers').selectbox({
	    className: "jsb", replaceInvisible: true
	  }).change(function() {
	    var choice = jQuery(this).val();
	    if (choice == 'yes') {
	      jQuery('.paragraph-numbering').show();
	      jQuery('.collage-content').css('padding-left', '50px');
	    }
	    else {
	      jQuery('.paragraph-numbering').hide();
	      jQuery('.collage-content').css('padding-left', '0px');
	    }
	  });
	/*
	  jQuery('#printhighlights').selectbox({
	    className: "jsb", replaceInvisible: true
	  }).change(function() {
	    var choice = jQuery(this).val();
	    if(jQuery('#printheatmap').val() == 'yes') {
	      jQuery('#printheatmap').val('no');
	      jQuery('#heatmap_options .jsb-currentItem').html('No');
	    }
	    if(choice == 'original') {
	      jQuery('.collage-content').each(function(i, el) {
	        var id = jQuery(el).data('id');
	        var data = eval("collage_data_" + id);
	        jQuery.highlightCollage(id, data.highlights);
	      });
	    } else if(choice == 'all') {
	      jQuery('.collage-content').each(function(i, el) {
	        var id = jQuery(el).data('id');
	        var data = eval("color_map_" + id);
	        jQuery.highlightCollage(id, data);
	      });
	    } else {
	      jQuery('tt').css('border-bottom', '2px solid #FFFFFF');
	    }
	  });
	  jQuery('#printheatmap').selectbox({
	    className: "jsb", replaceInvisible: true 
	  }).change(function() {
	    var choice = jQuery(this).val();
	    if(jQuery('#printhighlights').val() == 'original' || jQuery('#printhighlights').val() == 'all') {
	      jQuery('#printhighlights').val('none');
	      jQuery('#highlight_options .jsb-currentItem').html('None');
	    }
	    if(choice == 'yes') {
	      if(loaded_heatmaps) {
	        jQuery('.collage-content').each(function(i, el) {
	          var id = jQuery(el).data('id');
	          jQuery.displayHeatmap(id);
	        });
	      } else {
	        jQuery('.collage-content').each(function(i, el) {
	          var id = jQuery(el).data('id');
	          jQuery.loadHeatmap(id);
	        });
	      }
	    } else {
	      jQuery('tt').css('border-bottom', '2px solid #FFFFFF');
	    }
	  });
	  */

	  if(document.location.hash.match('fontface')) {
	    var vals = document.location.hash.replace('#', '').split('-');
	    for(var i in vals) {
	      var font_values = vals[i].split('=');
	      if(font_values[0] == 'fontsize' || font_values[0] == 'fontface') {
	        jQuery('#' + font_values[0]).val(font_values[1]);
	      }
	    }
	  }
	  export_functions.setFontPrint();
  },
  setFontPrint: function() {
    var font_size = jQuery('#fontsize').val();
    var font_face = jQuery('#fontface').val();
    var base_font_size = base_font_sizes[font_face][font_size];
    if(font_face == 'verdana') {
      jQuery.rule("body .singleitem *, body .singleitem article tt { font-family: Verdana, Arial, Helvetica, Sans-serif; font-size: " + base_font_size + 'px; }').appendTo('style');
    } else {
      jQuery.rule("body .singleitem *, body .singleitem article tt { font-family: '" + font_map[font_face] + "'; font-size: " + base_font_size + 'px; }').appendTo('style');
    }
    jQuery.rule('.singleitem *.scale1-5 { font-size: ' + base_font_size*1.5 + 'px; }').appendTo('style');
    jQuery.rule('.singleitem *.scale1-4 { font-size: ' + base_font_size*1.4 + 'px; }').appendTo('style');
    jQuery.rule('.singleitem *.scale1-3 { font-size: ' + base_font_size*1.3 + 'px; }').appendTo('style');
    jQuery.rule('.singleitem *.scale1-2 { font-size: ' + base_font_size*1.2 + 'px; }').appendTo('style');
    jQuery.rule('.singleitem *.scale1-1 { font-size: ' + base_font_size*1.1 + 'px; }').appendTo('style');
    jQuery.rule('.singleitem *.scale0-9 { font-size: ' + base_font_size*0.9 + 'px; }').appendTo('style');
    jQuery.rule('.singleitem *.scale0-8 { font-size: ' + base_font_size*0.8 + 'px; }').appendTo('style');
  },
  "version2" : {
	  displayHeatmap: function(collage_id) {
	    jQuery.each(stored_heatmap["collage" + collage_id].data, function(i, e) {
	      var opacity = e / (stored_heatmap["collage" + collage_id].max + 1);
	      var color_combine = jQuery.xcolor.opacity('#FFFFFF', '#FE2A2A', opacity);
	      var hex = color_combine.getHex();
	      jQuery('#collage' + collage_id + ' tt.' + i).css('border-bottom', '2px solid ' + hex);
	    });
	  },
	  loadHeatmap: function(collage_id) {
	    jQuery.ajax({
	      type: 'GET',
	      cache: false,
	      dataType: 'JSON',
	      url: '/collages/' + collage_id + '/heatmap',
	      success: function(data){
	        stored_heatmap["collage" + collage_id] = data.heatmap;
	        jQuery.displayHeatmap(collage_id);
	        loaded_heatmaps = true;
	      },
	    });
	  },
	  loadState: function(id) {
      var data = eval("collage_data_" + id);
      collage_id = id;

      annotations = eval("annotations_" + id);
      jQuery('#collage' + id + ' div.article').annotator({ readOnly: true }).annotator('addPlugin', 'H2O', {}).annotator('addPlugin', 'Store', {
        prefix: '/annotations',
        urls: {
          create: '/create',
          read: '/annotations/:id',
          update: '/:id',
          destroy: '/:id',
          search: '/search'
        }
      });
      jQuery('#collage' + id + ' .unlayered-border-start,#collage' + id + ' .unlayered-border-end,#collage' + id + ' .layered-border-start,#collage' + id + ' .layered-border-end').remove();

      jQuery.each(data, function(i, e) {
		    if(i.match(/^unlayered/)) {
		      $('#collage' + id + ' .unlayered-' + e).remove();
		      $('#collage' + id + ' .unlayered-ellipsis-' + e).replaceWith($('<span>').addClass('unlayered-ellipsis').html('[...]').show());
		    } else if(i.match(/^layered/)) {
		      $('#collage' + id + ' .annotation-' + e).remove();
		      $('#collage' + id + ' .layered-ellipsis-' + e).replaceWith($('<span>').addClass('layered-ellipsis').html('[...]').show());
        } else if(i == 'font_face') {
          jQuery('#fontface').val(e);
        } else if(i == 'font_size') {
          jQuery('#fontsize').val(e);
        } else if(i == 'highlights') {
          jQuery('#printhighlights').val('original');
          jQuery('#printheatmap').val('no');
          jQuery.each(e, function(j) {
            jQuery('.layer-' + j).addClass('highlight-' + j);
          });
          layer_data = e;
          export_functions.version2.highlightCollage(id, e);
        }

      /*
        if(i == 'load_heatmap') {
          jQuery.loadHeatmap(id);
          jQuery('#printheatmap').val('yes');
          jQuery('#printhighlights option:first').remove();
          jQuery('#printhighlights').val('none');
        } else if(i == 'highlights') {
        */
      });
      jQuery('#collage' + id + ' .unlayered-ellipsis:not(:visible),#collage' + id + ' .layered-ellipsis:not(:visible)').remove();

      jQuery.each(['a', 'em', 'sup', 'p', 'center', 'h2', 'pre'], function(i, selector) {
        var set = jQuery('#collage' + id + ' div.article ' + selector);
        set = set.filter(':not(:has(*:visible)):not(.paragraph-numbering)');
        //set = set.filter(':not(:has(.layered-ellipsis:visible))');
        //set = set.filter(':not(:has(.unlayered-ellipsis:visible))');
        set.remove();
      });

	  },
	  highlightCollage: function(collage_id, highlights) {
	    jQuery('#collage' + collage_id + ' .layered-empty').removeClass('layered-empty');
	
		  var total_selectors = new Array();
		  $.each($('#collage' + collage_id + ' .annotator-wrapper .annotator-hl'), function(i, child) {
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
		      jQuery.rule('#collage' + collage_id + ' ' + selector + ' { border-bottom: 2px solid ' + current_hex + '; }').appendTo('#additional_styles');
		      updated[selector] = 1;
		    }
		  }
		  var keys_arr = new Array();
		  jQuery.each(updated, function(key, value) {
		    keys_arr.push(key);
		  });
	    if(keys_arr.length > 0) {
		    jQuery('#collage' + collage_id + ' .annotator-hl:not(' + keys_arr.join(',') + ')').addClass('layered-empty');
	    } else {
	      jQuery('#collage' + collage_id + ' .annotator-hl').addClass('layered-empty');
	    }
	
	  }
  },
  "version1": {
	  printMarkupAnnotation: function(annotation) {
	    var annotation_start = parseInt(annotation.annotation_start.replace(/^t/, ''));
	    var annotation_end = parseInt(annotation.annotation_end.replace(/^t/, ''));
	    var els = all_tts.slice(annotation_start - 1, annotation_end);

	    els.addClass('a a' + annotation.id);
	    jQuery.each(annotation.layers, function(i, layer) {
	      els.addClass('l' + layer.id);
	    });
	
	    if(annotation.annotation != '') {
	      jQuery('<span id="annotation-content-' + annotation.id + '" class="annotation-content">' + annotation.annotation + '</span>').insertAfter(els.last());
	    }
	  },
	  displayHeatmap: function(collage_id) {
	    jQuery.each(stored_heatmap["collage" + collage_id].data, function(i, e) {
	      var opacity = e / (stored_heatmap["collage" + collage_id].max + 1);
	      var color_combine = jQuery.xcolor.opacity('#FFFFFF', '#FE2A2A', opacity);
	      var hex = color_combine.getHex();
	      jQuery('#collage' + collage_id + ' tt.' + i).css('border-bottom', '2px solid ' + hex);
	    });
	  },
	  loadHeatmap: function(collage_id) {
	    jQuery.ajax({
	      type: 'GET',
	      cache: false,
	      dataType: 'JSON',
	      url: '/collages/' + collage_id + '/heatmap',
	      success: function(data){
	        stored_heatmap["collage" + collage_id] = data.heatmap;
	        jQuery.displayHeatmap(collage_id);
	        loaded_heatmaps = true;
	      },
	    });
	  },
	  loadState: function(id) {
      var annotations = eval("annotations_" + id);
      all_tts = jQuery('#collage' + id + ' div.article tt');
      jQuery.each(annotations, function(i, el) {
        export_functions.version1.printMarkupAnnotation(jQuery.parseJSON(el).annotation);
      });
      var data = eval("collage_data_" + id);

      jQuery.each(data, function(i, e) {
        if(i == 'load_heatmap') {
          jQuery.loadHeatmap(id);
          jQuery('#printheatmap').val('yes');
          jQuery('#printhighlights option:first').remove();
          jQuery('#printhighlights').val('none');
        } else if(i == 'highlights') {
          jQuery('#printhighlights').val('original');
          jQuery('#printheatmap').val('no');
          export_functions.version1.highlightCollage(id, e);
        } else if(i == 'font_face') {
          jQuery('#fontface').val(e);
        } else if(i == 'font_size') {
          jQuery('#fontsize').val(e);
        } else if(i.match(/#unlayered-ellipsis/)) {
          var pos_id = parseInt(i.replace(/#unlayered-ellipsis-/, '')) - 1;
          var elements = all_tts.slice(pos_id);
          var next_highlighted = elements.filter('.a:first');
          var unlayered_elements;
          if(next_highlighted.size()) {
            unlayered_elements = elements.slice(0, next_highlighted.data('id') - pos_id - 1);
          } else {
            unlayered_elements = elements;
          }
          jQuery('<span class="ellipsis">[...] </span>').insertBefore(unlayered_elements.first());
          unlayered_elements.hide();
        } else if(i.match(/#annotation-ellipsis/) && e != 'none') {
          var annotation_id = i.replace(/#annotation-ellipsis-/, '');
          var elements = jQuery('tt.a' + annotation_id);
          jQuery('<span class="ellipsis">[...] </span>').insertBefore(elements.first());
          elements.hide();
        } else if(i.match(/#annotation-content/) && e == 'inline-block') {
          jQuery(i).css('display', 'block');
        }
      });

      jQuery.each(['a', 'em', 'sup', 'p', 'center', 'h2', 'pre'], function(i, selector) {
        var set = jQuery('#collage' + id + ' article ' + selector);
        set = set.filter(':not(:has(tt:visible))');
        set = set.filter(':not(:has(.ellipsis:visible))');
        set = set.filter(':not(.paragraph-numbering)');
        set.addClass('no_visible_children');
      });

	    if(document.location.hash.match('fontface')) {
	      var vals = document.location.hash.replace('#', '').split('-');
	      for(var i in vals) {
	        var font_values = vals[i].split('=');
	        if(font_values[0] == 'fontsize' || font_values[0] == 'fontface') {
	          jQuery('#' + font_values[0]).val(font_values[1]);
	        }
	      }
	    }
	  },
	  highlightCollage: function(collage_id, highlights) {
	    jQuery('#collage' + collage_id + ' tt').css('border-bottom', '2px solid #FFFFFF');
	    jQuery.each(highlights, function(a, hex) {
	      jQuery.each(jQuery('#collage' + collage_id + ' tt.' + a), function(i, el) {
	        var current = jQuery(el);
	        var highlight_colors = current.data('highlight_colors');
	        if(highlight_colors) {
	          highlight_colors.push(hex);
	        } else {
	          highlight_colors = new Array(hex);
	        }
	        var current_hex = '#FFFFFF';
	        var opacity = 0.6 / highlight_colors.length;
	        jQuery.each(highlight_colors, function(i, color) {
	          var color_combine = jQuery.xcolor.opacity(current_hex, color, opacity);
	          current_hex = color_combine.getHex();
	        });
	        current.css('border-bottom', '2px solid ' + current_hex);
	        current.data('highlight_colors', highlight_colors);
	      });
	    });
	  }
  }
};

jQuery(document).ready(function(){
  if(jQuery('#playlist').size()) {
    jQuery('#printhighlights option:first').remove();
    jQuery('#printhighlights').val('none');
    jQuery('#printheatmap').val('no');
  }

  jQuery('.collage-content').each(function(i, el) {
    export_functions["version" + $(el).data('annotator_version')].loadState($(el).data('id')); 
  });

  export_functions.init();
});
