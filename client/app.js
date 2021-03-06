/* Ezer2        (C) 2009 Martin Šmídek */

/* global Ezer */

//Ezer.root                     je definován v hlavním programu aplikace
//Ezer.version                  dtto - default=ezer2
//Ezer.browser                  CH|FF|OP|IE
Ezer.options= Ezer.options || {};
Ezer.parm= Ezer.parm || {};     // parametry z nadřazené aplikace
Ezer.code= {};                  // kód modulů stažený ze serveru jako celkový strom
Ezer.file= {};                  // kód modulů jako seznam podle jména souborů
Ezer.loads= [];                 // kódy modulů přečtené jedním příkazem load_code2
                                // [ {name:složené_jméno,app:aplikace,code:kód}... ]
Ezer.onlogin=  function() {};   // funkce volané po přihlášení
Ezer.onlogout= function() {};   // a odhlášení z aplikace
Ezer.ontouch=  function() {};   // pokud byl zápis do _touch WHERE menu=login OR module=error
                                // během poslední minuty a skill='m' EXPERIMENTÁLNÍ
Ezer.run= {};                   // běhové struktury
Ezer.dbg= {stop:false};         // ladící struktury
Ezer.design= false;             // design-mode
Ezer.help_mode= false;          // help-mode
Ezer.continuation= null;        // pokračování po stop-adrese
Ezer.modal_fce= [];             // zásobník pro operaci 'j'
Ezer.DOM= null;                 // uživatelská plocha
Ezer.paths= Ezer.paths || {};   // parametry z nadřazené aplikace
Ezer.paths.images_lib= './'+Ezer.version+'/client/img/';
Ezer.paths.images_cc= (!Ezer.options.skin || Ezer.options.skin=='default'
  ? './'+Ezer.version+'/client/skins/default' : './skins/'+Ezer.options.skin)+'/clientcide';
;
Ezer.used= [];                  // seznam vyžádaných zdrojů ???
Ezer.evals= 0;                  // počet aktivních objektů Ezer.Eval (nuluje i DblClick na trace)
Ezer.process= 0;                // jednoznačné číslo procesu
Ezer.calls= [];                 // fronta volání čekajících na Ezer.evals==0
Ezer._MenuMain= null;
Ezer._PanelMain= null;
Ezer.excited= 0;                // >0 pokud bylo již použito Ezer.options.start
Ezer.konst= Ezer.konst || {};   // hodnoty nedefinovaných konsta(const x;y;z)
Ezer.curr= {panel:null};        // zobrazený panel
// systémové proměnné (root,user,ezer,options)
Ezer.sys= {root:Ezer.root,user:{},ezer:{},version:Ezer.version,options:Ezer.options};
// ------------------------------------------------------------------------------------------------- const_value
// vrátí hodnotu konstanty případně opravenou o hodnotu z Ezer.konst
Ezer.const_value= function (id,val) {
  var value= null;
  // nedefinovaná konstanta musí být definována přes Ezer.konst
  Ezer.assert(val!==null || Ezer.konst[id]!==undefined,
    Ezer.root+".php neobsahuje požadovanou definici konstanty '"+id+"'");
  if ( Ezer.konst!={} && Ezer.konst[id]!==undefined ) {
    // je použit mod přepisu konstant a konstanta s tímto jménem je v seznamu
    value= Ezer.konst[id];
  }
  else {
    // použita bude standardní hodnota konstanty
    value= val;
  }
  return value;
}
// ----------------------------------------------------------------------------- ON unload
window.addEvent('unload', function() {
  if ( Ezer && Ezer.sys ) {
    if ( Ezer.sys.dbg ) {
      if ( Ezer.sys.dbg.win_ezer ) {
        Ezer.sys.dbg.win_ezer.close();
      }
      if ( Ezer.sys.dbg.win_php ) {
        Ezer.sys.dbg.win_php.close();
      }
    }
  }
});
// ----------------------------------------------------------------------------- ON load
window.addEvent('load', function() {
  Ezer.app= new Ezer.Application(Ezer.options);
//   if ( Ezer.app.options.debug ) window.top.dbg.init();
  if ( Ezer.platform=='A' ) Browser.Platform.android= true;     // oprava mootools
  if ( Ezer.platform=='I' ) {
    Browser.Platform.ipad= true;                                // oprava mootools
//     document.ontouchmove= function(e){e.preventDefault();}     // zamezení posunu work
//     document.addEventListener('touchmove',function(event){event.preventDefault();},false);
  }
  Ezer.app._mini_debug(Ezer.app.options.mini_debug);
  if ( Ezer.app.options.ondomready ) ondomready();
});
// ----------------------------------------------------------------------------- ON popstate
if ( Ezer.browser!='IE' )                               // IE nepodporuje HTML5
  window.addEventListener("popstate", function(e) {
//                                                  Ezer.trace('*','the url has changed to '+location.href+', state='+JSON.stringify(e.state));
    var re= /\?menu=([^&]*)&?/;
    var obj= re.exec(location.href);
    if ( obj && Ezer.run.$ ) Ezer.fce.href(obj[1]);
  });
Ezer.pushState = Ezer.browser=='IE'
  ? function() {}
  : function(href) {
      // přidání $_GET parametru trace nebo jeho vynechání
      if ( Ezer.to_trace ) {
        href+= '&theight='+$('kuk').getStyle('height').toInt();
        href+= '&trace='+Ezer.app.options.ae_trace;
      }
      history.pushState(null,null,href);
    }
// ============================================================================> ClientCide - úpravy
Locale.use('cs-CZ');
Element.NativeEvents = $merge(Element.NativeEvents, {dragover:2, dragleave:2, drop:2});
Element.implement({
  // from http://davidwalsh.name/element-has-event
  hasEvent: function(eventType,fn) {
    //get the element's events
    var myEvents = this.retrieve('events');
    //can we shoot this down?
    return myEvents && myEvents[eventType]
      && (fn===undefined || myEvents[eventType].keys.contains(fn));
  }
});
Clientcide.setAssetLocation(Ezer.paths.images_cc);
// =========================================================================================> Google
// propojení s API Google Disk, v {root}.php musí být definováno
//   $options= (object)array('Google' => "{CLIENT_ID:'...'}",...)
// a připojen skript: https://apis.google.com/js/client.js?onload=Ezer.Google.ApiLoaded
  // Called when authorization server replies. @param {Object} authResult Authorization result.
Ezer.Google= {
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  authorize(d)
// požádá o přihlášení do Google Disk
  authorized: null,
  scope:'https://www.googleapis.com/auth/drive',
  authorize: function (caller) {
    var ok= 0;
    if ( !this.authorized || this.authorized.expires_at<(Date.now()/1000|0) ) {
      var config= {
        client_id:Ezer.options.Google.CLIENT_ID,
        scope:this.scope, immediate:false
      };
      gapi.auth.authorize(config, function(authResult) {
        console.log('login complete');
        console.log(gapi.auth.getToken());
        Ezer.Google.authorized= authResult && !authResult.error ? authResult : 0;
        if ( caller && caller instanceof Ezer.Block ) {
          caller.callProc('onautorize',[Ezer.Google.authorized ? 1 : 0]);
        }
      });
    }
    return this.authorized ? "přístup na Google Disk povolen" : "žádost se vyřizuje";
  },
  // Called when the client library is loaded to start the auth flow.
  ApiLoaded: function () {
    window.setTimeout(Ezer.Google.authorize, 1);
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  files_list
// viz https://developers.google.com/drive/web/search-parameters
  files_list: function (query,callback) {
    var retrievePageOfFiles= function(request, result) {
      request.execute(function(resp) {
        if ( resp.error ) {
          Ezer.fce.warning("Disk Google není přístupný: "+resp.message);
          callback(null);
        }
        result= result.concat(resp.items);
        var nextPageToken= resp.nextPageToken;
        if (nextPageToken) {
          request= gapi.client.drive.files.list({
            pageToken: nextPageToken
          });
          retrievePageOfFiles(request, result);
        } else {
          callback(result);
        }
      });
    };
    gapi.client.load('drive', 'v2', function() {
      var initialRequest= gapi.client.drive.files.list({q: query});
      retrievePageOfFiles(initialRequest, []);
    });
  }
};
// ====================================================================================> Application
//c: Application ([options])
//      základní třída aplikace
//s: system
Ezer.Application.implement({
// Ezer.Application= new Class({
// po startu aplikace jsou
//   1. načten kód $ a ostatní
//   2. spuštěna iniciační posloupnost (nebo část, použití v aktivním menu)
// při restartu modulu (rekompilace) jsou zjištěny a vymazány zasažené panely
// unload_module:
//   1. odstranění json-modulu a jeho instancí v iniciovaných tabs vč. závislých
//   2. označení tabs jako nezavedených
// load_module
//   1. načtení json-modulu a chybějících použitých
// init_tab
//   1. spuštění inicializační posloupnosti modulu na tabs
  Extends: Ezer.Application,
  Implements: [Options],
  status: null,                                 // loaded
  options: {
    user_record: true,                          // uživatelské údaje jsou v tabulce _user
    server_url: Ezer.version+'/server/ezer2.php',       // URL serveru
    login_interval: 60,                         // počet minut mezi obnovováním přihlášení - viz hits
    session_interval: 20,                       // počet minut mezi obnovou SESSION < login_interval
    must_log_in: true,
//--: Application.json - hlavní modul (standardně $)
    json:'$',
//on: Application.to_trace - zobrazit trasovací lištu
    to_trace:   0,                               // zobrazit lištu s ovládáním trasování
    show_trace: 0,                               // zobrazit trasovací okno
//os: Application.ae_trace - seznam aktivovaných modů trasování
    ae_trace:   '',                              // typ trasované informace
    ae_dump:    '',                              // typ vypisované informace
    mini_debug: true,                            // reload po kliknutí na ikonu
    skin: null,                                  // jméno skinu aplikace
//os: Application.skin - je-li nenulové tak barvy jsou v souboru skins/colors.php a img v skins/$skin
    status_bar: true                             // zobrazit status bar
  },
  library_code: null,                            // kořen knihovny pro code_name
  // ------------------------------------------------------------------------------------ initialize
  initialize: function (options) {
    this._ajax(0);                              // počet neukončených požadavků na server
    Ezer.App= this;
    this.setOptions(options);
    Ezer.Shield= new Mask('shield',{hideOnClick:false,
      style:{opacity:0.2,backgroundColor:'#333',zIndex:2}});
    this.DOM_add();
    if ( options._oninit ) {
      eval(options._oninit+'()');
    }
    else {
      this.load();
    }
  },
  // ------------------------------------------------------------------------------------ skin
  // vrátí cestu ke složce s background-image
  skin: function () {
    return !Ezer.options.skin || Ezer.options.skin=='default'
      ? './'+Ezer.version+'/client/skins/default' : './skins/'+Ezer.options.skin;
  },
  // ------------------------------------------------------------------------------------- load
//fx: Application.load ()
//      zavede do paměti kód
//s: system
  load: function () {
    //Ezer.trace('L','load root');
    if ( this.options.must_log_in ) {
      if (this.options.prelogin ) {
        var bw= {body:$('body').getSize(),screen:{x:screen.width,y:screen.height}};
        this.ask({cmd:'user_prelogin',size:bw},'logged1');
        this.putFoot(' přihlašování');
      }
      else if (this.options.refresh ) {
        this.ask({cmd:'user_relogin'},'logged1');
        this.putFoot(' obnovení');
      }
      else {
        this.loginDomKey();
        this.login();
        this.putFoot(' nepřihlášen');
      }
    }
    else if ( this.options.user_record ) {
      this.ask({cmd:'user_login',uname:this.options.uname,pword:this.options.pword},'logged')
    }
    else {
      Ezer.sys.user= {};
      this.ask({cmd:'load_code2',file:Ezer.root+'/'+this.options.json,i:1},'load_$',null,this);
    }
  },
  // ------------------------------------------------------------------------------------- clear
  clear: function () {
    if ( Ezer.run.$ )
        Ezer.run.$.DOM_destroy();
//       for (var o in Ezer.run.$.part)
//         Ezer.run.$.part[o].DOM_destroy();
    Ezer.run.$= null;
    this.menu= [];
    this.tab= [];
    this.library_code= null;
    Ezer.code= {};
    Ezer.run= {};
    Ezer.file= {};
    Ezer.loads= [];
    Ezer.evals= 0;
    Ezer.continuation= null;
    Ezer.calls= [];
//     Ezer.sys= {user:{},ezer:{}};          jinak nefunguje reload
    this._clearTrace();
    this._clearError();
    if ( this.options.debug && window.top.dbg.init_text )
      window.top.dbg.init_text();
  },
  // ------------------------------------------------------------------------------------- reload
  reload: function (/*options*/) {
    if ( this.options.must_log_in ) {
      if ( this.status=='loading' ) {
        if ( confirm('již je zaváděno - opravdu znovu zavést?') )  {
          this.status= 'error';
        }
      }
      if ( this.status=='loaded' || this.status=='error' ) {
        this.status= 'loading';
        this.clear();
        this.ask({cmd:'user_login',uname:Ezer.sys.user.username,pword:Ezer.sys.pword},'logged')
        Ezer.sys.pword= "**********";
      }
    }
    else {
      this.clear();
      this.load();
    }
  },
  // ------------------------------------------------------------------------------------- logout
  logout: function () {
    this.clear();
    this.loginDomOpen('logged','','');      // zavolá this.logged(odpověď serveru)
  },
  // ------------------------------------------------------------------------------------- login
  login: function() {
    this.loginDomOpen('logged1','','');      // zavolá this.logged(odpověď serveru)
  },
  // ------------------------------------------------------------------------------------- logged1
  // logged: akce po přihlášení
  logged1: function(y,parm) {
    this.logged(y,parm);
    if ( y.user_id) {
      Ezer.sys.user= y.sys.user;
      Ezer.sys.ezer= y.sys.ezer;
      Ezer.onlogin();
    }
    waiting(0);
  },
  // ------------------------------------------------------------------------------------- logged
  // logged: akce po změně přihlášení
  // naplnění objektu Ezer.sys.user.(id_user - klíč uživatele,abbr    - zkratka (3 znaky),...)
  // a Ezer.sys.ezer hodnotami z $root.php
  logged: function(y,parm) {
    if ( y && y.user_id ) {
      if ( this.options.skill && !y.sys.user.skills.contains(this.options.skill,' ') ) {
        this.loginDomMsg('nemáte dostatečné oprávnění');
      }
      else {
        if ( Ezer.options.dbg && !y.sys.user.skills.contains('m',' ') ) {
          Ezer.options.dbg= 0;                  // debugger je jen pro programátory
        }
        Ezer.sys.user= y.sys.user;
        Ezer.sys.ezer= y.sys.ezer;
        this.loginDomClose();
        Cookie.dispose(Ezer.root+'_logoff')
        this.bar_clock(true);
        // obnov stav trasování a zaveď kód
        if ( Ezer.sys.user.state && this.options.to_trace ) {
          this.options.to_trace= Ezer.sys.user.state[0]=='+' ? 1 : 0;
          if ( this.options.to_trace ) {
            this.options.show_trace= Ezer.sys.user.state[1]=='+' ? 1 : 0;
            this.options.ae_trace= Ezer.sys.user.state.substr(2);
          }
        }
        if ( y.sys.user.options ) {
          if ( y.sys.user.options.options && y.sys.user.options.options.to_trace ) {
            // pokud je trasování potlačeno ale uživatel má výjimku
            this.options.to_trace= y.sys.user.options.options.to_trace;
          }
          // pokud je obecně nebo pro uživatele povolená rekompilace
          if ( this.options.mini_debug
            || y.sys.user.options.options && y.sys.user.options.options.mini_debug ) {
            // pokud uživatel smí rekompilovat
            Ezer.app._mini_debug(true);
          }
          // pokud má uživatel nastavený zvláštní styl (sub.skin)
          if ( y.sys.user.options.css ) {
            var path= !Ezer.options.skin || Ezer.options.skin=='default'
              ? Ezer.version+'/client/skins/' : "skins/";
            path+= (Ezer.options.skin||'default')+"/"+y.sys.user.options.css+".css";
//                                                         Ezer.trace('*',path);
            var myCSS= new Asset.css(path, {id:'userStyle',title:'userStyle'});
          }
        }
        this._setTrace();
        this.putFoot('');
        this.ask({cmd:'load_code2',file:Ezer.root+'/'+this.options.json,i:2},'load_$',null,this);
        // pokud group_login, zajisti přihlášení do sdružených aplikací
        if ( this.options.group_login ) {
          this.ask({cmd:'user_group_login',par:this.options.group_login,i:2});
        }
        // zjištění, zda nedošlo ke zvýšení verze od startu systému, pokud ano doporuč restart
        if ( y.update ) {
          alert(y.update);
        }
      }
    }
    else /*if ( $('login').getStyle('display')=='block' )*/ {
      // pokud jde o selhání přihlášení
      this.loginDomMsg('chybné přihlašovací údaje');
      waiting(0);
    }
//     else {
//       // pokud jde o refresh
//       this.login();
//     }
  },
  // ------------------------------------------------------------------------------------- logoff
  // logoff: akce po odhlášení
  logoff: function() {
    this.clear();
    this._resetTrace();
    Ezer.sys.user= {};
    this.putFoot(' odhlášen');
    //this.bar_clock(); ... smyčka
    Ezer.app._ajax_init();
    Ezer.app._mini_debug(false);
  },
  // ------------------------------------------------------------------------------------- send_status
  send_status: function () {
    this.ask({cmd:'user_status',state:this._state()},'noop')
  },
  // ------------------------------------------------------------------------------------- noop
  noop: function() {
  },
  // ------------------------------------------------------------------------------------- run
  // spuštění kódu zdrojových textů v dané záložce
  // obj :: {id:key,def:value,path:idkey};
  run: function (tab,DOM) {
    var id= tab.desc._init;
    tab.desc.part= {};
    tab.desc.part[id]= new Ezer.Panel(null,Ezer.code[id],DOM,id);
  },
  // ------------------------------------------------------------------------------------- echo
  // zobrazení textu v Trace
  echo: function (msg) {
    Ezer.fce.echo(msg);
  },
  // ------------------------------------------------------------------------------------- dump
  // zobrazení objektu v Trace
  // obj :: {id:key,desc:value,path:idkey};
  dump: function (obj) {
    switch (obj.desc.type) {
    case '?':
      Ezer.debug({sorry:'no dump'},obj.id);
      break;
    case 'proc':
      Ezer.debug({code:obj.desc.code},obj.desc.type+' '+obj.id);
      break;
    default:
      Ezer.debug({options:obj.desc.options},
        obj.desc.type+' '+obj.id+(obj.desc.stop?' STOP':'')+(obj.desc.trace?' TRACE':''));
      break;
    }
  },
  // ------------------------------------------------------------------------------------- code
  // zobrazení kódu procedury v Trace
  // obj :: {id:key,desc:value,path:idkey};
  code: function (obj) {
    if (obj.desc.type=='proc') {
      var code= {};
      $each(obj.desc.code,function(cc,ic) {
        var tr= '', cc= obj.desc.code[ic];
        // instrukce
        for (var i in cc) {
          if ( i=='iff' || i=='ift') tr+= ' '+i+'='+(ic+cc[i]);
          else if ( i=='v') tr+= ' "'+cc[i]+'"';
          else if ( i!='s') tr+= ' '+cc[i];
        }
        code[ic]= tr;
      });
      Ezer.debug(code,
        obj.desc.type+' '+obj.id+(obj.desc.stop?' STOP':'')+(obj.desc.trace?' TRACE':''));
    }
  },
  // ------------------------------------------------------------------------------------- toggle
  // toggle příznaku (stopadresy,trasování) procedury
  // obj :: {id:key,desc:value,path:idkey};
  toggle: function (obj,tag) {
//     obj.desc[tag]= obj.desc[tag] ? false : true;
  },
  // ------------------------------------------------------------------------------------- stopped
  // interpret narazil na stop-adresu
  stopped: function (proc) {
//     if ( this.options.debug /*window.top.dbg*/ && window.top.dbg.show_stop )
//       window.top.dbg.show_stop(proc);
//     else
//       alert('proc '+proc.id+' stopped');
  },
  // ------------------------------------------------------------------------------------- load_$
  // load_$ (aplikace)
  //   source :: { use:<str*>  part:<desc># }
  //     desc :: <id>:{type:<id> options:<attr># [part:<desc>#] }
  // bude naplněna struktura Ezer.run podle $.menu
  load_$: function(y) {
    // načtení zdrojových textů
    if ( y.error ) {
      Ezer.error(y.error);
    }
    else {
      Ezer.code= {'$':y.app};
      Ezer.file.$= y.app;
      if ( this.options.debug /*window.top.dbg*/ && window.top.dbg.show_code )
        window.top.dbg.show_code(Ezer);
//       Ezer.trace('L','loaded '+y.msg);
      var root= new Ezer.BlockMain(y.app);
      Ezer.run= {$:root};
//       root.includeBlock();
      this.start_code(root);
      this.status= 'loaded';
      this.DOM_layout();  // přepočet layoutu
    }
  },
// ----------------------------------------------------------------------------------------- include
// voláním 'include' bude natažen kód
// po jeho inicializaci bude pokračováno 'continue' v témže objektu
  include: function(sender) {
//     Ezer.trace('L',sender.type+' '+sender.id+' including');
    this.ask(Ezer.Block.prototype.include.apply(sender,[]),'included',sender);
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  included
// vlož načtený kód do Ezer.code a Ezer.run
  included: function(y,sender) {
//     Ezer.trace('L','loaded '+y.msg);
    // zavolej sender._include(y)
    Ezer.Block.prototype.include_.apply(sender,[y]);
    // zavolej sender._include(y)
    Ezer.assert(sender.options.include,'chyba během include');
    sender.options.include= 'loaded';
//     this.start_code_continue();
  },
// -------------------------------------------------------------------------------------- start_code
// provede kód pro načtení 1.map,2.select,3.includes,4.onstart a inicializuje novou část systému
//? provede kód pro načtení 1.includes,2.select,3.map,4.onstart a inicializuje novou část systému
  start_code: function(top,end) {
    var codes= {map:[],select:[],onstart:[]/*,include:[]*/};
    top.start(codes,null);
    if ( codes.map.length+codes.select.length+codes.onstart.length > 0 ) {
//                                                 if ( Ezer.App.options.ae_trace.contains('L') )
      codes.map.extend(codes.select.extend(codes.onstart)).push({o:'v',v:'ok'});
      this.start_code_seq(top,codes.map,'start_href_modify');
    }
    else {
      this.start_href_modify();
    }
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  start_code_seq
// top je kořenný blok, code je kód, end je this.funkce volaná na závěr
// následovat mohou parametry oddělené /
  start_code_seq: function(top,code,end) {
    if ( code.length ) {
      new Ezer.Eval(code,top,[],'(startup)',{fce:function(id,val){
//         Ezer.trace('L',id+' skončila se stavem '+this.value+", pokračuje "+end);
        if ( end )
          Ezer.app[end](top);
      },args:['inicializace '+top.id],stack:true},true);
    }
    else if ( end ) {
      Ezer.app[end](top);
    }
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - start_href_modify
// přidá obsluhu elementům <a href='ezer://....'>
// obdobný kód je v Ezer.Label.set
  start_href_modify: function () {
    $$('a').each(function(el) {
      if ( el.href && el.href.substr(0,7)=='ezer://' ) {
        if ( !el.hasEvent('click') ) {
          el.addEvents({
            click: function(ev) {
              Ezer.fce.href(ev.target.href.substr(7));
              return false;
            }
          })
        }
      }
    })
    // vlastní spuštění aplikace
    if ( Ezer._MenuMain )
      Ezer._MenuMain.excite();
    else if ( Ezer._PanelMain )
      Ezer._PanelMain.excite();
    waiting(0);
  },
// ------------------------------------------------------------------------------------ onfirstfocus
// je voláno v případě prvního focus panelu - obdoba události domready
  onfirstfocus: function(panel) {
    Ezer.app.DOM_layout();  // přepočet layoutu
    if ( panel.force_help ) {
      this.help_text(panel.self_sys());
    }
  },
// -------------------------------------------------------------------------------------- block_info
// vrátí informaci o místě ve zdrojovém textu bloku
// vychází ze záznamů Ezer.code..._file a Ezer.run..._lc
// s touto informací se zavolá funkce Ezer.fce.error_ pokud ask_source=true
  block_info: function(b,lc,ask_source) {
    var file= '', info= '?';
    lc= lc||'';
    // najdi pozici
    if ( b.app_file ) {
      if ( !lc && b.desc && b.desc._lc )
        lc= b.desc._lc;
      var pos= b.app_file();                              // najdi jméno zdrojového textu
      // požádej server o text, pokud se to chce
      if ( ask_source && pos.file && lc )
        this.ask({cmd:'source_line',file:pos.file,app:pos.app,lc:lc},'block_info_',{});
      info= pos.file+'.ezer;'+lc;
    }
    else {
      info= '!';
      Ezer.fce.error_(info);
    }
    return info;
  },
  block_info_: function(y,parm) {
    if ( y && y.text )
      Ezer.fce.error_(y.text);
  },
// ------------------------------------------------------------------------------------- edit_source
// zavolání PSPad na zdrojový text na řádku kliknutého elementu
  edit_source: function(elem) {
    var pos= elem.app_file();
    if ( pos.file && elem.desc._lc ) {
//                              Ezer.trace('*','edit: PSPad '+pos.file+' '+elem.desc._lc);
      this.ask({cmd:'edit_source',file:pos.file,app:pos.app,lc:elem.desc._lc});
    }
  },
// ------------------------------------------------------------------------------------- source_text
// zabezpečí zobrazení zdrojového textu bloku b
  source_text: function(b,lc) {
    var info= '?';
    if ( b ) {
      // najdi pozici
      if ( !lc && b.desc && b.desc._lc )
        lc= b.desc._lc;
      var pos= b.app_file();                            // najdi jméno zdrojového textu
      // požádej server o text, pokud to jde
      if ( pos.file ) {
        var l_c= lc ? lc.split(',') : [0,0];
//                                                 Ezer.trace('*','::source_text:',pos.file);
        this.ask({cmd:'source_text',file:pos.file,app:pos.app},'source_text_',
          {file:pos.file,app:pos.app,l:l_c[0],c:l_c[1],root:pos.root});
      }
    }
    else pos.file= '?';
    return pos.file+'.ezer';
  },
  source_text_: function(y,parm) {
    if ( y.text )
      Ezer.fce.source_(y.text,parm.file,parm.app,parm.l,parm.c,true,parm.root);
  },
// --------------------------------------------------------------------------------------- help_text
// zobrazí helptext s daným klíčem získaným funkcí self_sys
  help_text: function(k) {
    this.ask({cmd:'help_text',key:k},'help_text_',{key:k});
  },
  // ezer2/help_text vrací: {text,refs,db}
  help_text_: function(y,parm) {
    Ezer.fce.popup_help(y.text,'HELP: '+y.key.title,y.key,parm.key,y.seen,y.refs,y.db);
  },
// --------------------------------------------------------------------------------------- help_save
// zapíše helptext s daným klíčem do db._help
  help_save: function(k,t,db) {
    this.ask({cmd:'help_save',key:k,text:t,db:db});
  },
// ---------------------------------------------------------------------------------------- help_ask
// zapíše otázku do helptextu s daným klíčem - po skončení předá zpět výsledek
  help_ask: function(k,t,c) {
    this.ask({cmd:'help_ask',key:k,text:t},'help_ask_',{continuation:c});
  },
  help_ask_: function(y,parm) {
    parm.continuation(y);
  },
// -------------------------------------------------------------------------------------- help_force
// zařídí vynucené zobrazení helpu
  help_force: function(k) {
    this.ask({cmd:'help_force',key:k});
  },
// --------------------------------------------------------------------------------------- save_drag
// po skončené inicializaci z include a load_$
  save_drag: function() {
    var drag= Ezer.drag.save();
    if ( drag && drag.length )
      this.ask({cmd:'save_drag',drag:drag},'save_drag_',{});
  },
  save_drag_: function(y,parm) {
    Ezer.fce.DOM.alert(y.warning||"Zdrojový text byl změněn. <br>Bude obnoveno okno prohlížeče!",
      function(){window.location.href= window.location.href;});
  },
// ----------------------------------------------------------------------------------------- started
// po skončené inicializaci z include a load_$
  started: function() {
    if ( this.options.debug /*window.top.dbg*/ && window.top.dbg.show_run ) {
      window.top.dbg.show_code();
      window.top.dbg.show_run();
    }
  },
// =================================================================================== evals & calls
// obsluha fronty volání aktivované uklidněním interpreta
// -------------------------------------------------------------------------------------- evals_init
// obnoví klid interpreta
  evals_init: function () {
    Ezer.evals= 0;
    Ezer.calls= [];
    this.putFoot(Ezer.evals);
  },
// ------------------------------------------------------------------------------------- evals_check
// zjistí klid interpreta
  evals_check: function () {
    this.putFoot(Ezer.evals);
    if ( !Ezer.evals && Ezer.calls.length ) {
      var x= Ezer.calls.shift();
      x.obj[x.metd].apply(x.obj,x.args);
    }
  },
// ------------------------------------------------------------------------------------- calls_queue
// přidá do fronty calls
  calls_queue: function (obj,metd,args) {
    Ezer.calls.push({obj:obj,metd:metd,args:args});
    this.evals_check();
  },
// ----------------------------------------------------------------------------------------- putFoot
// putFoot: přidat text do patičky
  putFoot: function(x) {
    if ( this.options.status_bar ) this.putFootDom(x);
  },
// --------------------------------------------------------------------------------------------- ask
// ask(x,then): dotaz na server se jménem funkce po dokončení
  ask: function(x,then,parm,env) {
    var app= this;
    x.root= Ezer.root;                  // název/složka aplikace
    x.app_root= Ezer.app_root;          // {root].inc je ve složce aplikace
    x.session= Ezer.options.session;    // způsob práce se SESSION
    var ajax= new Request({url:this.options.server_url, data:x, method: 'post',
      onSuccess: function(ay) {
        Ezer.App._ajax(-1);
        var y;
        try { y= JSON.decode(ay); } catch (e) { y= null; }
        if ( !y  )
          Ezer.error('LOAD: syntaktická chyba v PHP na serveru: '+ay,'C');
        else if ( y.error )
          Ezer.error(y.error,'C');
        else if ( y.cmd=='load_code2' && (!y.app || !y.app.part) )
          Ezer.error('LOAD: server vrátil prázdný kód pro '+y.file,'C');
        else {
          if ( y.trace ) Ezer.trace('u',y.trace);
          if ( then )
            app[then].apply(app,[y,parm]);
        }
      },
      onFailure: function(xhr) {
        if ( x.cmd=='source_line' && then )
            app[then].apply(app,[{},parm]);
        else
          Ezer.error('SERVER failure (1)','C');
      }
    });
    ajax.send();
    this._ajax(1);
  }
})
