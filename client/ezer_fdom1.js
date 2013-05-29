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
    window.addEvent('resize',function(e){ this.DOM_layout(); }.bind(this));
    this.DOM_layout();
    // V template stránky musí být div-element s id='drag' pro design-subsystém
    if ( $('drag') ) Ezer.drag.init($('drag'));
    this.bar_clock();
  },
  // ----------------------------------------------------------------------------- DOM_layout
  DOM_layout: function() {
    // změna šířky změní width ve stylu PanelRight
    var leftMenu= document.getElement('.Accordion');
    var leftMenuWidth= leftMenu ? leftMenu.getStyle('width').toInt() : 210;
    var w= window.getSize().x - leftMenuWidth;
    $$('.PanelRight').setStyle('width',w);
//                                         Ezer.fce.echo(window.getSize().x,'-',leftMenuWidth,'=',w);
    // změna výšky definuje velikost pracovní plochy
    Ezer.Shield.top= $('work').getCoordinates().top;
    if ( this.options.to_trace ) {
      var h= $('dolni').getCoordinates().top - $('work').getCoordinates().top;
      $('work').setStyle('height',h);
    }
    else {
      var h= $('dolni').getCoordinates().top - $('horni').getCoordinates().bottom;
      $('work').setStyle('height',h);
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
  },
  // ----------------------------------------------------------------------------- _mini_debug
  // ikona má název *logo.gif kde * je '+' nebo '-'
  _mini_debug: function (on) {
  // trik k rozlišení click a dblclk pomocí timeru
  // viz http://groups.google.com/group/mootools-users/browse_thread/thread/f873371716d338c9
    var timer;
    this.domIcon_idle= $('StatusIcon_idle');
    this.domIcon_server= $('StatusIcon_server');
    this.idle= true;                            // není běžící požadavek na server
    this.logo= $('logo');
    if ( this.logo ) {
      if ( on ) {
        this.logo.addEvents({
//           click: function(e) {
//             if ( !e.rightClick ) {
//               $clear(timer);
//               // přeložit kód
//               timer= (function(){
//                 this.reload();
//               }).delay(200, this);
//             }
//           }.bind(this),
          dblclick: function(e) {
//             $clear(timer);
            // zrušit session
            Cookie.dispose('PHPSESSID',{path: '/'});   //http://mootools-users.660466.n2.nabble.com/Moo-Cookie-write-and-dispose-acting-flaky-td3970737.html
            alert('Obnovte prosím svoje přihlášení do systému...');
            window.location.href= window.location.href;
          }
        });
      }
      else {
        this.logo.removeEvents('click,dblclick');
      }
    }
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
    this._barRightDom= $('status_right');
    this._bar= {};
    this._barRightDom.getChildren().destroy();
    // pokud je povolen ovladač trasování
    if ( this.options.to_trace ) {
      Ezer.to_trace= this.options.show_trace;
      this._barTrace= new Element('span', {text:'trace:','class':Ezer.to_trace?'ae_switch_on':'',
        title:'zapíná/vypíná trasování',
        events:{
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
      this._barSwitch('a','funkce na serveru');
      this._barSwitch('L','zavádění programu');
      this._barSwitch('q','kód interpreta');
      this._barSwitch('Q','kód interpreta (jen s ift,iff,is)');
      this._barSwitch('C','trasování kompilátoru');
      // dump
      new Element('span', {text:'dump:',title:'vypíše proměnné zobrazeného panelu', events:{
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
        click: function(event) {
          Ezer.trace(null,Ezer.fce.trail('show'));
        }.bind(this)
      }}).inject(this._barRightDom);
//       // informace na konci
//       new Element('span', {text:'| '+MooTools.lang.getCurrentLanguage()}).inject(this._barRightDom);
      // obsluha okna s chybami a trasováním
      $('kuk').addEvent('dblclick',this._clearTrace.bind(this))
              .setStyles({display:Ezer.to_trace ? 'block' : 'none'});
      $('status_bar').setStyles({cursor:Ezer.to_trace ? 'ns-resize' : 'default'});
      // ovládání výšky trasovacího panelu
      $('kuk').makeResizable({handle:$('status_bar'),modifiers:{x:''},invert:true,
        onComplete: function(){
          this.DOM_layout();
        }.bind(this)
      });
    }
    // pro všechny okno pro zobrazení měření výkonu - zachází se s ním jako s trasováním 'S'
    Ezer.is_trace['S']= this.options.ae_trace.indexOf('S')>=0;
    var speed= new Element('span', {text:'speed:','class':Ezer.is_trace['S']?'ae_switch_on':'',
        title:'zobrazí okno s měřením výkonu', events:{
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
      click: function(event) {
        Ezer.fce.speed('clear');
        Ezer.fce.speed('show');
        return false;
      }.bind(this)
    }}).inject(speed);
    // HELP a FAQ
    new Element('span', {text:'HELP!',title:'kontextový help formou FAQ', events:{
      click: function(event) {
        if ( Ezer.App.hits_block ) {
          var key= Ezer.App.hits_block.self_sys();
          Ezer.trace('*',"FAQ "+key);
          Ezer.App.help_text(key);
        }
      }.bind(this)
    }}).inject(this._barRightDom);
    $('error').addEvent('dblclick',this._clearError.bind(this));
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
    this._barTrace[on ? 'addClass':'removeClass']('ae_switch_on');
    if ( Ezer.to_trace ) {
      $('kuk').setStyle('display','block');
      $('status_bar').setStyles({cursor:'ns-resize'});
    }
    else {
      $('status_bar').setStyles({cursor:'default'});
      $('kuk').setStyle('display','none');
    }
  },
  // ----------------------------------------------------------------------------- _setTraceOnOff
  // nastaví trasování podle klíče id - on=1 vypne, on=0 zapne
  _setTraceOnOff: function (id,on) {
    // uprav zobrazení
    $('status_right').getChildren('span').each(function(el) {
      if ( el.get('text')==id ) {
        el.toggleClass('ae_switch_on');
        return;
      }
    });
    // uprav stav is_trace, ae_trace
    Ezer.is_trace[id]= on;
    if ( !on ) {
      this.options.ae_trace= this.options.ae_trace.replace(id,'');
    }
    else {
      this.options.ae_trace+= id;
    }
  },
  // ----------------------------------------------------------------------------- _barSwitch
  // přidání ovladače trasování k status_bar
  _barSwitch: function (id,title,dump) {
    Ezer.is_trace[id]= this.options.ae_trace.indexOf(id)>=0;
    new Element('span', {text:id, 'class':Ezer.is_trace[id]?'ae_switch_on':'',
      title:title,
      events:{
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
    Ezer.is_dump[id]= this.options.ae_dump.indexOf(id)>=0;
    new Element('span', {text:id, 'class':Ezer.is_dump[id]?'ae_switch_on':'',
      title:title,
      events:{
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
    var abbr= Ezer.sys.user
      ? "<span title='id="+Ezer.sys.user.id_user+' / '+Ezer.sys.user.skills+"'>"
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
        session:Ezer.options.session,module:'speed',hits:0,menu:'',msg:speeds
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
  bar_chat: function (x) {
    x.cmd= 'chat';
    x.root= Ezer.root;          // název/složka aplikace
    x.session= Ezer.options.session;    // způsob práce se SESSION
//                                                         Ezer.debug(x,'bar_chat');
    var ajax= new Request({url:this.options.server_url, data:x, method: 'post',
      onSuccess: function(ay) {
        this._ajax(-1);
        var y;
        try { y= JSON.decode(ay); } catch (e) { y= null; }
        if ( !y )
          Ezer.error('EVAL: syntaktická chyba na serveru:'+ay,'E');
//                                                         Ezer.debug(y,'bar_chat (response)');
        if ( y.update )
          Ezer.fce.warning(y.update);
        if ( y.log_out )
          location.replace(window.location.href);
        this.putFootDom(ae_time()+' '+(y?y.msg:'?'));
      }.bind(this)});
    ajax.send();
    this._ajax(1);
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
          }.bind(this)
        });
      }
      else {
        dom.title= this._helpSave.title;
        this.enable(this._helpSave.enabled);
        dom.removeEvents('mouseover','mouseout');
      }
    }
  }
});
