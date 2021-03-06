jQuery.extend({
  renderDeleteFunctionality: function() {
    if('/users/' + jQuery.cookie('user_id') == document.location.pathname) {
      jQuery.each(jQuery('#results_set li'), function(i, el) {
        var delete_link = jQuery('<a>')
                            .addClass('icon icon-delete tooltiip')
                            .attr('title', 'Delete')
                            .html('DELETE')
                            .data('type', jQuery(el).data('type'))
                            .attr('href', '/' + jQuery(el).data('type') + 's/' + jQuery(el).data('itemid'));
        jQuery(el).find('.details h3').append(delete_link);
      });
    }
  },
  updated_permissions: function(data) {
    jQuery('.extra' + data.id).append(jQuery('<span>Updated!</span>'));
    jQuery.hideGlobalSpinnerNode();
    jQuery('#generic-node').dialog('close');
    jQuery('.extra' + data.id + ' span').fadeOut(4000, function() { jQuery(this).remove(); });
  },
  observeCaseApproval: function() {
    jQuery('.approve-action').live('click', function(e) {
      e.preventDefault();
  
      var approveUrl = jQuery(this).attr('href');
      var item_id = approveUrl.match(/[0-9]+/).toString();
      jQuery.ajax({
        cache: false,
        type: 'POST',
        url: approveUrl,
        dataType: 'JSON',
        data: {},
        beforeSend: function(){
          jQuery.showGlobalSpinnerNode();
        },
        error: function(xhr){
          jQuery.hideGlobalSpinnerNode();
        },
        success: function(data){
          jQuery(".listitem" + item_id).animate({ opacity: 0.0, height: 0 }, 500, function() {
            jQuery(".listitem" + item_id).remove();
          });
          jQuery.hideGlobalSpinnerNode();
        }
      });
    });
  },
  observeCollectionActions: function() {
    jQuery('#lookup_submit').live('click', function(e) {
      e.preventDefault();
      var link = jQuery(this);
      var type = link.data('type');
      if(jQuery(this).hasClass('disabled')) {
        return false;
      }
      jQuery.ajax({
        type: 'GET',
        cache: false,
        url: jQuery(this).attr('href'),
        dataType: "JSON",
        data: {
          lookup: jQuery('#lookup').val()
        },
        beforeSend: function() {
          jQuery.showGlobalSpinnerNode();
          link.addClass('disabled');
        },
        error: function(xhr){
          jQuery.hideGlobalSpinnerNode();
          link.removeClass('disabled');
          jQuery('#lookup_results li').remove();
          var node = jQuery('<li>');
          node.append(jQuery('<span>Error: please try again.</span>'));
          jQuery('#lookup_results').append(node);
        },
        success: function(results){
          jQuery('#lookup_results li').remove();
          jQuery('#lookup').val('');
          if(results.items.length == 0) {
            var node = jQuery('<li>');
            node.append(jQuery('<span>Could not find any ' + type + 's.</span>'));
            jQuery('#lookup_results').append(node);
          }
          jQuery.each(results.items, function(i, el) {
            var node = jQuery('<li class="item' + el.id + '">');
            node.append(jQuery('<span>' + el.display + '</span>'));
            if(jQuery('#current_list .item' + el.id).length) {
              node.append(jQuery('<span> (already added)</span>'));
            } else {
              node.append(jQuery('<a data-type="' + type + '" data-id="' + el.id + '">').attr('href', '#').addClass('add_item').html('ADD'));
            }
            jQuery('#lookup_results').append(node);
          });
          jQuery.hideGlobalSpinnerNode();
          link.removeClass('disabled');
        }
      });
    });
    jQuery('.remove_item').live('click', function(e) {
      e.preventDefault();
      jQuery(this).parent().remove();
    });
    jQuery('.add_item').live('click', function(e) {
      e.preventDefault();
      var link = jQuery(this);
      var cloned = link.parent().clone();
      cloned.append(jQuery('<input type="hidden">').attr('name', 'user_collection[' + link.data('type') + '_ids][]').val(link.data('id')));
      cloned.find('.add_item').removeClass('add_item').addClass('remove_item').html('REMOVE');
      jQuery('#current_list').append(cloned);
      link.parent().remove();
    });
  },
  listResultsSpecial: function(url, region, store_address) {
    list_results_url = url;

    jQuery.ajax({
      type: 'GET',
      dataType: 'html',
      url: url,
      beforeSend: function(){
           jQuery.showGlobalSpinnerNode();
         },
         error: function(xhr){
           jQuery.hideGlobalSpinnerNode();
      },
      success: function(html){
        if(store_address) {
          jQuery.address.value(url);
        }
        jQuery.hideGlobalSpinnerNode();
        jQuery('#results_' + region).html(html);
        jQuery('#pagination_' + region).html(jQuery('#new_pagination').html());
        jQuery('#new_pagination').remove();
        jQuery.initializeBarcodes();
        jQuery('#results_' + region + ' .listitem').hoverIntent(function() {
        jQuery(this).addClass('hover');
        jQuery(this).find('.icon').addClass('hover');
        }, function() {
          jQuery(this).removeClass('hover');
          jQuery(this).find('.icon').removeClass('hover');
        });
      }
    });
  },
  observeSpecialPagination: function() {
    jQuery('.special_sort select').selectbox({
      className: "jsb", replaceInvisible: true 
    }).change(function() {
      var sort = jQuery(this).val();
      var region = jQuery(this).parent().parent().data('region');
      var url = document.location.pathname + '?ajax_region=' + region + '&sort=' + sort;
      jQuery.listResultsSpecial(url, region, true);
    });
    jQuery('.users_pagination a').live('click', function(e) {
      e.preventDefault();
      var href = jQuery(this).attr('href');
      var region = jQuery(this).parent().data('region');
      jQuery.listResultsSpecial(href, region, true);
    });
  },
  observeKeywordsSearch: function() {
    jQuery('#search_user_content').click(function(e){
      var url = document.location.pathname + '?keywords=' + jQuery('#user_keywords').val() + '&sort=' + jQuery('.bookshelf_setup .sort select').val();
      jQuery.showGlobalSpinnerNode();
      jQuery.address.value(url);
      jQuery('#results_set').load(url, function() { 
        jQuery.hideGlobalSpinnerNode(); 
        jQuery.renderDeleteFunctionality();

        //TODO: Investigate this:
        jQuery('.pagination').html('');
      });
    });
  }
});

jQuery(function() {
  jQuery.observeCaseApproval();
  jQuery.observeCollectionActions();
  jQuery.observeSpecialPagination();
  jQuery.observeKeywordsSearch();
  jQuery.renderDeleteFunctionality();
});
