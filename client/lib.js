// =======================================================================================> DEBUGGER
// funkce debuggeru
// ----------------------------------------------------------------------------- isElementInViewport
function isElementInViewport(el) {
  var rect= el.getBoundingClientRect();
  return rect.bottom > 0 &&
    rect.right > 0 &&
    rect.left < (window.innerWidth || document. documentElement.clientWidth) /*or $(window).width() */ &&
    rect.top < (window.innerHeight || document. documentElement.clientHeight) /*or $(window).height() */;
}
// -------------------------------------------------------------------------------- dbg_onshiftclick
function dbg_onshiftclick(block) {
  if ( !Ezer.options.dbg ) return false;
  if ( !Ezer.sys.dbg ) Ezer.sys.dbg= {win:null,file:''};
  var pos= block.app_file();
  if ( pos.file ) {
    var show= function() {
      var lc= block.desc._lc.split(',');
      var win= Ezer.sys.dbg.window;
      win.focus();
      var line= win.document.getElement('li.curr');
      if ( line )
        line.removeClass('curr');
      line= win.document.getElementById(lc[0]);
      if ( line && !isElementInViewport(line) )
        line.scrollIntoView();
      line.addClass('curr');
    };
    // zobrazení
    Ezer.sys.dbg.start= block.self();
    if ( pos.file==Ezer.sys.dbg.file ) {
      show();
    }
    else {
      var fname= pos.app+'/'+pos.file;
      Ezer.sys.dbg.window= window.open('./ezer2.2/dbg.php?err=1&src='+fname,'dbg',
        'width=650,height=700,resizable=1,titlebar=0,menubar=0');
      if ( Ezer.sys.dbg.window ) {
        Ezer.sys.dbg.file= pos.file;
      };
    }
  }
  return false;
}
// -------------------------------------------------------------------------------- dbg_onclick_line
// op= stop+ | stop- | trace+ | trace- | dump
function dbg_onclick_line(line,op) {
  var found= null;
  var type= op=='dump' ? 'var' : 'proc';
  if ( Ezer.sys.dbg ) {
    var walk = function(o,ln) {
      if ( o.part ) for (var i in o.part) {
        if ( found ) break;
        var oo= o.part[i];
        if ( oo.desc && oo.desc._lc && oo.type==type && oo.desc._lc.contains(ln) ) {
          found= {id:i,block:oo};
          break;
        }
        found= walk(oo,ln);
        if ( !found && oo instanceof Ezer.Var && oo._of=='form' && oo.value ) {
          found= walk(oo.value,ln);
        }
      }
      return found;
    };
    var dbg= Ezer.sys.dbg;
    dbg.line= line;
    // nalezení Ezer.Block podle dbg.start
    var ctx= [], known;
    known= Ezer.run_name(dbg.start,null,ctx);
    if ( known ) for (var i=ctx.length-1; i>=0; i--) {
      var o= ctx[i];
      if ( o.desc._file==dbg.file ) { // nejvyšší blok - budeme hledat řádek
        found= walk(o,line+',');
        if ( found ) {
          dbg.id= found.id;
          dbg.block= found.block;
          break;
        }
      }
    }
    // upravení found - jen hodnotové var
    if ( found && type=='var' && (found.block._of=='form' || found.block._of=='area')) {
      found= null;
    }
    // vlastní ladící akce
    if ( found ) switch (op) {
      case 'dump':
        if ( typeof dbg.block.value == "object" )
          found.value= debug(dbg.block.value,dbg.id,3);
        else
          found.value= dbg.id+'='+dbg.block.value;
        break;
      case 'stop+':
        dbg.block.proc_stop(1);
        break;
      case 'stop-':
        dbg.block.proc_stop(0);
        break;
      case 'trace+':
        dbg.block.proc_trace(1);
        break;
      case 'trace-':
        dbg.block.proc_trace(0);
        break;
    }
  }
  return found;
}
// -------------------------------------------------------------------------------- dbg_onclick_text
function dbg_onclick_text(el) {
  return 1;
}
// ------------------------------------------------------------------------------- dbg_onclick_start
function dbg_onclick_start(win) {
  win= win ? win : window;
  var dbg_src= win.document.getElementById('dbg_src');
  if ( dbg_src ) {
    dbg_src.addEvents({
      click: function(el) {
        var chs= el.target.getParent().getChildren(), x= 0;
        for (var i=0; i<chs.length; i++) {
          if ( chs[i]==el.target ) {
            x= i+1;
            break;
          }
        }
        Ezer.fce.echo("line=",x);
        return x;
      }
    })
  }
}
// ================================================================================================= ZeroClipboard
// ------------------------------------------------------------------------------------------------- clipboard
// vloží text do schránky Windows pomocí podle http://code.google.com/p/zeroclipboard/
function clipboard_init () {
  Ezer.clip= new ZeroClipboard.Client();
  Ezer.clip.setHandCursor( true );
//   Ezer.clip.addEventListener('mouseOver', clip_mouse_over);
  Ezer.clip.addEventListener('complete', clip_complete);
//   Ezer.fce.echo($('clipboard')?'clipboard nalezen':'clipboard nenalezen');
  Ezer.clip.glue('clipboard','clipboard');
  Ezer.clip.info= 'ok';
}
function clipboard_set(text) {
  Ezer.clip.setText(text);
}
function clip_complete(client, text) {
//   Ezer.clip.setText( 'nazdar' );
//   alert("Copied text to clipboard: " + text );
}
// ------------------------------------------------------------------------------------------------- make_url_menu
// sestavení url aplikace se změněným odkazem na menu
// menu = pole pro parametr menu
function make_url_menu(menu) {
  var url= location.protocol+'//'+location.hostname+(location.port?':'+location.port:'');
  url+= location.pathname;
  // přidání menu
  var del= '';
  url+= '?menu=';
  menu.each(function(id){
    url+= del+id;
    del= '.';
  });
  // přidání původních $_GET parametrů mimo trace+theight, které je doplněno v pushState
  for (var tag in Ezer.get ) {
    if ( tag!='trace' && tag!='theight' ) {
      var val= Ezer.get[tag];
      url+= '&'+tag+'='+val;
    }
  }
//                                                 Ezer.trace('*',url);
  return url;
}
// ------------------------------------------------------------------------------------------------- get_url_param
// zjištění hodnoty parametru v url
// see http://www.netlobo.com/url_query_string_javascript.html
function get_url_param(name) {
  name= name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS= "[\\?&]"+name+"=([^&#]*)";
  var regex= new RegExp( regexS );
  var results= regex.exec( window.location.href );
  if( results == null )
    return "";
  else
    return results[1];
}
// ------------------------------------------------------------------------------------------------- get_scrollbar_width
// zjištění šířky srollbar
function get_scrollbar_width() {
   var scr = null;
   var inn = null;
   var wNoScroll = 0;
   var wScroll = 0;
   scr = document.createElement('div');
   scr.style.position = 'absolute';
   scr.style.top = '100px';
   scr.style.left = '100px';
   scr.style.width = '200px';
   scr.style.height = '150px';
   inn = document.createElement('div');
   inn.style.width = '100%';
   inn.style.height = '200px';
   scr.appendChild(inn);
   document.body.appendChild(scr);
   scr.style.overflow = 'hidden';
   wNoScroll = inn.offsetWidth;
   scr.style.overflow = 'scroll';
   wScroll = inn.offsetWidth;
   if (wNoScroll == wScroll) wScroll = scr.clientWidth;
   document.body.removeChild(document.body.lastChild);
   return (wNoScroll - wScroll);
}
// ------------------------------------------------------------------------------------------------- padNum
// dorovnání čísla nulami do dané délky
function padNum(number, numDigits) {
  var str= number ? number.toString() : '0';
  while (str.length < numDigits) str= '0' + str;
  return str;
}
// ------------------------------------------------------------------------------------------------- padStr
// dorovnání stringu mezerami resp. omezení do dané délky
function padStr(str, len) {
  str= htmlentities(str);
  if ( str.length>len ) {
    str= str.substr(0,len-1)+'…'; //'&hellip;';
  }
  else {
    while (str.length < len) str+= ' ';
  }
  return str;
}
// ------------------------------------------------------------------------------------------------- datum
// vrátí dnešní datum a pokud je time=1 i čas ve tvaru používaném v položkách date
// pokud je time==2 zobrazují se i sekundy
// pokud je sql==1 ve formátu pro SQL
function ae_datum(time,sql) {
  var t= new Date(), td= t.getDate(), tm= 1+t.getMonth(), ty= t.getFullYear();
  if ( time ) { var th= t.getHours(), tn= t.getMinutes(), ts= t.getSeconds(); }
  if ( sql ) {
    dat= ty+'-'+padNum(tm,2)+'-'+padNum(td,2);
    if ( time ) {
      dat+= ' '+padNum(th,2)+':'+padNum(tn,2)+':'+padNum(ts,2);
    }
  }
  else {
    dat= td+'.'+tm+'.'+ty;
    if ( time ) {
      dat+= ' '+th+':'+padNum(tn,2)+(time==2 ? ':'+padNum(ts,2) : '');
    }
  }
  return dat;
}
// ------------------------------------------------------------------------------------------------- time2ymd
// převede datum typu "d.m.y h:m:s" na pole [y,m,d,h,m,s]
ae_time2ymd= function (dmy) {
  var y, m, d, s= [];
  if ( dmy.length > 0 ) {
    dmy= dmy.split('.');
    // den může být předeslán jménem dne v týdnu
    d= dmy[0].split(' ');
    d= parseInt(d[d.length-1],10);
    m= parseInt(dmy[1],10);
    // rok může být následován časem
    y= dmy[2].split(' ');
    if (y[1]) {
      var hms= y[1].split(':');
      if ( hms.length==3 )
        s= [y[0],m,d,hms[0],hms[1],hms[2]];
      else
        s= [y[0],m,d,hms[0],hms[1]];
    }
    else
      s= [y[0],m,d];
  }
  return s;
}
// ------------------------------------------------------------------------------------------------- time
// vrátí čas,pokud je time==2 zobrazují se i sekundy
function ae_time(time) {
  var t= new Date();
  var th= t.getHours(), tn= t.getMinutes(), ts= t.getSeconds();
  var tim= ' '+th+':'+padNum(tn,2)+(time==2 ? ':'+padNum(ts,2) : '');
  return tim;
}
// ------------------------------------------------------------------------------------------------- htmlentities
// jednoduchá varianta php funkce
function htmlentities(h,breaks) {
  var t= typeof(h)=='string' ? h.replace(/[<]/g,'&lt;').replace(/[>]/g,'&gt;') : h.toString();
  // pokus o pretty printing pro breaks==2:
  if ( breaks==2 ) t= t.replace(/&lt;([^/])/g,"<br/>&nbsp;&lt;$1");
  t= breaks ? t.replace(/[\n]/g,'<br/>') : t.replace(/[\n]/g,'\\n')
  return t;
}
// ------------------------------------------------------------------------------------------------- firstPropertyId
// vrátí klíč první vlatnosti objektu (podle for...in)
function firstPropertyId(o) {
  var i= null;
  if ( o )
    for (i in o)
      break;
  return i;
}
// ------------------------------------------------------------------------------------------------- debug
// zobrazení struktury objektu nebo pole
function debug (gt,label,depth) {
  var x= gt;
  label= label||'';
  depth= depth||5;
  if ( $type(gt)=='array' || $type(gt)=='object' ) {
    x= debugx(gt,label,depth);
  }
  else {
    x= "<table class='dbg' style='background-color:#ddeeff'><tr><td valign='top' class='title'>"+
      label+"</td></tr><tr><td>"+x+"</td></tr></table>";
  }
  return x;
}
function debugx (gt,label,depth) {
  var x= gt, g, t, c, maxlen= 32;
  if ( depth < 0 ) return "<table class='dbg_over'><tr><td>...</td></tr></table>";
  if ( $type(gt)=='array' || $type(gt)=='object' ) {
    c= $type(gt)=='array' ? '#ddeeff' : '#eeeeaa';
    x= "<table class='dbg' style='background-color:"+c+"'>";
    x+= label!==undefined ? "<tr><td valign='top' colspan='2' class='title'>"+label+"</td></tr>" : '';
    Object.each(gt,function(t,g){
      x+= "<tr><td valign='top' color='label'>"+g+"</td><td>"+debugx(t,undefined,depth-1)+"</td></tr>";
    });
    x+= "</table>";
  }
  else if ( $type(gt)=='string' ) {
    x= "'"+x+"'";
  }
  return x;
}
// ================================================================================================= ContextMenu
// Class:ContextMenu, Author:David Walsh, Website:http://davidwalsh.name, Version:1.0, Date:1/20/2009
// simplified by Martin Smidek
var ContextMenu = new Class({
  // implements
  Implements: [Options,Events],
  shown: false,
  ezer_owner: null,                              //120130 ezer owner
  // options
  options: {
    own_listener: false,                        //130531gn
    actions: {},
    menu: 'contextmenu',
    stopEvent: true,
    target: 'body',
    trigger: 'contextmenu',
    offsets: { x:0, y:0, from:'mouse' },        //101110gn
    onShow: function(){},
    onHide: function(){},
    onClick: function(){},
    fadeSpeed: 200,
    focus: null,                                //140905gn DOM určený pro aplikace focus_css
    up:false,
    focus_css: 'ContextFocus',
    focus_mask: true,                           //140202gn nenulové znamená označení target maskou
    event: null                                 // show imediately when started by event
  },
  // initialization
  initialize: function(options) {
    this.setOptions(options);                                   // set options
    this.clear();
    this.menu = $(this.options.menu);                           // option diffs menu
    this.menu.store('THIS',this);
    this.target = $(this.options.target);
    this.focus = this.options.focus ? $(this.options.focus) : this.target;
    this.hide().startListener();                                // hide and begin the listener
    this.menu.setStyles({position:'absolute',display:'none'});
    if ( this.options.event ) {
      this.start(this.options.event);                           // show the menu now
    }
    // pro dotyková zařízení
    if ( this.focus && (Ezer.platform=='A' || Ezer.platform=='I') ) {
      this.Hammer= new Hammer(this.focus);
      // press vyvolá contextmenu
      this.Hammer.on("press", function(e) {
//                                                                 Ezer.fce.echo("press");
        this.Hammer.stop();
        this.start(e);
      }.bind(this));
    }
  },
  // re-initialization
  reinitialize: function(options) {
    this.setOptions(options);                                   // set options
    this.menu = $(this.options.menu);                           // option diffs menu
    this.target = $(this.options.target);
    this.focus = this.options.focus ? $(this.options.focus) : this.target;
    this.hide().startListener();                                // hide and begin the listener
    this.menu.setStyles({position:'absolute',display:'none'});
    if ( this.options.event ) {
      this.start(this.options.event);                           // show the menu now
    }
 },
  // get things started
  startListener: function() {
    if ( !this.options.own_listener && this.target ) {
      this.target.addEvent(this.options.trigger,function(e) {     // show the menu
        if(!this.options.disabled) {                              // enabled?
          if(this.options.stopEvent) {                            // prevent default, if told to
            e.stop();
          }
          this.options.element= this.target;                      // record this as the trigger
          var pos= this.options.offsets.from=='mouse' ? e.page : this.target.getPosition();
          this.menu.setStyles({                                   // position the menu
            top: (pos.y + this.options.offsets.y),
            left: (pos.x + this.options.offsets.x),
            position: 'absolute',
            'z-index': '12000'
          });
          this.show();                                            //show the menu
        }
      }.bind(this));
    };
    // hide on body click
    $(document.body).addEvent('click', function(e) {
      if ( e.target!=this.target )
        this.hide();
    }.bind(this));
    $(document.body).addEvent(this.options.trigger, function(e) {
      if ( e.target!=this.target )
        this.hide();
    }.bind(this));
  },
  // get things started immediately     //101110gn
  start: function(e) {
    this.clear();
    this.options.element= this.target;                      // record this as the trigger
    if ( e ) {
      var x= e.pageX ? e.pageX : ( e.page ? e.page.x : ( e.center ? e.center.x : 0));
      var y= e.pageY ? e.pageY : ( e.page ? e.page.y : ( e.center ? e.center.y : 0));
      this.menu.setStyles({                                   // position the menu
        top: (y + this.options.offsets.y),
        left: (x + this.options.offsets.x),
        position: 'absolute',
        'z-index': '20000',
        opacity:1
      });
    }
    else {
      var pos= this.target.getPosition();
      this.menu.setStyles({                                   // position the menu
        top: (pos.y + this.options.offsets.y),
        left: (pos.x + this.options.offsets.x),
        position: 'absolute',
        'z-index': '20000',
        opacity:1
      });
    }
    this.show();                                            //show the menu
    return this;
  },
  // remove all menus but this
  clear: function() {
    $$('.ContextMenu').each(function(menu) {
      var myself= menu.retrieve('THIS');
      if ( myself ) myself.hide();
    });
  },
  // show menu
  show: function() {
    this.clear();
    this.menu.setStyle('display','block');
    if ( this.options.up ) {
      var height= this.menu.getSize().y;
      var top= this.menu.getStyle('top').toInt();
      top-= height;
      this.menu.setStyle('top',top);
    }
    this.shown= true;
    if ( this.options.focus_css ) this.focus.addClass(this.options.focus_css);
    if ( this.options.focus_mask ) {
      // pokud existuje element s id=mask pak jeho zobrazení a pozvednutí elementu nad masku
      var mask= $('mask');
      if ( mask ) {
        this.saved_style= this.target.getStyles("position,z-index");
        mask.setStyles({display:'block'});
        this.target.setStyles({position:'relative',zIndex:999});
      }
    }
    return this;
  },
  // hide the menu
  hide: function() {
    if(this.shown) {
      this.menu.setStyle('display','none');
      this.shown= false;
      if ( this.options.focus_css ) this.focus.removeClass(this.options.focus_css);
      if ( this.options.focus_mask ) {
        // případné odstranění masky
        var mask= $('mask');
        if ( mask ) {
          mask.setStyles({display:'none'});
          this.target.setStyles(this.saved_style);
        }
      }
    }
    return this;
  },
  // disable an item
  disableItem: function(item) {
    this.menu.getElements('a[href$=' + item + ']').addClass('disabled');
    return this;
  },
  // enable an item
  enableItem: function(item) {
    this.menu.getElements('a[href$=' + item + ']').removeClass('disabled');
    return this;
  },
  // diable the entire menu
  disable: function() {
    this.options.disabled = true;
    return this;
  },
  // enable the entire menu
  enable: function() {
    this.options.disabled = false;
    return this;
  },
  // execute an action
  execute: function(action,element) {
    if (this.options.actions[action]) {
      this.options.actions[action](element,this);
    }
    return this;
  }
});
// ================================================================================================= Mootools parts
// ================================================================================================= Base64
// ------------------------------------------------------------------------------------------------- base64_decode
function base64_decode (data) {
    // http://kevin.vanzonneveld.net
    // +   original by: Tyler Akins (http://rumkin.com)
    // +   improved by: Thunder.m
    // +      input by: Aman Gupta
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Onno Marsman
    // +   bugfixed by: Pellentesque Malesuada
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +      input by: Brett Zamir (http://brett-zamir.me)
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // *     example 1: base64_decode('S2V2aW4gdmFuIFpvbm5ldmVsZA==');
    // *     returns 1: 'Kevin van Zonneveld'
    // mozilla has this native
    // - but breaks in 2.0.0.12!
    //if (typeof this.window['atob'] == 'function') {
    //    return atob(data);
    //}
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
        ac = 0,
        dec = "",
        tmp_arr = [];

    if (!data) {
        return data;
    }

    data += '';

    do { // unpack four hexets into three octets using index points in b64
        h1 = b64.indexOf(data.charAt(i++));
        h2 = b64.indexOf(data.charAt(i++));
        h3 = b64.indexOf(data.charAt(i++));
        h4 = b64.indexOf(data.charAt(i++));

        bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

        o1 = bits >> 16 & 0xff;
        o2 = bits >> 8 & 0xff;
        o3 = bits & 0xff;

        if (h3 == 64) {
            tmp_arr[ac++] = String.fromCharCode(o1);
        } else if (h4 == 64) {
            tmp_arr[ac++] = String.fromCharCode(o1, o2);
        } else {
            tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
        }
    } while (i < data.length);

    dec = tmp_arr.join('');

    return dec;
}
// ------------------------------------------------------------------------------------------------- base64_encode
function base64_encode (data) {
    // Encodes string using MIME base64 algorithm
    // discuss at: http://phpjs.org/functions/base64_encode
    // +   original by: Tyler Akins (http://rumkin.com)
    // -   binary input: Martin Šmídek
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
        ac = 0,
        enc = "",
        tmp_arr = [];
    if (!data) {
        return data;
    }
//     data = this.utf8_encode(data + '');      //-MŠ
    do { // pack three octets into four hexets
        o1 = data.charCodeAt(i++);
        o2 = data.charCodeAt(i++);
        o3 = data.charCodeAt(i++);
        bits = o1 << 16 | o2 << 8 | o3;
        h1 = bits >> 18 & 0x3f;
        h2 = bits >> 12 & 0x3f;
        h3 = bits >> 6 & 0x3f;
        h4 = bits & 0x3f;
        // use hexets to index into b64, and append result to encoded string
        tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
    } while (i < data.length);
    enc = tmp_arr.join('');
    var r = data.length % 3;
    return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
}
// ================================================================================================= Resample
function dataURItoBlob(dataURI) {
  // convert base64 to raw binary data held in a string
  // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
  var byteString = atob(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

  // write the bytes of the string to an ArrayBuffer
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
  }

  // write the ArrayBuffer to a blob, and you're done
  var bb = new BlobBuilder();
  bb.append(ab);
  return bb.getBlob(mimeString);
}
var Resample =
Ezer.browser=='IE' ? null :
(function (canvas) {
 // (C) WebReflection Mit Style License
 // Resample function, accepts an image as url, base64 string, or Image/HTMLImgElement
 // optional width or height, and a callback to invoke on operation complete
 function Resample(img, width, height, onresample) {
  var
   // check the image type
   load = typeof img == "string",
   // Image pointer
   i = load || img
  ;
  // if string, a new Image is needed
  if (load) {
   i = new Image;
   // with propers callbacks
   i.onload = onload;
   i.onerror = xonerror;
  }
  // easy/cheap way to store info
  i._onresample = onresample;
  i._width = width;
  i._height = height;
  // if string, we trust the onload event otherwise we call onload directly
  // with the image as callback context
  load ? (i.src = img) : onload.call(img);
 }
 // just in case something goes wrong
 function xonerror() {
  throw ("not found: " + this.src);
 }
 // called when the Image is ready

//   if ( !$maxWidth ) $maxWidth= $origWidth;
//     if ( !$maxHeight ) $maxHeight= $origHeight;
//     // nyni vypocitam pomer změny
//     $pw= $maxWidth / $origWidth;
//     $ph= $maxHeight / $origHeight;
//     $p= min($pw, $ph);
//     // vypocitame vysku a sirku změněného obrazku - vrátíme ji do výstupních parametrů
//     $newWidth = (int)($origWidth * $p);
//     $newHeight = (int)($origHeight * $p);
//     $width= $newWidth;
//     $height= $newHeight;


 function onload() {
  var img= this,                               // minifier friendly
    max_width= img._width || img.width,        // maximální povolená šířka
    max_height= img._height || img.height,     // maximální povolená výška
    onresample= img._onresample,               // the callback
    pw= max_width / img.width,
    ph= max_height / img.height,
    p= Math.min(pw,ph);                         // poměr změny
    // vypocitame vysku a sirku změněného obrazku - vrátíme ji do výstupních parametrů
  width = round(img.width * p);
  height = round(img.height * p);
  // remove (hopefully) stored info
  delete img._onresample;
  delete img._width;
  delete img._height;
  // when we reassign a canvas size this clears automatically the size should be exactly the same
  // of the final image so that toDataURL ctx method will return the whole canvas as png
  // without empty spaces or lines
  canvas.width= width;
  canvas.height= height;
  // drawImage has different overloads in this case we need the following one ...
  context.drawImage(
   img,         // original image
   0,           // starting x point
   0,           // starting y point
   img.width,   // image width
   img.height,  // image height
   0,           // destination x point
   0,           // destination y point
   width,       // destination width
   height       // destination height
  );
  // retrieve the canvas content as base4 encoded PNG image and pass the result to the callback
  onresample(canvas.toDataURL("image/jpeg"));
 }
 var context = canvas.getContext("2d"), // point one, use every time ...
  round = Math.round                    // local scope shortcut
 ;
 return Resample;
}(
 // lucky us we don't even need to append and render anything on the screen
 // let's keep this DOM node in RAM for all resizes we want
 this.document.createElement("canvas"))
);
// ========================================================================================= pomocné
// --------------------------------------------------------------------------------- remap_fields_db
function remap_fields_db (block,new_db) {
  for (var ic in block.part) {
    field= block.part[ic];
    if ( field.table ) {
      field.table.options.db= new_db;
    }
  }
  return 1;
}
