var unlayered_count = 0;

var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Annotator.Plugin.H2O = (function() {
  H2O.prototype.field = null;

  H2O.prototype.input = null;

  H2O.prototype.options = {
    categories: {}
  };

  function H2O(element, categories) {
    this.setAnnotationCat = __bind(this.setAnnotationCat, this);
    this.updateField = __bind(this.updateField, this);
    this.options.categories = categories;
  }

  H2O.prototype.pluginInit = function() {
    this.annotator.subscribe("annotationCreated", function(annotation) {
      H2O.prototype.setHighlights(annotation);
      H2O.prototype.setUnlayeredSingle(annotation);
      H2O.prototype.setLayeredBorders([annotation]);
      //rehighlight();
    });
    this.annotator.subscribe("annotationsLoaded", function(annotations) {
      H2O.prototype.setUnlayeredAll();
      H2O.prototype.setLayeredBorders(annotations);
    });
    this.annotator.subscribe("beforeAnnotationDeleted", function(annotation) {
      H2O.prototype.beforeDestroyAnnotationMarkup(annotation);
    });
    this.annotator.subscribe("annotationDeleted", function(annotation) {
      H2O.prototype.destroyAnnotationMarkup(annotation);
      H2O.prototype.resetUnlayeredListeners();
    });
    this.annotator.subscribe("annotationUpdated", function(annotation) {
      console.log('inside annotation Updated');
      H2O.prototype.updateAnnotationMarkup(annotation);
    });

    var cat, color, _ref;
    _ref = this.options.categories;
    for (cat in _ref) {
      color = _ref[cat];
      this.annotator.editor.addField({
        id: 'layer-' + cat,
        type: 'checkbox',
        label: cat,
        value: cat,
        hl: color,
        checked: false,
        load: this.updateField,
        submit: this.setAnnotationCat
      });
    }
    this.viewer = this.annotator.viewer.addField({
      load: this.updateViewer
    });
    if (this.annotator.plugins.Filter) {
      this.annotator.plugins.Filter.addFilter({
        label: 'H2O',
        property: 'category',
        isFiltered: Annotator.Plugin.H2O.filterCallback
      });
    }

    return this.input = $(this.field).find(':input');
  };

  H2O.prototype.setViewer = function(viewer, annotations) {
    var v;
    return v = viewer;
  };

  H2O.prototype.updateAnnotationMarkup = function(annotation) {
    var class_string = ''
    $.each($('.highlight_layer'), function(_i, el) {
      class_string += 'layer-' + $(el).data('layer') + ' highlight-' + $(el).data('layer') + ' ';
    });
    $('.annotation-' + annotation.id).removeClass(class_string);
    if(annotation.category !== undefined) {
      for(var _i = 0; _i < annotation.category.length; _i++) {
        $('.annotation-' + annotation.id).addClass(annotation.category[_i]);
        if($(".highlight_layer[data-layer='" + annotation.category[_i].replace('layer-', '') + "']").data('highlight')) {
          $('.annotation-' + annotation.id).addClass(annotation.category[_i].replace('layer-', 'highlight-'));
        }
      }
    }
  };

  H2O.prototype.destroyAnnotationMarkup = function(annotation) {
    var first_highlight = $('.delete-' + annotation.id + ':first');
    var prev_node = first_highlight.prev('.unlayered-' + first_highlight.data('unlayered'));
    var last_highlight = $('.delete-' + annotation.id + ':last');
    var next_node = last_highlight.next('.unlayered-' + last_highlight.data('unlayered'));
    if($('.delete-' + annotation.id).size() == 1 && prev_node.size() > 0 && next_node.size() > 0) {
      first_highlight.hide();
      next_node.hide();
      prev_node.html(prev_node.html() + first_highlight.html() + next_node.html());
      first_highlight.remove();
      next_node.remove();
    } else {
      if(prev_node.size() > 0) {
        first_highlight.hide();
        prev_node.html(prev_node.html() + first_highlight.html());
        first_highlight.remove();
      } 
      if(next_node.size() > 0) {
        next_node.hide();
        last_highlight.html(last_highlight.html() + next_node.html());
        next_node.remove();
      }
    }
    $('.delete-' + annotation.id).removeClass('delete-' + annotation.id);
  };

  // Overlap use Cases for adding and removing annotations
  // All is unlayered
  // All is layered
  // Overlap in back
  // Overlap in front
  // Edges are unlayered, but inside is layered
  H2O.prototype.beforeDestroyAnnotationMarkup = function(annotation) {
    $('.layered-border-start-' + annotation.id + ',.layered-ellipsis-' + annotation.id + ',.layered-border-end-' + annotation.id).remove();

    var front_unlayered = false;
    var back_unlayered = false;
    var all_items = $('.unlayered,.annotator-hl');
    var first_pos = all_items.index(annotation.highlights[0]);
    var prev_node = $(all_items[first_pos - 1]);
    if(prev_node.is('.unlayered') && $(annotation.highlights[0]).parents('.annotator-hl').size() == 0) {
      front_unlayered = true;
    }
    
    var last_highlight = annotation.highlights[annotation.highlights.length - 1];
    var last_pos = all_items.index(last_highlight);
    var next_node = $(all_items[last_pos + 1]);
    if($(last_highlight).parents('.annotator-hl').size() == 0 && (last_pos != (all_items.size() - 1)) && (next_node.is('.unlayered'))) {
      back_unlayered = true;
    }

    if(front_unlayered && back_unlayered) {
      if($(annotation.highlights).children('.annotator-hl').size() > 0 || $(annotation.highlights).parents('.annotator-hl').size() > 0) {
        var shifted_unlayered = prev_node.data('unlayered');
        for(var _i = 0; _i < annotation.highlights.length; _i++) {
          var contents = $(annotation.highlights[_i]).contents();
          for(var _j = 0; _j < contents.length; _j++) {
            var parent_count = $(contents[_j]).parents('.annotator-hl:not(.annotation-' + annotation.id + ')').size();
            if(parent_count > 0) {
              $('.unlayered-border-end-' + shifted_unlayered).insertAfter($('.unlayered-' + shifted_unlayered + ':last'));
              shifted_unlayered = next_node.data('unlayered');
            }
            if(contents[_j].nodeType == 3 && parent_count == 0) {
              var updated = '<span class="delete-' + annotation.id + ' unlayered unlayered-' + shifted_unlayered + '" data-unlayered="' + shifted_unlayered + '">' + $(contents[_j]).text() + '</span>';
              $(contents[_j]).replaceWith(updated); 
            }
          }
        }
        $('.unlayered-border-start-' + shifted_unlayered).insertBefore($('.unlayered-' + shifted_unlayered + ':first'));
        $('.unlayered-ellipsis-' + shifted_unlayered).insertBefore($('.unlayered-' + shifted_unlayered + ':first'));
      } else {
        var add_unlayered = prev_node.data('unlayered');
        var remove_unlayered = next_node.data('unlayered');
        $('.unlayered-border-end-' + add_unlayered + ',.unlayered-border-start-' + remove_unlayered + ',.unlayered-ellipsis-' + remove_unlayered).remove();
        $('.unlayered-' + remove_unlayered).removeClass('unlayered-' + remove_unlayered).addClass('unlayered-' + add_unlayered).data('unlayered', add_unlayered);
        $('.unlayered-border-end-' + remove_unlayered).removeClass('unlayered-border-end-' + remove_unlayered).addClass('unlayered-border-end-' + add_unlayered).data('unlayered', add_unlayered);
        for(var _i = 0; _i < annotation.highlights.length; _i++) {
          var contents = $(annotation.highlights[_i]).contents();
          for(var _j = 0; _j < contents.length; _j++) {
            if(contents[_j].nodeType == 3) {
              var updated = '<span class="delete-' + annotation.id + ' unlayered unlayered-' + add_unlayered + '" data-unlayered="' + add_unlayered + '">' + $(contents[_j]).text() + '</span>';
              $(contents[_j]).replaceWith(updated); 
            }
          }
        }
      }
    } else if(front_unlayered) {
      var shifted_unlayered = prev_node.data('unlayered');
      for(var _i = 0; _i < annotation.highlights.length; _i++) {
        if($(annotation.highlights[_i]).parents('.annotator-hl').size() == 0) {
          var contents = $(annotation.highlights[_i]).contents();
          for(var _j = 0; _j < contents.length; _j++) {
            if(contents[_j].nodeType == 3) {
              var updated = '<span class="delete-' + annotation.id + ' unlayered unlayered-' + shifted_unlayered + '" data-unlayered="' + shifted_unlayered + '">' + $(contents[_j]).text() + '</span>';
              $(contents[_j]).replaceWith(updated); 
            }
          }
        }
      }
      var last_unlayered = $('span.delete-' + annotation.id + ':last');
      $('<a href="#" class="unlayered-border-end unlayered-border-end-' + shifted_unlayered + '" data-unlayered="' + shifted_unlayered + '"></a>').insertAfter(last_unlayered);
      $('.unlayered-border-end-' + shifted_unlayered + ':first').remove();
    } else if(back_unlayered) {
      var shifted_unlayered = next_node.data('unlayered');
      for(var _i = 0; _i < annotation.highlights.length; _i++) {
        if($(annotation.highlights[_i]).parents('.annotator-hl').size() == 0) {
          var contents = $(annotation.highlights[_i]).contents();
          for(var _j = 0; _j < contents.length; _j++) {
            if(contents[_j].nodeType == 3) {
              var updated = '<span class="delete-' + annotation.id + ' unlayered unlayered-' + shifted_unlayered + '" data-unlayered="' + shifted_unlayered + '">' + $(contents[_j]).text() + '</span>';
              $(contents[_j]).replaceWith(updated); 
            }
          }
        }
      }
      var first_unlayered = $('span.delete-' + annotation.id + ':first');
      $('<a href="#" class="unlayered-border-start unlayered-border-start-' + shifted_unlayered + '" data-unlayered="' + shifted_unlayered + '"></a>').insertBefore(first_unlayered);
      $('<a href="#" class="unlayered-ellipsis unlayered-ellipsis-' + shifted_unlayered + '" data-unlayered="' + shifted_unlayered + '">...</a>').insertBefore(first_unlayered);
      $('.unlayered-border-start-' + shifted_unlayered + ':last').remove();
      $('.unlayered-ellipsis-' + shifted_unlayered + ':last').remove();
    }
  };
  H2O.prototype.setLayeredBorders = function(annotations) {
    for(var _i=0; _i<annotations.length; _i++) {
      var _id = annotations[_i].id;
      if(_id === undefined) {
        _id = 'noid';
      }
      var layer_class = '';
      if(annotations[_i].category !== undefined) {
        var layer_class = annotations[_i].category.join(' ');
      }
      var start_node = $('.annotation-' + _id + ':first');
      var end_node = $('.annotation-' + _id + ':last');
      $('<a href="#" class="layered-border-start layered-border-start-' + _id + ' ' + layer_class + '" data-layered="' + _id + '"></a>').insertBefore(start_node);
      $('<a href="#" class="layered-ellipsis layered-ellipsis-' + _id + ' ' + layer_class + '" data-layered="' + _id + '">...</a>').insertBefore(start_node);
      $('<a href="#" class="layered-border-end layered-border-end-' + _id + ' ' + layer_class + '" data-layered="' + _id + '"></a>').insertAfter(end_node);
    }
    $('.layered-ellipsis').off('click').on('click', function(e) {
      e.preventDefault();
      var _id = $(this).data('layered');
      $('.annotation-' + _id).show();
      $('.layered-border-start-' + _id + ',.layered-border-end-' + _id).css('display', 'inline-block');
      $(this).hide();
    });
    $('.layered-border-start,.layered-border-end').off('click').on('click', function(e) {
      e.preventDefault();
      var _id = $(this).data('layered');
      $('.annotation-' + _id).hide();
      $('.layered-border-start-' + _id + ',.layered-border-end-' + _id).hide();
      $('.layered-ellipsis-' + _id).css('display', 'inline-block');
    });
  };

  H2O.prototype.setUnlayeredSingle = function(annotation) {
    var end_unlayered;
    $.each(annotation.highlights, function(_i, el) {
      var parent_node = $(el).parent();
      if(parent_node.hasClass('unlayered')) {
        var unlayered_key = parent_node.data('unlayered');
        var contents = $(parent_node).contents();
        for(var _j = 0; _j < contents.length; _j++) {
          if(contents[_j].nodeType == 3) {
            var updated = '<span class="unlayered unlayered-' + unlayered_key + '" data-unlayered="' + unlayered_key + '">' + $(contents[_j]).text() + '</span>';
            $(contents[_j]).replaceWith(updated); 
          }
        }
        if(parent_node.is('span')) {
          end_unlayered = parent_node.data('unlayered');
          parent_node.contents().unwrap();
        } else {
          parent_node.removeClass('unlayered unlayered-' + parent_node.data('unlayered'));
        }
      }
    });

    var front_unlayered = false;
    var back_unlayered = false;
    var all_items = $('.unlayered,.annotator-hl');
    var first_pos = all_items.index(annotation.highlights[0]);
    var prev_node = $(all_items[first_pos - 1]);
    if(first_pos != 0) {
      if(prev_node.is('.unlayered')) {
        $('<a href="#" class="unlayered-border-end unlayered-border-end-' + end_unlayered + '" data-unlayered="' + end_unlayered + '"></a>').insertAfter(prev_node);
        front_unlayered = true;
      }
    }

    var last_highlight = annotation.highlights[annotation.highlights.length - 1];
    if($(last_highlight).parents('.annotator-hl').size() == 0) {
      var last_pos = all_items.index(last_highlight);
      var next_node = $(all_items[last_pos + 1]);
      if(last_pos != (all_items.size() - 1)) {
        if(next_node.is('.unlayered')) {
          $('<a href="#" class="unlayered-border-start unlayered-border-start-' + end_unlayered + '" data-unlayered="' + end_unlayered + '"></a>').insertBefore(next_node);
          $('<a href="#" class="unlayered-ellipsis unlayered-ellipsis-' + end_unlayered + '" data-unlayered="' + end_unlayered + '">...</a>').insertBefore(next_node);
          back_unlayered = true;
        }
      }
    }

    if(front_unlayered && back_unlayered) {
      unlayered_count++;
      $('.unlayered-border-start-' + end_unlayered + ':last').attr('class', '').addClass('unlayered-border-start unlayered-border-start-' + unlayered_count).data('unlayered', unlayered_count); 
      $('.unlayered-border-end-' + end_unlayered + ':last').attr('class', '').addClass('unlayered-border-end unlayered-border-end-' + unlayered_count).data('unlayered', unlayered_count); 
      $('.unlayered-ellipsis-' + end_unlayered + ':last').attr('class', '').addClass('unlayered-ellipsis unlayered-ellipsis-' + unlayered_count).data('unlayered', unlayered_count); 
      for(var _i = last_pos + 1; _i < all_items.size(); _i++) {
        if($(all_items[_i]).is('.unlayered')) {
          $(all_items[_i]).removeClass('unlayered-' + end_unlayered).addClass('unlayered-' + unlayered_count).data('unlayered', unlayered_count); 
        } else {
          _i = all_items.size();
        }
      }
    } else if(front_unlayered) {
      $('.unlayered-border-end-' + end_unlayered + ':last').remove();
    } else if(back_unlayered) {
      $('.unlayered-border-start-' + end_unlayered + ':first').remove();
      $('.unlayered-ellipsis-' + end_unlayered + ':first').remove();
    } else {
      //Do nothing 
    }

    H2O.prototype.resetUnlayeredListeners();
  };

  H2O.prototype.setUnlayeredAll = function() {
  console.log('steph inside here');
    $('.annotator-wrapper *:not(.annotator-hl):not(:has(.annotator-hl))').addClass('unlayered');
    $.each($('.annotator-wrapper *:not(.annotator-hl):has(.annotator-hl)'), function(i, el) {
      if($(el).children(':not(.annotator-hl):has(.annotator-hl)').size() == 0) {
        var contents = $(el).contents();
        for(var _i = 0; _i < contents.length; _i++) {
          if(contents[_i].nodeType == 3) {
            var updated = '<span class="unlayered">' + $(contents[_i]).text() + '</span>';
            $(contents[_i]).replaceWith(updated); 
          }
        }
      }
    });
    $('.annotator-outer, .annotator-outer *,.annotator-adder, .annotator-adder *').removeClass('unlayered');
    
    unlayered_count = 0;
    var set_unlayered = false;
    var all_items = $('.annotator-hl,.unlayered');
    if($(all_items[0]).is('.unlayered')) {
      $('<a href="#" class="unlayered-border-start unlayered-border-start-0" data-unlayered="0"></a><a href="#" class="unlayered-ellipsis unlayered-ellipsis-0" data-unlayered="0">...</a>').insertBefore($(all_items[0]));
    }
    for(var _i = 1; _i < all_items.size(); _i++) {
      var current_node = $(all_items[_i]);
      var prev_node = $(all_items[_i - 1]);
      if(current_node.is('.annotator-hl') && prev_node.is('.unlayered')) {
        $('<a href="#" class="unlayered-border-end unlayered-border-end-' + unlayered_count + '" data-unlayered="' + unlayered_count + '"></a>').insertAfter(prev_node);
      }
      if(current_node.is('.unlayered') && prev_node.is('.annotator-hl')) {
        unlayered_count++;
        $('<a href="#" class="unlayered-border-start unlayered-border-start-' + unlayered_count + '" data-unlayered="' + unlayered_count + '"></a>').insertBefore(current_node);
        $('<a href="#" class="unlayered-ellipsis unlayered-ellipsis-' + unlayered_count + '" data-unlayered="' + unlayered_count + '">...</a>').insertBefore(current_node);
      }
      if(current_node.is('.unlayered')) {
        current_node.addClass('unlayered-' + unlayered_count).data('unlayered', unlayered_count); 
      }
    }
    if(all_items.last().is('.unlayered')) {
      $('<a href="#" class="unlayered-border-end unlayered-border-end-' + unlayered_count + '" data-unlayered="' + unlayered_count + '"></a>').insertAfter(all_items.last());
    }

    H2O.prototype.resetUnlayeredListeners();
  };

  H2O.prototype.resetUnlayeredListeners = function() {
    $('.unlayered-ellipsis').off('click').on('click', function(e) {
      e.preventDefault();
      var key = $(this).data('unlayered');
      $('.unlayered-' + key).show();
      $('.unlayered-border-start-' + key + ',.unlayered-border-end-' + key).css('display', 'inline-block');
      $(this).hide();
      jQuery.hideShowUnlayeredOptions();
    });
    $('.unlayered-border-start,.unlayered-border-end').off('click').on('click', function(e) {
      e.preventDefault();
      var key = $(this).data('unlayered');
      $('.unlayered-' + key).hide();
      $('.unlayered-ellipsis-' + key).show();
      $('.unlayered-border-start-' + key + ',.unlayered-border-end-' + key).hide();
      jQuery.hideShowUnlayeredOptions();
    });
  };

  H2O.prototype.setHighlights = function(annotation) {
    var cat, h, highlights, _i, _len, _results;
    cat = annotation.category;
    highlights = annotation.highlights;
    _results = [];
    for (_i = 0; _i < highlights.length; _i++) {
      h = highlights[_i];
      _results.push(h.className = h.className + ' annotation-noid');
      for(_c = 0; _c < cat.length; _c++) {
        _results.push(h.className = h.className + ' ' + cat[_c]);
      }
      $.each($('a.highlight_layer'), function(_i, el) {
        if($(el).data('highlight') && h.className.match('layer-' + $(el).data('layer'))) {
          _results.push(h.className = h.className + ' highlight-' + $(el).data('layer'));
        }
      });
    }
    return _results;
  };

  H2O.prototype.updateField = function(field, annotation) {
    if(annotation.category !== undefined && $.inArray(field.childNodes[0].id, annotation.category) != -1) {
      $(field).find('input').attr('checked', true);
    } else {
      $(field).find('input').attr('checked', false);
    }

    return true;
  };

  H2O.prototype.setAnnotationCat = function(field, annotation) {
    if(annotation.category === undefined) {
      annotation.category = [];
    }

    var pos = $.inArray(field.childNodes[0].id, annotation.category); 
    if (field.childNodes[0].checked && pos == -1) {
      annotation.category.push(field.childNodes[0].id);
    } else if(!field.childNodes[0].checked && pos != -1) {
      annotation.category.splice( pos, 1);
    }
    return;
  };

  H2O.prototype.updateViewer = function(field, annotation) {
    field = $(field);
    if (annotation.category != null) {
      return field.addClass('annotator-category').html(function() {
        var string;
        return string = $.map(annotation.category, function(cat) {
          var layer_name = cat.replace(/layer-/, '');
          return '<span class="' + cat + '">' + layer_name + '</span>';
        }).join('');
      });
    } else {
      return field.remove();
    }
  };

  return H2O;

})();
