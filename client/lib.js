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
    x= "<table border='1' bgcolor='#ddeeff'><tr><td valign='top' class='title'>"+label+"</td></tr><tr><td>"+x+"</td></tr></table>";
  }
  return x;
}
function debugx (gt,label,depth) {
  var x= gt, g, t, c, maxlen= 32;
  if ( depth < 0 ) return "<table class='dbg_over'><tr><td>...</td></tr></table>";
  if ( $type(gt)=='array' || $type(gt)=='object' ) {
    c= $type(gt)=='array' ? '#ddeeff' : '#eeeeaa';
    x= "<table border='1' bgcolor='"+c+"'>";
    x+= label ? "<tr><td valign='top' colspan='2' class='title'>"+label+"</td></tr>" : '';
    for (g in gt) {
      if ( g=='$family' ) continue;     // vynechání příznaku typu v Mootools
      if ( --maxlen < 0 ) return x+"<tr><td>...</td></tr></table>";
      t= gt[g];
      if ( typeof(t)!='function' )
        x+= "<tr><td valign='top' color='label'>"+g+"</td><td>"+debugx(t,null,depth-1)+"</td></tr>";
    }
    x+= "</table>";
  }
  else if ( $type(gt)=='string' ) {
    x= "'"+x+"'";
  }
  return x;
}
// ================================================================================================= ContextMenu
//  Class:ContextMenu, Author:David Walsh, Website:http://davidwalsh.name, Version:1.0, Date:1/20/2009
var ContextMenus = [];
var ContextMenu = new Class({
  // implements
  Implements: [Options,Events],
  shown: false,
  // options
  options: {
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
    focus_css: 'ContextFocus',
    event: null                                // show imediately when started by event
  },
  // initialization
  initialize: function(options) {
    this.setOptions(options);                                   // set options
    this.clear();
    this.menu = $(this.options.menu);                           // option diffs menu
    this.target = $(this.options.target);
//     this.fx = new Fx.Tween(this.menu, { property: 'opacity', duration:this.options.fadeSpeed });
    this.hide().startListener();                                // hide and begin the listener
    this.menu.setStyles({position:'absolute',/*top:'-900000px',*/display:'none'});
    if ( this.options.event ) {
      this.start(this.options.event);                           // show the menu now
    }
    ContextMenus.push(this);
  },
  // get things started
  startListener: function() {
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
          'z-index': '2000'
        });
        this.show();                                            //show the menu
      }
    }.bind(this));
    // menu items
    // this.menu.getElements('a').each(function(item) {
    //   item.addEvent('click',function(e) {
    //     if(!item.hasClass('disabled')) {
    //       this.execute(item.get('href').split('#')[1],$(this.options.element));
    //       this.fireEvent('click',[item,e]);
    //     }
    //   }.bind(this));
    // },this);
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
    if ( e && e.pageX ) {
      this.menu.setStyles({                                   // position the menu
        top: (e.pageY + this.options.offsets.y),
        left: (e.pageX + this.options.offsets.x),
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
    $each(ContextMenus,function(menu) {
      if ( menu!=this && menu.shown )
        menu.hide()
    }.bind(this));
  },
  // show menu
  show: function() {
    this.clear();
//     this.fx.start(1);
//     this.fireEvent('show');
    this.menu.setStyle('display','block');
    this.shown= true;
    if ( this.options.focus_css ) this.target.addClass(this.options.focus_css);
    return this;
  },
  // hide the menu
  hide: function() {
    if(this.shown) {
//       this.fx.start(0);
//       this.fireEvent('hide');
      this.menu.setStyle('display','none');
      this.shown= false;
      if ( this.options.focus_css ) this.target.removeClass(this.options.focus_css);
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
var Resample = (function (canvas) {
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