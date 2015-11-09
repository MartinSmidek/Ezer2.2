<?php # (c) 2008 Martin Smidek <martin@smidek.eu>

// ============================================================================================> PHP
  // nastavení zobrazení PHP-chyb klientem při &err=1
  if ( isset($_GET['err']) && $_GET['err'] ) {
    error_reporting(E_ALL ^ E_NOTICE);
    ini_set('display_errors', 'On');
  }

  // parametry aplikace DBG
  $app=      'dbg';
  $app_name= 'Debugger pro framework Ezer';
  $skin=     'default';

  $src= $_GET['src'];
  $src_ezer= "$src.ezer";
  $url= "../$src_ezer";

  $html= $notes= "";
  $lns= file($url,FILE_IGNORE_NEW_LINES);
  foreach($lns as $i=>$ln) {
    $lnx= htmlentities($ln);
    $i1= $i+1;
    $iii= str_pad($i1,4,' ',STR_PAD_LEFT);
    $html.= "\n<li id='$i1'><span class='line'>$iii</span><span class='text'>$lnx</span></li>";
    // detekce dokumentace
    $note= strpos($ln,'==>');
    if ( $note ) {
      $notes.= "\n<li id='N_$i1'>".substr($ln,$note+3)."</li>";
    }
  }
  $html= html_closure($src,$notes,$html);
  echo $html;
// ------------------------------------------------------------------------------------ html_closure
function html_closure($win_name,$notes,$source) {
  $html= <<<__EOD
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en" dir="ltr">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=9" />
    <link rel="shortcut icon" href="./ezer2.2/client/img/dbg.ico" />
    <title>$win_name</title>
    <script src="client/licensed/clientcide.js" type="text/javascript" charset="utf-8"></script>
    <script type="text/javascript">
      Ezer= {fce:{},obj:{}};
    </script>
    <script src="client/lib.js" type="text/javascript" charset="utf-8"></script>
    <script type="text/javascript">
// =====================================================================================> JAVASCRIPT
  var log;
  var open= false;
  window.addEvent('load', function() {
    log= $('log');
    $('body').addEvents({
      'click': function() { log.setStyles({display:'none'}); }
    });
  });
// ----------------------------------------------------------------------------------- dbg_show_text
  function dbg_show_text(ln) {
    // odstraň src
    var ul= $('src').getElement('ul');
    ul.empty();
    var notes= $('notes');
    notes.empty();
    // vytvoř text
    for (i= 0; i<ln.length; i++) {
      var i1= i+1;
      ul.adopt(
        new Element('li',{id:i1}).adopt(
          new Element('span',{text:i1,'class':'line'}),
          new Element('span',{text:ln[i],'class':'text'})
      ));
      // detekce dokumentace
      var note= ln[i].indexOf('==>');
      if ( note!=-1 ) {
        notes.adopt(new Element('li',{text:ln[i].substr(note+3),id:'N_'+i1}));
      }
    }
  }
// ------------------------------------------------------------------------------------- contextmenu
  Ezer.obj.contextmenu= {DOM:null,menu:null};
  Ezer.fce.contextmenu= function (menu,event,id,up) {
    event= event||window.event;
    if ( Ezer.obj.contextmenu.DOM ) {
      Ezer.obj.contextmenu.DOM.getChildren().destroy();
    }
    else {
      Ezer.obj.contextmenu.DOM= new Element('ul',{'class':'ContextMenu'}).inject($('body'));
    }
    if ( id )
      Ezer.obj.contextmenu.DOM.set('id',id);
    menu.each(function(item) {
      if ( item ) {
        var a, title= item[0], fce= item[1];
        new Element('li').adopt(
          a= new Element('a',{html:title[0]=='-' ? title.substr(1) : title})
        ).inject(Ezer.obj.contextmenu.DOM);
        if ( title[0]=='-' ) {
          a.setStyles({borderTop:"1px solid #AAAAAA"});
        }
        a.addEvents({
          click: function(el) {
            fce(event.originalTarget||event.target);
            Ezer.obj.contextmenu.menu.hide();
            return false;
          }
        })
      }
    });
    if ( Ezer.obj.contextmenu.menu ) {
      Ezer.obj.contextmenu.menu.reinitialize({event:event,target:event.originalTarget||event.target,
        menu:Ezer.obj.contextmenu.DOM,own_listener:true,up:up});
    }
    else {
      Ezer.obj.contextmenu.menu=
        new ContextMenu({event:event,target:event.originalTarget||event.target,
          menu:Ezer.obj.contextmenu.DOM,own_listener:true,up:up});
    }
    return 1;
  }
// ------------------------------------------------------------------------------------- dbg_context
  function dbg_context(el) {
    var li= el.getParent();
    var ul= li.getParent();
    var x= {chs:ul.getChildren(), ln:0};
    for (var i=0; i<x.chs.length; i++) {
      if ( x.chs[i]==li ) {
        x.ln= i+1;
        break;
      }
    }
    return x;
  }
// --------------------------------------------------------------------------------------- dbg_touch
  function dbg_touch(value,el) {
    log.setStyles({display:'block',top:el.page.y,left:el.page.x});
    log.set('html',value);
  }
// ------------------------------------------------------------------------------- dbg_onclick_start
  function dbg_onclick_start(win) {
    win= win ? win : window;
    // reakce na click na poznámku
    var dbg_not= win.document.getElementById('notes');
    dbg_not.addEvents({
      // ----------------------------------- click na poznámku
      click: function(el) {
        var ln= el.target.id.substr(2);
        var line= win.document.getElementById(ln);
        line.scrollIntoViewIfNeeded();
        var pick= win.document.getElement('li.pick');
        if ( pick ) pick.removeClass('pick');
        line.addClass('pick');
      }
    });
    var dbg_src= win.document.getElementById('src'), found= null;
    dbg_src.addEvents({
      // ----------------------------------- kontextové menu pro zdrojový text
      contextmenu: function(menu_el) {
        var x= dbg_context(menu_el.target);
        if ( x.ln ) {
          Ezer.fce.contextmenu([
            ['zjisti hodnotu', function(el) {
                found= opener.dbg_onclick_line(x.ln,'dump');
                dbg_touch(found ? found.value : '?',menu_el)
                return false;
            }],
            ['-nastav trasování', function(el) {
                found= opener.dbg_onclick_line(x.ln,'trace+');
                if ( found ) {
                  dbg_touch('proc '+found.id,menu_el)
                  x.chs[x.ln-1].addClass('trace');
                }
                return false;
            }],
            ['zruš trasování', function(el) {
                found= opener.dbg_onclick_line(x.ln,'trace-');
                if ( found ) x.chs[x.ln-1].removeClass('trace');
                return false;
            }],
            ['-zastopuj proceduru', function(el) {
                found= opener.dbg_onclick_line(x.ln,'stop+');
                if ( found ) {
                  dbg_touch('proc '+found.id,menu_el)
                  x.chs[x.ln-1].addClass('break');
                }
                return false;
            }],
            ['uvolni proceduru', function(el) {
                found= opener.dbg_onclick_line(x.ln,'stop-');
                if ( found ) x.chs[x.ln-1].removeClass('break');
                return false;
//             }],
//             ['-oprav text', function(el) {
//                 if ( !open ) {
//                   for (var i=0; i<x.chs.length; i++) {
//                     var text= x.chs[i].getElement('span.text');
//                     text.contentEditable= true;
//                   }
//                   open= true;
//                   $('src').focus();
//                 }
//                 return false;
//             }],
//             ['ulož text', function(el) {
//                 if ( open ) {
//                   var ln= [], iln= 0;
//                   for (var i=0; i<x.chs.length; i++) {
//                     var text= x.chs[i].getElement('span.text');
//                     text.contentEditable= false;
//                     var tt= text.textContent.split("\\n");
//                     for (t of tt) {
//                       ln[iln++]= t;
//                     }
//                   }
//                   open= false;
//                   dbg_show_text(ln);
//                 }
//                 return false;
            }]
          ],arguments[0]);
        }
        return false;
      },
      // ----------------------------------- dvojclick na zdrojový text
      dblclick: function(el) {
        var x= dbg_context(el.target), sel= window.getSelection(), range= sel.getRangeAt(0);
        var text= range ? range.startContainer.data.substring(range.startOffset,range.endOffset) : '';
        if ( text ) {
          var url= "./help.php?item="+text;
          var help= window.document.open(url,'help','width=400,height=400,resizable=1,titlebar=0,menubar=0');
        }
      },
      // ---------------------------- klávesnice při opravě zdrojového textu
      keydown: function(event) {
        switch (event.key) {
        case 'backspace':   // zrušit hledací vzory
          var char= window.getSelection().getRangeAt(0).startOffset;
          if ( char==0 ) {
            var text= event.target.innerText;
            var li= event.target.getParent();
            if ( li ) {
              var li2= li.previousElementSibling;
              var span= li2.getElement('span.text');
              var end= span.innerText.length;
              span.innerText+= text;
              li.destroy();
              placeCaretAt(span,end);
            }
            event.stop();
          }
          break;
        }
        return true;
      }
    })
  };
  function placeCaretAt(node,caret) {
    node.focus();
    var textNode= node.firstChild;
    var range= document.createRange();
    range.setStart(textNode, caret);
    range.setEnd(textNode, caret);
    var sel= window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
// =========================================================================================> STYLES
    </script>
    <style>
      body {
        font-size: 8pt; font-family: monospace,consolas; overflow: hidden; }
      ul#notes {
        padding: 0; margin-top: 5px;
        left: 0; width: 120px; position: absolute;}
      #notes li {
        cursor: alias; }
      div#src {
        padding: 0; margin-top: 5px; overflow: scroll; height: 100%;
        left: 120px; right: 0px; position: absolute;}
      #src ul {
        padding: 0; margin-top: 5px; }
      li {
        white-space: pre; list-style-type: none; text-overflow: ellipsis; overflow: hidden; }
      li span.line {
        position: absolute;
        background-color: silver; vertical-align: top; padding-right: 5px; margin-right: 5px;
        width: 24px; text-align: right;  }
      li span.text {
        margin-left:40px; display: block; }
      li span.text[contenteditable=true] {
        word-wrap: inherit; }
      li.break span {
        background-color: darkred;
        color: yellow; }
      li.trace {
        background-color: silver; }
      li.curr {
        background-color: orange; }
      li.pick {
        background-color: yellow; }
      #source {
        position: fixed; right: 10px; top: 2px; font-size: 16px; color: lightgray;}
      /* ----------------------- debug */
      #log {
        position:absolute; display: none; background-color:#eee; box-shadow:5px 5px 10px #567;
        padding: 5px; }
      .dbg {
        margin:0; overflow-y:auto; font-size:8pt; line-height:13px; }
      table.dbg {
        border-collapse:collapse; margin:1px 0;}
      .dbg td {
        border:1px solid #aaa; font:x-small Arial;color:#777;padding:1px 3px; line-height:11px; }
      .dbg td.title {
        color:#000; background-color:#aaa; }
      .dbg td.label {
        color:#a33;}
      .dbg table.dbg_array {
        background-color:#ddeeff; }
      .dbg table.dbg_object {
        background-color:#ffffaa; }
      /* ----------------------- context menu */
      .ContextMenu   {
        border:1px solid #ccc; padding:2px; background:#fff; width:200px; list-style-type:none;
        display:none; position:static; box-shadow:5px 5px 10px #567; cursor:default; }
      .ContextMenu .separator   {
        border-top:1px solid #999; }
      .ContextMenu li   {
        margin:0; padding:0; }
      .ContextMenu li a {
        display:block; padding:2px 2px 0px 25px; width:173px; text-decoration:none; color:#000; }
      .ContextMenu li a:hover   {
        background-color:#b2b4bf; }
      .ContextMenu li a.disabled {
        color:#ccc; font-style:italic; }
      .ContextMenu li a.disabled:hover {
        background-color:#eee; }
      .ContextFocus {
        background-color:#ffa !important; }
    </style>
  </head>
  <body id='body' onload="dbg_onclick_start()" style="background-color:oldlace;">
    <div id="source">$win_name</div>
    <ul id='notes'>$notes</ul>
    <div id='src'>
      <ul>$source</ul>
    </div>
    <span id='log'></span>
  </body>
</html>
__EOD;
  return $html;
}

?>

