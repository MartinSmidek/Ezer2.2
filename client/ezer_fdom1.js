// doplnění tříd Ezer o jejich zobrazení v DOM architektuře
// jména začínající podtržítkem jsou lokální pro DOM-doplnění, nesmí se používat v ezer.js
// ΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞ app.js
// layout aplikace a jeho ovládání - Ezer.Shield ukrývá obsah pod PanelPopup
Ezer.is_trace= {};                              // zapínání typů trasování
Ezer.is_dump= {};                               // zapínání typů výpisů
Ezer.Application= new Class({
  // ----------------------------------------------------------------------------------------------- DOM...
  domApp: null,    // aplikace
  domTitle: null,  // název aplikace
  domTFoot: null,  // patička
  domParent: null,
  domLogin: null,
  mooWarn: null,   // warning
  dialog: null,
  theight:Ezer.options.theight,   // výška trasovací oblasti
  resize:null,     // mootools objekt ovládající resize trasovací oblasti (attach, detach)
  full_screen:false,
  // ----------------------------------------------------------------------------- DOM_add
  DOM_add: function () {
    this.domParent= $('appl');
    this.domMenu= $('menu');
    this.domFoot= $('status_center');
    this.domUser= $('status_left');
    this.domUser.addEvent('click',this.bar_click.bind(this));
    this.domAjax= $('ajax_bar');
    this.mooWarn= new Fx.Slide('warning');
    this.mooWarn.element.addEvent('click',function(){Ezer.App.mooWarn.slideOut()});
//     if ( this.options.to_trace )
//       this._setTrace();

    window.addEvent('resize',function(e){
      this.DOM_layout();
    }.bind(this));

    // úprava výšky trasovací oblasti
//     if ( this.options.show_trace )
//       $('dolni').setStyle('height',this.theight);
      $('dolni').setStyle('height',0);
    this.DOM_layout();
    // V template stránky musí být div-element s id='drag' pro design-subsystém
    if ( $('drag') ) Ezer.drag.init($('drag'));
    this.bar_clock();
  },
  // ----------------------------------------------------------------------------- DOM_layout
  // pokud inner==true (asi jen pro Android) ...
  DOM_layout_mode: Ezer.platform=='A' ? 'inner' : 'outer',     // metoda získávání rozměrů
  DOM_layout: function() {
    // projití aplikace root-tabs-panel a provedení onresize u neaktivovaných panelů
    function downto_panels(block) {
      if ( block.part ) {
        for (var name in block.part) {
          var x= block.part[name];
          if ( x.part && (x instanceof Ezer.PanelPlain || x instanceof Ezer.PanelRight) ) {
            if ( x.part.onresize )
              x.callProc('onresize',[ws.x,ws.y]);
          }
          else if ( x instanceof Ezer.Tabs || x instanceof Ezer.MenuMain ) {
            downto_panels(x);
          }
        }
      }
    }
    // změna šířky změní width ve stylu PanelRight
    const pruh= 30;
    const leftMenuWidth= 210;
    var ws= this.DOM_layout_mode=='inner'
      ? {x:window.innerWidth,y:window.innerHeight} : window.getSize();
    $$('.PanelRight').each(function(dom_panel){
      var panel= dom_panel.retrieve('Ezer');
      var menu_left= panel.menuleft;
      if ( panel._folded ) {
        dom_panel.setStyles({width:ws.x-pruh,left:pruh});
        menu_left.DOM_Block.setStyle('width',pruh);
      }
      else {
        dom_panel.setStyles({width:ws.x-leftMenuWidth,left:leftMenuWidth});
        if ( menu_left ) {
          menu_left.DOM_Block.setStyle('width',leftMenuWidth);
        }
      }
    });
    // změna výšky definuje velikost pracovní plochy
    Ezer.Shield.top= $('work').getCoordinates().top;
    if ( this.DOM_layout_mode=='inner' ) {
      var hh= $('horni').getStyle('height').toInt(),
          hs= $('status_bar').getStyle('height').toInt(),
          hd= $('dolni').getStyle('height').toInt();
      var hw= ws.y - hh - hs - hd;
      $('work').setStyles({height:hw});
      // další 2 řádky nastavují korektně velikost, ale nelze použít (upravené) makeResizable
      $('paticka').setStyles({bottom:hd});
      $('dolni').setStyles({top:hh+hw+hs-4,bottom:'initial'});
      ws.y= hh+hw;
    }
    else {
      var t= $('dolni').getCoordinates().top;
      var h= t - $('work').getCoordinates().top - 15;
      $('work').setStyle('height',h);
      $('paticka').setStyle('bottom',ws.y-t+pruh);
      ws.y= t;
    }
    // definice sys.screen width a height
    Ezer.sys.screen= {width:ws.x,height:ws.y};
    // reakce na změnu
//     if ( Ezer.run && Ezer.run.$ )
//       downto_panels(Ezer.run.$);
    if ( Ezer.panel && Ezer.panel.part && Ezer.panel.part.onresize ) {
      Ezer.panel.callProc('onresize',[ws.x,ws.y]);
    }
  },
  // ----------------------------------------------------------------------------- DOM_destroy
  DOM_destroy: function() {
  },
  // ----------------------------------------------------------------------------- clearDom
  clearDom: function () {
    this.domFoot.setProperty('text','');
    this._ajax(0);
  },
  // ----------------------------------------------------------------------------- loginDomOpen
  loginDomOpen: function(after,uname,pword) {
    $('login').setStyle('display','block');
    if ( uname ) $('username').value= uname;
    if ( pword ) $('password').value= pword;
    // odmítnutí přihlásit se
    if ( $('login_no') && Ezer.options.web!=undefined ) {
      $('login_no').addEvent('click',function(){
        document.location.href= Ezer.options.web;
      });
    }
    // přihlášení
    if ( $('login_on') ) {
      var bw= {body:$('body').getSize(),screen:{x:screen.width,y:screen.height}};
      $('login_on').addEvent('click',function(){
        Ezer.sys.pword= $('password').value;
        this.ask({cmd:'user_login',uname:$('username').value,pword:Ezer.sys.pword,size:bw},after)
      }.bind(this));
      this.loginDomMsg(Cookie.read(Ezer.root+'_logoff')||'');
      $('username').focus();
    }
  },
  // ----------------------------------------------------------------------------- loginDomMsg
  loginDomMsg: function (msg) {
    $('login').setStyle('display','block');
    $('login_msg').set('text',msg);
  },
  // ----------------------------------------------------------------------------- loginDomKey
  // nastaví pro prohlížeč s file_api <span id='watch_key'> - viz fce ae_slib.php:root_php citlivou
  // pro příjem souboru s klíčem
  loginDomKeyObj: {},
  loginDomKey: function () {
    // Setup the dnd listeners.
    var dropZone= document.getElementById('watch_key');
    if ( window.File && dropZone ) {
      dropZone.addEvents({
        dragover: function(evt) {
          evt.stopPropagation();
          evt.preventDefault();
          evt.target.addClass('drop_area');
        },
        dragleave: function(evt) {
          evt.stopPropagation();
          evt.preventDefault();
          evt.target.removeClass('drop_area');
        }
      });
      ['stred','login'].each(function(id){
        var body= $(id);
        if ( body ) {
          body.addEventListener('drop', function(evt) {
            evt.preventDefault();
          }, true);
          body.addEventListener('dragover', function(evt) {
            evt.preventDefault();
          }, true);
          body.addEventListener('dragleave', function(evt) {
            evt.preventDefault();
          }, true);
        }
      });
      dropZone.addEventListener('drop', function(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        var text= '';
        var files= evt.dataTransfer.files; // FileList object.
        if ( files[0] ) {
          var r= new FileReader();
          r.onload= function(e) {
            text+= e.target.result
            var w= $('watch_try');
            w.value= text;
            dropZone.action= dropZone.baseURI;     // aby se neztratily GET parametry
            dropZone.submit();
          }
          r.readAsText(files[0]);
        }
      },false);
    }
  },
  // ----------------------------------------------------------------------------- loginDomClose
  loginDomClose: function () {
    var login= $('login');
    if ( login ) login.setStyle('display','none');
  },
  // ----------------------------------------------------------------------------- bodyClick
  // nastane při kliknutí na html.body
  bodyClick: function() {
    this._help(false);
    return false;
  },
  // ----------------------------------------------------------------------------- _mini_debug
  // ikona má název *logo.gif kde * je '+' nebo '-'
  _mini_debug_virgin: true,
  _mini_debug: function (on) {
    var timer;
    this.domIcon_idle= $('StatusIcon_idle');
    this.domIcon_server= $('StatusIcon_server');
    this.idle= true;                            // není běžící požadavek na server
    // kontextový help
    if ( $('_help') && this._mini_debug_virgin ) {
      $('_help').addEvents({
        // vyvolání kontextového helpu
        click: function(e) {
          this._help(true);
        }.bind(this),
      });
    }
    // kontextové menu loga pro ladění
    this.logo= $('logo');
    if ( this.logo ) {
      if ( on && Ezer.sys.user.skills && Ezer.sys.user.skills.contains('m',' ') ) {
        this.logo.addEvents({
          // kontextové menu pro ladění aplikace pro vývojáře
          contextmenu: function(e) {
            Ezer.fce.contextmenu([
              ['recompile',             function(el) { Ezer.app.reload() }],
              ['-drag',                 function(el) { Ezer.run.$.dragBlock(true,false) }],
              ['save',                  function(el) { Ezer.App.save_drag() }],
              ['-help mode start',      function(el) { Ezer.run.$.helpBlock(1) }],
              ['help mode end',         function(el) { Ezer.run.$.helpBlock(0) }],
              ['-relogin',              function(el) {
                Cookie.dispose('PHPSESSID',{path: '/'});
                alert('Obnovte prosím svoje přihlášení do systému...');
                window.location.href= window.location.href;}],
              ['-stop',                 function(el) { Ezer.dbg.stop=true }],
              ['continue',              function(el) { Ezer.dbg.stop=false }]
            ],arguments[0]);
            return false;
          }.bind(this)
        });
      }
    }
    // kontextové menu pro Android a iPad
    function actual_dim() {
      return ""
        + " window.outerWidth="+window.outerWidth
        + " window.innerWidth="+window.innerWidth + "<br>"
        + " window.outerHeight="+window.outerHeight
        + " window.innerHeight="+window.innerHeight + "<br>"
        + " HTTP_USER_AGENT="+Ezer.ua + "<br>"
        + " Browser.Platform.android="+Browser.Platform.android + "<br>"
        + " Browser.Platform.ipad="+Browser.Platform.ipad + "<br>"
        + " Ezer.platform="+Ezer.platform
        + " Ezer.browser="+Ezer.browser
      ;
    }
    function toggle_full_screen() {
      if ( document.documentElement.webkitRequestFullscreen ) {
//       if ( document.fullscreenEnabled  ) {
        this.full_screen= !this.full_screen;
        if ( this.full_screen )
//           document.documentElement.requestFullscreen();
          document.documentElement.webkitRequestFullscreen();
        else
//           document.exitFullscreen();
          document.webkitExitFullscreen();
      }
    }
    this.android_menu= $('android_menu');
    if ( this.android_menu ) {
      this.android_menu.addEvents({
        click: function(e) {
          Ezer.fce.contextmenu(
          Ezer.platform=='I'    // iPad
          ?[
            [ "<i class='fa fa-eye'></i>&nbsp;&nbsp;&nbsp;rozměry?",
              function(el) { Ezer.fce.alert(actual_dim()) }],
            [ "<i class='fa fa-ban'></i>&nbsp;&nbsp;&nbsp;vyčistit",
              function(el) { Ezer.fce.clear() }]
          ]
          :[                    // Android
            [ "<i class='fa fa-eye'></i>&nbsp;&nbsp;&nbsp;rozměry?",
              function(el) { Ezer.fce.alert(actual_dim()) }],
            [ "-<i class='fa fa-arrows-alt'></i>&nbsp;&nbsp;&nbsp;celá obrazovka",
              function(el) { toggle_full_screen(); }],
            [ "<i class='fa fa-compress'></i>&nbsp;&nbsp;&nbsp;přizpůsobit",
              function(el) { Ezer.App.DOM_layout_mode= 'inner'; Ezer.App.DOM_layout() }],
            [ "<i class='fa fa-expand'></i>&nbsp;&nbsp;&nbsp;maximalizovat",
              function(el) { Ezer.App.DOM_layout_mode= 'outer'; Ezer.App.DOM_layout() }],
            [ "-<i class='fa fa-ban'></i>&nbsp;&nbsp;&nbsp;vyčistit",
              function(el) { Ezer.fce.clear() }],
            [ "-<i class='fa fa-repeat'></i>&nbsp;&nbsp;&nbsp;reload",
              function(el) { location.reload() }]
          ],arguments[0],'android_menu_ul');
          Ezer.obj.contextmenu.DOM.setStyles({
            position:'fixed',left:'initial',right:4,top:16,
            fontSize:15,textIndent:-5,lineHeight:25});
          return false;
        }.bind(this)
      });
    }
    this._mini_debug_virgin= false;
  },
  // ----------------------------------------------------------------------------- putFootDom
  // patička
  putFootDom: function(x) {
//     this.domFoot.appendText(x);
    this.domFoot.set('text',x?x:'');
  },
  // ----------------------------------------------------------------------------- _state
  // vrátí řetězec charakterizující stav výpočtu
  // 0   =  +|-
  // 1.. = trasování
  _state: function() {
    return (Ezer.app.options.to_trace?'+':'-')+(Ezer.to_trace?'+':'-')+Ezer.app.options.ae_trace;
  },
  // ----------------------------------------------------------------------------- _resetTrace
  // smaže ovládání trasování
  _resetTrace: function() {
    this._barRightDom.getChildren().destroy();
  },
  // ----------------------------------------------------------------------------- _setTrace
  // vytvoření ovládání trasování, hlášení chyb, FAQ
  _setTrace: function() {
    var touch_now= 0;
    // menu pro debug!
    function __menu() {
      menu= [
        ['run (ctrl-Enter)',              function(el) { __run() }],
        ['clear & run (shift-ctrl-Enter)',function(el) { Ezer.fce.clear(); __run() }],
        ['-výběr kontextu myší',          function(el) {
          __clear();
          Ezer.help.dbg= true;
          Ezer.run.$.helpBlock(1)
        }],
        ['kontextem je běžný panel',      function(el) { __clear() }],
        ["-trace: session",    function(el) { __run("ask('test_session')") }],
        ["trace: sys",         function(el) { __run("echo(debug(sys))") }],
        ["trace: database",    function(el) { __run("echo(debug(ask('sql_query','SELECT DATABASE() AS selected FROM DUAL')))") }]];
      if ( Ezer.options.curr_version!=undefined ) {
        menu.push(
        // v případě hlídání verzí
        ["-alert:  verze",    function(el) { Ezer.app.bar_chat({op:'message?'},true) }],
        ["test verze",    function(el) { Ezer.app.bar_chat({op:'message?'}) }]
        )
      };
      if ( true ) {
        menu.push(
        // spuštění panel meta z ezer2.help.ezer - zobrazí výsledek Ezer.fce.meta_tree (area.js)
        ['-popup: struktura aplikace',   function(el) {
          var elem= Ezer.run.$.part[Ezer.root];
          if ( elem && elem.part && elem.part[Ezer.root] ) elem= elem.part[Ezer.root];
          if ( elem && elem.part && elem.part.doc ) elem= elem.part.doc;
          if ( elem && elem.part && elem.part.meta ) elem= elem.part.meta;
          if ( elem && elem instanceof Ezer.Panel ) {
            elem.popup();
          }
          else {
            Ezer.fce.alert("pro zobrazení musí být přístupný modul ezer2.help.ezer s cestou $.<i>root</i>.doc Je-li include:onclick, stačí kliknout na Nápověda");
          }
        }]);
      }
      Ezer.fce.contextmenu(menu,arguments[0],0,1);
    }
    // provedení skriptu
    function __run(script) {
      if ( script ) {
        // skript je dán parametrem
        Ezer.run.$.runScript(script);
      }
      else {
        // skript je v okně debug
        if ( Ezer.help.block )
          Ezer.help.block.runScript($('dbg').value);
        else if ( Ezer.panel ) {
          Ezer.panel.runScript($('dbg').value);
        }
        else
          Ezer.run.$.runScript($('dbg').value);
      }
    }
    // odstranění nastaveného kontextu pro skript
    function __clear() {
      if ( Ezer.help.block ) {
        var dom= Ezer.help.dom(Ezer.help.block);
        if ( dom ) dom.removeClass('dbg_context');
        Ezer.help.block= null;
      }
    }
    this._barRightDom= $('status_right');
    this._bar= {};
    this._barRightDom.getChildren().destroy();
    // pokud je povolen ovladač trasování
    if ( this.options.to_trace ) {
      Ezer.to_trace= this.options.show_trace;
      this._barTrace= new Element('span', {text:'trace:','class':Ezer.to_trace?'ae_switch_on':'',
        title:'zapíná/vypíná trasování',
        events:{
          touchstart: function(event) { touch_now= Date.now(); },
          touchend: function(event) { if ( Date.now() - touch_now < 300 ) this.click(event); },
          click: function(event) {
            this._showTrace(1-Ezer.to_trace);
            this.send_status();
            this.DOM_layout();
          }.bind(this)
        }
      }).inject(this._barRightDom);
      this._barSwitch('U','echo,...');
      this._barSwitch('T','trasování na žádost');
      this._barSwitch('*','podle potřeby');
      this._barSwitch('u','display,debug, trace na serveru');
      this._barSwitch('M','MySQL');
      this._barSwitch('E','výpočty');
      this._barSwitch('e','události');
      this._barSwitch('f','funkce');
      this._barSwitch('m','metody');
      this._barSwitch('x','metody na serveru');
      this._barSwitch('X','x podrobně');
      this._barSwitch('a','funkce na serveru');
      this._barSwitch('L','zavádění programu');
      this._barSwitch('q','kód interpreta');
      this._barSwitch('Q','kód interpreta (jen s ift,iff,is)');
      this._barSwitch('C','trasování kompilátoru');
      if ( Ezer.options.dbg ) {
        // debug - zobrazení debuggeru - zachází se s ním jako s trasováním '$'
        Ezer.is_trace['$']= this.options.ae_trace.indexOf('$')>=0;
        var debug= new Element('span', {id:'dbg_switch', text:'debug!', title:'zobrazí debugger',
           'class':Ezer.is_trace['$']?'ae_switch_on':'', events:{
          touchstart: function(event) { touch_now= Date.now(); },
          touchend: function(event) { if (Date.now()-touch_now<300 ) this.click(event); else __menu(); },
          click: function(event) {
            if ( Ezer.to_trace ) {
              event.target.toggleClass('ae_switch_on');
              if ( this.options.ae_trace.indexOf('$')>=0 ) {
                this.options.ae_trace= this.options.ae_trace.replace('$','');
                Ezer.is_trace['$']= false;
              }
              else {
                this.options.ae_trace+= '$';
                Ezer.is_trace['$']= true;
              }
              $('form').setStyles({display:event.target.hasClass('ae_switch_on') ? 'block' : 'none'});
            }
          }.bind(this),
          contextmenu: function(e) {
            e.preventDefault();
            __menu(e);
            return false;
          }.bind(this)
        }}).inject(this._barRightDom);
        $('form').addEvents({
          keydown: function (event) {
            if (event.key=='enter' && event.control ) {
              if ( event.shift ) Ezer.fce.clear();
              __run();
            }
          }.bind(this),
        })
        $('body').addEvents({
          keydown: function(event){
            bodyKeydown(event)
          },
          click: function(event){
            bodyClick(event)
          }
        });
        $('form').setStyles({display:Ezer.to_trace && Ezer.is_trace['$'] ? 'block' : 'none'});
        bodyLoad('5.1');
//         // pro dotyková zařízení
//         if ( Ezer.platform=='A' || Ezer.platform=='I' ) {
//           var mc= new Hammer(debug);
//           // press vyvolá contextmenu
//           mc.on("press", function(e) {
//             //mc.stop();
//                                                     Ezer.debug(e,"Hammer: press");
//           }.bind(this));
//         }
      }
      // dump
      new Element('span', {text:'dump:',title:'vypíše proměnné zobrazeného panelu', events:{
        touchstart: function(event) { touch_now= Date.now(); },
        touchend: function(event) { if ( Date.now() - touch_now < 300 ) this.click(event); },
        click: function(event) {
          if ( Ezer.panel ) {
            Ezer.trace(null,Ezer.fce.debug(Ezer.panel.dump(this.options.ae_dump),
              "panel "+Ezer.panel.id));
          }
        }.bind(this)
      }}).inject(this._barRightDom);
      this._barDump('F','zobrazit Form');
      this._barDump('A','zobrazit Area');
      this._barDump('O','zobrazit strukturu objektů');
      // trail - uživatelská stopa
      new Element('span', {text:'trail:',title:'vypíše uživatelskou stopu', events:{
        touchstart: function(event) { touch_now= Date.now(); },
        touchend: function(event) { if ( Date.now() - touch_now < 300 ) this.click(event); },
        click: function(event) {
          Ezer.trace(null,Ezer.fce.trail('show'));
        }.bind(this)
      }}).inject(this._barRightDom);
      // obsluha okna s chybami a trasováním
      var kuk= $('kuk');
      kuk.addEvent('dblclick',this._clearTrace.bind(this));

      // pro dotyková zařízení
      if ( Ezer.platform=='A' || Ezer.platform=='I' ) {
        // We create a manager object, which is the same as Hammer(), but without the presetted recognizers.
        var mc = new Hammer.Manager(kuk);
        // Tap recognizer with minimal 2 taps
        mc.add( new Hammer.Tap({ event: 'doubletap', taps: 2 }) );
        // Single tap recognizer
        mc.add( new Hammer.Tap({ event: 'singletap' }) );
        // we want to recognize this simulatenous, so a quadrupletap will be detected even while a tap has been recognized.
        mc.get('doubletap').recognizeWith('singletap');
        // we only want to trigger a tap, when we don't have detected a doubletap
        mc.get('singletap').requireFailure('doubletap');
        mc.on("singletap doubletap", function(ev) {
          Ezer.App._clearTrace();
        });
      }
      $('status_bar').setStyles({cursor:Ezer.to_trace ? 'ns-resize' : 'default'});
      // ovládání výšky trasovacího panelu
      this.resize= $('dolni').makeResizable({handle:$('status_bar'),modifiers:{x:''},invert:true,
        onComplete: function(){
          this.DOM_layout();
        }.bind(this)
      });
      if ( !Ezer.to_trace )
        this.resize.detach();
      this._showTrace(Ezer.to_trace);
      // speed - pro všechny okno pro zobrazení měření výkonu - zachází se s ním jako s trasováním 'S'
      Ezer.is_trace['S']= this.options.ae_trace.indexOf('S')>=0;
      var speed= new Element('span', {text:'speed:','class':Ezer.is_trace['S']?'ae_switch_on':'',
          title:'zobrazí okno s měřením výkonu', events:{
        touchstart: function(event) { touch_now= Date.now(); },
        touchend: function(event) { if ( Date.now() - touch_now < 300 ) this.click(event); },
        click: function(event) {
          event.target.toggleClass('ae_switch_on');
          if ( this.options.ae_trace.indexOf('S')>=0 ) {
            this.options.ae_trace= this.options.ae_trace.replace('S','');
            Ezer.is_trace['S']= false;
          }
          else {
            this.options.ae_trace+= 'S';
            Ezer.is_trace['S']= true;
          }
          Ezer.obj.speed.span.setStyles({display:Ezer.is_trace['S'] ? 'block' : 'none'});
          Ezer.fce.speed('clear');
          Ezer.fce.speed('show');
          Ezer.obj.speed.msg= 'měření časové a datové náročnosti'; this._showSpeed();
        }.bind(this)
      }}).inject(this._barRightDom);
      Ezer.obj.speed.span= new Element('span', {text:Ezer.obj.speed.msg, 'class':'measures',
          styles:{display:Ezer.is_trace['S'] ? 'block' : 'none'},
          title:'SQL, PHP, Ezer udává čas v ms, NET je ms/KB, kliknutí vynuluje čitače', events:{
        touchstart: function(event) { touch_now= Date.now(); },
        touchend: function(event) { if ( Date.now() - touch_now < 300 ) this.click(event); },
        click: function(event) {
          Ezer.fce.speed('clear');
          Ezer.fce.speed('show');
          return false;
        }.bind(this)
      }}).inject(speed);
//     // HELP a FAQ
//     new Element('span', {text:'HELP!',title:'kontextový help formou FAQ', events:{
//       click: function(event) {
//         this._help(true);
//       }.bind(this)
//     }}).inject(this._barRightDom);
    }
    $('error').addEvent('dblclick',this._clearError.bind(this));
  },
  // ----------------------------------------------------------------------------- _help
  // ukázání kontextového helpu
  _help: function(on) {
    if ( on && Ezer.App.hits_block ) {
      var key= Ezer.App.hits_block.self_sys(1);
                                                Ezer.trace('*',"FAQ "+key.sys+'  '+key.title);
                                                Ezer.debug(key,'trace/key');
      Ezer.App.help_text(key);
    }
    else if ( !on && Ezer.obj.DOM.help.sticky ) {
      Ezer.obj.DOM.help.sticky.hide();
    }
  },
  // ----------------------------------------------------------------------------- _showSpeed
  // ukázání Speed
  _showSpeed: function() {
    if ( Ezer.obj.speed.span )
      Ezer.obj.speed.span.set('text',Ezer.obj.speed.msg);
  },
  // ----------------------------------------------------------------------------- _clearTrace
  // smazání Trace
  _clearTrace: function() {
    if ( $('kuk') ) $('kuk').getChildren().destroy();
    Ezer.trace.n= 0;
  },
  // ----------------------------------------------------------------------------- _clearError
  // smazání a skrytí Error, inicializace ServerBar
  _clearError: function() {
    if ( $('error') ) $('error').set('text','').setStyle('display','none');
    this._ajax_init();
  },
  // ----------------------------------------------------------------------------- _setTraceOnOff
  // ovládá zobrazení okna trasování - on=1 zapne, on=0 vypne
  _showTrace: function (on) {
    Ezer.to_trace= on ? 1 : 0;
    if ( this._barTrace ) {
      this._barTrace[on ? 'addClass':'removeClass']('ae_switch_on');
      if ( Ezer.to_trace ) {
        // povolí změnu výšky trasovací oblasti
        this.resize.attach();
        $('status_bar').setStyles({cursor:'ns-resize'});
        // ukáže trasovací oblast v zapamatované výšce
        $('dolni').setStyle('height',this.theight);
//       $('trace').setStyle('display','block');
//       $('form').setStyles({display:$('dbg_switch').hasClass('ae_switch_on') ? 'block' : 'none'});
      }
      else {
        // zakáže změnu výšky trasovací oblasti
        if ( this.resize ) this.resize.detach();
        $('status_bar').setStyles({cursor:'default'});
        // bude vidět jen status-bar
//       $('trace').setStyle('display','none');
//       this.theight= $('dolni').getStyle('height');
        $('dolni').setStyle('height',0);
//       $('kuk').setStyle('display','none');
//       $('form').setStyle('display','none');
      }
    }
  },
  // ----------------------------------------------------------------------------- _setTraceOnOff
  // nastaví trasování podle klíče id - on=true zapne, on=false vypne,
  // on=object znázorňuje selektivní trasování některých jmen
  _setTraceOnOff: function (id,on) {
    // uprav zobrazení
    $('status_right').getChildren('span').each(function(el) {
      if ( el.get('text')==id ) {
        if ( typeof(on)=='object' )
          el.addClass('ae_switch_sel');
        else {
          el.removeClass('ae_switch_sel');
          if ( on )
            el.addClass('ae_switch_on');
          else
            el.removeClass('ae_switch_on');
        }
        return;
      }
    });
    // uprav stav is_trace, ae_trace
    Ezer.is_trace[id]= on;
    if ( !on ) {
      this.options.ae_trace= this.options.ae_trace.replace(id,'');
    }
    else if ( this.options.ae_trace.indexOf(id)==-1 ) {
      this.options.ae_trace+= id;
    }
  },
  // ----------------------------------------------------------------------------- _barSwitch
  // přidání ovladače trasování k status_bar
  _barSwitch: function (id,title,dump) {
    var touch_now= 0;
    Ezer.is_trace[id]= this.options.ae_trace.indexOf(id)>=0;
    new Element('span', {text:id, 'class':Ezer.is_trace[id]?'ae_switch_on':'',
      title:title,
      events:{
        touchstart: function(event) { touch_now= Date.now(); },
        touchend: function(event) { if ( Date.now() - touch_now < 300 ) this.click(event); },
        click: function(event) {
          this._setTraceOnOff(id,!Ezer.is_trace[id]);
          this.send_status();
        }.bind(this)
      }
    }).inject(this._barRightDom);
  },
  // ----------------------------------------------------------------------------- _barDump
  // přidání ovladače trasování k status_bar
  _barDump: function (id,title) {
    var touch_now= 0;
    Ezer.is_dump[id]= this.options.ae_dump.indexOf(id)>=0;
    new Element('span', {text:id, 'class':Ezer.is_dump[id]?'ae_switch_on':'',
      title:title,
      events:{
        touchstart: function(event) { touch_now= Date.now(); },
        touchend: function(event) { if ( Date.now() - touch_now < 300 ) this.click(event); },
        click: function(event) {
          event.target.toggleClass('ae_switch_on');
          if ( this.options.ae_dump.indexOf(id)>=0 ) {
            this.options.ae_dump= this.options.ae_dump.replace(id,'');
            Ezer.is_dump[id]= false;
          }
          else {
            this.options.ae_dump+= id;
            Ezer.is_dump[id]= true;
          }
          this.send_status();
        }.bind(this)
      }
    }).inject(this._barRightDom);
  },
  // =============================================================================================== CLOCK & CHAT
  clock_tics: 0,              // minutky: počet tiků (minut) od minulé činnosti
  session_tics: 0,            // minutky: počet tiků (minut) od minulé obnovy SESSION
  hits: 0,                    // počet uživatelských interakcí (button, menu, ...)
  last_hits: 0,               // počet interakcí v minulé minutě
  waiting: false,             // je zobrazena výzva k prodloužení
//   hits_sent: false,           // Ezer.fce.touch: bylo posláno na server
  hits_block: null,           // Ezer.fce.touch: blok, kterému byly naposledy připsány hits
  // ----------------------------------------------------------------------------- bar_clock
  // základní hodiny aplikace volané po minutě
  //   zobrazování času v ae_bar.time
  //   odhlášení při nečinnosti
  bar_clock: function (quiet) {
    var wait= 5;              // minuty na zobrazení výzvy k prodloužení sezení přes nečinnost
    if ( Ezer.sys.user.id_user && !quiet ) {
      // pokud je někdo přihlášený, podíváme se na změny během uplynulé minuty
      this.clock_tics++;
      this.session_tics++;
//                                                   Ezer.trace('*','bar_clock: ticks='+this.clock_tics+', hits+='+(this.hits-this.last_hits));
      if ( this.hits != this.last_hits ) {
        // uživatel byl aktivní => reset minutek
        this.clock_tics= 1;
        this.last_hits= this.hits;
      }
      if ( this.waiting && this.clock_tics > Ezer.App.options.login_interval + wait ) {
        // je zobrazena výzva a čas vypršel, cookie zanikne zavřením browseru
        Cookie.write(Ezer.root+'_logoff',
          'odhlaseno '+ae_datum(1)+' po '+this.clock_tics+' min. necinosti',{duration:false});
//                                                   Ezer.trace('*','bar_clock: logout');
        Ezer.fce.touch('logout');       // jako po kliknutí na Tabs.logoff
        return;
      }
      else if ( this.session_tics > Ezer.App.options.session_interval  ) {
        // je čas obnovit SESSION
        this.session_tics= 1;
        this.bar_chat({op:'re_log_me'});
      }
      else if ( !this.waiting && this.clock_tics > Ezer.App.options.login_interval  ) {
        // čas uplynul a uživatel nic nedělal => zobrazení možnosti prodloužit sezení
       var wait_msg= "Delší dobu jste neprovedli žádnou činnost v rámci aplikace. "
                + "<br>Pokud si přejete v práci pokračovat, stiskněte tlačítko OK. "
                + "<br>Pokud tak neučiníte během následujících "+wait
                + " minut, budete z aplikace automaticky odhlášeni.";
        this.waiting= true;
        Ezer.fce.DOM.alert(wait_msg,Ezer.App.bar_clock_continue);
      }
      else {
        // uživatel neaktivní ale nepřekročen limit NEBO čekáme
        this.bar_chat({op:'message?'});
      }
      var hm= this.bar_clock_show(true);
      if ( hm.substr(-2)=='59' )
        this.bar_clock_hour();
    }
    else {
      this.bar_clock_show(false);
    }
    if ( !quiet )
      setTimeout("Ezer.App.bar_clock()",60*1000); // minutové kyvadlo
  },
  // ----------------------------------------------------------------------------- bar_clock_show
  // zobrazování času a stavu v ae_bar.time
  bar_clock_show: function (zbyva) {
    var org= Ezer.sys.user.org, access= Ezer.sys.user.access;
    if ( Ezer.options.watch_access_opt && Ezer.options.watch_access_opt.abbr ) {
      org= Ezer.options.watch_access_opt.abbr[org];
      access= Ezer.options.watch_access_opt.abbr[access];
    }
    var abbr= Ezer.sys.user
      ? "<span title='id="+Ezer.sys.user.id_user
        +', start='+Ezer.options.start_datetime
        +', data='+org+'/'+access
        +', funkce='+Ezer.sys.user.skills+"'>"
        +(Ezer.sys.user.abbr||'---')+(Ezer.sys.user.note||'')+'</span>'
      : '';
    var hm= ae_time();
    this.domUser.innerHTML= hm+' '+abbr;
    if ( zbyva ) {
      this.domUser.innerHTML+= " ... <span title='minut do odhlášení'>"
        +(Ezer.App.options.login_interval-this.clock_tics)+' min</span> ... &nbsp;';
    }
    return hm;
  },
  // ----------------------------------------------------------------------------- bar_clock_hour
  // akce na konci hodiny - zápis speed za hodinu do _TOUCH a vynulování hodinových čitačů
  bar_clock_hour: function () {
    if ( Ezer.sys.user.id_user ) {
      var speeds= Ezer.fce.speed('hour');
      // informace do _touch na server
      var x= {cmd:'touch',user_id:Ezer.sys.user.id_user,user_abbr:Ezer.sys.user.abbr,root:Ezer.root,
        app_root:Ezer.app_root,session:Ezer.options.session,module:'speed',hits:0,menu:'',msg:speeds
      };
      var r= new Request({method:'post', url:Ezer.App.options.server_url, onComplete:null}).post(x);
    }
  },
  // ----------------------------------------------------------------------------- bar_clock_continue
  // je voláno pokud uživatel v okně zobrazeném z bar_clock potvrdil, že chce pokračovat
  bar_clock_continue: function () {
    Ezer.App.clock_tics= 0;
    Ezer.App.hits++;
    Ezer.App.waiting= false;
//                                                   Ezer.trace('*','bar_clock: prodlouženo');
    Ezer.App.bar_clock(true);
  },
  // ----------------------------------------------------------------------------- bar_chat
  // udržuje se serverem konverzaci
  bar_chat: function (x,test) {
    x.cmd= 'chat';
    x.root= Ezer.root;                  // název/složka aplikace
    x.app_root= Ezer.app_root;          // {root].inc je ve složce aplikace
    x.session= Ezer.options.session;    // způsob práce se SESSION
    x.curr_version= Ezer.options.curr_version; // verze při startu
    if ( test )
      x.svn= 1;                         // zjištění verze SVN pro aplikaci a jádro
//                                                         Ezer.debug(x,'bar_chat');
    var ajax= new Request({url:this.options.server_url, data:x, method: 'post',
      onSuccess: function(ay) {
        //this._ajax(-1);
        var y;
        try { y= JSON.decode(ay); } catch (e) { y= null; }
        if ( !y )
          Ezer.error('EVAL: syntaktická chyba na serveru:'+ay,'E');
        if ( test ) {
          Ezer.debug(y,'bar_chat (response)');
          Ezer.fce.DOM.alert(y.msg);
        }
        else {
          var cv= y.curr_version ? y.curr_version.toInt() : 0,
             yav= y.a_version ? y.a_version.toInt() : 0,
             ygv= y.g_version ? y.g_version.toInt() :0, ykv= y.k_version ? y.k_version.toInt() : 0;
          if ( ykv > cv || yav > cv || (ygv && ygv > cv) ) {
            var msg= "Na serveru byly provedeny programové změny, obnovte prosím okno prohlížeče"
              + "<br>pomocí tlačítka (nebo co nejdříve stiskem Ctrl-R), aby vám mohly sloužit.<hr>"
              + y.help;
            Ezer.fce.DOM.confirm(msg,
              function(x){ if (x) document.location.reload(true); },{
                'Obnov nyní (doporučeno)':1,'Provedu za chvíli ...':0},{heading:
                "<span style='color:orange;text-align:center;display:block'>Upozornění systému</span>",
                width:520});
          }
        }
        if ( y.log_out )
          location.replace(window.location.href);
        //this.putFootDom(ae_time()+' '+(y?y.msg:'?'));
      }.bind(this)});
    ajax.send();
    //this._ajax(1);
    return true;
  },
  // ----------------------------------------------------------------------------- bar_click
  bar_click: function () {
    var x= '', del= '';
    // klik zobrazí resp. zhasne následující informace
    if ( !this.domFoot.get('text') ) {
      // zjištění velikosti uživatelské plochy
      x= 'window='+window.getSize().x+'x'+window.getSize().y+', ';
      // přidání informací o uživateli
      for (var i in Ezer.sys.user) {
        if ( i!='skills' ) {
          x+= del+i+'='+Ezer.sys.user[i];
          del= ', ';
        }
      }
    }
    this.putFootDom(x);
  },
  // =============================================================================================== SERVER
  pb: null,
  // ----------------------------------------------------------------------------- _ajax
  // zobrazí změnu zatížení serveru
  // on==0 pro inicializaci, +1 po přidání požadavku, -1 po skončení požadavku
  _ajax: function (on) {
    if ( !on ) {
      // inicializace - vytvoř progress bar pokud není
      if ( !this.pb && $('ajax_bar') ) {
        window.addEvent('domready', function() {
          this.pb= new Ezer.ServerBar({
            container: $('ajax_bar'),
            startPercentage: 0,
            speed: 500,
            boxID: 'bar_box',
            percentageID: 'bar_perc',
            displayID: 'bar_text'
          });
        }.bind(this));
      }
      this._ajax_init();
    }
    else {
      // zobrazení
      this.ajax+= on;
      this._ajax_show();
    }
  },
  // ----------------------------------------------------------------------------- _ajax_show
  // zobrazí aktuální stav zatížení serveru
  _ajax_show: function () {
    if ( this.pb ) {
      this.pb.set(this.ajax*21);
      if ( this.domIcon_idle && this.domIcon_server ) {
        // ikona má na začátku názvu '-' když je server pasivní, '+' když je aktivní
        if ( this.pb.width==0 && this.idle ) {
          this.domIcon_idle.setStyle('display','block');
          this.domIcon_server.setStyle('display','none');
          this.idle= false;
        }
        else if ( this.pb.width>0 && !this.idle ) {
          this.domIcon_idle.setStyle('display','none');
          this.domIcon_server.setStyle('display','block');
          this.idle= true;
        }
      }
    }
  },
  // ----------------------------------------------------------------------------- _ajax_init
  // zobrazí iniciální stav zatížení serveru - vynuluje i počet "běžících" Eval
  _ajax_init: function () {
    this.ajax= 0;
    this.idle= true;
    this._ajax_show();
    Ezer.evals= 0;
    Ezer.calls= [];
  }
});
// ΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞ ServerBar
// class from http://davidwalsh.name/progress-bar-animated-mootools
Ezer.ServerBar = new Class({
  // implements
  Implements: [Options],
  // options
  options: {
    container: $(document.body),
    boxID:'',
    percentageID:'',
    displayID:'',
    startPercentage: 0,
    displayText: false,
    displayPrefix:'',
    speed:7
  },
  // initialization
  initialize: function(options) {
    this.setOptions(options);
    this.createElements();
    this.width= 0;
  },
  // creates the box and percentage elements
  createElements: function() {
    var box= new Element('div', { id:this.options.boxID });
    var perc= new Element('div', { id:this.options.percentageID, 'style':'width:0px;' });
    perc.inject(box);
    box.inject(this.options.container);
    if (this.options.displayText) {
      var text= new Element('div', { id:this.options.displayID });
      text.inject(this.options.container);
    }
    this.set(this.options.startPercentage);
  },
  // calculates width in pixels from percentage
  calculate: function(percentage) {
    return ($(this.options.boxID).getStyle('width').replace('px','') * (percentage / 100)).toInt();
  },
  // animates the change /*in percentage*/
  animate: function(to) {
    this.width= this.calculate(to.toInt());
    $(this.options.percentageID).set('morph',
      { duration: this.options.speed, link:'cancel' }).morph({width:this.width});
    if (this.options.displayText) {
      $(this.options.displayID).set('text', this.options.displayPrefix + to.toInt() /*+ '%'*/);
    }
  },
  // sets the percentage from its current state to desired percentage
  set: function(to) {
    this.animate(to);
  }
});
// ΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞΞ ezer.js
// ------------------------------------------------------------------------------------------------- Block + DOM
//c: Block-DOM ([options])
//      základní třída
//s: Block-DOM
Ezer.Block= new Class({
//o: Block-DOM.DOM - DOM kořen celého bloku (s tím se například posunuje při Drag)
  DOM: null,
//o: Block-DOM.DOM_Block - prvek DOM do které jsou vnořeny Parts
  DOM_Block: null,
  initialize: function(DOM) {
    if ( DOM ) this.DOM= DOM;
  },
  DOM_re1: function () {
    if ( this.DOM_add1 ) this.DOM_add1();
  },
  DOM_re2: function () {
    if ( this.DOM_add2 ) this.DOM_add2();
  }
});
// ================================================================================================= Help
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  Ezer.help
// programátorské informace
Ezer.help= {
  block: null,                  // poslední blok, na který bylo kliknuto
  dbg: false,                   // Ezer.Help pracuje v modu hledání kontextu pro debuger
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  dom
// získání zobrazeného bloku
  dom: function (the) {
    var dom=
      the instanceof Ezer.Tabs      ? the.DOM_li   : (
      the instanceof Ezer.Panel     ? the._tabDom  : (
      the instanceof Ezer.MenuGroup ? the.domA     : (
      the.DOM_Block )));
    return dom;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  title
// zobrazení základních informací o bloku jako title
  title: function (the) {
    var pos= the.app_file();
    var help= the.type+' '+the.id+' '
      +(pos.file ? pos.file : '?')+(the.desc._lc ? ';'+the.desc._lc : '')
      +(the.desc.options && the.desc.options.skill ? ' skill='+the.desc.options.skill : '');
    Ezer.help.dom(the).set('title',the._help ? the._help(help) : help);
  }
};
// ================================================================================================= Drag
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  Ezer.drag
// obsluha klávesnicí
Ezer.drag= {
  text: '',                             // zdrojový text načtený v Dbg
  file: '',                             // jméno souboru zdrojového textu
  blocks: [],                           // seznam bloků vybraných pro pohyb
  changed: [],                          // seznam změněných souřadnic bloků
  titles: [],                           // seznam změněných popisů bloků
  input: null,
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  init
  init: function (drag_div) {
    this.input= drag_div;
    this.input.addEvents({
      keydown: function(ev) {
        var p= null, s;
        switch(ev.key) {
        case 'up':    p= ev.shift ? 'height' : 'top';  s= -1; break;
        case 'down':  p= ev.shift ? 'height' : 'top';  s= +1; break;
        case 'left':  p= ev.shift ? 'width'  : 'left'; s= -1; break;
        case 'right': p= ev.shift ? 'width'  : 'left'; s= +1; break;
        }
        if ( p && this.blocks.length>0 ) {
          this.blocks.each(function(block,i) {
            block.DOM_Block.setStyle(p,block.DOM_Block.getStyle(p).toInt()+s);
//             block._drag.coord= window.top.dbg.get_text(block.desc._c);
            var c= block._dragChange;
            if ( !block._dragChange ) block._dragChange= {_l:0,_t:0,_w:0,_h:0};
            block._dragChange['_'+p[0]]+= s;
//                                                         Ezer.debug(block._dragChange,'change');
            var i= this.changed.indexOf(block),
              nic= !block._dragChange._l && !block._dragChange._t && !block._dragChange._w && !block._dragChange._h;
            if ( i==-1 ) {
              this.changed.push(block);
              block.DOM_Block.addClass('drag_changed');
            }
            else if ( nic )  {
              this.changed.splice(i,1);
              block.DOM_Block.removeClass('drag_changed');
            }
          },this);
        }
      }.bind(this)
    });
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  toggle
  toggle: function (block) {
    var i, dom= block.DOM_Block;
    if ( (i= this.blocks.indexOf(block))>=0 ) {
      // je v seznamu -> vyjmout
      this.blocks.splice(i,1);
      dom.removeClass('dragging');
    }
    else {
      // není v seznamu -> přidat
      this.blocks.push(block);
      if ( !block._drag ) block._drag= {};
      dom.addClass('dragging');
    }
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  title
// zobrazení základních informací o bloku jako title
  title: function () {
    Ezer.drag.input.focus();
    this.DOM_Block.set('title',this.type+'.'+this.id+Ezer.drag.new_coord(this,this._dragChange));
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  click
// reakce na kliknutí:
// rightclick = změna title
  contextmenu: function (ev) {
    var form= $('drag_form');
    if ( form && (this instanceof Ezer.Button || this instanceof Ezer.Label ) ) {
      if ( this.DOM_drag_menu===undefined ) {
        this.DOM_drag_menu=
          new ContextMenu({target:this.DOM_Block,menu:form,focus_css:null,
            offsets:{x:15,y:15,from:'target'}}).start();
      }
      else {
        this.DOM_drag_menu.show();
      }
      var title= $('drag_title');
      (function(){title.focus();}).delay(300,this);
      title.value= this.get();
      form.removeEvents();
      form.addEvents({
        submit:function (evnt) {
          this.set(title.value);
          form.setStyles({display:'none'});
          evnt.stopPropagation();
          // zapiš, že byla změna v titles
          if ( Ezer.drag.titles.indexOf(this)==-1 ) Ezer.drag.titles.push(this);
          this.DOM_Block.addClass('drag_changed');
          return false;
        }.bind(this),
        keyup: function (event) {
          if ( event.key=='esc' )
            this.DOM_drag_menu.hide();
          return false;
        }.bind(this)
      });
    }
    return false;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  click
// reakce na kliknutí:
// click+ctrl = přidání čí ubrání ze seznamu pohybovaných Ezer.DragBlocks
// click+shift+ctrl = zobrazení zdrojového textu
  click: function (ev) {
    ev.stop();
    Ezer.drag.input.focus();
    if ( ev && ev.control && ev.shift ) Ezer.fce.source(this);
    if ( ev && ev.control ) Ezer.drag.toggle(this);
    ev.stopPropagation();
    return false;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  coord
// vrátí text souřadnic bloku (text musí být načten s atributy _c)
  coord: function (block) {
    var c= '[?]';
    if ( this.text && block.desc._c ) {
      c= block.desc._c+':'+window.top.dbg.get_text(block.desc._c);
    }
    return c;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  new_coord
// odvodí pro změněné nové souřadnice bloku v textovém tvaru
  new_coord: function (block,change,omezeni) {
    var coord= {_l:'',_t:'',_w:'',_h:''}, b, s;
    for (var x in omezeni||coord) {
      if ( typeof(block.options[x])=='object' ) {
        // symbolické zadání
        var del= '';
        for (var i in block.options[x]) {
          switch (s= block.options[x][i][0]) {
          case 'k':                             // v block.options[x][i][2] je jméno konstanty
            coord[x]+= del+block.options[x][i][2];
            break;
          case 'n':
            coord[x]+= del+(block.options[x][i][1]+(change?change[x]||0:0));
            break;
          case 'l': case 't': case 'w': case 'h': case 'r': case 'b':
            coord[x]+= del+block.options[x][i][1]+'.'+s;
            break;
          }
          del= '+';
        }
      }
      else if ( block.options[x]===undefined ) {
        // prázdná hodnota na místě width nebo height
        if ( change && change[x] && (x=='_w'||x=='_h')) {
          // pokud proběhla změna musí být nahrazena skutečnou hodnotou
          var c= block.DOM_Block.getCoordinates(block.owner.DOM_Block);
          coord[x]= change[x]+(x=='_w'?c.width:c.height);
        }
      }
      else {
        // pouze číslo
        coord[x]= block.options[x]+(change?change[x]||0:0);
      }
    }
  return '['+coord._l+','+coord._t+','+coord._w+','+coord._h+']';
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  save
// vrátí seznam změn
  save: function () {
    var list= [];
    var del= "˙";
    // uložení souřadnic
    this.changed.each(function(block,i) {
      var pos= block.app_file();                        // najdi jméno zdrojového textu
      var pf= del+pos.app+del+pos.file;
      if ( block.type=='form' ) {
        // u form je třeba změnit left+top v use (tj. form.owner) a width+height ve form
        var use_change= {_l:block._dragChange._l,_t:block._dragChange._t};
        var form_change= {_w:block._dragChange._w,_h:block._dragChange._h};
        list.push(block.owner.desc._c+del+this.new_coord(block.owner,use_change,{_l:'',_t:''})+pf);
        list.push(block.desc._c+del+this.new_coord(block,form_change,{_w:'',_h:''})+pf);
      }
      else {
        // u ostatních se mění přímo souřadnice bloku
        list.push(block.desc._c+del+this.new_coord(block,block._dragChange)+pf);
      }
      block.DOM_Block.removeClass('drag_changed');
    },this);
    // uložení title
    this.titles.each(function(block,i) {
      var pos= block.app_file();                        // najdi jméno zdrojového textu
      var pf= del+pos.app+del+pos.file;
      var t= block.get();
      list.push(block.desc._c+del+t+pf+del+block.options.title);
      block.DOM_Block.removeClass('drag_changed');
    },this);
                                                        Ezer.debug(list,'save');
    return list;
  }
};
// ------------------------------------------------------------------------------------------------- Drag
Ezer.Drag= new Class({
  _dragSave: {},                        // úschova vlastností
  _dragChange: null,                    // změny l,t,w,h
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _dragThis
// počne resp. skončí design-mode pro blok
  _dragThis: function(on) {
    // vlastní funkce
    var dom= this.DOM_Block;
    if ( dom ) {
      if ( on ) {
        this.enable(true);
        this._dragSave.title= dom.title;
        dom.addClass('dragged');
        dom.addEvents({
          contextmenu:Ezer.drag.contextmenu.bind(this),
          click:      Ezer.drag.click.bind(this),
          mouseover:  Ezer.drag.title.bind(this)
        });
      }
      else {
        dom.title= this._dragSave.title;
        dom.removeClass('dragged');
        dom.removeEvents('mouseover','mousedown');
      }
    }
  }
});
// ------------------------------------------------------------------------------------------------- Help
Ezer.Help= new Class({
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _helpThis
  _helpSave: {},                        // úschova vlastností
  _helpIn: false,
  _helpBlock: null,                     // zvolený blok - je definován událostí click
// počne resp. skončí design-mode pro blok
  _helpThis: function(on) {
    // vlastní funkce
    var dom= Ezer.help.dom(this);
    if ( dom ) {
      if ( on ) {
        this._helpSave= {title:dom.title,enabled:this.enable(),cursor:dom.getStyle('cursor'),
          outline:dom.getStyle('outline'),opacity:dom.getStyle('opacity')};
        this.enable(true);
        dom.addEvents({
          mouseover: function() {
            if ( !this._helpIn ) {
              this._helpIn= true;
              var dom= Ezer.help.dom(this);
              if ( dom ) {
                dom.setStyles(
                  {outline:'2px dotted grey',cursor:'help',opacity:0.7});
                Ezer.help.title(this);
              }
            }
            return false;
          }.bind(this),
          mouseout:  function() {
            this._helpIn= false;
            var dom= Ezer.help.dom(this);
            if ( dom ) {
              dom.setStyles(
                {outline:this._helpSave.outline,cursor:this._helpSave.cursor,
                 opacity:this._helpSave.opacity});
            }
            return false;
          }.bind(this),
          click:  function() {
            if ( Ezer.help.dbg && this._helpIn ) {
              Ezer.help.block= this;
                                                    Ezer.trace('*','context: '+this.self()+'/'+this._helpIn);
              Ezer.help.dbg= false;
              Ezer.run.$.helpBlock(0);
              var dom= Ezer.help.dom(this);
              if ( dom ) {
                dom.addClass('dbg_context');
              }
            }
            else {
                                                    Ezer.trace('*','click: '+this.self());
//               Ezer.App.edit_source(this);
            }
            return false;
          }.bind(this)
        });
      }
      else {
        dom.title= this._helpSave.title;
        this.enable(this._helpSave.enabled);
        dom.removeEvents('mouseover','mouseout','click');
      }
    }
  }
});
/*
// https://developer.mozilla.org/en-US/docs/Web/Events/resize
var optimizedResize = (function() {
    var callbacks = [],
        running = false;
    // fired on resize event
    function resize() {
        if (!running) {
            running = true;
            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(runCallbacks);
            } else {
                setTimeout(runCallbacks, 66);
            }
        }
    }
    // run the actual callbacks
    function runCallbacks() {
        callbacks.forEach(function(callback) {
            callback();
        });
        running = false;
    }
    // adds callback to loop
    function addCallback(callback) {
        if (callback) {
            callbacks.push(callback);
        }
    }
    return {
        // initalize resize event listener
        init: function(callback) {
            window.addEventListener('resize', resize);
            addCallback(callback);
        },
        // public method to add additional callback
        add: function(callback) {
            addCallback(callback);
        }
    }
}());

// start process
optimizedResize.init(function() {
    console.log('Resource conscious resize callback!')
});
setTimeout(function() {
  window.addEventListener("resize", resizeThrottler, false);
  var resizeTimeout;
  function resizeThrottler() {
    // ignore resize events as long as an actualResizeHandler execution is in the queue
    if ( !resizeTimeout ) {
      resizeTimeout = setTimeout(function() {
        resizeTimeout = null;
        actualResizeHandler();
       // The actualResizeHandler will execute at a rate of 15fps
       }, 66);
    }
  }
  function actualResizeHandler() {
    // handle the resize event
    Ezer.app.DOM_layout()
  }
}());
*/
