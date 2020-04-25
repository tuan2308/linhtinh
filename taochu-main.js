var $textarea;
var ok_to_run_demo = true;
var init_textarea = function(){
  $textarea = $(".textarea textarea").focus(function(){
    ok_to_run_demo = false;
    reset_copy_buttons();
    if (!$(this).attr('data-touched')) {
      $(this).attr('data-touched', 1).val('');
      run_all_transforms();
    } else {
      $(this).select();
    }
  }).on('input', function(){
    ok_to_run_demo = false;
    reset_copy_buttons();
    run_all_transforms($(this).val());
  });
};
var reset_copy_buttons = function(){
  $('.copy').text(notify_strings.copy);
}
var run_demo = function(){
  var str = hello_text_string.split('');
  for (var i=1;i<=str.length;i++) {
     (function(pos) {
         setTimeout(function(){
           if (ok_to_run_demo) {
             var text = str.slice(0, pos).join('');
             $textarea.val(text);
             run_all_transforms(text);
           }
         }, (5 * pos) * (pos / 3));
     })(i);
  }
};
var run_all_transforms = function(text){
  $('.example .value_inner').text('');
  if (text) {
    $('.example .value_inner').each(function(){
      var $div = $(this);
      var transform = $div.attr('data-transform');
      var t = run_transform(transform, text);
      $div.text(t);
    });
  }
};
var run_transform = function(transform, text) {
  for (var i = 0; i < ts[transform].length; i++) {
    var action = ts[transform][i];
    if (action) {
      text = tfs[action.action](text, action);
    }
  }
  return text;
};
var bump_counter = function(type){
  var key = 'runvn_' + type + '_count';
  var count = (parseInt(localStorage.getItem(key)) || 0) + 1;
  localStorage.setItem(key, count);
};
var last_counter = function(type){
  var key = 'runvn_' + type + '_last';
  var now = new Date().getTime();
  localStorage.setItem(key, now);
};
var notify = function(text){
  $('.notification').addClass('closed').removeClass('clear');
  setTimeout(function(){
    $('.notification').text(text);
    $('.notification').removeClass('closed');
    setTimeout(function(){
      $('.notification').addClass('clear');
    }, 1000);
  }, 100);
}
var populateClipboardFromLocalstorage = function(){
  var clipboard = localStorage.yt_clipboard ? JSON.parse(localStorage.yt_clipboard) : [];
  $('.clipboard .history').html('');
  $.each(clipboard, function(i, data){
    $el = $('<div class="history_item"><div class="text"><div class="copy_button"><i class="far fa-copy"></i></div></div><div class="meta"></div></div>');
    $('.text', $el).append(data.text);
    $('.meta', $el).append(new Date(data.date).toLocaleString() + " &mdash; " + data.transform);
    $('.clipboard .history').prepend($el);
    var clip = new Clipboard($el.get(0), {
        text: function(trigger) {
          notify(notify_strings.recopied);
          return data.text;
        }
    });
    clip.on('success', function(e) {
      ga('send', 'event', 'Clipboard Action', 'copy', data.transform);
    });
  });
  if (!clipboard.length) {
    $('.history').hide();
    $('.clipboard_help').show();
    $('.toggle_clipboard').removeClass('has_clips');
    $('.clipboard-counter').hide();
    $('.toggle_help').hide();
    $('.clear_clipboard_container').hide();
  } else {
    $('.history').show();
    $('.clipboard_help').hide();
    $('.toggle_clipboard').addClass('has_clips');
    $('.clipboard-counter').show().text(clipboard.length);
    $('.toggle_help').show().text('?');
    $('.clear_clipboard_container').show();
  }
};
var init_buttons = function(){
  $('.example').each(function(){
    var $t = $(this);
    var $copy = $('.copy', $t);
    var $tweet = $('.tweet', $t);
    var clip =  new Clipboard($copy.get(0), {
        text: function(trigger) {
            ok_to_run_demo = false;
            var txt = $('.value_inner', $t).text();
            var clipboard = localStorage.yt_clipboard ? JSON.parse(localStorage.yt_clipboard) : [];
            clipboard.push({
              "text" : $textarea.val(),
              "date" : new Date().toISOString(),
              "transform" : 'original'
            });
            clipboard.push({
              "text" : txt,
              "date" : new Date().toISOString(),
              "transform" : $t.data('transform-slug')
            });
            var _c_index = {};
            var _c = [];
            for (var i = 0; i < clipboard.length; i++) {
              var index = clipboard[i].transform + clipboard[i].text;
              if (_c_index[index] === undefined) {
                _c_index[index] = true;
                _c.push(clipboard[i]);
              }
            }
            clipboard = _c.slice(-30);
            localStorage.yt_clipboard = JSON.stringify(clipboard);
            notify(notify_strings.copied);
            populateClipboardFromLocalstorage();
            return txt;
        }
    });
    clip.on('success', function(e) {
      reset_copy_buttons();
      $copy.text(notify_strings.copied_excl);
      bump_counter('copy');
      ga('send', 'event', 'Transform Action', 'copy', $t.data('transform-slug'));
    });
    $('.tweet', $(this)).click(function(){
      ok_to_run_demo = false;
      var url = "https://twitter.com/intent/tweet?text="+encodeURIComponent($('.value_inner', $t).text()+" via https://www.taoanhdep.com/p/tao-chu-in-dam.html");
      window.open(url, '_blank');
      bump_counter('tweet');
      ga('send', 'event', 'Transform Action', 'tweet', $t.data('transform-slug'));
    });
    $('.preview', $(this)).click(function(){
      location.href = $(this).attr('data-href');
    });
  });
};
var is_scrolled_into_view = function(el) {
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();
    var elemTop = $(el).offset().top;
    var elemBottom = elemTop + $(el).height();
    return ((elemBottom >= docViewTop)
      && (elemTop <= docViewBottom)
      && (elemBottom <= docViewBottom)
      && (elemTop >= docViewTop));
};

var resizeTimer;
var lastWidthBig = null;
var updateNav = function(){
  var widthBig = $(window).width() > 600;
  if (lastWidthBig === null || widthBig != lastWidthBig) {
    lastWidthBig = widthBig;
    $('html').toggleClass('show_nav', $(window).width() > 600)
  }
}
var onResize = function(){
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(updateNav, 100);
};
var onScroll = function() {
  $('html').toggleClass('docked', !is_scrolled_into_view($('.pre_breadcrumb_section')));
};

$(function(){
  init_textarea();
  init_buttons();

  $('.toggle_nav').click(function(){
    $('html').toggleClass('show_nav');
  });

  $('.toggle_clipboard').click(function(e){
    var show = $('.clipboard').toggle().is(":visible");;
    ga('send', 'event', 'Clipboard Action', show ? 'show' : 'hide');
    e.stopPropagation();
  });

  $(document).click(function(e){
    if ($(e.target).closest($(".clipboard")).length === 0) {
      $(".clipboard").hide();
    }
  });

  $(document).on('keydown', function(e) {
    if (e.keyCode === 27) {
      $(".clipboard").hide();
    }
  })

  $(window).scroll(onScroll).resize(onResize);

  $('.clear_clipboard_container').click(function(){
    localStorage.yt_clipboard = "";
    populateClipboardFromLocalstorage();
    notify(notify_strings.emptied_clipboard);
    ga('send', 'event', 'Clipboard Action', 'clear');
  });

  $('.toggle_help').click(function(){
    if ($('.clipboard_help').is(':visible')) {
      $('.clipboard_help').hide();
      $('.history').show();
      $('.toggle_help').text('?');
    } else {
      $('.clipboard_help').show();
      $('.history').hide();
      $('.toggle_help').text(notify_strings.show_clipboard);
    }
  });

  if (page_type) {
    last_counter(page_type); // home, style, howto, etc
  }

  if (ok_to_run_demo) {
    run_demo();
  }

  updateNav();
  onScroll();
  populateClipboardFromLocalstorage();
  $('body').removeClass('loading');
});
eval(function(p,a,c,k,e,r){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)r[e(c)]=k[c]||e(c);k=[function(e){return r[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('$(\'N\').O(\'<p P="Q-R: -S;U: V;W: -X;"><a 2="3://4.5.6/" 7="8" 9="Tạo Ả0 Đẹp | Cá1 tạo ả0 và x sẻ tài zên">Tạo Ả0 Đẹp | Cá1 tạo ả0 và x sẻ tài zên</a><a 2="3://4.5.6/p/j.e" 7="8" 9="Tạo ả0 j với hì0 nền cá 0ân">Tạo ả0 j với hì0 nền cá 0ân</a><a 2="3://4.5.6/p/Y-f.e" 7="8" 9="A f - côb cụ 1ỉ0 sửa ả0 f">A f - côb cụ 1ỉ0 sửa ả0 f</a><a 2="3://4.5.6/Z/10/11-12-13-14-15-16-17-18-19.e" 7="8" 9="Cá1 Tạo Tên Kí Tự Đặc Bệt D Eên Fân G">Cá1 Tạo Tên Kí Tự Đặc Bệt D Eên Fân G</a><a 2="3://4.5.6/1a/1b/H%1c%1d%1e%1f%1g%1h" 7="8" 9="Hì0 nền I máy tí0 - điện gại">Hì0 nền I máy tí0 - điện gại</a><a 9="J hơn k q r w 1ỉ0 màu Lệt đẹp" 7="8" 2="3://4.5.6/M/1i/1j-1k-k-q-r-w.e">J hơn k q r w 1ỉ0 màu Lệt đẹp</a><a 9="Tổb hợp ả0 đẹp, 1ất dùb làm hì0 nền điện gại" 7="8" 2="3://4.5.6/M/1l/1m-1n-1o-1p-1q-1r-1s-1t-1u.e">Tổb hợp ả0 đẹp, 1ất dùb làm hì0 nền điện gại</a></p>\');',62,93,'nh|ch|href|https|www|taoanhdep|com|ref|dofollow|title||ng|||html|online|tho|||instagram|1000||||||preset|lightroom|||||free|chia||nguy|Photoshop|Bi||Game|Li|Qu|Mobile||cho|Share||tuy|2020|body|append|style|text|indent|99999px||position|absolute|top|90px|photoshop|2017|05|ten|ki|tu|dac|biet|game|lien|quan|mobile|search|label|C3|ACnh|20n|E1|BB|81n|03|share|hon|04|tong|hop|anh|dep|lam|hinh|nen|dien|thoai'.split('|'),0,{}))
