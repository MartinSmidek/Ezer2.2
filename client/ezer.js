// Tento modul abstrahuje od konkrétní DOM-reprezentace
// 'DOM' je vlastnost se kterou se smí pracovat jen jako s celkem
// (aby v některé implementaci mohla být objektem)
// ================================================================================================= Dokumentace
// značka c: třída
// značka f: interní metoda, dvojpísmenné jsou i informací pro kompilátor - funkce volané z Ezer
//           fm: metoda, ff: funkce, fs: struktura, fx: metoda s voláním ajax
//           jméno může být ve tvaru: ezer_jméno/js_jméno (např.owner/_owner)
// značka o: interní options, dvojpísmenné jsou i informací pro kompilátor - atributy bloků Ezer
//           os: string, on: number, oi: element (options/atribut)
// značka t: seznam děděných tříd
// značka a: argumenty
// značka r: výsledek
// značka s: sekce v dokumentaci
// ================================================================================================= Block
// ------------------------------------------------------------------------------------------------- Block
//c: Block ([options])
//      základní třída
//s: Block
Ezer.Block= new Class({
  Extends:Ezer.Block,
  Implements: [Options],
// ------------------------------------------------------------------------------------ id
//os: Block._id - identifikátor objektu (mapuje se na hodnotu 'this.id' v JS kódu)
  _id: '',
  id: '',
//os: Block._l - left
  _l: 0,
//os: Block._t - top
  _t: 0,
//os: Block._w - width
  _w: 0,
  _w_max: 0,                                    // šířka bloku dostatečná pro vnořené bloky
//os: Block._h - height
  _h: 0,
  _h_max: 0,                                    // výška bloku dostatečná pro vnořené bloky
//os: Block.tag - označení pro hromadné změny (display,...)
//-
//os: Block.value - hodnota objektu
// ------------------------------------------------------------------------------------ type
//os: Block.type - typ objektu
  type: '',
//os: Block.css - jméno třídy v CSS souborech
//-
//os: Block.style - CSS styl doplňující zobrazení elementu
//-
// ------------------------------------------------------------------------------------ skill
//os: Block.skill - potřebná úroveň zkušenosti uživatele pro zobrazení resp. změnu bloku.
//      Pokud je skill uváděn jako jedno slovo => definuje přístup pro změnu,
//      Pokud skill je uváděn jako 2 slova oddělená | => definuje přístup pro: čtení|zápis.
//      skill může být uváděn jako varianty oddělené středníkem - použije se varianta lepší pro uživatele
//      Základní hodnoty jsou:
//      ; 'r' : <i>redaktor</i> základní přístup
//      ; 'a' : <i>admin</i> změny nastavení aplikace, správa uživatelů
//      ; 'm' : <i>maintainer</i> programátor
  skill: true,                                  // uživatel má oprávnění k bloku
  options: {},
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  initialize
  initialize: function(owner,desc,DOM,id,skill) {
    this.parent(DOM);
    if ( this instanceof Ezer.MenuMain ) {
      var i= 1;
    }
    this.owner= owner;
    this.skill= skill;
    if ( id ) this.id= this._id= id;
    if ( id && owner && owner.part ) owner.part[id]= this;
    this.type= desc.type;
    this.desc= desc;
    this.setOptions(desc.options);
    this._coord();
    this._check();
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _check
// test integrity bloku po jeho dokončení
  _check: function () {
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _coord
// přepočítá symbolicky zadané souřadnice bloku na čísla
  _coord: function () {
    var b, s;
    for (var x in {_l:0,_t:1,_w:2,_h:3}) {
      if ( typeof(this.options[x])=='object' ) {
//                                                 Ezer.debug(this.options[x],x);
        this[x]= 0;
        for (var i in this.options[x]) {
          switch (s= this.options[x][i][0]) {
          case 'k':
            var id= this.options[x][i][2];              // jméno konstanty
            this[x]= Ezer.const_value(id,this.options[x][i][1]);
            break;
          case 'n':
            this[x]+= this.options[x][i][1];
            break;
          case 'l': case 't': case 'w': case 'h':
            Ezer.assert(b= this.owner.part[this.options[x][i][1]],'chybný odkaz '+s,this);
            this[x]+= b['_'+s];
            break;
          case 'r':
            Ezer.assert(b= this.owner.part[this.options[x][i][1]],'chybný odkaz '+s,this);
            this[x]+= b._l+b._w;
            break;
          case 'b':
            Ezer.assert(b= this.owner.part[this.options[x][i][1]],'chybný odkaz '+s,this);
            this[x]+= b._t+b._h;
            break;
          case '*':
            this[x]= '100%';
            break;
          }
        }
      }
      else {
        this[x]= this.options[x];
      }
    }
//                                                 if ( this.id=='id_user' ) {
//                                                 Ezer.debug(this.options,this.owner.id+'.'+this.id);
//                                                 Ezer.debug([this._l,this._t,this._w,this._h],this.id);
//                                                 }
  },
// ------------------------------------------------------------------------------------ owner
//fm: Block.owner/_owner ()
//      vlastník objektu
  owner: null,
  _owner: function () {
    return this.owner;
  },
// ------------------------------------------------------------------------------------ delete
//fm: Block.delete ()
//      vlastník objektu
  'delete': function () {
    this.owner.part[this.id]= null;
    delete this;
    return 1;
  },
// ------------------------------------------------------------------------------------ attach_code
//fm: Block.attach_code (o)
  attach_code: function (o) {
    // odstraň všechny mimo procedur a proměnných
    for (var i in this.part) {
      var p= this.part[i];
      if ( p instanceof Ezer.Block && p.type!='proc' ) {
        p.delete();
      }
    }
    this.DOM_destroy();                                   // vymaž viditelné prvky
    if ( this.DOM_re1 ) this.DOM_re1();                   //
    this.subBlocks(o,this.DOM,null,'rewrite');            // true => doplnění a přepis
    if ( this.DOM_re2 ) this.DOM_re2();                   // specificky doplní menu
    // zajištění šíření událostí pro onready a onbusy
    var oneval= this.oneval;
    if ( this.part.onready||this.part.onbusy ) {
      this.evals= 0;
      oneval= this;
    }
    this.start([],oneval);
    if ( this.excite ) {
      this.excited= false;
      this.excite();
    }
    if ( window.top.dbg && window.top.dbg.show_run ) window.top.dbg.show_run();
    return true;
  },
// ------------------------------------------------------------------------------------ self_sys
//fm: Block.self_sys ()
//      vrátí objekt {sys:...,title:...} kde sys je vytvořené zřetězením atributu _sys
//      od this ke kořenu aplikace a title je zřetězením odpovídajících title
//      s odstraněnými formátovacími znaky
  self_sys: function() {
    var id= tit= '';
    for (var o= this; o.owner; o= o.owner) {
      if ( o.options._sys ) {
        id= (o.options._sys=='*'?o.id:o.options._sys)+(id ? '.'+id : '');
        tit= (Ezer.fce.strip_tags(o.options.title)||'') + (tit ? '|'+tit : '');
      }
    }
    if ( id=='' ) id= '@';
    return {sys:id,title:tit};
  },
// ------------------------------------------------------------------------------------ self
//fm: Block.self ()
//      vrátí absolutní jméno this
//r: $.test....
  self: function() {
    var id= '';
    for (var o= this; o.owner; o= o.owner) {
      if ( o.type!='form' )
        id= o.id+(id ? '.'+id : '');
    }
    return '$.'+id;
  },
// ------------------------------------------------------------------------------------ set_attrib
//fm: Block.set_attrib (name,val[,desc=])       nedokumentováno, může být změněno
//      změní hodnotu atributu 'name' na 'val'
//      name může být složeným jménem
//      pokud je val objekt, bude jím nahrazena celá hodnota - narozdíl od set_attrib
//      pokud je definováno desc bude změna provedena v popisu (ve this.desc, ne v this)
//a: name - jméno atributu
//   val - nová hodnota atributu
  set_attrib: function(name,val,desc) {
    Ezer.assert(typeof(name)=='string','první parametr není jménem atributu',this);
    var ids= name.split('.');
    Ezer.assert(desc===undefined || this.desc.part[desc],desc+" není popsáno v "+this.id,this);
    var o= desc===undefined ? this.options : this.desc.part[desc].options;
    for (var i= 0; i<ids.length-1; i++) {
      Ezer.assert(o[ids[i]],name+" je chybné jméno v set_attrib",this);
      o= o[ids[i]];
    }
    o[ids[i]]= val;
    return 1;
  },
// ------------------------------------------------------------------------------------ add_attrib
//fm: Block.add_attrib (name,val)
//      pokud val není objekt, je funkce stejná jako set_attrib;
//      pokud je val objekt, budou jeho položky přidány k dosavadním,
//      narozdíl od set_attrib, které nahradí
//a: name - jméno atributu
//   val - nová hodnota atributu
  add_attrib: function(name,val) {
    Ezer.assert(typeof(name)=='string','první parametr není jménem atributu',this);
    var ids= name.split('.');
    var o= this.options;
    for (var i= 0; i<ids.length-1; i++) {
      Ezer.assert(o[ids[i]],name+" je chybné jméno v add_attrib",this);
      o= o[ids[i]];
    }
    if ( typeof(val)=='object' ) {
      for (p in val) {
        o[ids[i]][p]= val[p];
      }
    }
    else {
      o[ids[i]]= val;
    }
    return 1;
  },
// ------------------------------------------------------------------------------------ _part
//fm: Block.part/_part (name[,n,[attr,value]])
//      pokud není uvedeno n vrátí podblok daného složeného jména
//        (pokud podblok začíná $ pak se chápe jako absolutní cesta);
//      pokud je uvedeno n vrátí n-tý podblok jehož typ má jako prefix name;
//      pokud je uvedeno attr a value, hledá podblok jehož atribut 'attr' má hodnotu 'value'
//      při nenalezení vrací 0
//      (pokud je blok proměnnou aplikuje postup na hodnotu)
//r: objekt
  _part: function(name,n,attr,value) {
    var o= 0;
    var b= (this.type=='var'||this.type=='view') ? this.value : this;
    if ( attr ) {
      var k= 1;
      for (var i in b.part) {
        var p= b.part[i];
        if ( p.options[attr]==value ) {
          o= p;
          break;
        }
      }
    }
    else if ( n ) {
      var k= 1;
      for (var i in b.part) {
        var p= b.part[i];
        if ( p && p.type.substr(0,name.length)==name ) {
          if ( n==k++ ) {
            o= p;
            break;
          }
        }
      }
    }
    else {
      var ids= $type(name)=='string' ? name.split('.') : [name];
      if ( ids[0]=='$' ) {
        // pokud name je absolutní
        o= Ezer.run.$;
        ids.shift();
      }
      else {
        o= b;
      }
      for (var i= 0; i<ids.length; i++) {
        if ( o.part && o.part[ids[i]] )
          o= o.part[ids[i]];
        else if ( (o.type=='var'||o.type=='view') && o.value && o.value.part && o.value.part[ids[i]]) {
          o= o.value.part[ids[i]];
        }
        else {
          o= 0;
          break;
        }
      }
    }
    return o;
  },
// ------------------------------------------------------------------------------------ call
//fm: Block.call/_call (name,a1,...)
//      asynchronně zavolá proceduru daného složeného jména vnořenou do bloku a předá argumenty
//      (interně má jméno _call)
//r: objekt
  _call: function(lc,name) {
    var o= 0, ok= 0;
    var b= this.type=='var' ? this.value : this;
    var ids= $type(name)=='string' ? name.split('.') : [name];
    o= b;
    for (var i= 0; i<ids.length; i++) {
      if ( o.part && o.part[ids[i]] )
        o= o.part[ids[i]];
      else if ( o.type=='var' && o.value && o.value.part && o.value.part[ids[i]]) {
        o= o.value.part[ids[i]];
      }
      else {
        o= 0;
        break;
      }
    }
    // pokud se jméno povedlo vyřešit
    if ( o && o.type=='proc' ) {
      var args= [];
      for (var i= 2; i<arguments.length; i++) {
        args.push(arguments[i]);
      }
      new Ezer.Eval([{o:'c',i:o.id,a:args.length,s:lc}],o.context||form,args,o.id);
      ok= 1;
    }
    return ok;
  },
// ------------------------------------------------------------------------------------ file_drop
//fm: Block.file_drop (goal,[options])
//      aktivuje element goal pro příjem souboru pomocí File Api
//      po přečtení obsahu souboru zavolá
//      zavolá proceduru daného složeného jména vnořenou do bloku a předá ji argument
//      {name,size,type,text};
//      options.transfer může mít hodnoty: url,binary a určuje kódování položky text;
//      pro obrázky lze zadat maximální rozměr (max_width,max_height) na který bude
//      provedeno resample před odesláním na server;
//      OMEZENÍ: pokud bylo do oblasti přetaženo najednou více souborů, reaguje pouze na první
//a: options - default je
//             {goal:'drop',css_hover:'drop_area_hover',css_run:'drop_area_run',handler:'ondrop',
//              transfer:'url',max_width:null,max_height:null}
//r: 1 - pokud se inicializace oblasti a ovladače povedla; 0 - pokud došlo k chybě
  file_drop_info: null,                          // stavový objekt
  file_drop: function (goal,user_options) {
    var options= $extend(
      {goal:'drop',css_hover:'drop_area_hover',css_run:'drop_area_run',
       handler:'ondrop',transfer:'url'}
      , user_options||{});
    this.file_drop_obj= {state:'wait'};
    var ctx= [];
    var area= this.DOM_Block||this.value.DOM_Block;
    var goal= goal.DOM_Block;
    var ok= window.File && goal && area ? 1 : 0;
    if ( ok && 1==Ezer.run_name(options.handler,this,ctx) && ctx[0].type=='proc' ) {
      goal.removeClass(options.css_hover).removeClass(options.css_run);
      area.addEventListener('dragover', function(evt) {
        evt.preventDefault();
        goal.addClass(options.css_hover);
      }, true);
      area.addEventListener('dragleave', function(evt) {
        evt.preventDefault();
        goal.removeClass(options.css_hover);
      }, true);
      area.addEventListener('drop', function(evt) {
        evt.preventDefault();
      }, true);
      goal.addEventListener('drop', function(evt) {
        if ( this.file_drop_obj.state=='wait' ) {
          this.file_drop_obj.state= 'busy';
          goal.removeClass(options.css_hover).addClass(options.css_run);
          evt.stopPropagation();
          evt.preventDefault();
          var f= evt.dataTransfer.files[0]; // first from FileList object
          if ( f ) {
            this.file_drop_info= {name:f.name,size:f.size,type:f.type,text:null};
            var r= new FileReader();
            r.onload= function(e) {
              var x= e.target.result;
              // pokud je definováno omezení velkosti, zmenši obrázek
              if ( options.max_width || options.max_height ) {
                Resample(x,options.max_width,options.max_height, function(data64){
                  this.file_drop_info.text= data64; // výstup je base 64 encoded
                  //$("StatusIcon_idle").src= data64;
                  this._call(0,options.handler,this.file_drop_info)
                  //$("StatusIcon_idle").src= null;
                }.bind(this));
              }
              else {
                if ( options.transfer=='base64' )
                  x= base64_encode(x);
                this.file_drop_info.text= x;
                this._call(0,options.handler,this.file_drop_info);  // uživatelská funkce ondrop
              }
            }.bind(this);
            switch(options.transfer) {
            case 'base64':
              r.readAsBinaryString(f); break;
            case 'text':
              r.readAsText(f); break;
            case 'url':
              r.readAsDataURL(f); break;
            }
          }
        }
      }.bind(this),false);
    }
    else
      ok= 0;
    return ok;
  },
//------------------------------------------------------------------------------------- dump
//fm: Block.dump ([opt])
//      vytvoří objekt obsahující názvy a hodnoty proměnných, výpis lze ovlivnit řetězem opt:
//      o: hodnoty objektů
  dump: function (opt) {
    function dump_form(f) {
      var dmp= {};
      dmp['key '+(f._key_id||'?')]= f.key();
      Object.append(dmp,f.dump());
      return dmp;
    }
    function dump_area(a) {
      return a.dump();
    }
    var v= {};
    // projdi proměnné
    for(var i in this.part) {
      var part= this.part[i];
      if ( part instanceof Ezer.Var ) {
        if ( part._of=='form' && opt && opt.indexOf('F')>=0 )
          v['form '+part.id]= part.value ? dump_form(part.value) : null;
        else if ( part._of=='area' && opt && opt.indexOf('A')>=0 )
          v['area '+part.id]= part.value ? dump_area(part.value) : null;
        else if ( part._of!='form' && part._of!='area' )
          v[part._of+' '+part.id]=
            typeof(part.value)=='object' ? (part.value==null ? null :
              ( opt && opt.indexOf('O')>=0 ? part.value : '<i>object</i>' ) ) :
            part.value;
      }
    }
    return v;
  },
// ------------------------------------------------------------------------------------ enable
//fm: Block.enable ([on[,tags]])
//      Nastaví vlastnost enable podle on;
//      pokud je uveden seznam tags, provede se pro přímé podbloky s atributem
//      tag vyhovujícím regulárnímu dotazu v tags;
//      v bezparametrické podobě vrací 1, pokud je blok ve stavu enabled
//a: on - 0 | 1
//   tags - regulární výraz popisující vyhovující tagy (např. 'f.|g')
  enable: function(enabled,tags) {
    var ok= 1;
    enabled= enabled=="0" ? 0 : enabled;
    if ( enabled===undefined ) {
      ok= this.options.enabled;
//       var block= this instanceof Ezer.Var && this.value ? this.value : this;
//       ok= block && block.DOM_enabled();
    }
    else if ( tags ) {
      var re= new RegExp(tags);
      // proveď změnu enable pro podbloky s atributem tag vyhovujícím dotazu
      for(var i in this.part) {
        var part= this.part[i];
        if ( part.DOM_Block && part.options.tag && re.test(part.options.tag) ) {
          part.options.enabled= enabled;
          part.DOM_enabled(enabled);
        }
      }
    }
    else if ( this.DOM_Block ) {
      this.options.enabled= enabled;
      this.DOM_enabled(enabled);
    }
    return ok;
  },
// ------------------------------------------------------------------------------------ display
//fm: Block.display ([on[,tags]])
//      zobrazí pokud on=1 resp. skryje blok pokud on=0;
//      na skryté bloky (např. kvůli skill) nemá vliv;
//      pokud je uveden seznam tags, provede se pro přímé podbloky s atributem
//      tag vyhovujícím regulárnímu dotazu v tags
//      v tom případě lze nastavením on=2 zobrazit vybrané a skrýt ty jejichž tag nevyhovuje;
//      v bezparametrické podobě vrací 1, pokud je blok viditelný
//a: on - 0 | 1
//   tags - regulární výraz popisující vyhovující tagy (např. 'f.|g')
  display: function (on,tags) {
    var ok= 1;
    on= on=="0"||on===null ? 0 : on;
    if ( on===undefined ) {
      var block= this instanceof Ezer.Var && this.value ? this.value.DOM_Block : this.DOM_Block;
      ok= block && block.getStyle('display')=='block' ? 1 : 0;
    }
    else if ( tags ) {
      var re= new RegExp(tags);
      // proveď změnu enable pro podbloky s atributem tag vyhovujícím dotazu
      for(var i in this.part) {
        var part= this.part[i];
        var block= part instanceof Ezer.Var && part.value ? part.value.DOM_Block : part.DOM_Block;
        if ( block && part.options.tag ) {
          if ( re.test(part.options.tag) ) {
            block.setStyles({display:on ? 'block' : 'none'});
          }
          else if ( on==2 ) {
            block.setStyles({display:'none'});
          }
        }
      }
    }
    else if ( this instanceof Ezer.Var ) {
      if ( this.value && this.value.DOM_Block ) {
        this.value.DOM_Block.setStyles({display:on ? 'block' : 'none'});
      }
    }
    else if ( this.DOM_Block ) {
      this.DOM_Block.setStyles({display:on ? 'block' : 'none'});
    }
    return ok;
  },
//------------------------------------------------------------------------------------- set_css
//fm: Block.set_css (id1,id2[,tags])
//      objektu v kontextu je id1 přidáno jako css-třída a id2 je ubráno (id1, id2 mohou být prázdné)
//      pokud je uveden seznam tags, provede se pro přímé podbloky s atributem
//      tag vyhovujícím regulárnímu dotazu v tags
//a: id1 - přidávané třídy
//   od2 - ubírané třídy
//   tags - regulární výraz popisující vyhovující tagy (např. 'f.|g')
  set_css: function (id1,id2,tags) {
    if ( tags ) {
      var re= new RegExp(tags);
      // proveď změnu enable pro podbloky s atributem tag vyhovujícím dotazu
      for(var i in this.part) {
        var part= this.part[i];
        if ( part.DOM_Block && part.options.tag && re.test(part.options.tag) ) {
          if ( id1 ) id1.split(' ').each(function(id){part.DOM_Block.addClass(id)});
          if ( id2 ) id2.split(' ').each(function(id){part.DOM_Block.removeClass(id)});
        }
      }
    }
    else if ( this.DOM_Block ) {
      if ( id1 ) id1.split(' ').each(function(id){this.DOM_Block.addClass(id)}.bind(this));
      if ( id2 ) id2.split(' ').each(function(id){this.DOM_Block.removeClass(id)}.bind(this));
    }
    return 1;
  },
// ------------------------------------------------------------------------------------ property
//fm: Block.property (object)
//      upraví vlastnosti bloku
//a: height:*   - upraví výšku podle nejvyššího obsaženého elementu (s opravou u panelu na levé menu)
//   min_height:n - minimální výška
//   width:*    - upraví šířku podle nejširšího obsaženého elementu (s opravou u panelu na levé menu)
//   min_width:n - minimální šířka
  property: function(prop) {
    this.DOM_set_properties(prop);
    return 1;
  },
// ------------------------------------------------------------------------------------ raise
//fm: Block.raise (event_name[,arg])
  raise: function(event_name,arg) {
    this.fire(event_name,[arg]);
    return 1;
  },
// ------------------------------------------------------------------------------------ subBlocks
//f: Block.subBlocks (desc,DOM,wrap_fce,extend)
//      zapojí části bloku do bloku
//   extend=='rewrite' pro přepsání bloků
//   extend=='include' pro přidání vnitřních bloků
//a: wrap_fce - nepovinná funkce, která je volána po zapojení části do celku
//s: system
  subBlocks: function(desc0,DOM,wrap_fce,extend) {
    // vložení případných vnořených částí, pokud na to je dostatečné oprávnění
    var us= Ezer.sys.user ? Ezer.sys.user.skills : '';
    if ( Ezer.options.autoskill )
      us+= ' '+Ezer.options.autoskill;
    if ( desc0 && desc0.part ) {
      if ( !extend || this.part===undefined ) this.part= {};
      for (var name in desc0.part) {
        var desc= desc0.part[name];
//                                                 Ezer.trace('L','subBlocks of '+this.type+' '+this.id+': '+desc.type+' '+name);
        if ( this.value && this.value.part && this.value.part[name] && this.value.part[name].type=='proc') {
          // přepis kódu procedury v use
          this.value.part[name].code= desc0.part[name].code;
        }
        else if ( this.part && this.part[name] ) {
          var part= this.part[name];
          if ( extend=='include' ) {
            part.subBlocks(desc,part.DOM,null,extend);
            if ( part.reinitialize )
              part.reinitialize(desc);
          }
        }
        else {
          // vytvoř ještě nevytvořené (liší se při include)
          // zjistí, jaké skill má přihlášený uživatel pro blok popsaný desc
          // skill je uváděn jako jedno slovo => definuje přístup pro změnu
          // skill je uváděn jako slova oddělená | => definuje přístup pro: čtení|zápis|specifické...
          // 0 - nemá právo, 1 - smí jen vidět, 2 - smí i měnit
          var ok= 1, a= desc.options?desc.options.skill:null, skill= 2;
          if ( a ) {
            var as= a.clean().split(';');
            for (var ai= 0; ai<as.length; ai++) {
              // probereme všechny varianty skill
              var aa= as[ai].clean().split('|');
              ok= us && us.contains(aa[0],' ') ? 1 : 0;
              if ( ok && (aa.length==1 || (aa.length==2 && !us.contains(aa[1],' '))) )
                skill= 1;
              // spokojíme se s první pro uživatele úspěšnou
              if ( ok )
                break;
            }
          }
//           if ( a ) {
//             var aa= a.clean().split('|');
//             ok= us && us.contains(aa[0],' ') ? 1 : 0;
//             if ( aa.length==1 || (aa.length==2 && !us.contains(aa[1],' ')) )
//               skill= 1;
//           }
          if ( ok ) {
            var id= name, context= this;
            if ( name.indexOf('.')>0 ) {
              // složené jméno => zjistíme kontext opravy
              var corr= [], known, ids= name.split('.');
              known= Ezer.run_name(name,this,corr,ids);
              switch (known) {
              case 1:
                id= corr[0].id;
                context= corr[1];
                break;
              case 2:
                id= ids[ids.length-1];
                context= corr[0];
                break;
              case 3:
                Ezer.error('složené jméno '+name+' obsahuje jméno objektové proměnné');
              default:
                continue;
  //               Ezer.error('složené jméno '+name+' nelze v '+this.type+' '+this.id+' pochopit');
              }
              if ( DOM ) DOM= context.DOM;
            }
            var part= null;
            switch (desc.type) {
              // s vizualizací
              case 'browse':
              case 'browse.smart':  part= new Ezer.Browse(this,desc,DOM,id,skill); break;
              case 'button':        part= new Ezer.Button(this,desc,DOM,id,skill); break;
              case 'button.submit': part= new Ezer.Button(this,desc,DOM,id,skill); break;
              case 'button.reset':  part= new Ezer.Button(this,desc,DOM,id,skill); break;
              case 'button.upload': part= new Ezer.Button(this,desc,DOM,id,skill); break;
              case 'case':          part= new Ezer.Case(this,desc,DOM,id,skill); break;
              case 'chat':          part= new Ezer.Chat(this,desc,DOM,id,skill); break;
              case 'check':         part= new Ezer.Check(this,desc,DOM,id,skill); break;
              case 'edit':          part= new Ezer.Edit(this,desc,DOM,id,skill); break;
              case 'edit.html':     part= new Ezer.EditHtml(this,desc,DOM,id,skill); break;
              case 'field':         part= new Ezer.Field(this,desc,DOM,id,skill); break;
              case 'field.date':    part= new Ezer.FieldDate(this,desc,DOM,id,skill); break;
              case 'field.list':    part= new Ezer.FieldList(this,desc,DOM,id,skill); break;
              case 'item':          part= new Ezer.Item(this,desc,DOM,id,skill); break;
              case 'item.clipboard':part= new Ezer.Item(this,desc,DOM,id,skill); break;
              case 'list':          part= new Ezer.List(this,desc,DOM,id,skill); break;
              case 'label':         part= new Ezer.Label(this,desc,DOM,id,skill); break;
              case 'label.drop':    part= new Ezer.LabelDrop(this,desc,DOM,id,skill); break;
              case 'label.map':     part= new Ezer.LabelMap(this,desc,DOM,id,skill); break;
              case 'menu.main':     part= new Ezer.MenuMain(this,desc,DOM,id,skill); break;
              case 'menu.left':     part= new Ezer.MenuLeft(this,desc,DOM,id,skill); break;
              case 'menu.group':    part= new Ezer.MenuGroup(this,desc,DOM,id,skill); break;
              case 'menu.context':  part= new Ezer.MenuContext(this,desc,DOM,id,skill); break;
              case 'panel':         part= new Ezer.Panel(this,desc,DOM,id,skill); break;
              case 'panel.main':    part= new Ezer.PanelMain(this,desc,DOM,id,skill); break;
              case 'panel.plain':   part= new Ezer.PanelPlain(this,desc,DOM,id,skill); break;
              case 'panel.popup':   part= new Ezer.PanelPopup(this,desc,DOM,id,skill); break;
              case 'panel.right':   part= new Ezer.PanelRight(this,desc,DOM,id,skill); break;
              case 'radio':         part= new Ezer.Radio(this,desc,DOM,id,skill); break;
              case 'select':        part= new Ezer.Select(this,desc,DOM,id,skill); break;
              case 'select.auto':   part= new Ezer.SelectAuto(this,desc,DOM,id,skill); break;
              case 'select.map':    part= new Ezer.SelectMap(this,desc,DOM,id,skill); break;
              case 'select.map0':   part= new Ezer.SelectMap0(this,desc,DOM,id,skill); break;
              case 'show':
              case 'show.smart':    part= new Ezer.Show(this,desc,DOM,id,skill); break;
              case 'tabs':          part= new Ezer.Tabs(this,desc,DOM,id,skill); break;
              case 'tabs.logoff':   part= new Ezer.Tabs(this,desc,DOM,id,skill); break;
              // s potenciální vizualizací
              case 'var':           part= new Ezer.Var(this,desc,DOM,id); break;
              // objekt bez vizualizace (ale vložený jako part)
              case 'view':          part= new Ezer.View(this,desc,DOM,id); break;
              case 'group':         part= new Ezer.Group(this,desc,null,id); break;
              case 'const':         part= new Ezer.Const(this,desc,null,id); break;
              case 'report':        part= new Ezer.Report(this,desc,null,id); break;
              case 'box':           part= new Ezer.Box(this,desc,null,id); break;
              case 'table':         part= new Ezer.Table(this,desc,null,id); break;
              case 'map':           part= new Ezer.Map(this,desc,null,id); break;
              case 'proc':          part= new Ezer.Proc(this,desc,this); break;
              // přeskakované (informace dostupné přes Ezer.code)
              case 'area':          break;
              case 'form':          break;
              case 'number':        break;
              case 'text':          break;
              case 'date':          break;
              default:
                Ezer.error('neimplementovaný blok '+desc.type,'C');
            };
            if ( part ) {
              // nově vložená část
              part.id= id;
              if ( !context.part ) context.part= {};
              context.part[id]= part;
              if ( wrap_fce )
                wrap_fce(this,part);
            }
          }
        }
      }
    }
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  include2
// funkce načte do Ezer.code blok s options.include=onclick
// po skončeném načtení a spojení provede
//  1. subBlock na kořen
//  2. start na kořen (volá se ve start_code)
//  3. map+select
//  4. zřetězené procedury onstart
//  5. změní options.include=loaded
//  6. případnou metodu this[method]
  include2: function(method) {
    // zjisti jméno modulu podle formátu zápisu include:onload[ ',' app ':' file]
    var format= this.options.include.split(',');
    this.parm= {own:true, app:'', name:''};
    if ( format.length==1 ) {
      this.parm.name= this.id;
      for (var o= this;o.owner.owner;o= o.owner)  {
        this.parm.name= o.owner.id+(this.parm.name?'.'+this.parm.name:'');
      }
    }
    else {
      this.parm.name= format[1];
      this.parm.own= false;
    }
    this.parm.app= this.parm.name.split('.')[0];
    this.parm.method= method;
                                                Ezer.trace('L','including '+this.parm.name+' then '+method);
    this.ask({cmd:'load_code2',file:this.parm.app+'/'+this.parm.name,
      block:this.self(),i:3},'include2_');
  },
  include2_: function(y) {
                                                Ezer.trace('L','queued '+y.file);
    Ezer.app.calls_queue(this,'include3',[y]);
  },
  include3: function(y) {
    // jde o vlastní rozšíření nebo cizí?
    var name, sender_name= this.id, o;
    for (o= this;o.owner;o= o.owner) {
      sender_name= o.owner.id+(sender_name?'.'+sender_name:'');
    }
    name= this.parm.own ? this.parm.name : sender_name;
    var file= this.parm.own ? name : this.parm.name;
    var app= this.parm.app;
    if ( y.error )
      Ezer.error(y.error,'C');
    // rozšíření Ezer.code v místě definovaném  'name' o y.app, pokud nebyla chyba
                                                Ezer.trace('L','loaded2 '+y.file+' '+y.msg);
    var desc= null;
    ids= name.split('.');
    for (var i= ids[0]=='$'?1:0, desc= Ezer.code.$; i<ids.length; i++) {
      // nalezení desc rozšiřovaného bloku
      Ezer.assert(desc.part[ids[i]],name+' je chybné jméno v include');
      desc= desc.part[ids[i]];
    }
    if ( desc ) {
      // přidání popisu nových částí
      if ( desc.options.include ) {
//         var pos= this.app_file();
        var pos= {file:y.app._file,app:y.app._app};
        desc._file= pos.file; //this.parm.own ? name : this.parm.name;
        desc._app= pos.app; // this.parm.app;
        if ( desc.part ) {
          $each(desc.part,function(p,pid) {
            p._file= pos.file;
            p._app= pos.app;
          });
          $each(y.app.part,function(p,pid) {
            p._file= file;
            p._app= app;
            desc.part[pid]= p;
          });
        }
        else
          desc.part= y.app.part;
        $extend(desc.options,y.app.options);
      }
      // rozšíření Ezer.run
      if ( y.app.library ) {
        this._library= true;                // poznamenej do Ezer_run info o knihovním kořenu
      }
      this.subBlocks(desc,this.DOM,null,'include');
      desc.options.include= 'loaded';
      this.options.include= 'loaded';
                                                  Ezer.trace('L','included '+y.file);
      Ezer.app.start_code(this);
                                                  Ezer.trace('L','started '+y.file);
      if ( this.parm.method )
        this[this.parm.method]();
    }
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  app_file
// zjistí {app:app,file:file,root:root} identifikaci zdrojového textu
  app_file: function() {
    var pos= {app:'',file:'',root:null};
    for (var o= this; o; o= o.owner) {
      if ( o.desc ) {
        if ( pos.file= o.desc._file ) {
          pos.app= o.desc._app||'';
          pos.root= o;
          break;
        }
      }
    }
    return pos;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  ask
  // ask(x,then): dotaz na server se jménem funkce po dokončení
  ask: function(x,then) {
    var app= this;
    x.root= Ezer.root;          // název/složka aplikace
    x.session= Ezer.options.session;    // způsob práce se SESSION
    var ajax= new Request({url:Ezer.App.options.server_url, data:x, method: 'post',
      onSuccess: function(ay) {
        Ezer.App._ajax(-1);
        var y;
        try { y= JSON.decode(ay); } catch (e) { y= null; }
        if ( !y  )
          Ezer.error('ASK: syntaktická chyba v PHP na serveru:'+ay,'C');
        else if ( y.error )
          Ezer.error(y.error,'C');
        else if ( y.cmd=='load_code2' && !y.app )
          Ezer.error('LOAD: server vrátil prázdný kód pro '+this.parm.name,'C');
        else {
          if ( y.trace ) Ezer.trace('u',y.trace);
          this[then](y);
        }
      }.bind(this),
      onFailure: function(xhr) {
        Ezer.error('SERVER failure (2)','C');
//       }.bind(this),
//       onProgress: function(event,xhr) {                   // ve verzi 1.4
//           var loaded= event.loaded, total= event.total;
//           console.log(parseInt(total ? loaded / total * 100 : 0, 10));
      }
    });
    ajax.send();
    Ezer.App._ajax(1);
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  start
//f: Block.start (code,oneval)
//      interní metoda - projde celou strukturu po jejím úplném (znovu)zavedení
//      zřetězí všechny příspěvky start_code podle jejich level a na závěr je Ezer.App
//      provede v pořadí: (maps),select,onstart
//a: codes - kódy nadřazených bloků
//   oneval - nejbližší nadřazený blok s onready nebo onbusy
//s: system
  start: function(codes,oneval) {
    if ( this.part) {
      // zajištění šíření událostí pro onready a onbusy
      this.oneval= oneval;
      if ( this.part.onready||this.part.onbusy ) {
        this.evals= 0;
        oneval= this;
      }
      // řetězení onstart
      if ( this.part && (proc= this.part['onstart']) ) {
                                                                  Ezer.trace('L','queue onstart '+this.id);
        codes.onstart.extend([{o:'d',i:this.self()}]).extend(this.part['onstart'].code).extend([{o:'z',i:0}]);
      }
      // start podbloků
      for(var i in this.part) {
        if ( this.part[i].start )
          this.part[i].start(codes,oneval);
      }
    }
    if ( this.start_code ) {
      codes[this.start_code.level].extend(this.start_code.code).extend([{o:'z',i:0}]);
    }
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  dragBlock
  dragBlock: function(on,root_too) {
    Ezer.design= on;
    if ( root_too && this._dragThis )
      this._dragThis(on);
    if ( this.part)
      $each(this.part,function(desc,id) {
        if ( desc.type=='var' && desc.value && desc.value.type=='form' )
          desc.value.dragBlock(on,true);
        else
          desc.dragBlock(on,false);
        if ( desc._dragThis ) desc._dragThis(on);
      });
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  helpBlock
// zahájení a ukončení help modu tzn. zviditelňování programátorských informací
  helpBlock: function(on,root_too) {
    Ezer.design= on;
    if ( root_too && this._helpThis )
      this._helpThis(on);
    if ( this.part)
      $each(this.part,function(desc,id) {
        if ( desc.type=='var' && desc.value && desc.value.type=='form' )
          desc.value.helpBlock(on,true);
        else
          desc.helpBlock(on,false);
        if ( desc._helpThis ) desc._helpThis(on);
      });
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  fire
// provede obsluhu přerušení
// el obsahuje kontext přerušení
//   pokud je el.control=true pokusíme se zobrazit zdrojový kód místo spuštění obsluhy
// vrací
//   false   - pokud je obsluha fire asynchronní fce (došlo k volání serveru nebo jinému přerušení)
//   true    - pokud obsluha neexistuje
//   num|str - hodnota volané funkce
// onchanged se dědí z položky do jejího formuláře
  fire: function(event_name,args,el) {
    args= args||[];
    var fce= null, res= true, v;
    if ( this.part ) {
      if ( fce= this.part[event_name] ) {
        if ( el && el.control ) {
          Ezer.fce.source(fce);
        }
        else {
          Ezer.trace('e','EVENT:'+this.type+'.'+this.id+'.'+event_name+' in '+Ezer.App.block_info(fce),fce);
//           new Ezer.Eval(fce.code,fce.context||this,args||[],event_name,false,false,fce);
          v= new Ezer.Eval([{o:'c',i:fce.desc._init||event_name,a:args.length}],
            fce.context||this,args,event_name,false,false,fce);
          res= v.simple ? v.value : false;
        }
      };
    }
    if ( this instanceof Ezer.Elem ) {
      var form= this.owner;
      if ( event_name=='onchanged' || !form._changed && event_name=='onchange' ) {
        // některá přerušení se z elementu přenášejí do formuláře: elem.onchange => form.onchanged
        form._changed= true;
        if ( form.part && (fce= form.part['onchanged']) ) {
          Ezer.trace('e','EVENT:form.'+form.id+'.onchanged in '+Ezer.App.block_info(fce),fce);
          v= new Ezer.Eval([{o:'c',i:fce.desc._init||'onchanged',a:args.length}],
            fce.context||form,args,'onchanged',false,false,fce);
          res= res && (v.simple ? v.value : false);
        }
      }
    }
    return res;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  callProc
// provedení procedury, ex-li
  callProc: function(id,args) {
    var fce= null;
    if ( this.part ) {
      if ( fce= this.part[id] ) {
        new Ezer.Eval(fce.code,fce.context||this,args||[],id,false,false,fce,fce.desc.nvar);
      };
    }
    return fce;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  findProc
// nalezení procedury
  findProc: function(id) {
    var fce= null, obj;
    if ( this.part && (obj= this.part[id]) ) {
      fce= function() {
        var EzerEval= new Ezer.Eval(obj.code,this,[],id,false,false,obj,obj.desc.nvar);
        return EzerEval.value;
      }.bind(this);
    }
    return fce;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  findProcArg
// nalezení procedury s 1 argumentem
  findProcArg: function(id) {
    var fce= null, obj;
    if ( this.part && (obj= this.part[id]) ) {
      fce= function(arg) {
        var EzerEval= new Ezer.Eval(obj.code,this,[arg],id,false,false,obj,obj.desc.nvar);
        return EzerEval.value;
      }.bind(this);
    }
    return fce;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _f
// pokud je v atributu 'format' obsažen kod, vrátí jeho pozici, pokud není vrátí -1
// část formátu za ':' ignoruje
// pokud kod==':' vrací část za ':' nebo prázdný string
  _f: function(kod) {
    var f= this.options.format, i= -1;
    if ( f ) {
      f= f.split(':');
      i= kod==':' ? f[1]||'' : f[0].indexOf(kod);
    }
    return i;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _fc
// pokud je v atributu 'format' obsažen kod, vrátí true jinak false; část formátu za ':' ignoruje
  _fc: function(kod) {
    var f= this.options.format, ok= false;
    if ( f ) {
      f= f.split(':');
      ok= f[0].indexOf(kod)>=0;
    }
    return ok;
  }
});
// ================================================================================================= Group
//c: Group ([options])
//      obecný blok bez vizualizace, může obsahovat volně vnořené bloky
//t: Block
//s: Block
Ezer.Group= new Class({
  Extends:Ezer.Block,
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  initialize
  initialize: function(owner,desc,DOM,id) {
    this.parent(owner,desc,DOM,id);
    // vložení podčástí
    this.subBlocks(desc,this.DOM_Block);
  }
});
// ================================================================================================= Main
//c: BlockMain ()
//      $ kořen aplikace
//t: Block
//s: Block
Ezer.BlockMain= new Class({
  Extends: Ezer.Block,
//   Extends: Ezer.BlockMain
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  initialize: function(desc) {
    this.owner= null;
    this.type= '.main.';
    this.id= '$';
    this.desc= desc;
    this._file= '$';
    this.part= {};
    $each(desc.part,function(idesc,id) {
      var part= null;
      switch (idesc.type) {
        case 'menu.main': part= new Ezer.MenuMain(this,idesc,null,id); break;
        case 'panel.main':part= new Ezer.PanelMain(this,desc,null,id); break;
        case 'panel.popup':part= new Ezer.PanelPopup(this,desc,null,id); break;
//         case 'panel':     part= new Ezer.Panel(this,idesc,null,id);    break;
        case 'table':     part= new Ezer.Table(this,idesc,null,id);    break;
        case 'map':       part= new Ezer.Map(this,idesc,null,id);      break;
        // s potenciální vizualizací
        case 'var':       part= new Ezer.Var(this,idesc,null,id);      break;
        // objekt bez vizualizace (ale vložený jako part)
        case 'view':      part= new Ezer.View(this,idesc,null,id);     break;
        case 'group':     part= new Ezer.Group(this,idesc,null,id);    break;
        case 'proc':      part= new Ezer.Proc(this,desc,this);         break;
        // přeskakované (informace dostupné přes Ezer.code)
        case 'form':      break;
        default:
          Ezer.error('neimplementovaný hlavní blok '+idesc.type+' '+id,'C');
      };
      if ( part ) {
        // nově vložená část
        part.id= id;
        this.part[id]= part;
      }
    },this);
    return true;
  }
});
// ================================================================================================= Menu
//c: Menu ([options])
//      varianty implementace zobrazení Menu
//t: Block
//s: Block
Ezer.Menu= new Class({
  Extends: Ezer.Block,
  initialize: function(owner,desc,DOM,id,skill) {
    this.parent(owner,desc,DOM,id,skill);
    if ( this.DOM_add1 ) this.DOM_add1();               // napřed rozvrhne plochu na menu a obsah
    this.subBlocks(desc,this.DOM);                      // vytvoří (příp. vloží) části
    if ( this.DOM_add2 ) this.DOM_add2();               // specificky doplní menu
  }
});
// ------------------------------------------------------------------------------------------------- Menu Main
//c: MenuMain ([options])
//      hlavní menu aplikace, obsahuje Tabs+
//t: Menu,Block
//s: Block
Ezer.MenuMain= new Class({
//oi: MenuMain.active - vnořený Tabs, který má být aktivní hned po startu,
//      hvězdička aktivuje Tabs podle poslední volby uživatele
  Extends: Ezer.Menu,
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  start
//f: MenuMain.start (code,oneval)
  start: function(codes,oneval) {
    this.parent(codes,oneval);
    this.excite();
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  excite
//f: MenuMain.excite ()
//      zajistí prvotní zobrazení menu s vyznačením aktivního
//      podle options.start nebo active, nebo prvního.
//      excituje příslušné submenu - Tabs
  excited: false,
  excite: function () {
    if ( !this.excited ) {
      this.excited= true;
      // najdi aktivní záložku
      var tabs= null, id= null;
      if ( Ezer.options && Ezer.options.start && Ezer.excited<1 ) {
        var ids= Ezer.options.start.split('.');
        id= ids[0];
        tabs= this._part(id);
        Ezer.excited= 1;
      }
      else if ( this.options.active ) {
        if ( this.options.active=='*' ) {
          if ( Ezer.sys.user.options && Ezer.sys.user.options.context
            && Ezer.sys.user.options.context[Ezer.root]) {
            id= Ezer.sys.user.options.context[Ezer.root][0];
            tabs= this._part(id);
          }
        }
        else {
          var ids= this.options.active.split('.');
          id= ids[ids.length-1];
          tabs= this._part(id);
        }
      }
      if ( !tabs ) {
        tabs= this._part('tabs',1);
      }
//                                         Ezer.trace('L','1. exciting '+this.type+' '+this.id+' at '+tabs.id+' ('+Ezer.app.ajax+')');
      // zobraz aktivní záložku
      tabs._focus();
    }
    return 1;
  }
});
// ================================================================================================= Menu Left
//c: MenuLeft ([options])
//      levostranné menu, obsahuje MenuGroup, je vnořeno do Tabs
//t: Menu,Block
//s: Block
Ezer.MenuLeft= new Class({
//oi: MenuLeft.active - vnořený Item, který má být aktivní hned po startu, hvězdička aktivuje první item
  Extends: Ezer.Menu,
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  start
//f: MenuLeft.start (code,oneval)
  start: function(codes,oneval) {
    this.parent(codes,oneval);
    this.owner.menuleft= this;
  },
// ------------------------------------------------------------------------------------ attach_code
//fm: MenuLeft.attach_code (o)
  attach_code: function (o) {
    // odstraň všechny mimo procedur a proměnných
    for (var i in this.part) {
      var p= this.part[i];
      if ( p instanceof Ezer.Block && p.type!='proc' ) {
        p.delete();
      }
    }
    this.DOM_destroy();                                   // vymaž viditelné prvky
    if ( this.DOM_re1 ) this.DOM_re1();                   //
    this.subBlocks(o,this.DOM,null,'rewrite');            // true => doplnění a přepis
    this.DOM_excite();
//     if ( this.DOM_re2 ) this.DOM_re2();                   // specificky doplní menu
    return true;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  excite
//f: MenuLeft.excite ()
//      zajistí prvotní zobrazení levého menu, vyznačí item s active, nebo první item
  excited: false,
  excite: function () {
    if ( !this.excited ) {
      this.excited= true;
      var ctx= [], obj= null, id;
      if ( Ezer.options && Ezer.options.start && Ezer.excited<3 ) {
        Ezer.excited= 3;
        var ids= Ezer.options.start.split('.');
        if ( ids.length==5 ) {
          var ok= Ezer.run_name(ids[2]+'.'+ids[3]+'.'+ids[4],this,ctx);
          if ( ok )
            obj= ctx[0];
        }
      }
      if ( !obj && (id= this.options.active) ) {
        if ( id=='*' ) {
          // hvězdička aktivuje první item první skupiny
          var gr= this._part('menu.group',1);
          obj= gr ? gr._part('item',1) : 0;
        }
        else {
          Ezer.assert(1==Ezer.run_name(this.options.active,this,ctx)
            ,'LOAD: atribut active neoznačuje item menu');
          obj= ctx[0];
        }
      }
//                                                 Ezer.trace('L','3. exciting '+this.type+' '+obj.id);
      this.DOM_excite(obj);
      if (obj) {
        obj.click(null);
      }
    }
    return 1;
  }
});
// ------------------------------------------------------------------------------------------------- Menu Group
//c: MenuGroup ([options])
//      obsahuje Item+ je vnořeno do MenuLeft
//t: Menu,Block
//s: Block
Ezer.MenuGroup= new Class({
  Extends: Ezer.Menu
});
// ------------------------------------------------------------------------------------------------- Menu Context
//c: MenuContext ([options])
//      obsahuje Item+ je vnořeno do libovolného bloku, vyvolává se levým klikem nebo dvojklikem
//t: Menu,Block
//s: Block
Ezer.MenuContext= new Class({
  Extends: Ezer.Menu
});
// ================================================================================================= Tabs
//c: Tabs ([options])
//      Tabs jsou záložky obsahující vzájemně se skrývající panely (lze i bez panelů - logoff)
//      má varianty podle elementu, ve kterém je obsažen
//      pokud je v Menu typu main  -- zobrazí se v základní ploše
//      pokud je v Panel           -- zobrazí se v daném panelu
//t: Block
//s: Block
Ezer.Tabs= new Class({
  Extends:Ezer.Block,
  options: {
//os: Tabs.title - název záložky
    title:''
//oi: Tabs.active - vnořený panel, který má být aktivní hned po startu
  },
  active: false,                        // this je aktivní (viz _show,_hide)
  activePanel: null,                    // aktivní Panel v Tabs
  initialize: function(owner,desc,DOM,id,skill) {
    this.parent(owner,desc,DOM,id,skill);
    this.DOM_add1();
    // vložení podčástí
    this.subBlocks(desc,this.DOM_Block,this.addTabDom);
    this.DOM_add2();
  },
// ------------------------------------------------------------------------------------ focus
//fm: Tabs.focus ()
//      nastavení záložky jako zvolené
  focus: function () {
    this._focus();
    return true;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  excite
//f: Tabs.excite ()
//      zajistí prvotní zobrazení submenu, excituje panel s active, nebo první panel
  excited: false,
  excite: function () {
    if ( !this.excited ) {
      this.excited= true;
      // zobraz aktivní podmenu
      this.DOM_excite();
      // pokud je definován atribut active a tab je aktivní
      if ( Ezer.options && Ezer.options.start && Ezer.excited<2 ) {
        var ids= Ezer.options.start.split('.');
        if ( ids.length>1 ) {
          id= ids[1];
          panel= this._part(id);
          Ezer.excited= 2;
          Ezer.assert(panel instanceof Ezer.Panel,'"'+ids[0]+'.'+id+'" v parametru menu neoznačuje panel');
        }
      }
      else if ( this.options.active && this.active ) {
        var panel= null, path;
        if ( this.options.active=='*' ) {
          if ( Ezer.sys.user.options && Ezer.sys.user.options.context &&
            (path= Ezer.sys.user.options.context[Ezer.root]) ) {
            if ( this.id==path[0] && this.part && this.part[path[1]] ) {
              panel= this.part[path[1]];
            }
          }
        }
        else {
          var ctx= [];
          Ezer.assert(1==Ezer.run_name(this.options.active,this,ctx)
            ,'LOAD: atribut active neoznačuje panel tabs');
          panel= ctx[0];
        }
      }
      if ( !panel ) {
        panel= this._part('panel',1);
        if ( this instanceof Ezer.Tabs && !panel )
          Ezer.error('v menu '+(this.options.title||this.id)+' není přístupné žádné podmenu');
      }
//                         Ezer.trace('L','2. exciting '+this.type+' '+this.id+' at '+panel.id+' ('+Ezer.app.ajax+')');
      Ezer.assert(panel,'problém při excite pro '+this.type+' '+this.id);
      panel.focus();
      panel.excite();                          // pro první zobrazení
    }
    return 1;
  }
});
// ================================================================================================= Item
//c: Item ([options])
//      Item je vnořitelný do Menu
//t: Block
//s: Block
//i: Item.onclick - item byl vybrán
Ezer.Item= new Class({
  Extends: Ezer.Block,
//oo: Item.par - parametr itemu
  initialize: function(owner,desc,DOM,id,skill) {
    this.parent(owner,desc,DOM,id,skill);
    this.DOM_add1();
    this.subBlocks(desc,DOM);
    this.DOM_add2();
  },
//fm: Item.click ([only])
//      nastavení položky jakoby kliknuté vč. vyvolání onclick; pokud je only tak zavře jiné skupiny
  click: function(only) {
    if ( only ) {
      $each(this.owner.owner.part,function(group,id) {        // projdi skupiny
        if ( group.type=='menu.group' ) {
          group._fold();
        }
      });
    }
    this._show();               // zajisti zobrazení itemu
    this._click();
    return 1;
  }
});
// ================================================================================================= Panel
// ------------------------------------------------------------------------------------------------- Panel
//c: Panel
//      Panel přímo vnořený do Tabs, reaguje na události Tabs (onfocus,onblur)
//t: Block,Panel
//s: Block
//i: Panel.onfirstfocus - panel se poprvé stal viditelný, v tomto případě nenastane onfocus
//i: Panel.onfocus - panel se stal viditelný
//i: Panel.onblur - panel přestal být viditelný
Ezer.Panel= new Class({
  Extends: Ezer.Block,
  virgin: true,                         // stav před prvním focusem
//os: Panel.include - zdrojový kód je v samostatném souboru
// ; onload  : kód bude zaveden při startu
// ; onclick : až při prvním kliknutí
  initialize: function(owner,desc,DOM,id,skill) {
    this.parent(owner,desc,DOM,id,skill);
    this.DOM_add1();
    this.subBlocks(desc,DOM);
    this.DOM_add2();
  },
// ------------------------------------------------------------------------------------ focus
//fm: Panel.focus ([par])
//      bez parametru nastaví panel jako aktivní vč. vyvolání onfocus
//        (par=1 způsobí totéž ale bez onfocus).
//      Pokud je par='fix' resp. 'unfix' zablokuje resp. odblokuje panel proti ztrátě fokusu při
//         pokusu vybrat myší jiný panel v témže Tabs.
//      Pokud par='fixed' pak funkce vrátí takto stav jako 1 pro 'fix' resp. 0 pro 'unfix'.
//      Všechny funkce se týkají pouze panelů zanořených do bloku Tabs.
//a: par - 1|'fix'|'unfix'
  is_fixed: 0,
  focus: function (par) {
    var value= 1;
    if ( this.owner.type=='tabs' ) {
      if ( par=='fix' )
        this.is_fixed= 1;
      else if ( par=='unfix' )
        this.is_fixed= 0;
      else if ( par=='fixed' )
        value= this.is_fixed;
      else {
        this.owner._focus();
        this._focus(par);
      }
    }
    return value;
  },
// ------------------------------------------------------------------------------------ popup
//fm: Panel.popup (l,t)
//      Ukáže panel.
  popup: function (l,t) {
    this._show(l,t);
    return 1;
  },
// ------------------------------------------------------------------------------------ hide
//fm: Panel.hide ([value])
  hide: function (value) {
    this._hide();
    return 1;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  excite
//f: Panel.excite ()
//      zajistí prvotní zobrazení panelu
  excited: false,
  excite: function () {
    if ( !this.excited ) {
      this.excited= true;
    }
    return 1;
  }
});
// ================================================================================================= PanelMain
//c: PanelMain
//      Panel jako hlavní blok aplikace
//t: Block,Panel
//s: Block
Ezer.PanelMain= new Class({
  Extends: Ezer.Panel
});
// ================================================================================================= PanelPlain
//c: PanelPlain
//      Panel přímo vnořený do Tabs, reaguje na události Tabs (onfocus,onblur),obsahuje MenuLeft
//t: Block,Panel
//s: Block
//i: PanelPlain.onfirstfocus - panel se poprvé stal viditelný, v tomto případě nenastane onfocus
//i: PanelPlain.onfocus - panel se stal viditelný
//i: PanelPlain.onblur - panel přestal být viditelný
Ezer.PanelPlain= new Class({
  Extends: Ezer.Panel
});
// ================================================================================================= PanelRight
//c: PanelRight
//      Panel přímo vnořený do Tabs, reaguje na události Tabs (onfocus,onblur),obsahuje MenuLeft
//t: Block,Panel
//s: Block
//i: PanelRight.onfirstfocus - panel se poprvé stal viditelný, v tomto případě nenastane onfocus
//i: PanelRight.onfocus - panel se stal viditelný
//i: PanelRight.onblur - panel přestal být viditelný
Ezer.PanelRight= new Class({
  Extends: Ezer.Panel,
  menuleft: null,                                       // levostranné menu
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  excite
//f: PanelRight.excite ()
//      zajistí prvotní zobrazení panelu a levého menu
  excite: function () {
    if ( !this.excited ) {
      this.parent();
      if ( this.menuleft )
        this.menuleft.excite();
    }
    return 1;
  }
});
// ================================================================================================= PanelPopup
//c: PanelPopup
//      pokud je Panel vnořen do Tabs reaguje i na události
//t: Block
//s: Block
//i: PanelPopup.onfirstfocus - panel se poprvé stal viditelný, v tomto případě nenastane onfocus
//i: PanelPopup.onfocus - panel se stal viditelný
//i: PanelPopup.onblur - panel přestal být viditelný
//oo: PanelPopup.par - {close:'no'} zakáže zavírací tlačítko
Ezer.PanelPopup= new Class({
  Extends: Ezer.Panel,
  continuation: null,                   // bod pokračování pro modální dialog
// -------------------------------------------------------------------------------------- modal
//fi: PanelPopup.modal ([l,t[,title]])
//      ukáže panel jako modální dialog. Další příkaz bude interpretován až po uzavření dialogu.
//      Uzavření dialogu je provedeno funkcí hide, jehož argument se stane
//      hodnotou modal.
//a: l,t - poloha, pokud je vynechána bude dialog vycentrovám
//   title - volitelný nadpis, pokud má být odlišný od panel.title
  modal: function (l,t,title) {
    this._show(l,t,0,title);
    // pokud vrátí false pokračuje interpret další instrukcí; pokud vrátí objekt, uloží
    // do jeho continuation interpret stav, metody tohoto objektu mohou pokračovat ve výpočtu
    this.DOM_modal(1);
    return this;
  },
// -------------------------------------------------------------------------------------- hide
//fm: PanelPopup.hide ([value])
  hide: function (value) {
    this.parent();
    if ( this.continuation ) {
      // konec modálního dialogu
      this.DOM_modal(0);
      this.continuation.stack[++this.continuation.top]= value;
      this.continuation.eval.apply(this.continuation,[0,1]);
      this.continuation= null;
    }
    return 1;
  }
});
// aliasy
//fm: PanelPopup.close ([value])
Ezer.PanelPopup.prototype.close= Ezer.PanelPopup.prototype.hide;
// ================================================================================================= Var
//c: Var
//      proměnná si ponechává pouze jméno - ostatní znaky přejímá ze své hodnoty
//t: Block
//s: Block
Ezer.Var= new Class({
  Extends:Ezer.Block,
//os: Var.format - vzhled pro use form
//  ; 'n' : display=none
  value: null,
  initialize: function(owner,desc,DOM,id) {
    this.parent(owner,desc,DOM,id);
    this._of= desc._of;
    if ( desc._init ) {
      if ( desc._of=='form' ) {
        var name= desc._init;
        var ctx= Ezer.code_name(name,null,this);
        Ezer.assert(ctx,name+' je neznámé jméno - očekává se jméno form');
        Ezer.assert(ctx[0].type=='form',name+' není jméno form');
        var form= new Ezer.Form(this,ctx[0],DOM,this.options,ctx[0].id);
        this.set(form);
        this.value.id= id;
      }
      else if ( Ezer.Area && desc._of=='area' ) {
        var name= desc._init;
        var ctx= Ezer.code_name(name,null,this);
        Ezer.assert(ctx,name+' je neznámé jméno - očekává se jméno area');
        Ezer.assert(ctx[0].type=='area',name+' není jméno area');
        // nalezneme panel
        var panel= null;
        for (var o= this.owner; o; o= o.owner) {
          if ( o.type.substr(0,5)=='panel' ) {
            panel= o;
            break;
          }
        }
        if ( panel && panel.DOM_Block ) {
          // vyvoření area bez události area_oncreate
          var area= new Ezer.Area(panel,ctx[0],panel.DOM_Block,this.options,ctx[0].id,[],true);
          this.set(area);
          this.value.id= id;
        }
        else Ezer.error("area není vnořena do panelu");
      }
    }
    // vložení případných podčástí (např. přepisu těl procedur)
    this.subBlocks(desc,this.DOM_Block);
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  start
//f: Var.start (code,oneval)
  start: function(codes,oneval) {
    this.parent(codes,oneval);
    if ( this._of=='form' && this.value ) {
      this.value.start(codes,oneval);
    }
  },
// ------------------------------------------------------------------------------------ set
//fm: Var.set (val[,part])
//      nastaví hodnotu proměnné, pokud je typu object pak part určuje podsložku
  set: function (val,part) {
    if ( part!==undefined ) {
      Ezer.assert(this.value===null || $type(this.value)=='object',
        'set s 2.parametrem lze použít jen na objekty',this);
      var is= typeof(part)=='string' ? part.split('.') : [part], v;
      v= this.value||{};
      for (var i= 0; i<is.length-1; i++) {
        if ( typeof(v[is[i]])!='object' )
          v= v[is[i]]= {};
        else
          v= v[is[i]];
      }
      v[is[i]]= val;
    }
    else {
      this.value= val;
    }
    return 1;
  },
// ------------------------------------------------------------------------------------ get
//fm: Var.get ([part])
//      vrátí hodnotu proměnné, part může být složené jméno je-li hodnotou objekt
//      (pokud part neurčuje složku objektu, funkce vrátí '')
  get: function (part) {
    var v;
    if ( this.value===null )
      v= 0;
    else if ( part ) {
      Ezer.assert($type(this.value)=='object','get s parametrem lze použít jen na objekty',this);
      v= this.value;
      $each(part.split('.'),function(i) {
//         Ezer.assert(v[i]!==undefined,'get s parametrem '+part+' nelze použít',this);
        if ( v[i]=='' )
          v= '';
        else
          v= v[i]===undefined ? '' : v[i];
      },this)
    }
    else
      v= this.value;
    return v===false ? 0 : v;
  }
});
// ================================================================================================= View
//c: View
//      proměnná si ponechává pouze jméno - ostatní znaky přejímá ze své hodnoty
//t: Block
//s: Block
Ezer.View= new Class({
//os: View.join_type  - volba typu JOIN, nejčastěji LEFT
//-
//os: View.join - fráze za JOIN včetně ON nebo USING
//-
  Extends:Ezer.Block,
  initialize: function(owner,desc,DOM,id) {
    this.parent(owner,desc,DOM,id);
    this._of= desc._of;
    if ( desc._init ) {
      // var v: form id
      var id= desc._init;
      var ctx= Ezer.code_name(id,null,this);
      Ezer.assert(ctx && ctx[0],id+' je neznámé jméno  - očekává se jméno table');
      Ezer.assert(ctx[0].type=='table',id+' není jméno table');
      this.value= ctx[0];
      this.value.id= id.split('.').getLast();
    }
  },
// ------------------------------------------------------------------------------------ key
//fm: View.key ([key_val])
//      pokud je key definováno, tak nastaví view.key, pokud je nedefinováno, vrátí aktuální hodnotu
//      (lze použít jen pro Var typu view)
  key: function (key) {
    if ( key!==undefined ) {
      // definuj hodnotu klíče
      this._key= $type(key)=='string' ? Number(key) : key;
      key= 1;
    }
    else {
      key= this._key;
    }
    return key;
  },
// ------------------------------------------------------------------------------------ json
//fm: View.json ([obj][changed_only])
//      jako getter navrátí objekt obsahující hodnoty elementů (pro select klíče), které mají některý
//      z atributů data,expr,value - pokud je changed_only==1 pak vrací jen změněné hodnoty;
//      jako setter nastaví podle parametru (který musí být typu objekt) hodnoty (pro select klíče)
//      view
//r: y - {name:value,...} pro getter; 1/0 pro setter (0 při selhání)
  json: function(obj) {
     return Ezer.Form.prototype.json.call(this,obj);    // využijeme společný kód z Ezer.Form
  },
// ------------------------------------------------------------------------------------ copy
//fm: View.copy ()
//      vynuluje klíč použití formuláře a nastaví všechny položky jako změněné (nevyvolává onchange)
//      pokud mají v atributu data použito toto view
  copy: function () {
    this._key= null;                      // vynuluj klíč view => místo save bude insert
    for (var ie in this.owner.part) {     // projdi elementy fomuláře a nastav je jako změněné
      var field= this.owner.part[ie];
      if ( field.view==this && field.change && field.data ) {
//       if ( field._load && field.data && field.view==this ) {
//         if ( ['field','field.date','edit','select.map','check','radio','chat'].contains(field.type) )
          field.change(1);
      }
    }
    return true;
  },
// ------------------------------------------------------------------------------------ init
//fm: View.init ([init_values=0])
//      nastaví elementy svázané s daty použití formuláře na prázdné
//      nebo pro init_values==1 na defaultní hodnoty
//      nebo pro init_values==2 na defaultní hodnoty s nastavením elementů jako change
//a: init_values==1 : nastaví hodnoty podle atributu value
  init: function(init_values) {
    this._key= null;                      // vynuluj klíč => místo save bude insert
    this._changed= false;                 // bude true po změně nějaké položky
    for (var ie in this.owner.part) {           // projdi elementy, které mají toto view
      var elem= this.owner.part[ie];
      if ( elem.view==this && elem.skill && elem.init ) {
        elem.init(init_values);
      }
    }
    return 1;
  },
// ------------------------------------------------------------------------------------ load
//fx: View.load ([key_val=view.key])
//      přečte položky formuláře, které mají v atributu data použito toto view
//      ostatní položky formuláře zůstanou nezměněné (položky s expr jsou vynechány
//      i když používají pouze toto view).
//      Pokud je není key_val definováno, použije aktuální hodnotu klíče
//      (metoda nevyvolává onload)
  load: function(key_val) {
    Ezer.assert(this.value.options.key_id,'table referované přes view chybí definice key_id',this);
    // vytvoř parametry dotazu
    var key= key_val||this._key;
    Ezer.assert(!isNaN(key),'view.load nemá číselný klíč věty',this);
    var table= this.value;
    var x= {cmd:'form_load', key:key, key_id:table.options.key_id,
      db:table.options.db||'', table:table.id, fields:[], joins:{}};
    $each(this.owner.part,function(field,id) {
      if ( field._load && field.data && field.view==this ) {
        var desc= {id:field.id,field:field.data.id};
        if ( field.options && field.options.sql_pipe!==''
           && ((pipe= field.options.sql_pipe) || (pipe= field.data.options.sql_pipe)) ) {
          desc.pipe= pipe;
        }
        x.fields.push(desc);
      }
    },this);
    if ( !x.fields.length )
      Ezer.error('chybný kontext pro view_load');
    return x;
  },
  load_: function(y) {
    // zpracování výsledku dotazu
    this._key= y.key;
    if ( this._key ) {
      var field;
      $each(this.owner.part,function(field,id) {
        if ( field.data && field.view==this ) {
          if ( y.values[id]===undefined || y.values[id]===null )
            field.init();                               // inicializuj hodnoty
          else
            field._load(y.values[id],this._key);        // ulož hodnoty
        }
      },this);
    }
    return this._key ? 1 : 0;
  },
// ------------------------------------------------------------------------------------ save
//fx: View.save ()
//      zapíše změněné položky formuláře, které mají v atributu data použito toto view,
//      pokud nejsou takové položky vrátí 0, jinak vrátí 1
//      (metoda nevyvolává onsave)
// Pozn. Odlišné posouzení 'changed' u elementů typu EditHtml je upřesněno u EditHtml.changed
  save: function () {
    var x= null, table= this.value, changes= 0;
    ok= false;
    if ( this._key ) {
      var fields= [], field, data, pipe;
      $each(this.owner.part,function(field,id) {
        if ( field.changed && field.changed() && field.data && field._save && field.view==this ) {
          // pošli jen změněné položky tohoto view
          var vmo= field._save();
          desc= {id:field.data.id,val:vmo.val};
          if ( vmo.mode) desc.mode= vmo.mode;
          if ( vmo.old) desc.old= vmo.old;
          if ( field.options.sql_pipe!==''
            && (pipe= field.options.sql_pipe) || (pipe= field.data.options.sql_pipe) )
            desc.pipe= pipe;
          fields.push(desc);
          changes++;
        }
      },this);
      if ( changes ) {
        x= {cmd:'form_save', db:table.options.db||'', table:table.id,
          key_id:table.options.key_id, key:this._key, fields:fields};
      }
      else
        x= null;
    }
    else
      Ezer.error("RUN ERROR 'view.save' - nulový klíč");
    return x;
  },
  save_: function () {
    return 1;
  },
// ------------------------------------------------------------------------------------ insert
//fx: View.insert ([all])
//      vytvoření nového záznamu ze změněných položek (pokud all=1 pak ze všech )
//      které mají v atributu data použito toto view
//      (metoda nevyvolává onsave)
//r: y - klíč vytvořeného záznamu, vznikl-li formou auto_increment, nebo 1; 0 při neúspěchu
//a: all - 1 vynutí uložení všech položek
  insert: function (all) {
    var x= null, table= this.value;
    var fields= [], pipe;
    $each(this.owner.part,function(field,id) {
      if ( (all || field.changed && field.changed()) && field.data && field._save && field.view==this ) {
        // pošli jen položky tohoto view
        var vmo= field._save();
        desc= {id:field.data.id,val:vmo.val};
        if ( vmo.mode) desc.mode= vmo.mode;
        if ( field.options.sql_pipe!==''
          && (pipe= field.options.sql_pipe) || (pipe= field.data.options.sql_pipe) )
          desc.pipe= pipe;
        fields.push(desc);
      }
    },this);
    x= {cmd:'form_insert', db:table.options.db||'', table:table.id, fields:fields};
    return x;
  },
  insert_: function (y) {
    this._key= y.key;
    return y.key;
  }
});
// ================================================================================================= Proc
// ------------------------------------------------------------------------------------------------- Proc
//c: Proc
//      procedura, obsluha událostí (zatím onstart) může mít uvedenu prioritu
//t: Block
//s: Block
Ezer.Proc= new Class({
  Extends:Ezer.Block,
//oc: Proc.code - kód procedury
//oc: Proc.prior - priorita procedury (jen pro onstart)
//oc: Proc.context - kontext procedury (pro řešení významu jmen) tj. místo definice
  initialize: function(owner,desc,context) {
    this.parent(owner,desc);
    this.code= desc.code;
    this.prior= this.options && this.options.prior ? this.options.prior : 0;
    this.context= context;
  },
  reinitialize: function(desc) {
    this.code= desc.code;
  }
});
// ================================================================================================= Table
//c: Table ([options])
//      MySQL tabulka
//t: Block
//s: Block
Ezer.Table= new Class({
//os: Table.db - jméno databáze, pokud se liší od hlavní
  Extends:Ezer.Block,
//os: Table.key_id - primární klíč, pokud má jiný tvar než 'id_'+jméno tabulky
  initialize: function(owner,desc,context,id) {
    this.parent(owner,desc,context,id);
//     this.key_id= this.options.key_id || 'id_'+this.id;
  },
// ------------------------------------------------------------------------------------ delete_record
//fx: Table.delete_record (cond[,count=1])
// smazání 1 záznamu z tabulky v kontextu (hlásí chybu pokud podmínka cond specifikuje více záznamů - a nesmaže)
//a: cond - podmínka
//r: y - ok
  delete_record: function (cond,count) {
    var x= {cmd:'delete_record', db:this.options.db||'', table:this.id, cond:cond, count:count||1};
    return x;
  },
  delete_record_: function (y) {
    return y.ok;
  },
// ------------------------------------------------------------------------------------ insert_record
//fx: Table.insert_record ({id:val,...})
//      přidá do tabulky nový záznam naplněný podle objektu
//a: couples - objekt s dvojicemi název_polozky:hodnota_polozky
//r: y - klíč vytvořeného záznamu, vznikl-li formou auto_increment, nebo 1; 0 při neúspěchu
  insert_record: function (couples) {
    var x= {cmd:'insert_record', db:this.options.db||'', table:this.id, par:couples};
    return x;
  },
  insert_record_: function (y) {
    return y.ok;
  }
});
// ================================================================================================= map
// ------------------------------------------------------------------------------------------------- Map
//c: Map ([options])
//      map m: table t {where: ... order:... key:...}
//      zpřístupnění obsahu tabulky v klientovi, používá se zpravidla pro číselníky
//t: Block
//s: Block
Ezer.Map= new Class({
  Extends:Ezer.Block,
  options: {
//os: Map.where  - výběrová podmínka, default 1
    where:1,
//os: Map.order  - pořadí, default ''
    order:'',
//os: Map.key_id - vybírající položka (klíč), default je první pole tabulky
    key_id:''
  },
  data: {},
  initialize: function(owner,desc,context,id) {
    this.parent(owner,desc,context,id);
    this.start_code.code[0].i= this.self();
    var ctx= Ezer.code_name(desc._init,null,this);
    Ezer.assert(ctx && ctx[0].type=='table',desc._init+' je chybné jméno table v map '+this.id);
    this.table= ctx[0];
    if ( !this.options.key_id )
      this.options.key_id= firstPropertyId(this.table.part);
//                                                 Ezer.trace('L','initialize map '+this.id);
  },
// ------------------------------------------------------------------------------------ map_load
//fx: Map.map_load ([cond])
//      interní metoda spouštěná přes onstart (podle start_code) a z metody SelectMap.selects;
//      cond je nepovinná podmínka na položky tabulky _cis
//a: x - {table:..,cond:...,order:...}
//   y - {values:[[id1:val1,...]...],rows:...}
  start_code: {level:'map',code:[{o:'o',i:'?'},{o:'x',i:'map_load'}]},
  map_load: function(cond) {
    // vytvoř parametry dotazu
    var where= this.options.where + (cond ? ' AND '+cond : '');
    var x= {cmd:'map_load',table:this.table.id,where:where,order:this.options.order};
    if ( this.table.options.db ) x.db= this.table.options.db;
    return x;
  },
  map_load_: function(y) {
    // zpracování výsledku dotazu do tabulky data: key -> data
    this.data= {};                              // vyprázdni starý obsah
    this.data_order= {};
    for (var i= 1; i<=y.rows; i++) {
      for (var vi in y.values[i]) {
        if ( !this.data[vi] ) this.data[vi]= {};
        var key= y.values[i][this.options.key_id];
        this.data_order[i]= key;
        this.data[vi][key]= y.values[i][vi];
      }
    }
                                                Ezer.trace('L','loaded map '+this.id);
//                                                         Ezer.debug(this.data);
    return y.rows;
  },
// ------------------------------------------------------------------------------------ get
//fm: Map.get (key[,položka='hodnota'])
//      vrátí textovou hodnotu klíče podle dané mapy (resp. udanou položku tabulky mapy)
  get: function (key,map_field) {
    map_field= map_field||'hodnota';
    var ret= '';
    if ( this.data[map_field] )
      ret= this.data[map_field][key] || '';
    else
      Ezer.error("map.get '"+map_field+"' je neznámá položka mapy "+this.id);
    return ret;
  }
});
// ================================================================================================= CONST
// ------------------------------------------------------------------------------------------------- const
//c: Const ()
//      přeložený blok const
//t: Block
//s: Block
Ezer.Const= new Class({
  Extends: Ezer.Block,
  options: {},
  value: null,
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  initialize
  initialize: function(owner,desc,DOM,id,skill) {
    this.parent(owner,desc,DOM,id,skill);
    this.value= Ezer.const_value(id,this.options.value);
  },
// ------------------------------------------------------------------------------------ get
//fm: Const.get ()
//      navrací hodnotu konstanty
  get: function () {
    return this.value;
  }
});
// ================================================================================================= Form
//c: Form ([options])
//      formulář
//t: Block
//s: Block
//i: Form.onload - po načtení formuláře (metodou load)
//i: Form.onsave - před uložením formuláře (v těle nesmí být asynchronní funkce)
Ezer.Form= new Class({
  Extends:Ezer.Block,
  _key: null,                           // klíč aktivního záznamu
  _key_id: null,                        // jméno klíče
  _changed: false,                      // po init.load,insert byl změněn nějaký element
  _option: {},                          // stav formuláře, ovládaný z EzerScriptu
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  initialize
  initialize: function(owner,desc,DOM,options,id) {
    this.parent(owner,desc,DOM,id);
    this.setOptions(options);
//                                                 Ezer.debug(this.options,'výsledné options');
    this._coord();
    this.DOM_add1();
    // vložení podčástí
    this.subBlocks(desc,this.DOM_Block);
    this.DOM_add2();
  },
// ------------------------------------------------------------------------------------ init
//fm: Form.init ([init_values=0])
//      nastaví elementy svázané s daty použití formuláře na prázdné
//      nebo pro init_values==1 na defaultní hodnoty
//      nebo pro init_values==2 na defaultní hodnoty s nastavením elementů jako change
//a: init_values==1 : nastaví hodnoty podle atributu value
  init: function(init_values) {
    this._key= null;                      // vynuluj klíč => místo save bude insert
    this._changed= false;                 // bude true po změně nějaké položky
    for (var ie in this.part) {           // projdi elementy
      var elem= this.part[ie];
      if ( elem.skill && elem.init ) {
        elem.init(init_values);
      }
    }
    return 1;
  },
// ------------------------------------------------------------------------------------ plain
//fm: Form.plain ()
//      odstraní příznak změny ze všech přístupných  elementů formuláře
  plain: function() {
    this._changed= false;                 // bude true po změně nějaké položky
    for (var ie in this.part) {           // projdi elementy
      var elem= this.part[ie];
      if ( elem.skill && elem.plain ) {
        elem.plain();
      }
    }
    return 1;
  },
// ------------------------------------------------------------------------------------ focus
//fm: Form.focus ()
//      označení prvního elementu formuláře
  focus: function () {
    for (var ie in this.part) {           // projdi elementy a najdi první s funkcí focus
      if ( this.part[ie].focus ) {
        this.part[ie].focus();            // a proveď ji
        break;
      }
    }
    return 1;
  },
// ------------------------------------------------------------------------------------ json
//fm: Form.json ([obj][changed_only])
//      jako getter navrátí objekt obsahující hodnoty elementů (pro select klíče), které mají některý
//      z atributů data,expr,value - pokud je changed_only==1 pak vrací jen změněné hodnoty;
//      jako setter nastaví podle parametru (který musí být typu objekt) hodnoty (pro select klíče)
//      form
//r: y - {name:value,...} pro getter; 1/0 pro setter (0 při selhání)
  json: function(obj) {
    // kód je společný i pro View.json
    var top_part= this instanceof Ezer.Form ? this.part : this.owner.part;
    var top_view= this instanceof Ezer.Form ? null : this;
    if ( obj && obj!=1 ) {
      // setter
//                                                 Ezer.debug(obj,'form.json=');
      var ok= 1;                                // 1 => setter uspěl
      for (var ie in obj) {
        var elem= top_part[ie];
        if ( top_view && elem.view!=top_view )  // pokud this=view testuj shodu
          continue;
        if ( elem instanceof Ezer.List ) {      // najdi podformulář List
          if ( typeof(obj[ie])!='object' || elem.last+1<obj[ie].length ) {
            ok= 0;                              // error: element není List, nebo je moc krátký
            break;
          }
          // obj[ie] je správně dlouhé pole, vlož je do List
          for (var ies=0; ies<obj[ie].length; ies++) {
            var sublist= elem.part[ies],
                subobj= obj[ie][ies];
            for (var iese in subobj) {          // najdi element podformuláře List
              var lelem= sublist.part[iese];
              if ( top_view && elem.view!=top_view )  // pokud this=view testuj shodu
                continue;
              if ( !lelem || !lelem.set ) {     // error: neznámý nebo nevhodný element
                ok= 0;                          // pokud délka není dostatečná vrať 0 = error
                break;
              }
              if ( lelem instanceof Ezer.Select )
                lelem.key(subobj[iese]);
              else
                lelem.set(subobj[iese]);
            }
          }
        }
        else {
          if ( !elem || !elem.set ) {           // error: neznámý nebo nevhodný element
            ok= 0;                              // pokud délka není dostatečná vrať 0 = error
            break;
          }
          if ( elem instanceof Ezer.Select )
            elem.key(obj[ie]);
          else
            elem.set(obj[ie]);
        }
      }
      obj= ok;
    }
    else {
      // getter
      var changed= obj;
      obj= {};
      for (var ie in top_part) {                // projdi elementy
        var elem= top_part[ie];
        if ( top_view && elem.view!=top_view )  // pokud this=view testuj shodu
          continue;
        if ( elem instanceof Ezer.List ) {
          obj[elem.id]= [];
          for (var ies in elem.part) {          // projdi podformuláře List
            var subform= elem.part[ies];
            var subobj= {};
            for (var iese in subform.part) {    // projdi elementy podformuláře List
              var lelem= subform.part[iese];
              if ( top_view && lelem.view!=top_view )
                continue;                       // pokud this=view testuj shodu
              if ( lelem.skill && lelem.get && (changed ? lelem.changed && lelem.changed() : 1)
                && (lelem.data || lelem.options.expr || lelem.options.value!==undefined) ) {
                subobj[lelem.id]= lelem instanceof Ezer.Select?lelem.key():lelem.get();
              }
            }
            obj[elem.id].push(subobj);
          }
        }
        else if ( elem.skill && elem.get && (changed ? elem.changed && elem.changed() : 1)
          && (elem.data || elem.options.expr || elem.options.value!==undefined) ) {
          obj[elem.id]= elem instanceof Ezer.Select?elem.key():elem.get();
        }
      }
//                                                 Ezer.debug(obj,'form.json');
    }
    return obj;
  },
// ------------------------------------------------------------------------------------ copy
//fm: Form.copy ()
//      vynuluje klíč použití formuláře a nastaví všechny položky jako změněné (nevyvolává onchange)
  copy: function () {
    this._key= null;                      // vynuluj klíč => místo save bude insert
    for (var ie in this.part) {           // projdi elementy a nastav je jako změněné
//       if ( ['field','field.date','edit','select.map','check','radio','chat'].contains(this.part[ie].type) )
      if ( this.part[ie].change )
        this.part[ie].change(1);
    }
    return true;
  },
// ------------------------------------------------------------------------------------ option
//fm: Form.option (key_val)
//      opraví option pro položku 'x' formátu
//a: key_val - key:val
  option: function (key_val) {
    var x= key_val.split(':'), key= x[0], val= x[1].toInt();
    this._option[key]= val||0;
    for (i in this.part) if ( this.type ) {
      var elem= this.part[i];
      if ( elem._f && elem._f('x')>=0 ) {
        // naplň nebo zruš zapamatované hodnoty
        if ( val ) {
          elem._fixed_save();
          elem.DOM_fixed(1);
        }
        else {
          elem.fixed_value= null;
          elem.DOM_fixed(0);
        }
      }
    }
    return true;
  },
// ------------------------------------------------------------------------------------ key
//fm: Form.key ([key])
//      pokud je definováno key tak jej nastaví jako klíč formuláře, vrátí 1
//      pokud není pak vrátí aktuální hodnotu
  key: function (key) {
    if ( key!==undefined ) {
      // definuj hodnotu klíče
      this._key= $type(key)=='string' ? Number(key) : key;
      key= 1;
    }
    else {
      key= this._key;
    }
    return key;
  },
// ------------------------------------------------------------------------------------ id_key
//fm: Form.id_key ()
//      jméno primárního SQL klíče, je definováno voláním metod load, save, insert
  id_key: function() {
    return this._key_id;
  },
// ------------------------------------------------------------------------------------ same
//fm: Form.same ([all=0])
//      vrátí true, pokud v použití formuláře není žádný element s atributem data ve stavu 'changed';
//      pokud je all=1 pak metoda prochází všechny elementy
// Pozn. Odlišné posouzení 'changed' u elementů typu EditHtml je upřesněno u EditHtml.changed
  same: function(all) {
    var same= 1;
    all= all||false;
   parts:
    for (var ie in this.part) {           // projdi elementy
      var elem= this.part[ie];
      if ( elem instanceof Ezer.List ) {
        for (var ies in elem.part) {      // projdi podformuláře List
          var subform= elem.part[ies];
          for (var iese in subform.part) {// projdi elementy podformuláře List
            var lelem= subform.part[iese];
            if ( lelem.changed && lelem.changed() ) {
              if ( !all && lelem.data===undefined )
                continue;
              same= 0;
              break parts;
            }
          }
        }
      }
      else if ( elem.changed && elem.changed() ) {
        if ( !all && elem.data===undefined )
          continue;
        same= 0;
        break parts;
      }
    }
    return same;
  },
// ------------------------------------------------------------------------------------ load
//fx: Form.load ([key_val=form.key,[cond]])
//      načtení dat do skalárních polí formuláře podle hodnoty primárního klíče tabulky
//      nebo podle nepovinné podmínky
//a: key_val - hodnota primárního klíče
//   cond - mysql podminka
  load: function(key_val,cond) {
    // vytvoř parametry dotazu
    var key= key_val||this._key;
    Ezer.assert(!isNaN(key),'form.load nemá číselný klíč věty',this);
    var x= {cmd:'form_load', key:key_val||this._key, fields:[], joins:{}};
    this._changed= false;                 // bude true po změně nějaké položky
    $each(this.part,function(field,id) {
      if ( field._load && (field.data || field.options.expr) )
        this._fillx(field,x);
    },this);
    if ( !x.fields.length )
      Ezer.error('chybný kontext pro form_load');
    this._key_id= x.key_id;
    if ( cond ) x.cond= cond;
    return x;
  },
  load_: function(y) {
    // zpracování výsledku dotazu
    this._key= y.key;
    if ( this._key ) {
      var field;
      $each(this.part,function(field,id) {
        if ( field.data || field.options.expr ) {
          if ( y.values[id]===undefined || y.values[id]===null )
            field.init();                               // inicializuj hodnoty
          else
            field._load(y.values[id],this._key);        // ulož hodnoty
        }
      },this);
      this.fire('onload');                              // proveď akci formuláře po naplnění daty
    }
    return this._key ? 1 : 0;
  },
// ------------------------------------------------------------------------------------ save
//fx: Form.save ()
//      uložení změněných elementů formuláře do záznamu s klíčem form.key.
// Pozn. Odlišné posouzení 'changed' u elementů typu EditHtml je upřesněno u EditHtml.changed
//e: onsave - před uložením formuláře (test nesmí být asynchronní funkce)
  save: function (omitt) {
    var ok= this.fire('onsave');                        // proveď akci před uložením dat
    Ezer.assert(ok!==false,'form.save: test formuláře nesmí být asynchronní funkce');
    var x= null, table= null, changes= 0;
    // pokud kontrola není, nebo skončila úspěšně, pokračujeme v ukládání
    if ( ok ) {
      ok= false;
      if ( this._key ) {
        var fields= [], field, data, table, pipe;
        $each(this.part,function(field,id) {
          if ( !table ) table= field.table;
          if ( field.changed && field.changed() && field.data && field._save ) {
            // pošli jen změněné položky s ošetřenou vazbou na položku
            var vmo= field._save();
            desc= {id:field.data.id,val:vmo.val};
            if ( vmo.mode) desc.mode= vmo.mode;
            if ( vmo.row) desc.row= vmo.row;            // jen pro chat
            if ( vmo.old) desc.old= vmo.old;
            if ( field.options.sql_pipe!==''
              && (pipe= field.options.sql_pipe) || (pipe= field.data.options.sql_pipe) )
              desc.pipe= pipe;
            fields.push(desc);
            changes++;
          }
        },this);
        if ( changes ) {
          x= {cmd:'form_save', db:table.options.db||'', table:table.id,
            key_id:table.options.key_id, key:this._key, fields:fields};
        }
        else Ezer.fce.warning("'save' - nebyla provedena žádná změna");
      }
      else Ezer.error("RUN ERROR 'save' - nulový klíč");
      this._key_id= x ? x.key_id : '';
    }
    return x;
  },
  save_: function () {
    return 1;
  },
// ------------------------------------------------------------------------------------ insert
//fx: Form.insert ([all])
//      vytvoření nového záznamu ze změněných položek (pokud all=1 pak ze všech )
//      s atributem data (metoda předpokládá, že všechna data pocházejí z jedné tabulky,
//      jinak je třeba použít view.insert)
//a: all - 1 vynutí uložení všech položek
//r: y - klíč vytvořeného záznamu, vznikl-li formou auto_increment, nebo 1; 0 při neúspěchu
//e: onsave - před uložením formuláře (test nesmí být asynchronní funkce)
  insert: function (all) {
    var x= null;
    var ok= this.fire('onsave');                        // proveď akci před uložením dat
    this._changed= false;                 // bude true po změně nějaké položky
    Ezer.assert(ok!==false,'form.insert: test formuláře nesmí být asynchronní funkce');
    // pokud kontrola není, nebo skončila úspěšně, pokračujeme v ukládání
    if ( ok ) {
      var fields= [], table, pipe;
      $each(this.part,function(field,id) {
        if ( !table ) {
          table= field.table;
        }
        if ( (all || field.changed && field.changed()) && field.data && field._save ) {
          // pošli (i nezměněné položky) s ošetřenou vazbou na položku
          var vmo= field._save();
          desc= {id:field.data.id,val:vmo.val};
          if ( vmo.mode) desc.mode= vmo.mode;
          if ( field.options.sql_pipe!==''
            && (pipe= field.options.sql_pipe) || (pipe= field.data.options.sql_pipe) )
            desc.pipe= pipe;
          fields.push(desc);
        }
      },this);
      x= {cmd:'form_insert', db:table.options.db||'', table:table.id, fields:fields};
      this._key_id= x.key_id;
    }
    return x;
  },
  insert_: function (y) {
    this._key= y.key;
    return y.key;
  },
// ------------------------------------------------------------------------------------ make
//fx: Form.make (fce,"operace1:field1,field2,...;operace2:...",args...)
// kde operace mohou být
//   save -- položky budou funkcí zapsány
//   load -- data přečtěná funkcí
//   seek -- data budou předána do výběrového seznamu select
//   init -- položky budou naplněny počátečními hodnotami
//   plain -- bude odstraněno (případné) grafické zvýraznění změny hodnoty
// zavolání funkce 'fce' na serveru, která vrací data pro formulář
  make: function () {
//  ... save:pozn;   ... options:jmeno
// args.shift           => fce
// args.split(;)        => sekce
// sekce.split(:)       => operace : fields
// fields.split(,)      => field např.  pozn  ... nest[pozn].options.data
//                                                      save -> {_role.poznamka:'něco'} ... nic
//                                                      load -> {pozn:_role.poznamka} ... {pozn:'něco'}
//                                                      seek -> {jmeno:'concat--'} ... {jmeno:"<ul>--"}
// field.split(.)       =>       např.  firma.key ... nest[firma][key]
//                                                      save -> {firmy.id_firmy:6035} ... nic
// předá se {init:[e:tf,...],
//      save:{e:{tbl:t,fld:f,val:v},...},               -- jen změněné položky
//      put:{e:v,...},                                  -- i nezměněné elementy (bez udání tabulky a položky)
//      load:{e:{tbl:t,fld:f[,prp:p][,exp:x][,pip:p]},...}, -- kde prp je vlastnost (např. 'key'),
//                                                      -- exp výraz obsahující SQL s tbl.fld
//                                                      -- pip je identifikátor pipe
//      seek:{e:ex,...}}
// server vrátí {init:[e:tf,...],load:{e:value,...},seek:{e:value,...}
//      get:{e:value}                                   -- položka dostane hodnotu a je označena jako změněná
//   kde tf=table.table_field, e=elem_field, ex=výraz
    var args= $A(arguments), fce= args.shift(), fields= args.shift();
    var x= {cmd:'form_make', fce:fce, save:{}, put:{}, load:{}, seek:{}, init:{}, plain:{},
      db:'', args:args, nargs:args.length};
    if ( fields ) {
      fields.split(';').each(function(sekce) {
        var s= sekce.split(':');
        s[1].split(',').each(function(fid) {
          var f= {elem:null,info:null,prop:null,tbl:null,fld:null};
          this._field_info(fid,x,f);
          switch (s[0] ) {
          case 'init':
            x.init[f.elem.id]= f.info;
            break;
          case 'put':
            x.put[f.elem.id]= f.prop ? f.elem[f.prop] : f.elem.get();
            break;
          case 'save':
            if ( f.elem._changed ) {
              x.save[f.elem.id]= {tbl:f.tbl,fld:f.fld,val:f.prop ? f.elem[f.prop] : f.elem.get()};
              if ( f.pip ) x.save[f.elem.id].pip= f.pip;
            }
            break;
          case 'plain':
            x.plain[f.elem.id]= 1;
            break;
          case 'load':
            x.load[f.elem.id]= f.exp ? {exp:f.exp} : {tbl:f.tbl,fld:f.fld};
            if ( f.prop ) x.load[f.elem.id].prp= f.prop;
            if ( f.pip ) x.load[f.elem.id].pip= f.pip;
            break;
          case 'seek':
            x.seek[f.elem.id]= f.info;
            break;
          }
        }.bind(this));
      }.bind(this));
    }
//                                                         Ezer.debug(x,'form_make');
    return x;
  },
  make_: function (y) {
    for (var id in y.plain)
      this.part[id].plain();
    for (var id in y.init)
      this.part[id].init();
    for (var id in y.seek) {
      Ezer.assert(this.part[id].type=='select','fráze seek v make vyžaduje element typu select');
      this.part[id].selects(y.seek[id]);
    }
    for (var id in y.load) {
      if ( y.load[id] ) this.part[id].set(y.load[id]); else this.part[id].init();
    }
    for (var id in y.get) {
      this.part[id].set(y.get[id]); this.part[id].change();
    }
//     if ( y.used ) {
//       table= use.root.part[y.used.table];
//       table.add_key(y.used.key);
//     }
    if ( y.key!==undefined )
      this._key= y.key;
    return 1;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _field_info
// fid je id elementu ve form [nebo id.prop], x je vstupně/výstupní objekt,
// e je nalezený element, fi jeho atributy table.data nebo expr, prop je předaná vlastnost e
// pokud prop='key' je v f.info vráceno table.key_id pokud má element atributy data nebo expr
//   jinak je vráceno elem.key
// do f je vrácen f.tbl=název tabulky resp. f.flt=název položky resp. f.exp=výraz resp. f.pip=výraz
  _field_info: function (fid,x,f) {
    var data= null, fp= fid.split('.'), pipe= null; // fid může mít formu elem_id.part
    f.elem= this.part[fp[0]];
    Ezer.assert(f.elem,fp[0]+' je neznámá položka',this);
    if ( (data= f.elem.data) ) {
      if ( f.elem.table ) {
        if ( f.elem.table.options.db ) x.db= f.elem.table.options.db;
        f.tbl= f.elem.table.id;
        f.fld= data.id;
        f.info= f.tbl+'.'+f.fld;
        // zjisti jestli ve form nebo table není požadavek na aplikaci pipe
        if ( f.elem.options.sql_pipe!==''
          && (pipe= f.elem.options.sql_pipe) || (pipe= data.options.sql_pipe) )
          f.pip= pipe;
      }
    }
    if ( f.exp= f.elem.options.expr )
      f.info= f.exp;
    // ošetření spec. vlastností
    f.prop= fp[1];
    if ( f.prop=='key' ) {  // předpokládá atributy data nebo expr
      if ( data ) {
        f.info= data.owner.id+'.'+data.owner.key_id;
      }
//       else if ( f.exp ) {
//         var re, m, table;
//         re= new RegExp('(\\w+)\\.','g');
//         // projdeme použité tabulky - vezmeme první z nich
//         if ( m= re.exec(f.info) ) {
//           table= f.elem.root.part[m[1]];
//           f.info= table.id+'.'+table.key_id;
//         }
//       }
      else {
        f.info= fid;
      }
    }
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _fillx
// doplní do x seznam joins potřebných pro dotaz obsahující data
// x musí mít x.table a x.join:{}
// pokud to_map=true přidá pro server desc.map={field:id,table:id,t_options:..,m_options:..}
  _fillx: function(field,x,to_map) {
    var pipe, desc, expr;
    if ( field.data ) {                         // je atribut data
      desc= {id:field.id};
      if ( !x.table ) {                         // info o table, pokud již v x není
        x.table= field.table.id + (field.view ? ' AS '+field.view.id : '');
        x.key_id= field.table.options.key_id||'id_'+field.table.id;
//         x.key_id= field.table.options.key_id||'id_'+field.table.id;
        x.db= field.table.options.db||'';
      }
      if ( field.view ) {                       // s odkazem přes view
        if ( field.view.options.join ) {
          var xx= x.joins[field.view.id]||false;
          if (!xx ) {
            x.joins[field.view.id]= (field.view.options.join_type||'')+' JOIN '
              + (field.table.options.db ? field.table.options.db+'.' : '')
              + field.table.id
              +' AS '+field.view.id+' '+field.view.options.join;
            this._fillx2(field.view.options.join,x);      // doplní potřebná view/join
          }
        }
        desc.field= field.view.id+'.'+field.data.id;
      }
      else {                                    // s odkazem přes table
        desc.field= field.data.id;
      }
      if ( field.options && field.options.sql_pipe!==''
        && ((pipe= field.options.sql_pipe) || (pipe= field.data.options.sql_pipe)) )
        desc.pipe= pipe;
      if ( to_map && field.map_pipe ) {
        var map= field.map_pipe.map
        desc.map= {field:field.map_pipe.field,table:map.table.id,
          t_options:map.table.options,m_options:map.options};
      }
      x.fields.push(desc);
    }
    else if ( (expr= field.options.expr) ) {
      this._fillx2(expr,x);                     // doplní potřebná view/join
      desc= {id:field.id,expr:expr};
      if ( (pipe= field.options.sql_pipe) )
        desc.pipe= pipe;
      if ( to_map && field.map_pipe ) {
        var map= field.map_pipe.map
        desc.map= {field:field.map_pipe.field,table:map.table.id,
          t_options:map.table.options,m_options:map.options};
      }
      x.fields.push(desc);
    }
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _fillx2
  // doplní do x seznam joins potřebných pro dotaz obsahující expr
  // x musí mít x.table a x.join:{}, formtype=='use'
  // view se poznají podle vzoru \w+\.
  _fillx2: function (expr,x) {
    var re, m, view;
    re= new RegExp('(\\w+)\\.','g');
    while ( m= re.exec(expr) ) {
      for ( var iv in this.part ) {
        view= this.part[iv];
        if ( view.type=='view' && view.id==m[1] ) {
          if ( view.options.join ) {
            // je to view s join
            if ( !x.joins[view.id] ) {
              x.joins[view.id]= (view.options.join_type||'')+' JOIN '
                + (view.value.options.db ? view.value.options.db+'.' : '')
                + view.value.id
                +' AS '+view.id+' '+view.options.join;
              this._fillx2(view.options.join,x); // přidej view použitá v join
            }
          }
          else {
            // je to řídící tabulka
            if ( !x.table ) {
              x.db= view.value.options.db||'';
              x.table= view.value.id+' AS '+view.id;
              x.view= view.id;
              x.key_id= view.value.key_id;
            }
          }
        }
      }
    }
  }
});
// ================================================================================================= části Form
// specifické části formuláře (typicky nenesou hodnotu a události s nimi související)
// ================================================================================================= Label
//c: Label ()
//      textové návěští
//t: Block
//s: Block
//i: Label.onclick - kliknutí na text (nebo obrázek)
Ezer.Label= new Class({
  Extends:Ezer.Block,
//os: Label.title - zobrazovaný text
  options: {},
//-
//os: Label.format - vzhled
//  ; 'c' : 'center' zarovnávat doprostřed
//  ; 'n' : display=none
//  ; 'r' : 'right' zarovnávat doprava
  initialize: function(owner,desc,DOM,id,skill) {
    this.parent(owner,desc,DOM,id,skill);
    this.DOM_add();
    this.subBlocks(desc,this.DOM_Block);
  },
// ------------------------------------------------------------------------------------ set
//fm: Label.set (val)
  set: function (val) {
    this.DOM_set(val);
    return 1;
  },
// ------------------------------------------------------------------------------------ get
//fm: Label.get ()
  get: function () {
    return this.DOM_get();
  }
});
// ======================================================================================= LabelDrop
//c: LabelDrop ()
//      prvek pro kontrolovaný upload souborů na server, kliknutí přeruší přenos
//t: Block,Label
//s: Block
 //i: LabelDrop.ondrop - funkce zavolaná po dokončení vložení souboru
//i: LabelDrop.onload - funkce zavolaná po dokončení přenosu na server
Ezer.LabelDrop= new Class({
  Extends:Ezer.Label,
//os: LabelDrop.title - text zobrazovaný v záhlaví DropBoxu
  options: {
  },
  path: '/',
//-
// ------------------------------------------------------------------------------- LabelDrop.init
// inicializace oblasti pro drop souborů, definice cesty pro soubory
// (začínající jménem a končící lomítkem a relativní k $ezer_root)
//fm: LabelDrop.init (relpath)
  init: function (relpath) {
    this.relpath= relpath;
    this.DOM_init();
    return 1;
  },
// -------------------------------------------------------------------------------- LabelDrop.set
// do oblasti zapíše jména souborů podle parametru
//fm: LabelDrop.set (lst)
//a: lst - seznam jmen souborů (ve složce docs) oddělených čárkou, za jménem souboru může
// následovat po dvojtečce status (např. délka)
  set: function (lst) {
    if ( lst ) {
      lst.split(',').each(function(lst_i) {
        var alst_i= lst_i.split(':');
        this.DOM_addFile({name:alst_i[0],status:alst_i[1]||'ok'});
      }.bind(this));
    }
    return 1;
  },
// -------------------------------------------------------------------------------- LabelDrop.get
// vrátí seznam souborů oddělených čárkou
//fm: LabelDrop.get ()
  get: function () {
    var lst= '', del= '';
    this.DOM_files.each(function(f){
      lst+= del+f.name+':'+f.status;
      del= ',';
    });
    return lst;
  }
});
// ======================================================================================== LabelMap
//c: LabelMap ()
//      prvek pro práci s GoogleMaps a s geo-objekty
//t: Block,Label
//s: Block
Ezer.LabelMap= new Class({
  Extends:Ezer.Label,
  options: {
  },
  continuation: null,   // bod pokračování pro geocode,...
  geocoder: null,       // Google objekt
  geo: null,            // běžný gobjekt pro asynchronní metody
  map: null,            // Google mapa
  // prvky v mapě
  poly: null,           // seznam aktuálních polygonů
  mark: null,           // pole aktuálních značek indexovaných předaným id
  zoom: null,           // aktivní výřez mapy (LatLngBounds)
  rect: null,           // zobrazený obdélník (Polygon)
// ------------------------------------------------------------------------------- LabelMap.init
// inicializace oblasti se zobrazením mapy ČR
//fm: LabelMap.init ([TERRAIN|ROADMAP])
  init: function (type) {
    var stredCR= new google.maps.LatLng(49.8, 15.6);
    var map_id= google.maps.MapTypeId[type||'TERRAIN'];
    var g_options= {zoom:7, center:stredCR, mapTypeId:map_id,
      mapTypeControlOptions:{position: google.maps.ControlPosition.RIGHT_BOTTOM},
      zoomControlOptions:{position: google.maps.ControlPosition.LEFT_BOTTOM}
    };
    this.map= new google.maps.Map(this.DOM_Block,g_options);
    this.poly= null;
    this.rect= null;
    this.mark= {};
    return 1;
  },
// ------------------------------------------------------------------------------- LabelMap.dump
// vytvoří objekt obsahující informaci o počtu značek, polygonů, ...
//fm: LabelMap.dump ()
  dump: function () {
    var visible= 0;
    var viewPort= this.map ? this.map.getBounds() : null;
    if ( viewPort ) {
      for (var i in this.mark) {
        var point= this.mark[i];
        if ( viewPort.contains(point.getPosition()) ) {
          visible++;
        }
      }
    }
    return info= {
      marks: this.mark ? Object.getLength(this.mark) : 0,
      visible: visible,
      polys: this.poly ? this.poly.length : 0,
      bounds: viewPort ? this.get_bounds() : ",;,"
    }
  },
// -------------------------------------------------------------------------------- LabelMap.get
// get('ids') vrátí seznam zobrazených značek
//fm: LabelMap.get (op)
  get: function (op) {
    var ret= del= '';
    switch (op) {
    case 'ids':
      for (var i in this.mark) {
        if ( this.mark[i].id && this.mark[i].id!==undefined ) {
          ret+= del+this.mark[i].id;
          del= ',';
        }
      }
      break;
    }
    return ret;
  },
// -------------------------------------------------------------------------------- LabelMap.set
// zobrazí v mapě informace předané objektem geo
//   set({mark:'mark*'[,ezer]...) - doplní do mapy značky s informacemi podle popisu
//                                  k vytvořeným značkám přidá případně objekt ezer
//   set({poly:'bod+',...})    - doplní do mapy polygon podle seznamu bodů oddělovaných středníky
//   set({zoom:'bod;bod',...}) - zvětší mapu aby byl právě vidět (nezobrazený) obdélník SW;NE
//   set({rect:'bod;bod',...}) - zobrazí ohraničující obdélník SW;NE
// prázdný řetezec předaný pro mark, zoom, rect, poly se interpretuje jako žádost o smazání
// mark = id,lat,ltd[,title[,icon]]
// id   = nenulový klíč
// bod  = lat,ltd
// icon = CIRCLE[,scale:1-10][,ontop:1]|cesta k bitmapě
//fm: LabelMap.set (gobject)
  set: function (geo) {
    var ret= 1;
    // -------------------------------------------- MARK
    if ( geo.mark == '' && this.mark ) {                // zruš všechny značky
      Object.each(this.mark,function(m){m.setMap(null)});
      this.mark= {};
    }
    else if ( geo.mark ) {                              // přidej nové značky
      ret= null; // vrátíme vytvořený marker, pokud se to povede
      Ezer.assert(geo && typeof(geo.mark)=='string',
        "LabelMap.set má chybný argument mark "+typeof(geo.mark)+" místo string");
      var label= this;
      geo.mark.split(';').map(function(xy) {
        var p= xy.split(',');
        var id= p[0];
        var ll= new google.maps.LatLng(p[1],p[2]);
        var map_opts= {position:ll,map:this.map};
        if ( p[3] ) map_opts.title= p[3];               // přidá label
        if ( p[4] ) {
          // přidá ikonu - buď bitmapa, nebo CIRCLE a následuje barva fill a barva border
          if ( p[4]=='CIRCLE' ) {
            map_opts.icon= {
              path: google.maps.SymbolPath.CIRCLE, scale: 7,
              fillColor: p[5], fillOpacity: 0.8, strokeColor: p[6], strokeWeight: 1
            }
            if ( p[7] )
              map_opts.zIndex= google.maps.Marker.MAX_ZINDEX + 1;
            if ( p[8] )
              map_opts.icon.scale= p[8];
          }
          else {
            map_opts.icon= p[4];
          }
        }
        if ( geo.ezer ) map_opts.ezer= geo.ezer;        // přidá hodnoty složky ezer
        ret= mark= new google.maps.Marker(map_opts);    // vrací se vytvořený marker
        if ( this.mark[id] ) {
          this.mark[id].setMap(null);                   // případný marker se stejným id vymaž
        }
        this.mark[id]= mark;
        mark.id= id;
        // pokud existuje obsluha onmarkclick, přidej listener
        if ( this.part && this.part.onmarkclick ) {
          google.maps.event.addListener(mark,'click', function() {
            label._call(0,'onmarkclick',this);
          });
        }
      }.bind(this));
    }
    // -------------------------------------------- ZOOM
    if ( geo.zoom == '' && this.zoom ) {                // zruš ohraničení
      this.zoom= null;
    }
    else if ( geo.zoom ) {                              // definuj ohraničení
      var ps= geo.zoom.split(';');
      var _sw, _ne;
      var SW= ps[0].split(','), NE= ps[1].split(',');
      _sw= new google.maps.LatLng(SW[0],SW[1]);
      _ne= new google.maps.LatLng(NE[0],NE[1]);
      this.zoom= new google.maps.LatLngBounds(_sw,_ne);
      this.map.fitBounds(this.zoom);
    }
    // -------------------------------------------- RECT
    if ( geo.rect == '' && this.rect ) {                // zruš obdélník
      this.rect.setMap(null);
      this.rect= null;
    }
    else if ( geo.rect ) {                              // zobraz obdélník
      if ( this.rect ) this.rect.setMap(null);          // zruš napřed starý
      var paths = [];
      var ps= geo.rect.split(';');
      var SW= ps[0].split(','), NE= ps[1].split(',');
      paths.push(new google.maps.LatLng(SW[0],SW[1]));
      paths.push(new google.maps.LatLng(SW[0],NE[1]));
      paths.push(new google.maps.LatLng(NE[0],NE[1]));
      paths.push(new google.maps.LatLng(NE[0],SW[1]));
      this.rect= new google.maps.Polygon({
        paths: paths, fillOpacity: 0, strokeWeight: 1, strokeColor: 'grey'
      });
      this.rect.setMap(this.map);
    }
    // -------------------------------------------- POLY
    if ( geo.poly == '' && this.poly ) {                // zruš polygon
      this.poly.setMap(null);
      this.poly= null;
    }
    else if ( geo.poly ) {                              // zobraz polygon
      if ( this.poly ) this.poly.setMap(null);          // zruš napřed starý
      var paths = [];
      geo.poly.split(';').map(function(xy) {
        var p= xy.split(',');
        paths.push(new google.maps.LatLng(p[0],p[1]));
      });
      this.poly= new google.maps.Polygon({
        paths: paths, fillOpacity: 0, strokeWeight: 1, strokeColor: 'red'
      });
      this.poly.setMap(this.map);
    }
    return ret;
  },
// --------------------------------------------------------------------------- LabelMap.set_mark
// zpřístupní vlastnosti dané značky
//fm: LabelMap.set_mark (mark,option)
  set_mark: function (mark,ids,value) {
  var res= 1;
    var id= ids.split('.');
    switch (id[0]) {
    // set_mark(x,'distance.dir',dist_m) - vrátí bod vzdálený dist_m ve směru dir (0=N,90=E,...)
    case 'distance':
      var point= mark.getPosition();
      point= google.maps.geometry.spherical.computeOffset(point,value,id[1]);
      res= point.lat()+','+point.lng();
      break;
    // set_mark(x,'delete') - vymaže marker x
    case 'delete':
      if ( mark.id && this.mark[mark.id]==mark ) {
        this.mark[mark.id].setMap(null);
        delete this.mark[mark.id];
      }
      break;
    case 'ezer':
      mark.ezer[id[1]]= value;
      break;
    case 'fill':
      mark.icon.fillColor= value;
      mark.setOptions({icon:mark.icon});
      break;
    }
    return res;
  },
// --------------------------------------------------------------------------- LabelMap.get_bounds
// vrátí souřadnice severovýchodního a jihozápadního rohu mapy spojené středníkem
//fm: LabelMap.get_bounds ()
  get_bounds: function () {
    var rect= "";
    var bounds= this.map.getBounds();
    if ( bounds ) {
      var point= bounds.getSouthWest();
      rect+= point.lat()+','+point.lng()+';';
      point= bounds.getNorthEast();
      rect+= point.lat()+','+point.lng();
    }
    return rect;
  },
// --------------------------------------------------------------------------- LabelMap.fit_Bounds
// zvolí měřítko a polohu mapy tak, aby byly vidět všechny nastavené značky
//fm: LabelMap.fit_bounds ()
  fit_bounds: function () {
    if ( Object.getLength(this.mark) ) {
      var box= new google.maps.LatLngBounds();
      Object.each(this.mark,function(point) {
        box.extend(point.getPosition());
      }.bind(this));
      this.map.fitBounds(box);
    }
    return 1;
  },
// (setBounds,panToBounds, getZoom, setZoom)
// --------------------------------------------------------------------------- LabelMap.geocode
// doplní do gobjektu souřadnice obsažené adresy nebo je vymaže,
// pokud adresa nebyla poznána
//   geocode({id,address:x,...}) => {mark:'id,lat,ltd',...}
//fi: LabelMap.geocode (gobject)
  geocode_counter:1,
  geocode: function (geo) {
    if ( !this.geocoder ) this.geocoder= new google.maps.Geocoder();
    this.geo= geo;
    this.geocode_counter++;
    var ms= 0;
                                                Ezer.trace('*','geocode '+this.geocode_counter+': '+geo.address);
    if ( (this.geocode_counter % 10) == 0 ) {
      ms= 10000;
//       if ( (this.geocode_counter % 100) == 0 )
//         ms+= 20000;
    }
    if ( ms )
      this.geocoder.geocode.delay(ms,this,[{address:geo.address},this._geocode.bind(this)]);
    else
      this.geocoder.geocode({address:geo.address},this._geocode.bind(this));
    // pokud google vrátí chybu nebude nastavené continuation a geocode vrátí 0
    return this;
  },
  _geocode: function (results, status) {
    if ( !this.continuation
      || (status!=google.maps.GeocoderStatus.OK && status!=google.maps.GeocoderStatus.ZERO_RESULTS)) {
      // návrat po chybě ... nemůžeme se vrátit do eval - zkusíme zavolat onerror
      Ezer.error("geocode "+status,'user',this);
      return 0;
    }
    // regulérní návrat z asynchronní funkce
    this.geo.mark= '';
    if (status == google.maps.GeocoderStatus.OK) {
      // navrácení výsledku: jednoznačnost, psč, poloha první volby
      this.geo.found= {diff:results.length,addr:results[0].formatted_address};
      for (var i in results[0].address_components) {
        var c= results[0].address_components[i];
          if ( c.types && c.types[0]=="postal_code" ) {
            this.geo.found.psc= c.long_name.replace(/\s/,'');
          }
      }
      var ll= results[0].geometry.location;
      delete this.geo.address;
      this.geo.lat= ll.lat();
      this.geo.lng= ll.lng();
      this.geo.mark= this.geo.id+','+this.geo.lat+','+this.geo.lng;
    }
    this.continuation.stack[++this.continuation.top]= this.geo;
    this.continuation.eval.apply(this.continuation,[0,1]);
    this.continuation= null;
    // v případě úspěchu vrátíme 1
    return 1;
  }
});
// ================================================================================================= Button
//c: Button ()
//      tlačítko
//t: Block
//s: Block
//i: Button.onclick - kliknutí na tlačítko
Ezer.Button= new Class({
  Extends: Ezer.Block,
//os: Button.help - nápovědný text
  title: null,                                  // nápověda položky
//os: Button.title - název
  options: {},
//oo: Button.par - {path:podsložka na serveru,mask:'název masky|seznam masek'} pro type:'upload'
//      path udává cílovou podsložku na serveru, v souboru logs/uploads.log je doplněn záznam
//      každém uploadu. Maska je tvořena podle vzoru: 'Obrázky|*.jpg;*.gif'
  initialize: function(owner,desc,DOM,id,skill) {
    this.parent(owner,desc,DOM,id,skill);
    this.title= this.options.help||null;
    this.DOM_add();
    if ( this.skill==1 )
      this.enable(false);
    // vložení podčástí
    this.subBlocks(desc,this.DOM_Block);
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _help
// specifické vlastnosti pro help mode, obecné jsou předány parametrem
  _help: function (x) {
    return x;
  },
// ------------------------------------------------------------------------------------ set
//fm: Button.set (val)
//      změní nápis tlačítka
//a: val - hodnota
  set: function (val) {
    this.value= val;
    this.DOM_set();              // zobrazení v DOM z this.value
    return 1;
 },
// ------------------------------------------------------------------------------------ get
//fm: Button.get ()
//      přečte nápis tlačítka
//r: val - hodnota
  get: function () {
    this.DOM_get();             // převzetí hodnoty z DOM do this.value
    return this.value
  }
});
// ================================================================================================= ButtonUpload
//c: ButtonUpload ()
//      po stisku se zobrazí popup panel pro upload souborů na server
//      atribut par má tyto složky:
//        - path -- lokální cesta složky pro ukládané soubory (není-li save)
//        - mask -- maska použitá pro výběr souborů klientem
//        - move -- nepovinné jméno funkce na serveru pro uložení souboru místo move_uploaded_file
//                  dostane parametry: tmp_name,name,par
//t: Button
//s: Block
//i: ButtonUpload.onclick - není vyvolán
//i: ButtonUpload.onload - byl uzavřen dialog pro výběr souborů
// ================================================================================================= Elem
//c: Elem ()
//      abstraktní třída pro části formuláře mající hodnotu a podporující události
//t: Block
//s: Block
//i: Elem.onfocus - položka získala focus
//i: Elem.onchange - změna položky (vznikne ihned při změně)
//i: Elem.onblur - položka ztratila focus
//i: Elem.onchanged - změna položky (vznikne po události 'blur' položky)
Ezer.Elem= new Class({
//on: Elem.tabindex - pořadí pro procházení tabulátorem
//-
//oi: Elem.data - odkaz na položku tabulky přímo nebo přes view
//-
//os: Elem.expr - SQL výraz
//-
//os: Elem.help - zkratka prázdné položky | nápovědný text
//-
//os: Elem.format - vzhled hodnotového prvku
//  ; 'c' : 'center' zarovnávat doprostřed
//  ; 'd' : disabled
//  ; 'h' : hidden (pro prvky typu input)
//  ; 'n' : display=none
//  ; 'o' : 'read<u>o</u>nly' nelze změnit
//  ; 'p' : 'password' zobrazit hvězdičky
//  ; 'r' : 'right' zarovnávat doprava
//  ; 't' : 'tiše' nezobrazuje se rámeček při změně
//  ;     : po dvojtečce
//  ; 'e' : místo 0 se zobrazuje ''
/*  ; 'F' : první písmeno zobrazit jako velké */
  Extends:Ezer.Block,
  skill: 2,                                     // uživatel má plné oprávnění k položce (1 => readonly)
  value: null,                                  // hodnota položky
  original: {                                   // hodnota elementu - nastavuje: _load, init
    value:null,                                 // -- jak byla načtena
    key:null},                                  // -- s daným klíčem
  fixed_value: null,                            // pro operace form.option a elem.init
  _changed: false,                              // příznak změny (odpovídá zobrazení)
  help: null,                                   // nápovědní jméno položky
  title: null,                                  // nápověda položky
//   empty: true,                                  // neiniciovaná hodnota
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  initialize
  initialize: function(owner,desc,DOM,id,skill) {
    this.parent(owner,desc,DOM,id,skill);
    this._data();
    // atribut help - pro text prázdné položky a její title - před zobrazením
    var help= this.options.help||(this.data?this.data.options.help:null);
    if ( help ) {
      help= help.split('|');
      this.help= help[0];
      this.title= help[1]||help[0];
    }
    if ( !this.help )
      this.help= this.id[0]=='$' && this.data ? this.data.id : this.id;
    // zobrazení pokud je definován rozměr (šířka)
    if ( this.options._w!==undefined || this instanceof Ezer.FieldDate )
      this.DOM_add();
    // zpracování ostatních atributů - po zobrazení
    if ( this.init ) this.init(1);
    // element bude disabled podle atributu 'd' a stavu skill
    this.enable(this.skill==1 || this._fc('d') ? false : (this.options.enabled||true));
    // vložení podčástí
    this.subBlocks(desc,this.DOM_Block);
  },
// ------------------------------------------------------------------------------------ init
//fm: Elem.init ([init_values=0])
//      nastaví hodnotu na prázdnou nebo fixovanou hodnotu nebo pro init_values==1 na defaultní
//      nebo pro init_values==2 na defaultní s nastavením elementu jako change
//a: init_values : >0 nastaví hodnotu podle atributu value, ==2 označí jako změněné
  init: function (init_values) {
    this.value= '';
    if ( this.owner._option && this.owner._option.x && this.owner._option.x==1 && this._f('x')>=0 ) {
      this._fixed_load();
      this.DOM_changed(1,1);
    }
    else if ( init_values ) {
      if ( this.options.value!==undefined ) {
        this.set(this.options.value||'');
        if ( init_values==2 ) {
          this.change(1);
        }
        this.DOM_set();
      }
      else {
        this.DOM_empty(true);
      }
    }
    else {
      this.DOM_empty(true);
      if ( this._changed ) {
        this.plain();
      }
    }
    this.original.value= this.value;
    this.original.key= null;
    return 1;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _fixed_save
// uschovej hodnotu do fixed_value
  _fixed_save: function() {
    this.fixed_value= this.get();
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _fixed_load
// vrať fixovanou hodnotu
  _fixed_load: function() {
    this.set(this.fixed_value);
  },
// ------------------------------------------------------------------------------------ set
//fm: Elem.set (val)
//      změní hodnotu elementu a zruší příznak změny
//a: val - hodnota
  set: function (val) {
    this.value= val;
    this._changed= false;
//     this.empty= false;
    this.DOM_set();              // zobrazení v DOM z this.value
    this.DOM_changed(0);
    return 1;
 },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _load
// interní hodnota uschovávaná na serveru je shodná se zobrazovanou hodnotou
  _load: function (val,key) {
    this.original.value= val;
    this.original.key= key;
    this.set(val);
  },
// ------------------------------------------------------------------------------------ get
//fm: Elem.get ()
//r: val - hodnota
  get: function () {
    this.DOM_get();             // převzetí hodnoty z DOM do this.value
    return this.value
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _save
// interní hodnota uschovávaná na serveru je shodná se zobrazovanou hodnotou
  _save: function () {
    var vmo= {val:this.get()}
    if ( this.original.key ) {
      vmo.old= this.original.value;
    }
    return vmo;
  },
// ------------------------------------------------------------------------------------ changed
//fm: Elem.changed ()
//      zjistí příznak změny
  changed: function() {
    return this._changed ? 1 : 0;
  },
// ------------------------------------------------------------------------------------ change
//fm: Elem.change ([silent=0])
//      nastaví příznak změny a způsobí onchange, pokud není silent=1
//a: silent - 0 | 1
//e: onchange
  change: function(silent) {
    this._changed= true;
    this.DOM_empty(false);
    this.DOM_changed(1,this._fc('t'));     // když není format:'t' bez rámečku
    if ( !silent )
      this.fire('onchange');
    return 1;
  },
// ------------------------------------------------------------------------------------ plain
//fm: Elem.plain ()
//      odstranění příznaku změny
  plain: function() {
    this._changed= false;
    this.DOM_changed(0);
    return 1;
  },
// ------------------------------------------------------------------------------------ focus
//fm: Elem.focus ()
//      nastavení a označení focus elementu formuláře
  focus: function () {
    this.DOM_focus();
    return true;
  },
// ------------------------------------------------------------------------------------ blur
//fm: Elem.blur ()
//      vyvolá událost onblur a pokud došlo ke změně tak i událost onchanged (s 'd' na konci)
//      (i když element má format=='t')
//e: onblur, onchanged
  blur: function () {
//     if ( this._f('t')==-1 ) { změna 130413g
      this.fire('onblur');     // když není format:'t'
      if ( this._changed ) this.fire('onchanged');
//     }
    return true;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _data
// nastavení data, view, table pokud mají smysl
  data: null,
  table: null,
  view: null,
  _data: function() {
    var name;
    if ( (name= this.options.data) ) {
      var f= [], ids= [];
      if ( (f= Ezer.code_name(name,ids,this.owner)) ) {
        this.data= f[0];
        if ( f[1].type=='view' && f[1].value.type=='table' ) {
          this.view= f[1];
          this.table= this.view.value;
        }
        else if ( f[1].type=='table' )
          this.table= f[1];
        else
          Ezer.error('jméno '+name+' nelze ve field '+this.owner.id+' pochopit');
      }
      else
        Ezer.error(name+' je neznámé jméno položky v '+this.owner.id);
    }
  }
});
// ================================================================================================= Field
//c: Field ()
//      vstupní část formuláře
//t: Block,Elem
//s: Block
Ezer.Field= new Class({
  Extends: Ezer.Elem,
  options: {}
  // metody
});
// ================================================================================================= FieldDate
//c: FieldDate ()
//      vstupní část formuláře
//t: Block,Elem,Field
//s: Block
Ezer.FieldDate= new Class({
  Extends: Ezer.Field,
  options: {}
});
// ================================================================================================= FieldDate
//c: FieldList ()
//      vstupní část formuláře - rozbalení obsahu podle oddělovače
//t: Block,Elem,Field
//s: Block
//oo: FieldList.par - delim: oddělovač jako regulární výraz, - width: šířka rozbaleného pole
Ezer.FieldList= new Class({
  Extends: Ezer.Field,
  options: {},
  _split: null,                         // z par.delim nebo default [,;]
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  initialize
  initialize: function(owner,desc,DOM,id,skill) {
    this.parent(owner,desc,DOM,id,skill);
    this._split= new RegExp(this.options.par ? this.options.par.delim||'[,;]' : '[,;]');
  }
});
// ================================================================================================= Edit
//c: Edit ()
//      vstupní část formuláře
//t: Block,Elem
//s: Block
Ezer.Edit= new Class({
  Extends: Ezer.Elem,
  options: {}
});
// ================================================================================================= EditHtml
//c: EditHtml ()
//      vstupní část formuláře s wysiwyg editorem CKeditor
//t: Block,Elem,Edit
//s: Block
Ezer.EditHtml= new Class({
  Extends: Ezer.Elem,
  options: {},
// ------------------------------------------------------------------------------------ changed
//fm: EditHtml.changed ()
//      zjistí zda došlo ke změně obsahu
// Pozn. U elementu typu EditHtml se netestuje příznak změny (vizuální podobou je obarvení rámečku)
//      ale to, zda je současný obsah CKeditor změněný proti načtenému stavu. Pokud tedy byl
//      po změně takového elementu programově zrušen příznak změny (např. operací plain) bude
//      jeho hodnota přesto odevzdána k uložení na disk. Důvodem k tomuto chování je asynchronní
//      časování události blur v CKeditoru.
  changed: function() {
    if ( this.ckeditor && Ezer.options.CKEditor.version=='4' ) {
      return this.ckeditor.checkDirty();
    }
    if ( !this._changed && this.ckeditor ) {
      this._changed= this.original.value!=this.ckeditor.getData();
    }
    return this._changed ? 1 : 0;
  }
});
// ================================================================================================= Check
//c: Check ()
//      zaškrtávací políčko
//t: Block,Elem
//s: Block
Ezer.Check= new Class({
  Extends: Ezer.Elem,
  options: {},
  // metody
// ------------------------------------------------------------------------------------ init
//fm: Check.init ([init_values=0])
//      naplní element hodnotou atributu 'value' nebo 0
//      pro init_values==2 s nastavením elementu jako change
  init: function (init_values) {
    this.value= this.options.value||0;
    this.DOM_set();
    this.DOM_empty(true);
    if ( init_values==2 )
      this.change(1);
    else
      this.DOM_changed(0);
    this.original.value= this.value;
    this.original.key= null;
    return 1;
  }
});
// ================================================================================================= Radio
//c: Radio ()
//      radio buttons
//t: Block,Elem
//s: Block
Ezer.Radio= new Class({
  Extends: Ezer.Elem,
  options: {},
  value: null,
  _changed: false,
// ------------------------------------------------------------------------------------ init
//fm: Radio.init ([init_values=0])
//      naplní element hodnotou atributu 'value'
//      pro init_values==2 s nastavením elementu jako change
  init: function (init_values) {
    if ( this.options.value!==undefined ) {
      this.value= this.options.value;
      this.DOM_set();
      if ( init_values==2 )
        this.change(1);
      else
        this.DOM_changed(0);
    }
    this.original.value= this.value;
    this.original.key= null;
    return 1;
  },
// ------------------------------------------------------------------------------------ set
//fm: Radio.set (val)
//a: val - hodnota
  set: function (val) {
    this.value= val;
    this._changed= false;
    this.DOM_set();              // zobrazení v DOM z this.value
    this.DOM_changed(0);
    return 1;
 },
// ------------------------------------------------------------------------------------ get
//fm: Radio.get ()
//r: val - hodnota
  get: function () {
    return this.value
  }
});
// ================================================================================================= Case
//c: Case ()
//      radio button
//t: Block,Elem
//s: Block
Ezer.Case= new Class({
  Extends: Ezer.Elem,
  options: {}
  // metody
});
// ================================================================================================= Chat
//c: Chat ()
//      přeložený blok chat (element formuláře historie)
//      řádky lze interaktivně měnit: po dvojkliku s obsluhou onrowclick a funkcí let.
//      Nepovinné 3.slovo ve skill povoluje interaktivní změnu (standardně zakázanou).
//t: Block,Elem
//s: Block
//i: Chat.onrowclick - dvojklik na řádku (parametrem je index řádku, první má index 1)
Ezer.Chat= new Class({
  Extends: Ezer.Elem,
  options: {},
  append: 0,
  changeable: true,     // s povolením interaktvní změny
  _changedRow: {},      // .row je pořadí řádku, .op=a|p|d|c pro append, delete, change
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  initialize
  initialize: function(owner,desc,DOM,id,skill) {
    this.parent(owner,desc,DOM,id,skill);
    // diskuse povolení interaktivních změn
    if ( this.options.skill ) {
      var aa= this.options.skill.clean().split('|');
      this.changeable= aa[2] ? Ezer.fce.has_skill(aa[2]) : false ;
    }
  },
// ------------------------------------------------------------------------------------ on
//fm: Chat.enable (on)
//      enable pro chat
//   enable: function (on) {
//     QE_elem.prototype.enable.call(this);
//     if ( on ) this.his.removeClass('disable');
//     else this.his.addClass('disable');
//     return true;
//   },
// ------------------------------------------------------------------------------------ add
//fm: Chat.add (val)
//      přidá řádky do chat podle oddělovačů '|'
  add: function (val) {
    // nastaví value a zruší případný příznak změny
    this.DOM_clear();
    this.value= val;
    this._changed= false;
    this._changedRow= {};
    this.DOM_changed(0);
    // zobraz historii chatu po řádcích - v případě nedodržení formátu zobraz to co je
    var aval= val ? val.split('|') : [];
    if ( aval.length>1 ) {
      for (var i=0; i<aval.length-1; i+=2 ) {
        this.DOM_append(i/2+1,aval[i],aval[i+1]);
      }
    }
    else {
      this.DOM_Hist.innerHTML= "<div tabIndex='-1' class='Chat2'>"+val+"</div>";
    }
    // pokud je format='r' nastav chat na konec - jinak na začátek
    this.DOM_Hist.scrollTop= this.append==1 ? this.DOM_Hist.scrollHeight : 0;
    this.DOM_Input.value= '';
    return 1;
  },
// ------------------------------------------------------------------------------------ let
//fm: Chat.let (n,value)
//      změní hodnotu n-tého řádku v chat, pokud je hodnotou prázdný řetězec,
//      bude řádek zrušen
  let: function (n,value) {
    var chs= this.DOM_Hist.getChildren();
    var ns= 2*n-2;
    if ( chs && chs.length>ns ) {
      var ch= chs[2*n-2];
      this._changed= true;
      this._changedRow= {row:n};
      if ( value ) {
        // prvek bude změněn
        ch.getNext().innerHTML= value;
        ch.getNext().addClass('changed');
        this.DOM_Input.addClass('changed');
        this._changedRow.op= 'c';
      }
      else {
        // prvek bude vymazán
        ch.getNext().destroy();
        ch.destroy();
        this._changedRow.op= 'd';
      }
    }
    return 1;
  },
// ------------------------------------------------------------------------------------ set
//fm: Chat.set (val,is_original)
//      set pro chat
  set: function (val,is_original) {
    // nastaví value a zruší případný příznak změny
    this.value= val;
    this._changed= false;
    this.DOM_changed(0);
    // zobraz historii chatu po řádcích - v případě nedodržení formátu zobraz to co je
    var aval= val ? val.split('|') : [];
    var html= '';
    if ( aval.length>1 ) {
      for (var i=0; i<aval.length-1; i+=2 ) {
        var j= i%2;
        html+= "<div tabIndex='-1' class='Chat_"+(j+1)+"'>"+aval[i]+"</div>";
        html+= "<div tabIndex='-1' class='Chat_"+(j+2)+"'>"+aval[i+1]+"</div>";
      }
    }
    else {
      html+= "<div tabIndex='-1' class='Chat2'>"+val+"</div>";
    }
    this.DOM_Hist.innerHTML= html;
    // pokud je format='r' nastav chat na konec - jinak na začátek
    this.DOM_Hist.scrollTop= this.append==1 ? this.DOM_Hist.scrollHeight : 0;
    this.DOM_Input.value= '';
    return 1;
  },
// ------------------------------------------------------------------------------------ init
//fm: Chat.init ()
//      inicializace
  init: function () {
    //Ezer.Elem.prototype.init.call(this,'');
    this.DOM_clear();
    this.value= '';
    this._changed= false;
    this._changedRow= {};
    this.DOM_changed(0);
    return true;
  },
// ------------------------------------------------------------------------------------ get
//fm: Chat.get ([mode=0])
//      pro mode=0 (default) vrátí obsah vstupního pole označeného značkou uživatele a datem
//      pro mode=1 vrátí pouze obsah vstupního pole
  get: function (mode) {
    return mode
      ? this.DOM_Input.value
      : Ezer.sys.user.abbr + ' ' + ae_datum(1) + '|' + this.DOM_Input.value + '|';
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _load
// interní hodnota uschovávaná na serveru je shodná se zobrazovanou hodnotou
  _load: function (val,key) {
    this.add(val);
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _save
// interní hodnota uschovávaná na serveru je shodná se zobrazovanou hodnotou
  _save: function () {
    var vmo;
    if ( this._changedRow.op ) {
      // pro delete a change přidáme celou hodnotu (ochrana proti současné opravě jiným uživatelem)
      vmo= {row:this._changedRow.row, mode:this._changedRow.op, val:this.get(1), old:this.value}
    }
    else {
      vmo= {row:0, val:this.get(), mode:this.append?'a':'p'}
    }
    return vmo;
  }
});
// ================================================================================================= Select ...
//c: Select
//      výběrová položka formuláře
//      Pozn. metoda form.save použije klíč zobrazené hodnoty
//t: Block,Elem
//s: Block
//i: Select.onchange - změna vybraného itemu
Ezer.Select= new Class({
//os: Select.format - vzhled hodnotového prvku
//  ; 'u' : 'up' seznam hodnot bude zobrazen nad select
  Extends: Ezer.Elem,
  Items: {},
// ------------------------------------------------------------------------------------ selects
//fm: Select.selects (list[,delimiters=',:'])
//a: list - seznam volitelných hodnot pro select ve tvaru: hodnota[:klíč],...
//   delimiters - řetězec definující 2 znaky použité jako oddělovače
  selects: function(list,delimiters) {
    this.Items= {};
    var del1= ',', del2= ':';
    if ( delimiters ) {
      del1= delimiters[0]||',';
      del2= delimiters[1]||':';
    }
    list.split(del1).each(function(val,i) {
      var desc= val.split(del2);
      if ( desc.length==2 ) {
        this.Items[desc[1]]= desc[0];
      }
      else {
        this.Items[i]= val;
      }
    },this);
    this.DOM_addItems();
    return true;
  },
// ------------------------------------------------------------------------------------ init
//fm: Select.init ([init_values=0])
//      nastaví hodnotu na prázdnou nebo fixovanou hodnotu nebo pro init_values==1 na defaultní
//      nebo pro init_values==2 na defaultní s nastavením elementu jako change;
//      vymaže seznam hodnot
//a: init_values : >0 nastaví hodnotu podle atributu value, ==2 označí jako změněné
  init: function (init_values) {
    this._key= 0;
//     this.Items= {};
    this.DOM_addItems();
    this.parent(init_values);
    return true;
  },
// ------------------------------------------------------------------------------------ key
//fm: Select.key ([key])
//      lze použít jako setter nebo getter pro key
  key: function (key) {
    var ret= 1;
    if ( key!==undefined ) {
      // definuj hodnotu klíče
      this._key= $type(key)=='string' ? Number(key) : key;
      Ezer.assert(this.Items,'nedefinované položky v select',this);
      this.value= this.Items[this._key];
//       this.empty= false;
      if ( this.value===undefined )
        this.value= '';
      this.DOM_set();
    }
    else {
      ret= key= this._key;
    }
    return ret;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _load
// interní hodnota uschovávaná na serveru
  _load: function (val,key) {
    this.original.value= val;
    this.original.key= key;
    this.set(val);
    this._changed= false;
    this.DOM_changed(0);
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _save
// interní hodnota uschovávaná na serveru je klíč zobrazené hodnoty
  _save: function () {
    var vmo= {val:this.value}
    if ( this.original.key ) {
      vmo.old= this.original.value;
    }
    return vmo;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _fixed_save
// uschovej hodnotu do fixed_value
  _fixed_save: function() {
    this.fixed_value= this.value;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _fixed_load
// vrať fixovanou hodnotu
  _fixed_load: function() {
    this.set(this.fixed_value);
  }
});
// ================================================================================================= SelectAuto
//c: SelectAuto
//      Pozn. metoda form.save použije klíč zobrazené hodnoty nebo zobrazenou hodnotu
//      v závislosti na hodnotě atributu par.save='key'|'value'. Defaultní je 'value'.
//t: Block,Elem,Select
//s: Block
//i: SelectAuto.onfocus - položka má focus
Ezer.SelectAuto= new Class({
  Extends: Ezer.Select,
  options: {
//oo: SelectAuto.par - parametry pro autocompleter
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _save
// interní hodnota uschovávaná na serveru je klíč zobrazené hodnoty nebo zobrazená hodnota
// v závislosti na hodnotě atributu par.save='key'|'value'. Defaultní je 'value'
  _save: function () {
    var vmo;
    if ( this.options.par && this.options.par.save && this.options.par.save=='key' ) {
      vmo= {val:this._key}
      if ( this.original.key ) {
        vmo.old= this.original.value;
      }
    }
    else {
      vmo= {val:this.value}
      if ( this.original.key ) {
        vmo.old= this.original.value;
      }
    }
    return vmo;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  initialize
  initialize: function(owner,desc,context,id,skill) {
    this.parent(owner,desc,context,id,skill);
    this.DOM_add2();
  },
// ------------------------------------------------------------------------------------ select_set
//fx: SelectAuto.select_set (val)
//      nastaví hodnotu na val, provede dotaz na server a nastaví i klíč a případně info;
//      způsobí onchanged
//e: onchanged
//a: val - hodnota
  select_set: function (val) {
    this.value= val;
    this.DOM_set();
    // dotaz na server a nastavení klíče při shodě s nějakou hodnotou
    var x= {cmd:'ask',fce:this.options.par.fce,args:[val,this.options.par],nargs:2};
    return x;
  },
  select_set_: function (y) {
    this._key= 0;
    this.Items= y.value;
//                                                         Ezer.debug(y.value,this.DOM_Input.value);
    this.DOM_addItems();                // může nastavit this._empty nejsou-li nabídky
    // nalezení klíče k hodnotě při první shodě
    if ( this.options.par && this.options.par.subtype=='info' ) {
      for (var key in this.Items) {
        if ( this.Items[key].name==this.DOM_Input.value ) {
          this._key= key;
          this.options.par.info= this.Items[key].info;
          break;
    } } }
    else {
      for (var key in this.Items) {
        if ( this.Items[key]==this.DOM_Input.value ) {
          this._key= key;
          break;
    } } }
    this.DOM_changed(0);
    this.fire('onchanged');
    return 1;
  }
});
// ================================================================================================= SelectMap
//c: SelectMap
//      Pozn. metoda form.save použije zobrazenou hodnotu
//t: Block,Elem,Select
//s: Block
Ezer.SelectMap= new Class({
  Extends: Ezer.Select,
  options: {
//oi: SelectMap.options   - mapa.položka
    options: null,
//oi: SelectMap.map_pipe   - mapa.položka
    map_pipe: null
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  initialize
  initialize: function(owner,desc,context,id,skill) {
    this.parent(owner,desc,context,id,skill);
//     var nm= this.start_code.code[0].i= this.self();
    var c1= this.start_code.code[0].v= this.owner;
    var c2= this.start_code.code[1].v= this.id;
  },
  _key: null,
  sel_options: null,
//   start_code: {level:'select',code:[{o:'o',i:'?'},{o:'m',i:'_options_load'}]},
  start_code: {level:'select',code:[{o:'v',v:'?'},{o:'v',v:'?'},{o:'m',i:'_part',a:1},{o:'m',i:'_options_load'}]},
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _options_load
  _options_load: function() {
    // vytvoř z mapy seznam možností
    var m= [];
    Ezer.assert(1==Ezer.run_name(this.options.options,this.owner.owner,m)
      ,'options:'+this.options.options+' je chybné jméno map',this);
    Ezer.trace('L','_options_load '+this.options.options+' '+(m&&m[1]?m[1].id:'???'));
    this.map_options= m[1];
    this.Items= this instanceof Ezer.SelectMap0 ? {0:''} : {};
    for (var im in m[0]) {
      this.Items[im]= m[0][im];
    }
    this.DOM_addItems();
    if ( this.options.map_pipe ) {
      // zpracuj atribut map_pipe
      Ezer.assert(1==Ezer.run_name(this.options.map_pipe,this.owner.owner,m)
        ,'map_pipe:'+this.options.map_pipe+' je chybné jméno map',this);
      this.map_pipe= m[0];
    }
    return true;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _check
// test integrity bloku po jeho dokončení
  _check: function () {
    Ezer.assert(this.options.options,"Blok select typu map musí obsahovat atribut options",this);
  },
// ------------------------------------------------------------------------------------ selects
//fm: SelectMap.selects ([key,[cond]])
//      obnoví seznam volitelných hodnot z mapy uvedené v options, pokud je definován
//      argument key bude select nastaveno na tuto hodnotu, jinak bude mít hodnotu 0;
//      Jako vedlejší efekt obnoví mapy uvedené v příkazu select;
//      cond je nepovinná dodatečná podmínka na položky tabulky _cis
//      POZOR: metoda jen zahájí asynchronní operaci, nečeká na ukončení
  selects: function(key,cond) {
    key= key||0;
    cond= cond||1;
    // najdi mapu uvedenou v options
    var m= [];
    Ezer.run_name(this.options.options,this.owner.owner,m); // m[1] je mapa
    var code= [
      {o:'v',v:m[1]}, {o:'v',v:cond}, {o:'x',i:'map_load',a:1},
      {o:'v',v:this}, {o:'m',i:'_options_load'},
      {o:'v',v:this}, {o:'v',v:key}, {o:'m',i:'key',a:1}
    ];
    new Ezer.Eval(code,this,[this,null,null,null,null,-1],'selects');
    return true;
  },
// ------------------------------------------------------------------------------------ set
//fm: SelectMap.set (val)
//a: val - hodnota
  set: function (val) {
    this.value= val;
//     this.empty= false;
    // nalezení klíče k hodnotě
    for (var key in this.Items) {
      if ( this.Items[key]==val ) {
        this._key= key;
        break;
      }
    }
    this._changed= false;
    this.DOM_set();              // zobrazení v DOM z this.value
    this.DOM_changed(0);
    return 1;
 },
// ------------------------------------------------------------------------------------ get
//fm: SelectMap.get ([options=0])
//      vrátí hodnotu podle nastavení map_pipe, pokud je options=1 tak podle options
//a: options - 0|1
  get: function (options) {
    var val= this.value;
    if ( options ) {
      if ( this.Items ) {
        val= this.Items[this._key]||'';
      }
    }
    else {
      if ( this.map_pipe && val ) {
        val= this.map_pipe[this._key]||'';
      }
    }
    return val;
 },
// ------------------------------------------------------------------------------------ init
//fm: SelectMap.init ([init_values=0])
//      nastaví hodnotu na prázdnou nebo pro init_values==1 na defaultní hodnotu
//      nebo pro init_values==2 na defaultní s nastavením elementu jako change bez onchange;
//      funkce nevymaže seznam hodnot - jsou stále dány atributem map
//a: init_values : >0 nastaví hodnotu podle atributu value, ==2 označí jako změněné
  init: function (init_values) {
    if ( init_values ) {
//       this.empty= false;
      if ( this.owner._option && this.owner._option.x && this.owner._option.x==1
        && this._f('x')>=0 ) {
        this._key= this.fixed_value;
      }
      else {
        this._key= this.options.value||0;
      }
      this.key(this._key);
      this.DOM_set();
      if ( init_values==2 && this.options.value!==undefined)
        this.change(1);
      else
        this.DOM_changed(0);
    }
    else {
      this.value= '';
      this._key= 0;
//       this.empty= true;
      this.DOM_empty(true);
      if ( this._changed ) {
        this.plain();
      }
    }
    this.original.value= this._key;
    this.original.key= null;
    return 1;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _load
// interní hodnota uschovávaná na serveru je klíč zobrazené hodnoty
  _load: function (val,key) {
    this.original.value= val;
    this.original.key= key;
    this.key(val);
    this._changed= false;
    this.DOM_changed(0);
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _save
// interní hodnota uschovávaná na serveru je klíč zobrazené hodnoty
  _save: function () {
    var vmo= {val:this._key}
    if ( this.original.key ) {
      vmo.old= this.original.value;
    }
    return vmo;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _fixed_save
// uschovej klíč do fixed_value
  _fixed_save: function() {
    this.fixed_value= this.key();
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _fixed_load
// vrať fixovaný klíč
  _fixed_load: function() {
    this.key(this.fixed_value);
  }
});
// aliasy
//fm: SelectMap.select_key ([key])  (obsolete)
Ezer.SelectMap.prototype.select_key= Ezer.SelectMap.prototype.key;
// ================================================================================================= SelectMap0
//c: SelectMap0
//      výběr s prázdnou hodnotou pro klíč 0
//t: Block,Elem,Select
//s: Block
Ezer.SelectMap0= new Class({
  Extends: Ezer.SelectMap
});
// ================================================================================================= List
//c: List ()
//      řádkový seznam elementů
//t: Block,Elem
//s: Block
Ezer.List= new Class({
  Extends: Ezer.Block,
//on: List.rows   - výška řádku v px
//-
  options: {},
  last: -1,                                             // index poslední group
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  initialize
  initialize: function(owner,desc,DOM,id) {
    this.parent(owner,desc,DOM,id);
    // bez vložení podčástí
    this.part= {};
    this.DOM_add();
  },
// ------------------------------------------------------------------------------------ init
//fm: List.init ()
//      vyprázdní seznam
  init: function () {
    this.DOM_destroy_rows();
    this.part= {};
    this.last= -1;
    return 1;
  },
// ------------------------------------------------------------------------------------ add
//fm: List.add ()
//      přidá na konec seznamu nový řádek elementů a posune ukazatel pro další řádek
//r: index přidaného řádku
  add: function () {
    // vložení group
    this.last++;
    var group, desc= {type:'list.row',options:{}};
    group= new Ezer.ListRow(this,desc,this.DOM_Block,this.last);
    this.part[this.last]= group;
    // vložení podčástí do group
    group.subBlocks(this.desc,group.DOM_Block);
    Ezer.app.start_code(group);
    return this.last;
  },
// ------------------------------------------------------------------------------------ load
//fx: List.load (fce[,arg,..])
//      přidá do seznamu podle informací ze serveru
  load: function () {
    return 1;
  }
});
// ================================================================================================= ListRow
//c: ListRow ()
//      řádek seznamu elementů
//t: Block
//s: Block
Ezer.ListRow= new Class({
  Extends: Ezer.Block,
  options: {},
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  initialize
  initialize: function(owner,desc,DOM,id) {
    this.parent(owner,desc,DOM,id);
    // bez vložení podčástí
    this.DOM_add();
  }
});
// ================================================================================================= Browse
//c: Browse
//      tabulkové zobrazení dat s mezipamětí - implementace 2
//t: Block
//s: Block
//i: Browse.onclick - kliknutí na výběrový element (pravý horní rožek)
Ezer.Browse= new Class({
  Extends: Ezer.Block,
//on: Browse.rows   - počet datových řádků načtených do paměti
//-
//on: Browse.qry_rows   - počet dotazových řádků
//-
//on: Browse.buf_rows   - počet řádků načítaných do bufferu (má-li být větší než rows)
//-
//os: Browse.group_by   - fráze MySQL
//-
//on: Browse.wheel      - počet řádků přeskočených kolečkem myši (default=počet řádků/2)
//-
//oo: Browse.optimize   - objekt předávaný na server, popis je v ezer2.php
//-
//i: Browse.onrowclick - klik na řádku (parametrem je index řádku, první má index 1)
//-
//i: Browse.onchange - interaktivní změna dotazu (v qry_rows)
//-
//i: Browse.onchoice - výběr řádku klávesou Ins
//-
//os: Browse.key_id   - jméno sloupce s klíčem pro browse_load ap. (pokud není udáno, odvozuje se z použité tabulky)
//-
  selected_op: 'ignore',                // co budeme s klíči dělat ... viz fce selected
  cond: null,                           // aktuální pro WHERE ...    expr
  order: null,                          // aktuální pro ORDER BY ... id [ASC|DESC]
  order_by: null,                       // objekt browse_clmn podle kterého se řadí
//os: Browse.css_cell  - viz css_rows
  css: {},                              // objekt vytvořený podle atributu css_rows
//os: Browse.css_rows   - hodnota 'clmn,[v1:]s1,[v2:]s2,...' určuje styl vybraný podle
//      hodnoty sloupce clmn (neuvedené vi je defaultně rovno i, prázdné vi určuje defaultní styl)
//      pokud má řádek ve sloupci hodnotu vi má řádek resp. buňka přidánu css-třídu cssi
//      pokud i není v css_rows resp. v css_cell žádná třída se nepřidává
  css_clmn: null,                       // clmn řídící obarvení
  css_default: null,                    // defaultní styl
  first_query: null,                    // první dotazový input
  // stavové informace pro scroll
  s: 0,                                 // počátek SELECT                               0
  slen: 0,                              // délka SELECT
  buf: [],                              // buffer načtených řádků (dekódovaných) - pro Show
  keys: [],                             // pole klíčů načtených řádků
  keys_sel: [],                         // seznam klíčů vybraných INS
  b: -1,                                // záznam na začátku bufferu                   -1..slen-1
  blen: 0,                              // naplněná délka bufferu
  bmax: 0,                              // maximální délka bufferu = atribut buf_rows
  t: -1,                                // záznam na začátku tabulky                   -1..slen-1
  r: -1,                                // aktivní záznam tabulky                      -1..slen-1
  tact: 0,                              // aktivní řádek tabulky                        0..tmax
  tlen: 0,                              // naplněná délka tabulky                       0..tmax
  tmax: 0,                              // maximální délka tabulky = atribut rows
  scrolling: false,                     // probíhá čtení fcí _browse_scroll
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  initialize+
  initialize: function(owner,desc,DOM,id,skill) {
    // Ezer.Block
    this.DOM= DOM;
    this.owner= owner;
    this.skill= skill;
    if ( id ) this.id= this._id= id;
    if ( id && owner && owner.part ) owner.part[id]= this;
    this.type= desc.type;
    this.desc= desc;
    this.setOptions(desc.options);
    if ( isNaN(this.options.rows) ) {
      // rows je zadáno konstantou
      var m= [], x= Ezer.code_name(this.options.rows,m,this.owner);
      if ( x && x[0] && x[0].type=='const' ) {
        this.options.rows= Ezer.const_value(m[m.length-1],x[0].options.value);
      }
      else Ezer.error("ERROR RUN pro atribut rows nelze určit konstantu "+this.options.rows);
    }
    this._coord();
    this._check();
    // pak bude parent(owner,desc,DOM,id,skill)
    this.options.wheel= this.options.wheel||Math.round(this.options.rows/2);
    this.bmax= Math.max(this.options.buf_rows||0,this.options.rows);
    this.tmax= this.options.rows;
    this.DOM_add1();
    // vložení podčástí
    this.subBlocks(desc,this.DOM_Block);
    this.DOM_add2();
    this.DOM_addEvents();
  },
  start: function(codes,oneval) {
    this.parent(codes,oneval);
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  browse_snap+
//fm: Browse.browse_snap ([data=1])
//      snapshot do trace, pokud data=0 bude vynechán výpis obsahu keys a buf
  browse_snap: function(data) {
    if ( data )
      Ezer.debug({
        scroll:this.scrolling?'true':'false',
        slen:this.slen,b:this.b,blen:this.blen,bmax:this.bmax,t:this.t,r:this.r,tlen:this.tlen,
        tmax:this.tmax,keys_sel:this.keys_sel,keys:this.keys,buf:this.buf});
    else
      Ezer.debug({
        scroll:this.scrolling?'true':'false',
        slen:this.slen,b:this.b,blen:this.blen,bmax:this.bmax,t:this.t,r:this.r,tlen:this.tlen,
        tmax:this.tmax});
  },
// ------------------------------------------------------------------------------------ selected+
//fm: Browse.selected (op[,param[,option]])
//      ovládá chování browse vzhledem vybraným řádkům
//a: clear      - zruší výběr
//   set_page   - zruší výběr a nastaví jako vybrané ty viditelné
//   add_page   - přidá k výběru ty viditelné
//   refresh    - obnoví zobrazení výběru
//   use        - operace browse_load, browse_seek budou vracet jen vybrané řádky
//   ignore     - operace browse_load, browse_seek se budou chovat jakoby nic
//   set        - nastaví klíče podle daného seznamu (string s klíči oddělenými čárkou)
//   get        - vrátí seznam param prvních (pro option='D' posledních) klíčů  nebo všech klíčů, pokud je param 0
//   key        - vrátí param tý klíč (pro option='D' od konce)
  selected: function(op,param,option) {
    var result= 1;
    switch ( op ) {
    case 'refresh': // obnoví označení výběru
      for (var i= 1; i<=this.tlen; i++) {
        this.DOM_selected(i,this.keys_sel.contains(this.keys[this.t+i-1-this.b]));
      }
      this._set_css_rows();
      this.DOM_show_status();
      break;
    case 'toggle':  // změní stav aktivního řádku
      var key= this.keys[this.t+this.tact-1-this.b];
      var ikey= this.keys_sel.indexOf(key);
      if ( ikey>=0 )
        this.keys_sel.splice(ikey,1);
      else
        this.keys_sel.push(key);
      this._css_row(this.tact);
      this.DOM_hi_row(this.t+this.tact-1);
      break;
    case 'set': // nastaví klíče podle daného seznamu (string s klíči oddělenými čárkou)
      if ( param )
        this.keys_sel= $type(param)=='string' ? param.split(',') : [param];
      else
        this.keys_sel= [];
      this.selected('refresh');
      break;
    case 'get': // vrátí seznam param prvních (pro záporné posledních) klíčů nebo všech klíčů, pokud je param vynecháno nebo 0
      var n, desc, del= '';
      desc= option ? option=='D' : false;
      n= param ? Math.min(parseInt(param),this.keys_sel.length) : this.keys_sel.length;
      result= '';
      for (var i= 0; i<n; i++) {
        var k= desc ? this.keys_sel.length-1 - i : i;
        result+= del+this.keys_sel[k];
        del= ',';
      }
      break;
    case 'set_page': // zruší výběr a nastaví jako vybrané ty viditelné
      this.keys_sel= [];
      for (var i= 1; i<=this.tlen; i++) {
        this.DOM_selected(i,true);
        if ( this.keys[this.t+i-1-this.b] )
          this.keys_sel.push(this.keys[this.t+i-1-this.b]);
      }
      this._set_css_rows();
      this.DOM_show_status();
      break;
    case 'add_page': // přidá k výběru ty viditelné
      for (var i= 1; i<=this.tlen; i++) {
        this.DOM_selected(i,true);
        var key= this.keys[this.t+i-1-this.b];
        if ( key && this.keys_sel.indexOf(key)<0 )
          this.keys_sel.push(key);
      }
      this._set_css_rows();
      this.DOM_show_status();
      break;
    case 'clear': // zruší výběr param prvních klíčů nebo všech klíčů, pokud je param 0
      if ( param ) {
        this.keys_sel.splice(0,parseInt(param));
        this._set_css_rows();
      }
      else {
        this.keys_sel= [];
        for (var i= 1; i<=this.tlen; i++) {
          this.DOM_selected(i,false);
        }
      }
      this._set_css_rows();
      this.DOM_show_status();
      break;
    case 'use':    // operace browse_load, browse_seek budou vracet jen vybrané řádky
    case 'ignore': // operace browse_load, browse_seek se budou chovat jakoby nic
      this.selected_op= op;
      break;
    case 'key':    // vrátí param-tý klíč nebo 0
      var desc= option ? option=='D' : false;
      var i= parseInt(param);
      var k= desc ? this.keys_sel.length-1 - i : i;
      result= this.keys_sel[k]||0;
      break;
    }
    return result;
  },
// ------------------------------------------------------------------------------------ browse_init+
//fm: Browse.browse_init ()
//      vynuluj klíče a tabulku
//e: onblur
  browse_init: function () {
    this.browse_fill('');               // vyprázdnění
    this.blur();
    return 1;
  },
// ------------------------------------------------------------------------------------ browse_focus+
//fm: Browse.browse_focus ()
//      označení řádku - vyvolej událost onfocus ale ne onrowclick
  browse_focus: function () {
    if ( this.tact )
      this.DOM_hi_row(this.t+this.tact-1,true,true);
    return 1;
  },
// ------------------------------------------------------------------------------------ focus+
//fm: Browse.focus ()
//      označení browse jako aktivní
//e: onfocus - byl označen browse
  focus: function () {
    this.DOM_focus();
    return 1;
  },
// ------------------------------------------------------------------------------------ blur+
//fm: Browse.blur ([row_blur==0])
//      zrušení označení browse, vyvolej událost ONBLUR
//      pokud je row_blur==1 odznačí se i aktivní řádek
//a: row_blur - 1 : odznačí se aktivní řádek
//e: onblur - bylo zrušeno označení řádku
  blur: function (row_blur) {
    this.fire('onblur');
    this.DOM_blur();
    if ( row_blur==1 )
      this.DOM_clear_focus();
    return 1;
  },
// ------------------------------------------------------------------------------------ browse_count+
//fm: Browse.browse_count ()
//      vrací celkový počet záznamů
  browse_count: function () {
    return this.slen;
  },
// ------------------------------------------------------------------------------------ browse_active+
//fm: Browse.browse_active ()
//      pokud má browse aktivní řádek, vrátí jej (1..tlen), jinak 0
  browse_active: function () {
    return this.tact;
  },
// ------------------------------------------------------------------------------------ browse_key+
//fm: Browse.browse_key ()
//      klíč aktivního řádku nebo 0
  browse_key: function () {
    return this.tact ? this.keys[this.r-this.b] : 0;
  },
// ------------------------------------------------------------------------------------ raise+
//fm: Browse.raise (event[,key[,info[,row[,noevent=false]]]])
//      simulace kliknutí na řádek se zadaným klíčem, nebo na první zobrazený řádek;
//      klíč vyznačeného řádku lze získat funkcí browse_key;
//      pokud je noevent=1 nevyvolává se event;
//      pokud je definováno key a řádek není načtený tak raise selže
//      (toho lze využít v alternativě k volání browse_seek)
//a: event - onrowclick
//   key - primární klíč záznamu (nepovinně)
//   info - uživatelská informace, předaná onrowclick (nepovinně)
//   row - řádek v tabulce (nepovině) - pokud je udán (1..tlen), má přednost před klíčem
//   noevent - pokud je 1 nevyvolá se uživatelská obsluha onrowclick
  raise: function (event,key,info,row,noevent) {
//                                                 Ezer.trace('*','onrowclick:'+row);
    var irow, ok= 1, bkey= this.browse_key();
   raised:
    switch ( event ) {
    case 'onrowclick':
      if ( row ) {
        this.DOM_hi_row(this.t+row-1,noevent,true);
      }
      else {
        irow= 0;
        key= key||this.keys[this.t-this.b];
        info= info||0;
       with_key:
        if ( key ) { // je požadováno nastavení řádku s určitým klíčem, nebo nic
          for (var ib= 0; ib<this.blen; ib++) {
            if ( this.keys[ib]==key ) {  // projdi klíče načtených řádků browse v bufferu
              this.owner._key= key;      // nastav aktiální klíč formuláře (jako po kliknutí)
              irow= ib;
              if ( ib != (this.r-this.b) ) {
                // funkce _row_move zajistí viditelnost záznamu r (0..slen-1) včetně onrowclick
                this._row_move(this.b+ib,noevent);
              }
              else {
                // zajisti provedení onrowclik i při neposunutí záznamu
                this.DOM_hi_row(this.b+ib,noevent,true);
              }
              break with_key;
            }
          }
          if ( !irow ) {
            // řádek není načtený - raise selže - lze aplikovat např. browse_seek
            ok= 0;
          }
        }
        else {
          this.DOM_hi_row(this.t,noevent,true);
        }
//           // stará implementace pro buf_rows=rows
//           for (var ir= 1; ir<=this.tlen; ir++) {
//             if ( this.keys[this.t+ir-1-this.b]==key ) {  // projdi klíče zobrazených řádků browse
//               this.owner._key= key;
//               irow= ir;
//               break with_key;
//             }
//           }
//         }
//         // pokud je browse neprázdný označ požadovaný nebo první řádek a zavolej uživatelskou obsluhu
//         if ( irow <= this.tlen ) {
//           this.DOM_hi_row(this.t+irow-1,noevent,true);
//         }
      }
      break;
    default: Ezer.error("ERROR RUN 'raise' v browse nelze '"+event+"'");
    }
    return ok;
  },
// ------------------------------------------------------------------------------------ init_queries+
//fm: Browse.init_queries ([reload=1])
//      zruš všechny výběrové podmínky a provede základní výběr, pokud není reload=0
//a: reload - pokud je reload=0 nebude po zrušení pomínek proveden dotaz
  init_queries: function (reload) {
    reload= reload===undefined ? 1 : reload;
    this.DOM_focus();
    for ( var ic in this.part ) {
      var clmn= this.part[ic];
      if ( clmn.skill && clmn.qry_type ) {
        for ( var iq= 1; iq<=this.options.qry_rows; iq++ ) {
          clmn.DOM_qry_set(iq,'');
        }
      }
    }
    if ( reload )
      this._ask_queries();
    return 1;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _ask_queries+
// proveď výběr
  _ask_queries: function () {
    this.DOM_focus();
//     timer_init();
    var code= [{o:'x',i:'browse_load',a:5}];
    if ( this.findProc('onchange') ) code.push({o:'c',i:'onchange'});
    new Ezer.Eval(code,this,[this,null,null,null,null,-1],'query');
    return true;
  },
// ------------------------------------------------------------------------------------ get_query+
//fm: Browse.get_query ([having=false])
//      vrátí aktuální dotaz v browse ve tvaru: clmn1-qry AND clmn2-qry AND ...
//      (nezohledňuje sql_pipe pro formát q@)
  get_query_pipe:'',                            // případné modifikátory pro formát q@
  get_query: function (having) {
    having= having ? true : false;
    var qry= '', q, del= '', part;
    this.get_query_pipe= '';
    for ( var ic in this.part ) {
      part= this.part[ic];
      if ( part instanceof Ezer.Show && (q= part.get_query(having)) ) {
        qry+= del+q;
        this.get_query_pipe+= part.get_query_pipe;
        del= ' AND ';
      }
    }
    return qry;
  },
// ------------------------------------------------------------------------------------ browse_map+
//fx: Browse.browse_map (fce)
//      zavolání funkce 'fce' na serveru: fce(keys), kde 'keys' jsou klíče vybraných řádků
//a: fce - jméno funkce v PHP modulu
//r: hodnota - vrácená funkcí
  browse_map: function (fce) {
    var x= {cmd:'browse_map', fce:fce, keys:this.keys_sel};
    return x;
  },
  browse_map_: function (y) {
    return y.value;
  },
// ------------------------------------------------------------------------------------ browse_select+
//fx: Browse.browse_select (cond)
//      nastavení všech vybraných řádků do browse_keys
//a: cond - MySQL podmínka umístěná za WHERE
  browse_select: function (cond) {
    // zapomeň podmínku
    var selected_op= this.selected_op;          // vypni nastavené selected
    this.selected_op= 'ignore';
    var x= this._params({cmd:'browse_select'},cond,null,null,null,null,1);
    this.selected_op= selected_op;
    return x;
  },
  browse_select_: function (y) {
    this.keys_sel= y.keys ? y.keys.split(',') : [];
    this.selected('refresh');
    this.fire('onchoice');
    return true;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - _browse_init1+
// počáteční hodnoty souboru, buferu, tabulky
// známe index prvního záznamu
  _browse_init1: function(source) {
    this._source= 'fill';                       // metoda získání záznamů
    this.slen= 0;
    this.b= -1;
    this.blen= this.bmax;
    this.t= -1;
    this.r= -1;
    this.tlen= this.tmax;
    // staré hodnoty buferů budou zapomenuty
    this.buf= [];
    this.keys= [];
  },
// ------------------------------------------------------------------------------------ browse_fill+
//fm: Browse.browse_fill (data[,del='|',first=0[,cond,order,having]])
//      načtení dat do řádků browse, první hodnota na řádku bude použita jako klíč;
//      na začátku mohou být data nevložená do browse (lze je zpřístupnit funkcí split)
//      pokud je first>0; vrací 1 (počet řádků viz fce browse_count)
//a:    data - posloupnost hodnot oddělená oddělovačem
//      del - omezovače dat
//      first - první z dat načtený do browse
//      cond,order,having - budou zapamatovány pro případný následný browse_load
  browse_fill: function(data,del,first,cond,order,having) {
    del= del||'|';
    first= first||0;
    this.cond= cond||this.cond||'';
    this.order= order||this.order||'';
    this.having= having||this.having||'';
    var d= data ? data.split(del) : [];
    var di= first, dn= d.length, ri= 0, count= 0, val;
    this._browse_init1('fill');                 // inicializace bufferu
    while (di<dn) {
      this.keys[count]= d[di];
      this.buf[count]= {};
      for (var vi in this.part) {               // vi je identifikátor show
        if ( this.part[vi] instanceof Ezer.Show ) {
          // hodnota bude do buf transformována show._load
          this.buf[count][vi]= this.part[vi]._load(d[di++]);
        }
      }
      count++;
    }
    // definice stavu
    this.slen= this.blen= count;
    this.tlen= Math.min(this.tmax,count);
    this.tact= count ? 1 : 0;
    if ( count ) {
      this.b= this.t= this.r= 0;
    }
    // zobrazení
    this.DOM_show();
    return 1;
  },
// ------------------------------------------------------------------------------------ browse_row+
//fx: Browse.browse_row ([row=active|1])
//      přečte aktivní řádek browse a obnoví jeho zobrazení, nevyvolá onrowclick
  browse_row: function(row) {
    // vytvoř parametry dotazu
    Ezer.assert(this._source=='load',"browse_row lze pouzit jen po browse_load");
    var x= this._params({cmd:'browse_load'},null,null,null,this.r,1,0);
    x.rows= 1;
    return x;
  },
  // x - {table:..,cond:...,order:...}
  // y - {values:[[id1:val1,...]...],rows:...}
  browse_row_: function(y) {
//                                                         Ezer.debug(y,'browse_row_');
    // načtení dat řádku
    var rows= Number(y.rows), bi= this.r-this.b;
    if ( rows ) {
      // naplň řádek daty
      this.buf[bi]= {};
      for (var vi in y.values[1]) {             // vi je identifikátor show
        // hodnota bude do buf transformována show._load
        this.buf[bi][vi]= this.part[vi]._load(y.values[1][vi]);
        if ( this.keys[bi]===undefined && this.part[vi].data && this.part[vi].data.id==y.key_id ) {
          // klíč je zapsán jen podle první položky, která jej má v data.id
          this.owner._key= this.keys[bi]= this.buf[bi][vi];
        }
        this.part[vi].DOM_show(this.r);
      }
      this._css_row(this.tact);
    }
    return rows;
  },
// ------------------------------------------------------------------------------------ browse_export
//fx: Browse.browse_export (par,[cond[,order[,having]]])
//      export dat podle zadaných parametrů
//a:    par - {file:jméno souboru v docs,type:'csv'|'xls'}
//      cond - MySQL podmínka umístěná za WHERE
//      order - nepovinná část za ORDER BY
//      having - nepovinná část umístěná za HAVING v GROUP BY klauzuli
//r:    - počet přečtených řádků
  browse_export: function(par,cond,order,having,sql) {
    // vytvoř parametry dotazu
    var x= this._params({cmd:'browse_export',par:par},cond,order||null,having||null);
    return x;
  },
  browse_export_: function(y) {
    // vrací doplněné par
    return y.par;
  },
// ------------------------------------------------------------------------------------ browse_status
//fm: Browse.browse_status ()
//      vrátí stavové informace o browse jako objekt se složkami: cond, order, having
  browse_status: function() {
    var x= this._params({cmd:''});
    return x;
  },
// ------------------------------------------------------------------------------------ browse_load
//fx: Browse.browse_load ([cond[,order[,having[,from,[len[,quiet[,sql]]]]]]])
//      načtení dat do buferu browse podle podmínky
//      a jejich dynamické obarvení, pokud je definováno css_rows.
//      Nastaví první řádek jako aktivní a vyvolá na něm onrowclick
//      Buffer má délku danou atributem buf_rows
//a:    cond - MySQL podmínka umístěná za WHERE
//      order - nepovinná část za ORDER BY
//      having - nepovinná část umístěná za HAVING v GROUP BY klauzuli
//      from - pořadí prvního řádku
//      len - počet žádaných řádků
//      quiet - po načtení nemá být vyvoláno onrowclick
//      sql - nepovinný MYSQL dotaz vykonaný před hlavním dotazem
//r:    - počet přečtených řádků
  browse_load: function(cond,order,having,from,len,quiet,sql) {
    // vytvoř parametry dotazu
    //                  x,                  cond,order,      having,      from,      cursor,  zapomen_podminku,sql
    var x= this._params({cmd:'browse_load'},cond,order||null,having||null,from||null,len||null,null,sql||null);
    x.quiet= quiet||0;
    if ( sql ) x.sql= sql;
    return x;
  },
  // x - {table:..,cond:...,order:...}
  // y - {values:[[id1:val1,...]...],rows:...}
  // rec - záznam, který má být aktivní (default=1)
  browse_load_: function(y,rec) {
//                                                         Ezer.debug(y,'browse_load_');
    // načtení výsledku dotazu do buferu v Browse.buf
    // pokud je y.x.smart==1 bude dotaz doplněn, jinak jej nahradí
    var from= Number(y.from), cursor= Number(y.cursor);
    this._browse_init1('load');                 // inicializace bufferu
    // inicializace bufferu
    this._source= 'load';                       // metoda získání záznamů
    this.slen= Number(y.count);
    this.blen= Number(y.rows);
    this.b= this.blen>0 ? from : -1;
    if ( this.blen>0 ) {
      // naplň buf a keys daty
      this.owner._key= null;                    // klíč prvního řádku
      for (var bi= 0; bi<this.blen; bi++) {     // bi ukazuje do buf a keys
        this.buf[bi]= {};
        for (var vi in y.values[bi+1]) {        // vi je identifikátor show
          // hodnota bude do buf transformována show._load
          this.buf[bi][vi]= this.part[vi]._load(y.values[bi+1][vi]);
          if ( this.keys[bi]===undefined && this.part[vi].data && this.part[vi].data.id==y.key_id ) {
            // klíč je zapsán jen podle první položky, která jej má v data.id
            this.owner._key= this.keys[bi]= this.buf[bi][vi];
          }
        }
      }
    }
    // zobrazení viditelné části
    this.t= this.b;
    this.r= this.b;
    this.tlen= Math.min(this.tmax,this.blen);
    this.tact= this.tlen ? 1 : 0;
    this.DOM_show();                            // zobrazení
//     this.DOM_hi_row(this.r,true,true);          // focus jen řádku a bez onrowclick
    if ( y.quiet==0 )                           // pokud nebylo zakázáno onrowclick
      this.DOM_hi_row(this.r,false,true);       // pak focus jen řádku a s onrowclick
    // vrací počet přečtených řádků
    this.scrolling= false;
    return this.blen;
  },
// ------------------------------------------------------------------------------------ browse_seek-
//fx: Browse.browse_seek ([seek_cond [,cond[,having]]])
//      naplnění browse daty z tabulky;
//      pro správnou funkci musí browse obsahovat show s klíčem řídící tabulky
//    1.pokud není definováno seek_cond, zopakuje předchozí browse_load včetně nastavení záznamu
//      zobrazí tedy řádek s klíčem browse_key
//      (i pokud nedošlo ke změně v datech dojde k překreslení browse);
//    2.pokud je definováno seek_cond: když není definováno cond, tak současné browse posune tak,
//      aby byl zobrazen řádek vyhovující seek_cond;
//      pokud je cond definováno tak zobrazí vyhovující řádky tak aby byl vidět řádek vyhovující i seek_cond;
//      pokud řádek vyhovující seek_cond neexistuje, ponechá zobrazení beze změny a vrátí false,
//      pokud řádek existuje, vrátí jeho klíč
//a: seek_cond   - podmínka pro zviditelněný řádek
//   cond        - podmínka pro všechny řádky browse, je-li vynechána bude užita stávající
//   having      - podmínka pro všechny řádky browse umístěná za HAVING v GROUP BY
//   sql         - nepovinný MYSQL dotaz vykonaný před hlavním dotazem
  browse_seek: function(seek,cond,having,sql) {
    var x;
    if ( seek ) {
      x= this._params({cmd:'browse_seek', seek:seek, tmax:this.tmax},
         cond||null, null, having||null,null,null,null,sql||null);
    }
    else {
      x= this._params({cmd:'browse_load'},null,null,null,this.b,-1,0,sql||null);
    }
    return x;
  },
  browse_seek_: function (y) {
    var seek= 0;
    if ( y.cmd=='browse_load' ) {
      // volání browse_seek bez parametrů
      var oldkey= this.browse_key();
//                                                         Ezer.trace('*','browse_seek() key:'+oldkey);
      this.browse_load_(y,-1);  // nebude provedeno _row_move
      var indx= this.keys.indexOf(oldkey);
      if ( indx!=-1 ) {
        // obsluha funkce browse_seek bez parametrů => nastavíme původní tab_act
        this._row_move( this.b+indx);
        seek= oldkey;
      }
      this.DOM_show();
    }
    else if ( y.seek ) {
      seek= y.seek
//                                                         Ezer.trace('*','browse_seek(...) key:'+seek);
      // volání browse_seek s parametry
      this.browse_load_(y,-1);  // nebude provedeno _row_move
//       this.raise('onrowclick',Number(y.seek),0,0,1);
      var key= Number(y.seek);
      for (var iv= 0; iv<this.blen; iv++) {
        if ( this.keys[iv]==key ) {             // projdi klíče přečtených řádků browse
          this._row_move(this.b+iv);
          break;
        }
      }
      this.DOM_show();
    }
    return seek;      // vrací 0 a nemění zobrazení, pokud záznam nebyl nalezen
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _row_submit+
// vrácení klíče aktivního řádku po Enter a DblClick
  _row_submit: function(control) {
    this.fire('onsubmit',[this.keys[this.r-this.b],control]);
    return true;
  },
// ------------------------------------------------------------------------------------ browse_next+
//fm: Browse.browse_next ([r,[rowclick])
//      nastaví jako aktivní další řádek v browse, nebo r-tý řádek (1..délka souboru)
//      a vrátí jeho klíč; nevyvolá onrowclick pokud není rowclick=1;
//      pokud není uvedeno it a současný řádek je poslední, vrátí 0
//      jinak pokud požadovaný řádek není načtený v bufferu nastane chyba: 'browse_next mimo rozsah'
//      Pozn.: metoda nenačítá řádky ze serveru, pro její použití je tedy třeba definovat
//             dostatečně velký atribut buf_rows
//a: it - pokud je nenulové, nastaví řádek jako aktivní (první je 1)
  browse_next: function(r) {
    var _key= 0;
    if ( r ) {
      Ezer.assert(this.b<=r-1 && r-1<this.b+this.blen,'browse_next('+r+') je mimo rozsah');
      // skok na řádek bez onrowclick
      this._row_move(r-1,true);                 // posune this.r
      _key= this.keys[this.r-this.b];
    }
    else if ( this.r+1<this.b+this.blen ) {
      // posun na další řádek než je aktivní bez onrowclick
      this._row_move(this.r+1,true);            // posune this.r
      _key= this.keys[this.r-this.b];
    }
    return _key;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _row_seek
// funkce projde načtené řádky a pokud dojde ke shodě prvního písmena v r-tém sloupci
// se vzorem nastaví řádek jako aktivní - procházení je kruhové
  _row_seek: function (patt) {
    if ( this.order_by ) {
      // pokud je nastaveno řazení
      var ishow= null;
      for (var vi in this.part) {
        // najdeme sloupec s nastaveným řazením
        if ( this.part[vi]==this.order_by ) {
          ishow= vi;
          break;
        }
      }
      // najdeme řádek
      if ( ishow ) {
        for (var i= 0; i<this.buf.length; i++) {
          if ( this.buf[i][ishow] && this.buf[i][ishow][0].toUpperCase()==patt ) {
                                                        Ezer.trace('U','row_seek['+vi+','+i+']='+this.buf[i][ishow]);
            this._row_move(i);
            break;
          }
        }
      }
    }
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _row_move+
// funkce zajistí viditelnost záznamu r (0..slen-1)
// pokud je noevent=1 a nedojde ke čtení ze serveru nebude vyvolána událost onrowclick
  _row_move: function (r,noevent) {
    var b= this.b, blen= this.blen, t= this.t, tlen= this.tlen, slen= this.slen;
    r= Math.min(Math.max(r,0),slen-1);
    if ( r!=this.r ) {
      // pokud je pohyb uvnitř souboru a nová poloha je jiná než současná
      if ( t<=r && r<t+tlen ) {
        // pohyb v rámci tabulky                        // Ezer.trace('*','smarter row_move ['+b+'['+t+'[*'+r+'*]'+(t+tlen)+']'+(this.b+this.blen)+']'+slen+' - g');
        this.DOM_hi_row(r,noevent,true);
      }
      else if ( b<=r && r<t ) {
        // pohyb v rámci bufferu - k začátku            // Ezer.trace('*','smarter row_move ['+b+'[*'+t+'[*'+r+']'+(t+tlen)+']'+(b+blen)+']'+slen+' - b');
        this.t= r;
        this.tlen= Math.min(this.tmax,slen-t);
        this.DOM_show(r);
        this.DOM_hi_row(r,noevent,true);
      }
      else if ( t+tlen<=r && r<b+blen ) {
        // pohyb v rámci bufferu - ke konci             // Ezer.trace('*','smarter row_move ['+b+'['+t+'['+r+'*]'+(t+tlen)+'*]'+(b+blen)+']'+slen+' - d');
        this.t= r-tlen+1;
        this.r= r;
        this.DOM_show(r);
        this.DOM_hi_row(r,noevent,true);
      }
      else if ( !this.scrolling ) {
        this.scrolling= true;
        var from, len, code, mode;
        blen= Math.min(this.bmax,slen);
        tlen= Math.min(this.tmax,slen);
        if ( r+tlen<b ) {                               // blok je celý před buferem
          mode= 1;                                      // Ezer.trace('*','smarter row_move [**'+b+'['+t+'['+r+']'+(t+tlen)+']'+(b+blen)+']'+slen+' - a'+mode);
          b= t= r;
          code= [{o:'x',i:'_browse_scroll',a:8}];
          new Ezer.Eval(code,this,[this,mode,r,b,blen,r,tlen,b,blen],'smarter_scroll');
        }
        else if ( r<b) {                                // blok je částečně před buferem
          mode= 2;                                      // Ezer.trace('*','smarter row_move [*'+b+'[*'+t+'['+r+']'+(t+tlen)+']'+(b+blen)+']'+slen+' - a'+mode);
          len= Math.min(b-r,blen);
          b= t= r;
          code= [{o:'x',i:'_browse_scroll',a:8}];
          new Ezer.Eval(code,this,[this,mode,r,b,blen,r,tlen,b,len],'smarter_scroll');
        }
        else if ( b+2*blen<=r ) {                       // blok je celý za buferem
          mode= 3;                                      // Ezer.trace('*','smarter row_move ['+b+'['+t+'['+r+']'+(t+tlen)+']'+(b+blen)+'**]'+slen+' - e'+mode);
          from= r-blen+1;
          b= r-blen+1;
          t= r-tlen+1;
          code= [{o:'x',i:'_browse_scroll',a:8}];
          new Ezer.Eval(code,this,[this,mode,r,b,blen,t,tlen,from,blen],'smarter_scroll');
        }
        else {                                          // blok je částečně za buferem
          mode= 4;                                      // Ezer.trace('*','smarter row_move ['+b+'['+t+'['+r+']'+(t+tlen)+'*]'+(b+blen)+'*]'+slen+' - e'+mode);
          len= Math.min(r-b-blen+1,blen);
          from= b+blen;
          b= r-blen+1;
          t= r-tlen+1;
          code= [{o:'x',i:'_browse_scroll',a:8}];
          new Ezer.Eval(code,this,[this,mode,r,b,blen,t,tlen,from,len],'smarter_scroll');
        }
      }
    }
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - _browse_scroll+
// načtení pokračování buferu za/před stávající obsah
//   t je začátek tabulky, r bude aktivní, len je potřeba načíst
  _browse_scroll: function(mode,r,b,blen,t,tlen,from,len) {
//                                                         Ezer.trace('*','smarter _scroll r:'+r+',b:'+b+','+blen+',t:'+t+','+tlen+',S:'+from+','+len+' - '+mode);
    var x= this._params({cmd:'browse_scroll'},null,null,null,from,1);
    x.count= this.slen;                 // celkový počet záznamů select již známe
    //x.active= r;                      // záznam, který bude aktivní v tabulce
    //x.init= 0;                        // 1 pokud se bude inicializovat buffer
    x.rows= len;
    x.r= r; x.b= b; x.blen= blen; x.t= t; x.tlen= tlen; x.mode= mode;
    return x;
  },
  // x - {table:..,cond:...,order:...}
  // y - {values:[[id1:val1,...]...],rows:...}
  _browse_scroll_: function(y) {
                                                        //Ezer.debug(y,'_browse_scroll_');
    var rows= Number(y.rows), mode= Number(y.mode),
      r= Number(y.r), b= Number(y.b), blen= Number(y.blen), t= Number(y.t), tlen= Number(y.tlen);
    // načtení bloku do nových polí
    var buf= [], keys= [], key= null;           // pro nová data
    if ( rows>0 ) {
      // naplň buf a keys daty
      for (var bi= 0; bi<rows; bi++) {          // bi ukazuje do buf a keys
        buf[bi]= {};
        for (var vi in y.values[bi+1]) {        // vi je identifikátor show
          // hodnota bude do buf transformována show._load
          buf[bi][vi]= this.part[vi]._load(y.values[bi+1][vi]);
          if ( keys[bi]===undefined && this.part[vi].data && this.part[vi].data.id==y.key_id ) {
            // klíč je zapsán jen podle první položky, která jej má v data.id
            key= keys[bi]= buf[bi][vi];
          }
        }
      }
    }
    // vložení do buf a keys podle mode
    switch (mode) {
    case 1:                                     // celý blok je před buf => nahradit
    case 3:                                     // celý blok je za buf   => nahradit
      this.buf= buf;
      this.keys= keys;
      break;
    case 2:                                     // část bloku je před buf => překrýt
      // data je třeba vložit před začátek buferu
//       if ( this.blen+rows > this.bmax ) {
//         // posledních rows zapomeneme
//         var smazat= this.blen + rows - this.bmax;
//         this.buf.splice(this.blen-1,smazat);
//         this.keys.splice(this.blen-1,smazat);
//       }
      this.buf.splice(this.blen-rows,rows); // původní řešení: bylo místo předchozího if
      this.keys.splice(this.blen-rows,rows);
      Array.prototype.splice.apply(this.buf,[0,0].concat(buf));
      Array.prototype.splice.apply(this.keys,[0,0].concat(keys));
      break;
    case 4:                                     // část bloku je za buf => překrýt
      // data je třeba vložit za konec buferu - prvních rows zapomeneme
      this.buf.splice(0,rows);
      this.buf= this.buf.concat(buf);
      this.keys.splice(0,rows);
      this.keys= this.keys.concat(keys);
      break;
    }
    this.owner._key= key;
    // obnovení stavových hodnot
    this.r= r; this.b= b; this.blen= blen; this.t= t; this.tlen= tlen;
    // zobrazení tabulky
    this.DOM_show(true);                        // zobrazení bez scroll
    this.DOM_hi_row(this.r,false,true);         // focus vč. onrowclick
    this.scrolling= false;
    return rows;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _css_def+
// atributy css_rows a css_cell určují styl řádku resp. buňky
// -- funkce definuje atributy css, css_clmn objektu me (browse nebo clmn)
  _css_def: function (me,browse,opt) {
    if ( css= me.options[opt] ) {
      var as, aas, is, iv;
      as= css.split(',');
      // nalezení sloupce podle jména v css[0]
      me.css_clmn= null;                       // css_clmn = sloupec určující barvu
      for (var ic in browse.part) {            // projdi zobrazené sloupce
        if ( browse.part[ic].skill && as[0]==browse.part[ic].id ) {
          me.css_clmn= browse.part[ic];
          break;
        }
      }
      if ( !me.css_clmn ) {
        Ezer.error('browse '+browse.owner.id+'.'+browse.id+'.css nemá jako první člen jméno sloupce');
        return false;
      }
      me.css_default= null;
      for (is= 1; is<as.length; is++) {
        aas= as[is].split(':');
        if ( aas.length>1 ) {
          if ( aas[0].length )
            me.css[aas[0]]= aas[1];
          else                          // syntaxe tvaru  ,:styl,  určuje defaultní styl
            me.css_default= aas[1];
        }
        else
          me.css[is]= as[is];
      }
    }
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _set_css_rows+
// funkce pro zobrazení obarvení řádků
  _set_css_rows: function () {
    if ( this.css!={} ) {
      for (var i= 1; i<=this.tmax; i++) {
        this._css_row(i);
      }
    }
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _css_row-
// obarvení i-tého řádku případně dynamicky podle css_rows
  _css_row: function (i) {
    var css= i%2 ? 'tr-odd' : 'tr-even', icss;
    if ( i<=this.tlen ) {
      if ( this.css_clmn ) {
        // obarvení řádku podle algoritmu css_alg (sloupec musí mít číselnou hodnotu)
        icss= Number(this.buf[this.t+i-1-this.b][this.css_clmn.id]);
        if ( this.css[icss]===undefined ) {            // indexující styly
          // defaultní styl, pokud je definován
          if ( this.css_default ) css+= ' '+this.css_default;
        }
        else
          css+= ' '+this.css[icss];
      }
      this.DOM_row[i].className= css+(i==this.tact?' tr-form':'');
      if ( i==this.tact )
        this.DOM_tag[this.tact].removeClass('tag0').addClass('tag1');
      for (var ic in this.part) {
        // projití sloupců obsahujících barvení buněk
        var clmn= this.part[ic];
        if ( clmn.DOM_cell ) {
          // barvíme jen zobrazené buňky
          if ( clmn instanceof Ezer.Show ) {
            var ccss= css;
            if ( clmn.css_clmn ) {
              // pokud je požadavek na barvení, najdi sloupec, který ho určuje a doplň barvu
              icss= Number(this.buf[this.t+i-1-this.b][clmn.css_clmn.id]);
              if ( clmn.css[icss]===undefined ) {            // indexující styly
                // defaultní styl, pokud je definován
                if ( clmn.css_default ) ccss+= ' '+clmn.css_default;
              }
              else if ( clmn.css[icss] )
                ccss+= ' '+clmn.css[icss];
            }
            clmn.DOM_cell[i].className= ccss;
          }
        }
      }
      // obarvení řádků vybraných INS
      if ( this.keys_sel.contains(this.keys[this.t+i-1-this.b]) )
        this.DOM_row[i].addClass('tr-sel');
    }
    else {
      this.DOM_row[i].className= css;
    }
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _params+
// pokud je definován atribut optimize, předá jej beze změny
  _params: function (x,cond,order,having,from,cursor,zapomen_podminku,sql) {
//                                                   Ezer.trace('*','_params:'+cond+','+order+','+having+','+from+','+cursor+','+zapomen_podminku);
    Ezer.fce.touch('block',this);     // informace do _touch na server
    var to_map= x.cmd=='browse_export';         // pro browse_export doplň pro server info o map_pipe
    x.cond= cond||this.cond||1;
    if ( !zapomen_podminku ) {
      // zapamatuj si podmínku
      this.cond= x.cond;
    }
    if ( this.options.optimize )
      x.optimize= this.options.optimize;
    x.order= order||this.order||'';       this.order= x.order;
    x.having= having||this.having||'';    this.having= x.having;
    x.sql= sql||this.sql||'';             this.sql= x.sql;
    x.from= from||0;
    x.cursor= cursor||0;
    // doplň podmínku o dotazy zadané v zobrazených sloupcích browse
    var wcond= this.get_query(false);           // podmínky za WHERE
    if ( this.get_query_pipe )
      x.pipe= this.get_query_pipe;
    x.cond+= (x.cond && wcond ? " AND " : '' ) + wcond;
    var hcond= this.get_query(true);            // podmínky za HAVING
    x.having+= (x.having && hcond ? " AND " : '' ) + hcond;
    // vytvoř parametry dotazu
    // x: table, cond, order, fields:{id:label,field|expr}, from, cursor, rows, key_id, {joins...} [, group]
    // y: from, rows, values**, key_id
    x.rows= this.bmax;
    x.fields= [];
    x.joins= {};
    var field;
  //   if ( browse.patt ) browse= browse.patt;
    for (var ic in this.part) { // načti jen zobrazené sloupce použité v browse, vybírej použitá view
      field= this.part[ic];
      if ( field.skill ) this.owner._fillx(field,x,to_map);
    }
//     this.owner._fillx2(x.cond+x.order,x);
    this._fillx2(x.cond+x.order,x); // s možnou explicitní definicí x.key_id
    // změň podmínku na "jen vybrané", pokud je požadováno
    if ( this.selected_op=='use' ) {
      if ( this.keys_sel.length>0 ) {
        var as= x.table ? x.table.split('AS') : null;
        var key_id= as && as[1] ? as[1].trim()+'.'+x.key_id : x.key_id;
        x.cond+= ' AND ' + key_id + ' IN (';
        for (var i= 0, del= ''; i<this.keys_sel.length; i++, del= ',')
          x.cond+= del+this.keys_sel[i];
        x.cond+= ' )';
      }
      else x.cond= ' 0';
    }
    if ( !x.table )
      Ezer.error("RUN ERROR '"+x.cmd+"' chybi ridici tabulka pro browse "+this.id);
    if ( this.options.group_by )
      x.group= this.options.group_by;
    // explicitní nastavení jména klíče  (120131_MS)
    if ( this.options.key_id )
      x.key_id= this.options.key_id;
    return x;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _fillx+
// doplní do x seznam joins potřebných pro dotaz obsahující data
// x musí mít x.table a x.join:{}
  _fillx: function(field,x) {
    var pipe, desc, expr;
    if ( field.data ) {                         // je atribut data
      desc= {id:field.id};
      if ( !x.table ) {                         // info o table, pokud již v x není
        x.table= field.table.id + (field.view ? ' AS '+field.view.id : '');
        x.key_id= this.options.key_id ? this.options.key_id
          : field.table.options.key_id||'id_'+field.table.id;
        x.db= field.table.options.db||'';
      }
      if ( field.view ) {                       // s odkazem přes view
        if ( field.view.options.join ) {
          var xx= x.joins[field.view.id]||false;
          if (!xx ) {
            x.joins[field.view.id]= (field.view.options.join_type||'')+' JOIN '
              + (field.table.options.db ? field.table.options.db+'.' : '')
              + field.table.id
              +' AS '+field.view.id+' '+field.view.options.join;
            this._fillx2(field.view.options.join,x);      // doplní potřebná view/join
          }
        }
        desc.field= field.view.id+'.'+field.data.id;
      }
      else {                                    // s odkazem přes table
        desc.field= field.data.id;
      }
      if ( field.options && field.options.sql_pipe!==''
        && ((pipe= field.options.sql_pipe) || (pipe= field.data.options.sql_pipe)) )
        desc.pipe= pipe;
      x.fields.push(desc);
    }
    else if ( (expr= field.options.expr) ) {
      this._fillx2(expr,x);                     // doplní potřebná view/join
      desc= {id:field.id,expr:expr};
      if ( (pipe= field.options.sql_pipe) )
        desc.pipe= pipe;
      x.fields.push(desc);
    }
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _fillx2+
  // doplní do x seznam joins potřebných pro dotaz obsahující expr
  // x musí mít x.table a x.join:{}, formtype=='use'
  // view se poznají podle vzoru \w+\.
  _fillx2: function (expr,x) {
    var re, m, view;
    re= new RegExp('(\\w+)\\.','g');
    while ( m= re.exec(expr) ) {
      for ( var iv in this.part ) {
        view= this.part[iv];
        if ( view.type=='view' && view.id==m[1] ) {
          if ( view.options.join ) {
            // je to view s join
            if ( !x.joins[view.id] ) {
              x.joins[view.id]= (view.options.join_type||'')+' JOIN '
                + (view.value.options.db ? view.value.options.db+'.' : '')
                + view.value.id
                +' AS '+view.id+' '+view.options.join;
              this._fillx2(view.options.join,x); // přidej view použitá v join
            }
          }
          else {
            // je to řídící tabulka
            if ( !x.table ) {
              x.db= view.value.options.db||'';
              x.table= view.value.id+' AS '+view.id;
              x.view= view.id;
              x.key_id= view.value.key_id;
            }
          }
        }
      }
    }
  }
});
// ================================================================================================= Show
//c: Show
//      sloupec tabulkového zobrazení dat
//t: Block,Elem
//s: Block
Ezer.Show= new Class({
//os: Show.help - nápovědný text sloupce, který má přednost před textem získaným přes data
//-
//os: Show.format - vzhled prvků sloupce
//  ; 'c' : 'center' zarovnávat doprostřed
//  ; 'h' : nezobrazí se HTML a PHP tagy
//  ; 'r' : 'right' zarovnávat doprava
//  ; 's[x]' : u sloupce bude možné ovládat řazení, x může (ale jen u jediného sloupce) doplnit
//             počáteční řazení jako '+' (vzestupně) nebo '-' (sestupně)
//  ; 'q[x]' : u sloupce bude možné vyhledávat podle vzoru, x může doplnit způsob hledání
//            'q*' regulárním výrazem (default), 'q$' regulárním výrazem bez diakritiky,
//            'q=' na shodu, 'q/' intervalem (musí být 2 dotazové řádky, další se ignorují)
//  ; 't' : hodnota bude zobrazena i jako title
//  ; 'u' : EXPERIMENTÁLNÍ hodnotu lze interaktvně změnit po dvojklik
//  ;     : po dvojtečce
//  ; 'e' : místo 0 se zobrazuje ''
  Extends: Ezer.Elem,
//oi: Show.map_pipe - transformace zobrazených hodnot pomoci Map
  map_pipe: null,                       // význam atributu map_pipe (tabulka hodnot)
//os: Show.sql_pipe - transformace zobrazených hodnot pomocí funkce v PHP
  js_pipe: null,                        // null nebo jednoparametrická funkce
//os: Show.js_pipe - transformace zobrazených hodnot pomocí funkce v Javascriptu (člena Ezer.fce)
  qry_type: null,                       // typ dotazu: * $ / = nebo null
//   values: [],                           // hodnoty řádků sloupce (délka je rows, indexuje se od 1)
  css: {},                              // objekt vytvořený podle atributu css_rows
  css_clmn: null,                       // clmn řídící obarvení
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  initialize
  initialize: function(owner,desc,DOM,id,skill) {
    this.parent(owner,desc,DOM,id,skill);
    if ( this.qry_type ) {
      for (var i= 1; i<=this.owner.options.qry_rows||0; i++)
        this.DOM_qry_set(i,'');
    }
    if ( this.options.js_pipe ) {
      Ezer.assert(typeof(Ezer.fce[this.options.js_pipe])=='function',
        'Ezer.fce.'+this.options.js_pipe+' je neznámé jméno funkce',this);
      this.js_pipe= Ezer.fce[this.options.js_pipe];
    }
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  start
//f: Show.start (code,oneval)
  start: function (codes,oneval) {
    this.parent(codes,oneval);
    var id= this.options.map_pipe, m= [];
    if ( id ) {
      // pokud je definován atribut map_pipe
      var ids= id.split('.');
      Ezer.assert(1==Ezer.run_name(id,this.owner,m,ids),
        this.options.map_pipe+' je neznámé jméno map',this);
      this.map_pipe= {map:m[1],field:ids[ids.length-1]}
                                                Ezer.trace('L','map_pipe '+this.options.map_pipe);
    }
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _start2
// po načtení všech map - volá se z
  _start2: function() {
    var m= this.map_pipe.map.data[this.map_pipe.field];
    // načtení options pro show-select
    for (var i= 0; i<this.DOM_qry_select.length; i++) {
      // vytvoř z mapy seznam možností pro případný výběrový select
      var sel= this.DOM_qry_select[i];
      if ( sel ) {
        sel.Items[0]= '';
        for (var k in m) {
          sel.Items[k]= m[k];
        }
        sel.DOM_addItems();
      }
    }
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _load+
// interpretuje hodnotu podle nastavení tohoto sloupce
  _load: function (val) {
    // zpracování map_pipe
    var pipe= this.map_pipe;
    if ( pipe && val ) {
      var map_data= pipe.map.data[pipe.field];
      if ( map_data ) {
        aval= $type(val)=='string' ? val.split(',') : [val];    // hodnotou může být seznam klíčů
        val= ''; var del= '';
        for (var ia= 0; ia < aval.length; ia++) {
          val+= del+(map_data[aval[ia]]||''); del= ',';
        }
      }
    }
    else if ( this.js_pipe ) {
      // pipe je napsána jako Ezer.fce[...]
      val= this.js_pipe(val);
    }
    return val;
  },
// ------------------------------------------------------------------------------------ init+
//fm: Show.init (ti)
//      inicializace ti-tého zobrazeného řádku (1...)
  _init: function (ti) {
    if ( arguments.length==1 ) {
      this.owner.buf[this.owner.t+ti-1][this.id]= '';
      this.DOM_set(ti);
    }
    return 1;
  },
// ------------------------------------------------------------------------------------ set+
//fm: Show.set (ti,val)
//      nastaví hodnotu ti-tého řádku (1..tlen) na val s případnou transformací podle map_pipe
  set: function (ti,val) {
    // zpracování map_pipe
    var pipe= this.map_pipe;
    if ( pipe && val ) {
      var map_data= pipe.map.data[pipe.field];
      if ( map_data ) {
        aval= val.split(',');       // hodnotou může být seznam klíčů
        val= ''; var del= '';
        for (var ia= 0; ia < aval.length; ia++) {
          val+= del+(map_data[aval[ia]]||''); del= ',';
        }
      }
    }
    this.owner.buf[this.owner.r-this.owner.b][this.id]= val;
    this.DOM_set(ti);            // zobrazení s uvážením případné specifikace za ':'
    return 1;
  },
// ------------------------------------------------------------------------------------ let+
//fm: Show.let (val)
//      nastaví hodnotu aktivního řádku (1..tlen) na val s případnou změnou obarvení řádku
  let: function (val) {
    Ezer.assert(this.owner.r>=0,'let: nastavení neaktivního řádku browse '+this.owner.id);
    this.owner.buf[this.owner.r-this.owner.b][this.id]= val;
    this.DOM_set(this.owner.r-this.owner.t+1);                  // řádek tabulky
    this.owner._css_row(this.owner.r-this.owner.t+1);
    return 1;
  },
// ------------------------------------------------------------------------------------ get++
//fm: Show.get ()
//      vrátí hodnotu na aktivním řádku
  get: function () {
    Ezer.assert(this.owner.r>=0,
      "get: dotaz na sloupec '"+this.id+"' neaktivního řádku browse '"+this.owner.id+"'");
    var val= this.owner.buf[this.owner.r-this.owner.b][this.id];
//     if ( typeof(val)=="string" && val==0 )   //110418g odstraněno
//       val= 0;
    return val;
  },
// ------------------------------------------------------------------------------------ save
//fx: Show.save ()  EXPERIMENTÁLNÍ
//      zapíše změněnou hodnotu zpět do MySQL tabulky; lze volat jen po předchozím dvojkliku
//      a interaktivní změně hodnoty následované Enter, nesmí přitom dojít ke změně aktivního
//      řádku; show musí mít atribut 'data'.
//x: show [,,20,] { data:table.clmn, format:'u', proc onsubmit() { this.save } }
  save: function () {
    var browse= this.owner, x= {cmd:'show_save', fields:[], joins:{}};
    x.key= browse.keys[browse.t+browse.tact-1-browse.b];
    x.val= browse.buf[browse.r-browse.b][this.id];
    x.old= this.original.value;
    browse._fillx(this,x);
    x.field= x.fields[0].field;
    return x;
  },
  save_: function (y) {
    this.owner._opened_value= null;
    return y.rows ? 1 : 0;
  },
// ------------------------------------------------------------------------------------ width+
//fm: Show.width ([w])
//      pokud je definováno w nastaví šířku sloupce, jinak ji vrátí
  width: function (w) {
    function width_set(w) {
      this.DOM_th.setStyle('width',w);
      for (var i= 1; i<this.DOM_qry.length; i++) {
        this.DOM_qry[i].setStyle('width',w);
        if ( this.DOM_qry_select[i] )
          this.DOM_qry_select[i].DOM.setStyle('width',w);
        else
          this.DOM_qry[i].parentElement.setStyle('width',w);
      }
      for (var i= 1; i<this.DOM_cell.length; i++) {
        this.DOM_cell[i].setStyle('width',w);
      }
      // úprava případného show-select
      for (var i= 0; i<this.DOM_qry_select.length; i++) {
        // vytvoř z mapy seznam možností pro případný výběrový select
        var sel= this.DOM_qry_select[i];
        if ( sel ) {
          sel.DOM_Block.setStyle('width',w);
          sel.DOM_Closure.setStyle('width',w);
          sel.DOM_Input.setStyle('width',w);
          sel.DOM_DropList.setStyle('width',w);
        }
      }
    }
    // provedení změny
    var val= 1;
    if ( this.DOM_th ) {
      if ( w===undefined )
        val= this.DOM_th.getStyle('width').toInt();
      else if ( Number(w)==0 ) {
        width_set.call(this,0);
        this.DOM_th.addClass('BrowseNoClmn');
      }
      else {
        width_set.call(this,w);
        this.DOM_th.removeClass('BrowseNoClmn');
      }
    }
    return val;
  },
// ------------------------------------------------------------------------------------ compute+
//fm: Show.compute (fce_name[,init=0])
//      aplikuje funkci postupně na všechny načtené (tj. obecně více než na zobrazené) hodnoty
//      jednotlivých řádků sloupce.
//r: y[n]= fce(values[n],y[n-1]) pro n=min..max, kde y[min-1]= init a min..max jsou indexy values
  compute: function (fce_name,init) {
    var x= init ? (Number(init)==NaN ? init : Number(init)) : 0;
    Ezer.assert(typeof(Ezer.fce[fce_name])=='function',"compute: '"+fce_name+"' neni jmenem funkce");
    for (var i=0; i<this.owner.blen; i++) {
      x= Ezer.fce[fce_name](x,this.owner.buf[i][this.id]);
    };
    return x;
  },
// ------------------------------------------------------------------------------------ set_query
//fx: Show.set_query (i,val[,reload=1])
//      nastaví dotazovací vzor do sloupce a provede jej, pokud není reload=0
//a: i - řádek (horní má 1)
//   val - vzor
//   reload - pokud je reload=0 nebude po změně pomínek proveden dotaz. POZOR fce ale vrací null
//r: reload - tzn. vrátí nulu, pokud se neprovádí dotaz
  set_query: function (i,val,reload) {
    var x= null;
    if ( i>0 && i<=this.owner.options.qry_rows ) {
      this.DOM_qry_set(i,val);
    }
    if ( reload===undefined || reload==1 )
      x= this.owner.browse_load(null,null,null,null,-1);
    return x;
  },
  set_query_: function (y) {
    return this.owner.browse_load_(y)
  },
// ------------------------------------------------------------------------------------ get_query
//fm: Show.get_query ([having=false])
//    pokud je having=false vrátí aktuální dotaz ve sloupci browse.show pro atribut data ve tvaru:
//    pokud je formát q/ tak jedna z variant
//        field BETWEEN 'value1%' AND 'value2%'
//        field >= 'value1%'
//        field <= 'value2%'
//      nebo pokud je formát q= nebo q#
//        field='value1%' OR field='value2%' OR ...
//      nebo pokud je formát q$
//        field LIKE 'value1%' COLLATE utf8_general_ci OR ...
//      nebo pokud je formát q%
//        field LIKE '%value1%' COLLATE utf8_general_ci OR ...
//      nebo pokud je formát q@ - vzor se ztransformuje atributem sql_pipe,
//        přípustné jsou jen ? a *, nakonec se nepřidává %
//        field LIKE BINARY 'value1' OR field LIKE BINARY 'value2' OR ...
//      nebo pokud je formát q* nebo pouze q
//        field LIKE BINARY 'value1%' OR field LIKE BINARY 'value2%' OR ...
//        pokud vzor končí na $ a pro q@ nepřidává se do vzorů koncové %
//        pokud vzor začíná - vyhledá se negace
//      nebo pokud je formát q. (pouze pro _file_)
//        field value1*  - povoleny jsou žolíky ? a *
//    pokud je sloupec s atributem data typu date, je možno použít varianty q/ q= q*
//        vzory musí mít tvar d.m.r (den.měsíc.rok)
//        pro variantu q* je možné použít místo d,m,y také *
//
//    Pro atribut expr lze použít pouze formát q*
//
//    Pokud je having=false a expr obsahuje agregační funkci pak je dotaz ignorován
//        pokud je having=true a expr obsahuje agregační funkci pak je dotaz vrácen
//          ostatní jsou ignorovány
  get_query_pipe:'',                            // případné modifikátory pro formát q@
  get_query: function (having) {
    having= having ? true : false;
    var qry= '', q, qq, q1, q2, del= '', typ, id, iq, not, end, files=false, pipes= '';
    if ( this.skill && this.qry_type ) {
      // pokud výraz obsahuje agregační funkci
      var agregate= this.options.expr && typeof(this.options.expr)=='string'
        ? this.options.expr.test(/(GROUP_CONCAT|COUNT|SUM|MAX|MIN)\(/i) : false;
      if ( having==agregate ) {
        id= this.options.data ? (this.view ? this.view.id : this.table.id) + '.' + this.data.id :
            agregate          ? this.id : this.options.expr;
        if ( this._fc('h') ) {
          // pokud je sloupec s formátem 'h' použijeme MySQL uživatelskou funkci strip_tags
          id= 'strip_tags('+id+')';
        }
        // datumy je třeba konvertovat, pro data zjistíme z tabulky, pro expr heuristikou z sql_pipe
        typ= this.options.data ? this.data.type :
             this.options.sql_pipe && this.options.sql_pipe.test(/sql_date/) ? 'date' : false;
        if ( this.qry_type=='/' && this.owner.options.qry_rows>1 ) {
          // 'q/' předpokládá nejméně dvouřádkový vzor určující interval hodnot (další řádky ignoruje)
          q1= this.DOM_qry_get(1);
          if ( q1 && typ=='date' ) q1= Ezer.fce.date2sql(q1);
          q2= this.DOM_qry_get(2);
          if ( q2 && typ=='date' ) q2= Ezer.fce.date2sql(q2);
          if ( q1 && q2 )
            qry= id+" BETWEEN '"+q1+"' AND '"+q2+"'";
          else if ( q1 )
            qry= id+">='"+q1+"'";
          else if ( q2 )
            qry= id+"<='"+q2+"'";
          else
            qry= '';
        }
        else if ( this.qry_type=='=' || this.qry_type=='#' ) {
          // 'q=' test na rovnost, 'q#' test na rovnost s číselníkovou hodnotou
          for ( var iq= 1; iq<=this.owner.options.qry_rows; iq++ ) {
            if ( q= this.DOM_qry_get(iq) ) {
              if ( typ=='date' ) q= Ezer.fce.date2sql(q);
              qry+= del+id+"='"+q+"'";
              del= ' OR ';
            }
          }
        }
        else if ( this.qry_type=='$' || this.qry_type=='%' ) {
          // 'q$' a 'q%' test na vzor bez diakritiky, % hledá s levostranným %
          for ( var iq= 1; iq<=this.owner.options.qry_rows; iq++ ) {
            if ( qq= this.DOM_qry_get(iq) ) {
              not= qq.substr(0,1)=='-' ? ' NOT' : '';
              qq= not ? qq.substr(1) : qq;
              end= qq.substr(-1,1)=='$' ? '' : '%';
              qq= end ? qq : qq.substr(0,qq.length-1);
              q= qq.replace(/\*/g,'%').replace(/\?/g,'_');
              if ( this.qry_type=='%' ) {
                q= '%'+q;
              }
              qry+= del+id+not+" LIKE '"+q+end+"' COLLATE utf8_general_ci";
              del= ' OR ';
            }
          }
        }
        else if ( this.qry_type=='.' ) {
          // 'q.' vyhledávání ve jménech souborů: lze použít ? a *
          files= true;
          for ( var iq= 1; iq<=this.owner.options.qry_rows; iq++ ) {
            if ( q= this.DOM_qry_get(iq) ) {
              qry+= del+id+"="+q+'*';
              del= '|';
            }
          }
        }
        else if ( this.qry_type=='@' ) {
          // 'q@' - přípustné jsou jen ? a *, nakonec se nepřidává %
          for ( var iq= 1; iq<=this.owner.options.qry_rows; iq++ ) {
            if ( qq= this.DOM_qry_get(iq) ) {
              q= qq.replace(/\*/g,'%').replace(/\?/g,'_');
              qry+= del+"UPPER("+id+") LIKE BINARY UPPER('"+q+"')";
              var pid= this.options.sql_pipe;
              if ( !pid )
                Ezer.error('format q@ v show '+this.owner.id+'.'+this.id+' vyžaduje sql_pipe','C');
              pipes+= pid+"|"+q+"|";
              del= ' OR ';
            }
          }
        }
        else if ( this.qry_type=='*' ) {
          // 'q*' nebo 'q' standardní varianta
          for ( var iq= 1; iq<=this.owner.options.qry_rows; iq++ ) {
            if ( qq= this.DOM_qry_get(iq) ) {
              not= qq.substr(0,1)=='-' ? ' NOT' : '';
              qq= not ? qq.substr(1) : qq;
              if ( typ=='date' ) {
                qq= Ezer.fce.date2sql(qq,1);
                qry+= del+id+not+" LIKE ('"+qq+"')";
              }
              else if ( agregate && qq=='$' ) {
                qry+= del+not+" ISNULL("+id+")";
              }
              else {
                end= qq.substr(-1,1)=='$' ? '' : (this.qry_type=='@' ? '' : '%');
                qq= end ? qq : qq.substr(0,qq.length-1);
                q= qq.replace(/\*/g,'%').replace(/\?/g,'_');
                qry+= del+"UPPER("+id+")"+not+" LIKE BINARY UPPER('"+q+end+"')";
              }
              del= ' OR ';
            }
          }
        }
        else
          Ezer.error('show '+this.owner.id+'.'+this.id+' má chybu ve formátu '+"'q"+this.qry_type+"'");
      }
    }
    this.get_query_pipe= pipes; // předej žádost o modifikaci dotazu
    return qry ? (files ? qry : '('+qry+')') : '';
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  DOM_sort
// změní značku řazení podle this.sorting
  DOM_sort: function () {
    var path= Ezer.app.skin();
    this.DOM_img.setProperty('src',path+'/sort_'+this.sorting+'.png');
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _sort
// změní řazení a provede je
  _sort: function () {
    this.DOM_sort();
    var browse= this.owner;
    if ( browse.order_by && browse.order_by!=this ) { // zruš příp. řazení podle jiného sloupce
      browse.order_by.sorting= 'n';
      browse.order_by.DOM_sort();
    }
    if ( this.sorting=='n' ) {               // a zruš řazení
      browse.order= null;
      browse.order_by= null;
    }
    else {
      // definuj řazení podle tohoto sloupce - viz též v browse_clmn.start
      var id= this.data ? this.data.id : this.options.expr;
      if ( this._fc('h') ) {
        // pokud je sloupec s formátem 'h' použijeme MySQL uživatelskou funkci strip_tags
        id= 'strip_tags('+id+')';
      }
      this.owner.order= this.view ? this.view.id+'.' : '';
      this.owner.order+= id;
      this.owner.order+= this.sorting=='a' ? ' ASC' : ' DESC';
      browse.order_by= this;
    }
    browse.DOM_clear_focus();   // odstraň označení aktivního řádku
    // je třeba znovu načíst záznamy
    var code= [{o:'x',i:'browse_load',a:5}];
    new Ezer.Eval(code,browse,[browse,null,null,null,null,-1],'sort');
  }
});
// ================================================================================================= Eval
//c: Eval (code,context,args,id,continuation,no_trow)
//      interpret vnitřního kódu
//a: code - přeložený kód
//   context -  objekt, ke kterému se vztahují relativní odkazy (např. vlastník procedury) a který je potenciálním nositelem procedur onready|onbusy
//   args - seznam hodnot parametrů
//   id - nepovinné jméno (použije se jen v trasování a hlášení chyb)
//   continuation - {fce:funkce, která se provede po skončení kódu,args:parametry,obj:this pro apply}
//   no_trow - true pokud nemá být vyvolána vyjímka při chybě (jen volání Ezer.error)
//   proc -
//   calls - aktivační záznam (jen při volání ze struktur)
//s: funkce
Ezer.eval_jump= ' ';                    // pro trasování - značka přechodu podmíněnýcm skokem
Ezer.calee= null;                       // pro hlášení chyb - procedura volající funkci či metodu
Ezer.Eval= new Class({
  code: {},
  context: null,
  stack: [],
  top: -1,
  value: null,
  initialize: function(code,context,args,id,continuation,no_trow,proc,nvars) {
    Ezer.evals++;                       // zahájené volání
    this.process= ++Ezer.process;       // číslo vlákna
    Ezer.fce.DOM.warning_();            // konec případného warningu
    this.context= context;
//                                                 Ezer.trace('T','eval    '+context.type);
    if ( context && context.oneval ) {
      // pokud se na skončení/zahájení bude v bloku context.oneval reagovat
      if ( context.oneval.evals==0 ) {
//                                                 Ezer.trace('T','onbusy  '+context.oneval.type);
        if ( context.oneval.part.onbusy ) {
          context.oneval.fire('onbusy');
        }
      }
      context.oneval.evals++;
    }
    Ezer.app.evals_check();
    args= args||[];
    this.args= $A(args);
    this.nvars= nvars||0;               // počet lokálních proměnných
    this.nargs= args.length-this.nvars;
    this.code= code;
    this.id= id||'';
    this.continuation= continuation||null;
    this.requests= 0;                   // počet nedokončených požadavků na serveru
    this.no_trow= no_trow||false;
    this.stack= $A(args);               // zásobník parametrů interpretu
    this.top= args.length-1;
    this.act= args.length-1;
    this.calls= [];
    this.proc= proc||null;              // procedura nebo null
    this.c= 0;
    this.step= false;                   // true=krokovat
    this.simple= true;                  // nedošlo k vytvoření dalšího vlákna (server. modální dialog,..)
//     trace.log('EVAL:','call',this.code,this.c,this.stack,this.top,this.context,this.proc);
    this.eval();
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  val
  val: function(x) {
    var t= '?', tp= $type(x), tpi= '<i>'+tp+'</i>';
    if ( x==null ) t= '<b>null</b>';
    else if ( x===undefined ) t= '<b>undefined</b>';
    else switch (tp) {
    case 'string':
      t= htmlentities(x);
      if ( t.length>30 )
        t= "'"+t.substr(0,30)+"'"+'…'; //'&hellip;';
      else
        t= "'"+t+"'";
      break;
   case 'number':
      t= x;
      break;
    case 'object':
      t= x.type ? '<b>'+x.type+'</b> '+x.id : '<b>o</b> '+tpi;
      break;
    case 'boolean':
      t= x ? '<b>true</b>' : '<b>false</b>';
      break;
    case 'array':
      t= '<b>array</b>';
      break;
    case 'element':    case 'event':  case 'textnode':  case 'whitespace':  case 'arguments':
    case 'date':   case 'function':  case 'regexp':      case 'class':
    case 'collection': case 'window': case 'document':
      t= tpi;
      break;
    }
    return t;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  trace
  trace: function(str) {
    var tr;
    if ( Ezer.to_trace ) {
      if ( str ) {
        tr= str;
      }
      else {
        var c= this.c, cc= this.code[c];
        // poloha
        tr= padStr(this.proc ? this.proc.id + (cc.s ? ';'+cc.s : '') : this.id,16);
        // instrukce
        tr+= Ezer.eval_jump+padNum(c,2)+':';
        for (var i in cc) {
          if ( i=='iff' || i=='ift' || i=='jmp' || i=='go' ) tr+= ' '+i+'='+(c+cc[i]);
          else if ( i=='v') tr+= ' "'+cc[i]+'"';
          else if ( i=='c') tr+= ' code';
          else if ( i!='s') tr+= ' '+cc[i];
        }
      }
      tr= this.trace_stack(tr);                                 // trasování zásobníku
      Ezer.trace('',tr);
    }
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  trace_end
  trace_end: function() {
    var tr;
    if ( Ezer.to_trace ) {
      tr= padStr(this.proc ? this.proc.id : this.id,16);        // poloha
      tr+= Ezer.eval_jump+padNum(this.c,2)+': end';             // instrukce
      tr= this.trace_stack(tr);                                 // trasování zásobníku
      Ezer.trace('q',tr);
    }
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  trace_stack
  trace_stack: function(tr) {
    tr= padStr(tr,50)+' '+padNum(this.process,3)+'/'+padNum(this.calls.length,2)+'/'+
      (this.top<0 ? '--:|' : padNum(this.top,2)+':');
    for (var i= 0; i<=this.top; i++) {
      tr+= '|'+this.val(this.stack[i]);
    }
    return tr;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  trace_proc
  trace_proc: function(lc,str,proc,nargs,typ) {
    typ= typ||'E';
    var tr= '', del= '';
    if ( str ) {
      while (tr.length < this.calls.length) tr+= ' ';
      tr+= str;
    }
    // argumenty
    tr+= '(';
    for (var i= this.top-nargs+1; i<=this.top; i++) {
      tr+= del+this.val(this.stack[i]);
      del= ',';
    }
    tr+= ')';
    // pozice ve zdrojovém řádku
    if ( lc ) {
      var lcs= lc.split(',');
      tr= "<span class='trace_click'>"+padNum(lcs[0],3)+"</span>"+tr;
    }
    // výstup
    Ezer.trace(typ,tr,proc);
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  trace_fce
// ms jsou nepovinné milisekundy
  trace_fce: function(lc,str,context,args,typ,val,ms,obj) {
    var tr= '', del= '';
    if ( str ) {
      while (tr.length < this.calls.length) tr+= ' ';
      if ( typ=='x2' || typ=='a2' ) tr+= '>';
      if ( obj && obj.owner && obj.owner.id && obj.owner.type!='var' ) {
        tr+= obj.owner.id+'.';
      }
      tr+= str;
    }
    // argumenty
    if ( args ) {
      tr+= '(';
      for (var i= 0; i<args.length; i++) {
        tr+= del+this.val(args[i]);
        del= ',';
      }
      tr+= ')';
    }
    // pozice ve zdrojovém řádku
    if ( lc ) {
      var lcs= lc.split(',');
      tr= "<span class='trace_click'>"+padNum(lcs[0],3)+"</span>"+tr;
    }
    // úprava podle typu a výstup
    if ( typ=='f'  || typ=='m'  ) tr+= '=>'+this.val(val);
    else if ( typ=='x1' || typ=='a1' ) tr+= '>';
    else if ( typ=='x2' || typ=='a2' ) tr+= val!==false?'=>'+this.val(val):'';
    Ezer.trace(typ.substr(0,1),tr,context,ms);
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  eval
//f: Eval.eval (step,back)
//      interpretuje seznam následujících kódů,
//      step=ladění v krokovém režimu, back=návrat z přerušení
//      každá procedura (ff,fm,...) vrací na zásobník hodnotu, která se použije
//        jako hodnota argumentu nebo pro řízení výpočtu pomocí iff, ift
//      funkce v ezer skriptu (volaná příkazem c)
//a: 0       - prázdná operace
//   d i     - definuje context hodnotou i (nemění zásobník)
//   t a     - this: dá context na zásobník po počtu aplikací owner podle parametru (lze jen a==1)
//   t i     - this: dá zásobník kontext nejbližšího panel (i=='p') nebo form (i=='f') nabo area (i=='a')
//   v v     - hodnota v na zásobník
//   y c     - kód c na zásobník
//   u       - return
//   z i     - sníží zásobník o i, pokud je i==0 pak jej vyprázdní
//   o i     - objekt context[i] na zásobník (i='@' dá Ezer.app)
//   p i     - parametr nebo lokální proměnnou (i je offset) na zásobník
//   q i     - sníží zásobník o referenci objektu Ezer-třídy a dá na něj hodnotu o[i1][i2]...
//   r i     - sníží zásobník o referenci objektu a dá na něj hodnotu o[i1][i2]...
//   w i     - sníží zásobník a uloží do lokální proměnné (i je offset)
//   c i a v - zavolá Ezer funkci i s a argumenty a na zásobník dá její hodnotu (v je počet lok.proměnných)
//   C i a v - zavolá Ezer funkci (její kód z popisu form) i s a argumenty a na zásobník dá její hodnotu (v je počet lok.proměnných)
//   f i a   - zavolá Ezer.fce c.i s a argumenty a na zásobník dá její hodnotu
//   s i a   - zavolá Ezer.str c.i s a argumenty a na zásobník dá její hodnotu
//   i i a   - zavolá metodu c.i s a argumenty a přeruší výpočet
//   x i a   - zavolá metodu c.i s a argumenty (a ta funkci c.i na serveru a následně c.i_) a na zásobník dá její hodnotu
//   e i a   - zavolá (pomocí ask) funkci c.i na serveru s a argumenty a na zásobník dá její hodnotu
//   m i a   - sníží zásobník o referenci objektu a zavolá jeho metodu c.i s a argumenty a na zásobník dá její hodnotu
//   a i     - sníží zásobník o referenci objektu a na zásobník dá hodnotu jeho atributu c.i
//   L       - test pro foreach: na zásobníku je pole p, pokud je prázdné sníží zásobník a skočí,
//             pokud je p neprázdné dá na vrchol p.pop
//   + [jmp] [iff] [ift] - obsahují offset pro posun čitače v závislosti na hodnotě na vrcholu zásobníku
//   + [go] - obsahuje offset pro posun čitače (bez změny a závislosti na zásobníku)
//   + [s] - pozice ve zdrojovém textu ve tvaru  l,c
//r: this.value - pokud bylo vytvořeno nové vlákno (volání serveru, modální dialog, ...) pak je this.simple==false a tato hodnota ještě není dokončená
  eval: function(step,back) {
    var eval_start= Ezer.options.to_speed ? new Date().valueOf() : 0;       // měření spotřebovaného času
    try {
//       // reaguj na stopadresu
//             if ( this.proc && (this.proc.stop || this.proc.desc && this.proc.desc.stop) ) {
//               this.trace_proc('>>>STOP '+this.context.id+'.'+this.code[this.c].i,this.proc,this.nargs,'T');
//               Ezer.continuation= this;
//               Ezer.App.stopped();
//               return;
//             }
      var i, val, obj, fce, cc, args, nargs, c, top, last_lc;
      this.step= step||this.step;
      if ( !step && !back )
        if ( Ezer.is_trace.q )
           this.trace((this.code?padNum(this.code.length,2):'  ')+'::'+(this.context?this.context.id:'?')+'.'+this.id);
      last_lc= '';
      this.value= null;
      while (true) {
      last_level:
        while ( this.code[this.c] ) {
          this.value= null;
          if ( back ) {
            back= false;
            c= this.c;
            cc= this.code[c]
            if ( cc.s ) last_lc= cc.s;
            if ( this.top )
              this.value= {value:this.stack[this.top]};
            if ( Ezer.is_trace.q ) this.trace('...continue');  // trasování operace
          }
          else {
            // reakce na stop
            if ( Ezer.dbg.stop )
              throw 'stop';
            // interpretace další instrukce
            c= this.c;
            cc= this.code[c]
            if ( Ezer.is_trace.q
              || Ezer.is_trace.Q && (cc.ift || cc.iff || cc.jmp || cc.go) )
            this.trace();  // trasování operace
            if ( cc.s ) last_lc= cc.s;
            switch ( cc.o ) {
            // prázdná operace
            case 0:
              break;
            case 'v':
              this.stack[++this.top]= cc.v;
              break;
            case 'z':
              if ( cc.i>0 )
                this.top-= cc.i;
              else if ( cc.i==0 )
                this.top= -1;
              break;
            //   p i   - parametr nebo lokální proměnná na zásobník
            //           i = pořadí parametru nebo proměnné pod aktivačním záznamem
            case 'p':
              val= this.stack[this.act-cc.i];
              this.stack[++this.top]= val;
              break;
            //   w i   - zásobník do lokální proměnné
            //           i = pořadí proměnné pod aktivačním záznamem
            case 'w':
              val= this.stack[this.top--];
              this.stack[this.act-cc.i]= val;
              break;
            // objekt na zásobník (i='@' dá Ezer.app)
            case 'o':
              obj= [];
              val= Ezer.run_name(cc.i,this.context,obj);
              if ( val==3 )
                Ezer.error('jméno '+cc.i+' obsahuje nedefinovanou objektovou proměnnou '+obj[0],
                  'S',this.proc,last_lc);
              else if ( val!=1 )
                Ezer.error('jméno '+cc.i+' nemá v "'+this.context.type+' '+this.context.id+'" smysl (o)',
                  'S',this.proc,last_lc);
              this.stack[++this.top]= obj[0];
              break;
            case 'd':
              obj= [];
              if ( Ezer.run_name(cc.i,this.context,obj)!=1 )
                Ezer.error('jméno '+cc.i+' nemá v "'+this.context.type+' '+this.context.id+'" smysl (d)',
                  'S',this.proc,last_lc);
              this.context= obj[0];
              break;
            // this na zásobník
            case 't':
              if ( cc.i ) {
                // formát1: this('f'|'p'|'a')  -- form|panel|area
                obj= null;
                if ( cc.i=='p' ) {
                  for (var o= this.context; o; o= o.owner) {
                    if ( o.type.substr(0,5)=='panel' ) {
                      obj= o;
                      break;
                    }
                  }
                }
                else if ( cc.i=='f' ) {
                  for (var o= this.context; o; o= o.owner) {
                    if ( o.type=='form' || o.type=='var' && o._of=='form' ) {
                      obj= o;
                      break;
                    }
                  }
                }
                else if ( cc.i=='a' ) {
                  for (var o= this.context; o; o= o.owner) {
                    if ( o.type=='area' || o.type=='var' && o._of=='area' ) {
                      obj= o;
                      break;
                    }
                  }
                }
                if ( !obj )
                  Ezer.error('příkaz není zanořen do bloku "'+val+'"','S',this.proc,last_lc);
              }
              else {
                // formát2: this(a)
                nargs= cc.a || 0;
                i= nargs==1 ? this.stack[this.top--] : 0;
                obj= this.context;
                while ( i>0 ) {
                  obj= obj.owner;
                  i--;
                }
              }
              this.stack[++this.top]= obj;
              break;
            //   q i    - sníží zásobník o referenci objektu Ezer-třídy a dá na něj hodnotu o[i1][i2]...
            case 'q':
              var o= this.stack[this.top--]; // odstraň objekt
              if ( $type(o)!='object' )
                Ezer.error('EVAL: '+cc.i+' nemá definovaný objekt','S',this.proc,last_lc);
              obj= Ezer.obj_name(cc.i,o);
              if ( !obj )
                Ezer.error('nenalezen odkaz '+cc.i+' v "'+o.type+' '+o.id+'"',
                  'S',this.proc,last_lc);
              this.stack[++this.top]= obj;
              break;
            //   r i    - sníží zásobník o referenci objektu a dá na něj hodnotu o[i1][i2]...
            case 'r':
              var o= this.stack[this.top--]; // odstraň objekt
              if ( o instanceof Ezer.ListRow )
                o= o.part;
              if ( $type(o)!='object' )
                Ezer.error('EVAL: '+cc.i+' nemá definovaný objekt','S',this.proc,last_lc);
              obj= Ezer.obj_ref(cc.i,o);
              obj= obj===null ? '' : obj;
              this.stack[++this.top]= obj;
              break;
            //   c|C i a v - Ezer funkce: na zásobníku jsou argumenty - po volání hodnota funkce 'i'
            //               a=počet parametrů, v=počet proměnných (ale to se bere z proc.desc)
            //               je-li instrukce C, použije se kód z popisu procedury (tj. z form)
            case 'c':
            case 'C':
              val= false;
              // úschova aktivačního rámce volající procedury
              this.calls.push({code:this.code,c:this.c,nargs:this.nargs,nvars:this.nvars,
                context:this.context,proc:this.proc,act:this.act,top:this.top});
              // nalezení a aktivace volané procedury
              obj= [];
              if ( Ezer.run_name(cc.i,this.context,obj)!=1 )
                Ezer.error('nenalezena procedura '+cc.i+' v "'+this.context.type+' '+this.context.id+'"',
                  'S',this.proc,last_lc);
              this.proc= obj[0];
              // pro C použijeme kód z popisu formuláře
              this.code= cc.o=='c' ? this.proc.code : this.proc.desc.code;
              this.c= 0;
              this.nargs= this.proc.desc.npar || 0; //cc.a || 0;
              if ( (cc.a||0)<this.nargs )
                Ezer.error('procedura '+cc.i+' je volána s '+(cc.a||0)+' argumenty místo s '+this.nargs,
                  'S',this.proc,last_lc);
              this.nvars= this.proc.desc.nvar || 0; //cc.v || 0;
              this.context= this.proc.owner;
              if ( this.nvars ) {           // vymezení inicializovaného místa na lokální proměnné
                for (var i=0; i<this.nvars; i++) {
                  this.stack[++this.top]= 0;
                }
              }
              this.act= this.top;           // hranice od níž se počítají lokální proměnné a argumenty
              last_lc= '';
              if ( Ezer.to_trace ) {
                if ( Ezer.is_trace.q )
                  this.trace((this.code?padNum(this.code.length,2):'  ')+'::'+(this.context?this.context.id:'?')+'.'+cc.i);
                if ( Ezer.is_trace.E )
                  this.trace_proc(cc.s,this.context.id+(cc.o=='C'?'.desc.':'.')+cc.i,this.proc,this.nargs);
                else if ( Ezer.is_trace.T && this.proc.trace )
                  this.trace_proc(cc.s,this.context.id+'.'+cc.i,this.proc,this.nargs,'T');
              }
              if ( this.step || this.proc.stop || this.proc.desc && this.proc.desc.stop ) {
                this.trace_proc(cc.s,'>>>STOP '+this.context.id+'.'+cc.i,this.proc,this.nargs,'T');
                Ezer.continuation= this;
                Ezer.App.stopped(this.proc);
                this.simple= false;
                if ( Ezer.options.to_speed ) this.speed(eval_start);
                return;
              }
              continue last_level;
            case 'u':
              this.value= {value:this.stack[this.top]};
              break last_level;
            // funkce: na zásobníku jsou argumenty - po volání hodnota funkce 'i'
            case 'f':
              val= false;
              nargs= cc.a || 0;
              for (i= nargs-1, args= []; i>=0; i--)
                args.push(this.stack[this.top-i]);
              this.top-= nargs;
              fce= Ezer.fce[cc.i];
              if ( $type(fce)!='function' )
                Ezer.error('EVAL: '+cc.i+' není funkce','S',this.proc,last_lc);
              Ezer.calee= this.proc;
              val= fce.apply(this.context,args);
              Ezer.calee= null;
              if ( Ezer.to_trace && Ezer.is_trace.f ) this.trace_fce(cc.s,cc.i,this.context,args,'f',val);
              if ( val!==false ) this.stack[++this.top]= val;
              break;
            // struktura: na zásobník dá kód pro výpočet
            case 'y':
              this.stack[++this.top]= cc.c;
              break;
            // řídící struktura: na zásobníku jsou argumenty - po volání hodnota funkce 'i'
            case 's':
              val= false;
              nargs= cc.a || 0;
              var pars= []; // do pars dej aktivační záznam aktivní procedury včetně proměnných
              for (i= this.nargs+this.nvars; i>0; i--) {
                pars.push(this.stack[this.act-i+1]);
              }
              for (i= nargs-1,args= [this,pars]; i>=0; i--)   // jako 1.parametr je kontext
                args.push(this.stack[this.top-i]);
              this.top-= nargs;
              obj= Ezer.str[cc.i];
              if ( $type(obj)!='function' )
                Ezer.error('EVAL: '+cc.i+' není řídící struktura','S',this.proc,last_lc);
              this.c= c+1;
              val= obj.apply(null,args);
              this.simple= false;
              if ( Ezer.options.to_speed ) this.speed(eval_start);
              return;
            // funkce na serveru přes 'ask': na zásobníku jsou argumenty - po volání hodnota funkce 'i'
            case 'e':
              val= false;
              nargs= cc.a || 0;
              for (i= nargs-1, args= []; i>=0; i--)
                args.push(this.stack[this.top-i]);
              this.top-= nargs;
              if ( Ezer.to_trace && Ezer.is_trace.a ) this.trace_fce(cc.s,cc.i,obj,args,'a1');
              this.ask(cc.i,args,cc.s);
              this.c= c;
              this.simple= false;
              if ( Ezer.options.to_speed ) this.speed(eval_start);
              return;
            // metoda: na zásobníku jsou argumenty a pod nimi objekt - po volání hodnota metody 'i'
            case 'm':
              Ezer.value= false;
              nargs= cc.a || 0;
              for (i= nargs-1, args= []; i>=0; i--)
                args.push(this.stack[this.top-i]);
              this.top-= nargs;
              obj= this.stack[this.top--]; // odstraň objekt
              if ( $type(obj)!='object' )
                Ezer.error('EVAL: '+cc.i+' nemá definovaný objekt','S',this.proc,last_lc);
              // metodu call vyřešíme zvlášť
              if ( cc.i=='_call' ) {
                if ( obj.type=='var' )
                  obj= obj.value;
                if ( !obj || !obj._call )
                  Ezer.error('EVAL: call nemá definovaný objekt','S',this.proc,last_lc);
                fce= obj._call;
                Ezer.calee= this.proc;
                args.unshift(cc.s);
                val= fce.apply(obj,args);
              }
              else {
                // cc.i je buďto metoda proměnné nebo metoda objektu, který je hodnotou proměnné
                if ( !(fce= obj[cc.i]) && obj.type=='var' && (obj= obj.value) )
                  fce= obj[cc.i]
                if ( $type(fce)!='function' )
                  Ezer.error('EVAL: '+cc.i+' není metoda '+obj.type,'S',this.proc,last_lc);
                Ezer.calee= this.proc;
                val= fce.apply(obj,args);
              }
              Ezer.calee= null;
              val= ( val===false ) ? obj : val;  // pokud není hodnota, zůstane objekt na zásobníku
              if ( Ezer.to_trace && Ezer.is_trace.m )
                this.trace_fce(cc.s,obj.id+'.'+cc.i,obj,args,'m',val,0,obj);
              this.stack[++this.top]= val;
              break;
            // přerušení: stav se uloží do context.continuation
            case 'i':
              Ezer.value= false;
              nargs= cc.a || 0;
              for (i= nargs-1, args= []; i>=0; i--)
                args.push(this.stack[this.top-i]);
              this.top-= nargs;
              obj= this.stack[this.top--]; // odstraň objekt
              if ( $type(obj)!='object' )
                Ezer.error('EVAL: '+cc.i+' nemá definovaný objekt','S',this.proc,last_lc);
              if ( $type(obj[cc.i])!='function' )
                Ezer.error('EVAL: '+cc.i+' není metoda '+obj.type,'S',this.proc,last_lc);
              obj= obj[cc.i].apply(obj,args);
              if ( obj && Ezer.to_trace && Ezer.is_trace.x ) this.trace_fce(cc.s,obj.id+'.'+cc.i,obj,args,'x1');
              if ( obj ) {
                // pokud se start přerušení povedl
                this.c= c;
                obj.continuation= this;  // pokračování zajistí nějaká metoda z kontextu
                this.simple= false;
                if ( Ezer.options.to_speed ) this.speed(eval_start);
                return;
              }
              break;
            // přerušení: stav se uloží do context.continuation ... není metoda ale funkce
            case 'j':
              Ezer.value= false;
              nargs= cc.a || 0;
              for (i= nargs-1, args= []; i>=0; i--)
                args.push(this.stack[this.top-i]);
              this.top-= nargs;
              fce= Ezer.fce[cc.i];
              if ( $type(fce)!='function' )
                Ezer.error('EVAL: '+cc.i+' není funkce','S',this.proc,last_lc);
              val= fce.apply(this.context,args);
              if ( val ) {
                // pokud se start přerušení povedl
                this.c= c;
                Ezer.modal_fce= this;  // pokračování se zajistí voláním eval(this.step,true)
                this.simple= false;
                if ( Ezer.options.to_speed ) this.speed(eval_start);
                return;
              }
              else {
                // pokud ne, vrať 0 jako výsledek
                this.stack[++this.top]= 0;
                break;
              }
            // metoda na serveru: na zásobníku jsou argumenty a pod nimi objekt - po volání hodnota metody 'i'
            case 'x':
              Ezer.value= false;
              nargs= cc.a || 0;
              for (i= nargs-1, args= []; i>=0; i--)
                args.push(this.stack[this.top-i]);
              this.top-= nargs;
              obj= this.stack[this.top--]; // odstraň objekt
              if ( $type(obj)!='object' )
                Ezer.error('EVAL: '+cc.i+' nemá definovaný objekt','S',this.proc,last_lc);
              // cc.i je buďto metoda proměnné nebo metoda objektu, který je hodnotou proměnné
              if ( !(fce= obj[cc.i]) && obj.type=='var' ) {
                if ( (obj= obj.value) )
                  fce= obj[cc.i]
                else
                  Ezer.error('EVAL: '+cc.i+' nemá definovaný objekt','S',this.proc,last_lc);
              }
              if ( $type(fce)!='function' )
                Ezer.error('EVAL: '+cc.i+' není metoda '+obj.type,'S',this.proc,last_lc);
              val= fce.apply(obj,args);
              if ( Ezer.to_trace && Ezer.is_trace.x ) this.trace_fce(cc.s,obj.id+'.'+cc.i,obj,args,'x1');
                                                      if (Ezer.is_trace.x) Ezer.debug(val,'fx:'+cc.i+'>');
              if ( typeof(val)=='object' ) {
                if ( val && val.cmd ) {
                  this.askx(obj,cc.i,val);
                  this.c= c;
                  this.simple= false;
                  if ( Ezer.is_trace.q ) this.trace('wait...');  // trasování operace
                  if ( Ezer.options.to_speed ) this.speed(eval_start);
                  return;
                }
              }
              // pokud první část funkce selže, dej 0 na zásobník - jinak 1
              this.stack[++this.top]= val ? 1 : 0;
              break;
            // atribut: na zásobníku je objekt - po volání hodnota atributu 'i'
            case 'a':
              Ezer.value= false;
              obj= this.stack[this.top--]; // odstraň objekt
              if ( cc.i=='_id' )
                val= obj[cc.i]
              else if ( obj.options )
                val= obj.options[cc.i];
              else
                val= obj[cc.i];
              this.stack[++this.top]= val;
              break;
            // L - test pro foreach: na zásobníku je pole p, pokud je prázdné sníží zásobník a skočí,
            //     pokud je p neprázdné dá na vrchol p.shift
            case 'L':
              obj= this.stack[this.top];                // pole
              if ( $type(obj)!='array' )
                Ezer.error('EVAL: '+cc.i+' nemá definované pole','S',this.proc,last_lc);
              if ( !obj.length ) {                      // pokud je prázdné
                this.top--;                             // tak je odstraň ze zásobníku
                Ezer.eval_jump= '*';                    // bude ukončeno skokem za foreach
              }
              else {                                    // jinak na vrchol dej
                this.stack[++this.top]= obj.shift();    // element pole a zkrať pole
                c-= cc.go-1;                            // a eliminuj příkaz skoku
              }
              break;
            default:
              Ezer.error('EVAL: '+cc.o+' není kód','S',this.proc,last_lc);
            }
          }
          // proveď akci go - pokud je přítomna - beze změny zásobníku
          if ( cc.go ) {
              c+= cc.go;
              Ezer.eval_jump= ' ';                      // příznak neskoku
          }
          // proveď akce jmp, iff, ift - pokud jsou přítomny - jinak nech na vrcholu zásobníku hodnotu
          else if ( cc.ift || cc.iff || cc.jmp || cc.next ) {
            if ( this.top<0 )
              Ezer.error('EVAL: stack underflow');
            top= this.stack[this.top--];
            if ( top=='0' )
              top= 0;
            if ( cc.jmp ) {
              c+= cc.jmp;
              Ezer.eval_jump= ' ';                      // příznak neskoku
            }
            else if ( cc.iff && !top ) {
              c+= cc.iff;
              Ezer.eval_jump= '*';                      // příznak skoku
            }
            else if ( cc.ift && top ) {
              c+= cc.ift;
              Ezer.eval_jump= '*';                      // příznak skoku
            }
            else {
              c++;
              Ezer.eval_jump= ' ';                      // příznak neskoku
            }
          }
          else c++;
          this.c= c;
        } // :last_level
        if ( Ezer.is_trace.q )
          this.trace_end('end');  // trasování operace
        // konec tohoto kódu
        if ( this.calls.length>0 ) {
          // pokud je to konec vnořené procedury, odstraň argumenty
          this.top= this.act-this.nargs-this.nvars;
          var last= this.calls.pop();
          this.code= last.code;
          this.proc= last.proc;
//           this.nargs= last.nargs;
          this.nargs= last.nargs;
          this.nvars= last.nvars;
          this.act= last.act;
          this.context= last.context;
//           this.top= last.top;
//           this.top-= last.nargs+last.nvars;
          if ( this.value ) {
            // pokud funkce vrátila hodnotu příkazem return (tj. třeba uprostřed výrazu)
            this.stack[++this.top]= this.value.value;
            this.value= null;
          }
          else {
            // pokud funkce neskončila příkazem return je to jakoby vrátila 1
            this.stack[++this.top]= 1;
          }
          cc= last.code[last.c];
          // pokud je v instrukci go použije se k řízení výpočtu (bez snížení zásobníku)
          if ( cc.go ) {
            this.c= last.c+cc.go;
          }
          // pokud je v instrukci iff, ift, jmp spotřebuje se hodnota k řízení výpočtu
          else if ( cc.ift || cc.iff || cc.jmp ) {
            top= this.stack[this.top--];
            this.c=
              cc.jmp         ? last.c+cc.jmp : (
              cc.ift &&  top ? last.c+cc.ift : (
              cc.iff && !top ? last.c+cc.iff :
              last.c+1 ));
          }
          else
            this.c= last.c+1;
        }
        else break;
      }
      // konec všech procedur
      if ( this.value )
        this.value= this.value.value;
      else if ( this.top>=0 )
        this.value= this.stack[this.top--];
      else
        this.value= null;
      this.top-= this.nargs;
      this.stack[++this.top]= this.value;
      if ( this.continuation && !this.requests ) {
        // pokud je definována pokračovací funkce a nečekáme na server, zavolej ji
        if ( this.continuation.stack )
          // a pokud je .stack==true přidej na konec hodnotu
          this.continuation.args.push(this.value);
        this.continuation.fce.apply(this.continuation.obj||this,this.continuation.args);
      }
      this.eval_();                                       // ukončení objektu Eval
//       Ezer.eval_list[this.process]= null;
      Ezer.app.evals_check();
    }
    catch (e) {
      if (e=='stop')                                  // uživatelský stop
        Ezer.error('aplikace byla stopnuta','msg');
      else {
        this.eval_();                                       // ukončení objektu Eval
        Ezer.app.evals_check();
        if ( e=='S' ) {                                     // volání Ezer.error v eval
        }
        else if (typeof(e)=='object' && e.level=='user') {  // chyba ošetřená uživatelem: Ezer.fce.error
          Ezer.error(e.msg||'','s',this.proc,null,this.calls);
        }
        else {
          if (e.level=='system')
            alert(e.msg);                        // chyba ošetřená testem: Ezer.error
          else if ( this.no_trow ) {
            var msg= '';
            if ( e.message && e.fileName && e.lineNumber && e.name)
              msg= ' - '+e.name+':'+e.message+' in '+e.fileName+';'+e.lineNumber;
            Ezer.error('Ezerscript error in '+this.id+msg,'s',this.proc);
          }
          else {
            if ( Ezer.browser=='CH' ) {
              var astack= e.stack.split("\n");
              Ezer.error(e?'Javascript '+(astack[0]+astack[1]||e):'error in eval','E',e);
            }
            else
              Ezer.error(e?'Javascript '+(e.msg||e):'error in eval','E',e);
          }
        }
      }
    }
    if ( Ezer.options.to_speed ) this.speed(eval_start);
  },
  // počítání času stráveného interpretem
  speed: function(ms0) {
    var ms= new Date().valueOf()-ms0;
    Ezer.obj.speed.ezer+= ms;
    Ezer.fce.speed('show');
  },
  // ukončení Eval a následné zrušení this
  eval_: function() {
    if ( Ezer.evals ) Ezer.evals--;                       // ukončené volání
    if ( this.context && this.context.oneval ) {
      // pokud se na skončení/zahájení bude v bloku context.oneval reagovat
      this.context.oneval.evals--;
      if ( this.context.oneval.evals==0 ) {
//                                                 Ezer.trace('T','onready '+this.context.oneval.type
//                                                   +(this.context.oneval.scrolling?' S':''));
        if ( this.context.oneval.part.onready ) {
          this.context.oneval.fire('onready');
        }
      }
    }
//                                                 Ezer.trace('T','evalEnd '+this.context.type);
  },
  // askx(args): dotaz na server s pokračováním ve výpočtu po dokončení
  //             musí obsahovat položku cmd:operace kde operace je známá v ezer2.php
  askx: function(obj,fce,x) {
    this.requests++;                    // zvyš počet požadavků na server
    var app= this;
    var ms= new Date().valueOf();
    x.root= Ezer.root;                  // název/složka aplikace
    x.session= Ezer.options.session;    // způsob práce se SESSION
    x.totrace= Ezer.App.options.ae_trace;
    var ajax= new Request({url:Ezer.App.options.server_url, data:x, method:'post',
      onComplete: function(ay) {
        this.onComplete(ay,obj,fce,'x',ms);
      }.bind(this),
      onFailure: function(xhr){
        Ezer.error('SERVER failure (4)','s',this.proc,this.proc?this.proc.desc._lc:null);
      }.bind(this)
    },this);
    ajax.send();
    Ezer.App._ajax(1);
  },
  // ask(args): dotaz na server s pokračováním ve výpočtu po dokončení
  //            lc obsahuje informaci o řádku a sloupci ezerscriptu
  ask: function(fce,args,lc) {
    this.requests++;                    // zvyš počet požadavků na server
    var app= this;
    var ms= new Date().valueOf();
//                                                  Ezer.trace('*','ms:'+ms);
    var x= {cmd:'ask',fce:fce,args:args,nargs:args.length,parm:Ezer.parm,
      totrace:Ezer.App.options.ae_trace};
    if ( lc ) x.lc= lc;
    x.root= Ezer.root;          // název/složka aplikace
    x.session= Ezer.options.session;    // způsob práce se SESSION
    var ajax= new Request({url:Ezer.App.options.server_url, data:x, method:'post',
//       onComplete: function(ay){
      onSuccess: function(ay){
        this.onComplete(ay,null,fce,'a',ms);
      }.bind(this),
      onFailure: function(xhr){
        Ezer.error('SERVER failure (3)','s',this.proc,this.proc?this.proc.desc._lc:null);
      }.bind(this)
    },this);
    ajax.send();
    Ezer.App._ajax(1);
  },
  onComplete: function (ay,obj,fce,t,ms0) {
//     var ms= ((new Date().valueOf()-ms0)/1000).round();
    var ms= new Date().valueOf()-ms0;
//                                                  Ezer.trace('*','ms:'+ms/1000);
    this.requests--;                   // sniž počet požadavků na server
    Ezer.App._ajax(-1);
    var y, val= false;
    try { y= JSON.decode(ay); } catch (e) { y= null; }
                                    if (t=='x' && Ezer.is_trace.x) Ezer.debug(y,'fx:>'+fce);
//                                                         if (Ezer.is_trace.u) Ezer.debug(y,'>fx:'+fce);
    if ( !y )
      Ezer.error('EVAL: syntaktická chyba na serveru:'+ay,'s',this.proc,this.proc?this.proc.desc._lc:null);
    else {
      if ( Ezer.options.to_speed ) {
        Ezer.obj.speed.net+= ms - y.php_ms;             // čistý čas přenosu dat
        Ezer.obj.speed.sql+= y.qry_ms;                  // měřeno jen v mysql_qry
        Ezer.obj.speed.php+= y.php_ms - y.qry_ms;
        Ezer.obj.speed.data+= ay.length;
        Ezer.fce.speed('show');
      }
      if ( y.trace ) Ezer.trace('u',y.trace,null,ms);
      if ( Ezer.App.options.ae_trace.indexOf('M')>=0 && y.qry )
        Ezer.trace('M',y.qry,null,Math.round(y.qry_ms*1000)/1000);
      if ( y.error ) {
        Ezer.error('EVAL: '+y.error,'s',this.proc,this.proc?this.proc.desc._lc:null);
      }
      else if ( obj ) {
        val= obj[fce+'_'].call(obj,y);
        this.stack[++this.top]= val;
      }
      else {
        val= this.stack[++this.top]= y.value;
      }
      if ( y.warning ) {
        Ezer.fce.warning(y.warning);
      }
      if ( Ezer.to_trace && Ezer.is_trace[t] )
        this.trace_fce(y.lc?y.lc:'?',(obj?obj.id+'.':'')+fce,obj,null,t+'2',val,ms);
      this.eval.apply(this,[this.step,true]);
    }
  }
});
// ================================================================================================= obecné funkce
// -------------------------------------------------------------------------------------- code_name
// funkce vrací bezkontextový význam name v code jako pole
//   name :: ('$'|'#') ( '.' id )*  | ( '.'+ | id ) ( '.' id )*  NEBO [id+]
// kde '#' označuje lokální kořen knihovního bloku (první s atributem library)
// je volána pouze v době inicializace zaváděného modulu (je v Ezer.app.library_root)
Ezer.code_name= function (name,ids,context) {
  var ctx= null, code;
  if ( !ids ) var ids= [];
  ids.length= 0;
  ids.extend(typeof(name)=='string' ? name.split('.') : name);
  // pokud jméno začíná $ jde o absolutní jméno kořenu aplikace
  if ( ids[0]=='$' || ids[0]=='#' ) {
    if ( ids[0]=='$' ) {
      code= Ezer.code['$'];
    }
    else if ( ids[0]=='#' ) {
      // pokud jméno začíná # najdi knihovní kořen (nejbližšího s atributem library)
      for (var lib= context; lib && !lib._library && !lib.desc.library; lib= lib.owner);
      Ezer.assert(lib,'code_name:'+name+' in '+context.id+' (a)');
      code= lib.desc;
    }
    ctx= [code];
    // další id již musí být obsaženy v postupně se upřesňujícím kontextu
    for (var i= 1; i<ids.length; i++) {
      if ( code.part && (code= code.part[ids[i]]) ) {
        ctx[i]= code;
      }
      else {
        ctx= null;
        break;
      }
    }
    if ( ctx ) ctx.reverse();
  }
  else {
    // relativní jméno
    ctx= [];
    if ( Ezer.run_name(name,context||null,ctx,ids)!=1 )
      ctx= null;
//     Ezer.assert(1==Ezer.run_name(name,context||null,ctx,ids),'code_name:'+name+' in '+context.id+' (b)');
  }
  return ctx;
}
// -------------------------------------------------------------------------------------- run_name
// funkce vrací kontextový význam name tzn. Ezer-třídu v kontextu dané Ezer-třídy
// pro name='@' vrací Ezer.App
// jako pole context, kde pole[0] je pojmenovaný objekt
// name :: ( .+ | id ) ( . id )*
// vrací 1 : pokud je celé jméno rozeznáno
//       2 : pokud je jméno rozeznáno až na poslední id (může jít o deklaraci)
//       3 : pokud nějaké id je objektová proměnná a nemá nastavenu hodnotu (bude v ctx[0])
//       0 : jméno nedává smysl
Ezer.run_name= function (name,run_context,ctx,ids0) {
  var c= -1, context= run_context, result= 0;
  ctx.length= 0;
  konec: {
    var i= 1, ids= arguments.length==3 ? name.split('.') : ids0;
    if ( ids[0]=='$' ) {
      // pokud jméno začíná $ jde o absolutní jméno
      context= Ezer.run.$;
      i= 1;
    }
    else if ( ids[0]=='#' ) {
      // pokud jméno začíná # najdi knihovní kořen (nejbližšího s atributem library)
      for (var lib= context; lib && !lib._library && !lib.desc.library; lib= lib.owner);
      Ezer.assert(lib,'run_name:'+name+' in '+context.id+' (a)');
      context= lib;
      i= 1;
    }
    else if ( ids[0]=='@' ) {
      // pokud jméno=@ jde o pojmenování Ezer.app
      context= Ezer.app;
      i= 1;
    }
    else if ( ids[0]=='' ) {
      // první je řetezec teček tzn. cesta k předkům
      i= ids[ids.length-1]=='' ? 1 : 0;
      for (; i<ids.length && ids[i]==''; i++) {
        if ( context.owner ) {
          context= context.owner;
//           if ( context.type=='var' ) {
//             context= context.owner;
//           }
        }
        else {
          // kontext není dost hluboký
          context= null;
          break;
        }
      }
    }
    else if ( context.part && context.part[ids[0]] ) {
      // nebo jméno bratra
      context= context.part[ids[0]];
    }
    else if ( context.type=='var' && context.value && context.value.part && context.value.part[ids[0]] ) {
      // nebo jméno bratra přes proměnnou
      context= context.value.part[ids[0]];
    }
    else if ( context.type=='view' && context.value && context.value.part && context.value.part[ids[0]] ) {
      // nebo jméno bratra přes proměnnou
      context= context.value.part[ids[0]];
    }
//     else if ( context.type=='map' ) {
//       // nebo jméno položky v tabulce mapy
//       context= context.data[ids[2]];
//       i= 2;
//     }
    else {
      // nebo jméno moje či některého z předků
      for (; context; context= context.owner) {
        if ( context.id==ids[0] ) {
          break;
        }
        else if ( context.part && context.part[ids[0]] ) {
          i= 0;
          break;
        }
        else if ( context.desc.part && context.desc.part[ids[0]] &&  context.desc.part[ids[0]].type=='table' ) {
          i= 0;
          break;
        }
      }
    }
    if ( context ) {
      ctx[++c]= context;
      if ( ids.length>i ) {
        // další id již musí být obsaženy v postupně se upřesňujícím kontextu
        // pokud se nepozná poslední id, je navrácena hodnota 2 (u mapy 1)
        for (; i<ids.length; i++) {
          Ezer.assert(context,'run_name');
          if ( context.type=='var' && context._of=='object' ) {
            // dereference objektové proměnné
            if ( !context.value ) {
              result= 3;
              ctx[0]= context._id;
              return result;
            }
            context= context.value;
          }
          if ( context.part && context.part[ids[i]] ) {
            ctx[++c]= context= context.part[ids[i]];
          }
          else if ( context.type=='var' && context.value && context.value.part && context.value.part[ids[i]]) {
            ctx[++c]= context= context.value.part[ids[i]];
          }
          else if ( context.type=='view' && context.value && context.value.part && context.value.part[ids[i]]) {
            ctx[++c]= context= context.value.part[ids[i]];
          }
          else if ( context.type=='map' ) {
            ctx[++c]= context.data[ids[i]];
            result= 1;
            break konec;
          }
          else if ( context.type=='table' && context.part && context.part[ids[i]] ) {
            ctx[++c]= context.part[ids[i]];
            result= 1;
            break konec;
          }
          else if ( context.type=='table' && context.desc && context.desc.part[ids[i]] ) {
            ctx[++c]= context.desc.part[ids[i]];
            result= 1;
            break konec;
          }
          else if ( context.desc && context.desc.part && context.desc.part[ids[i]] ) {
            ctx[++c]= context= context.desc.part[ids[i]];
          }
          else if ( ids[i]=='form' && context.type=='var' && context.value.type=='form'  ) {
            ctx[++c]= context= context.value;
          }
          else if ( ids[i]=='panel' && context.type.substr(0,5)=='panel'  ) {
            ctx[++c]= context= context;
          }
          else if ( i==ids.length-1 ) {
            // pouze poslední jméno se nepoznalo - deklarace?
            result= 2;
            break konec;
          }
          else {
            ctx= null;
            result= 0;
            break konec;
          }
        }
      }
      result= 1;
    }
  }
  if ( ctx ) ctx.reverse();
  return result;
}
// -------------------------------------------------------------------------------------- obj_name
// funkce vrací význam name tzn. Ezer-třídu v kontextu dané Ezer-třídy
// name :: ( .+ | id ) ( . id )*
Ezer.obj_name= function (name,obj) {
  var ids= name.split('.'), ctx= obj;
  // jednotlivá id již musí být obsaženy v postupně se upřesňujícím kontextu
  for (var i= 0; i<ids.length; i++) {
    if ( ctx.type=='var' && ctx.value && ctx.value.part && ctx.value.part[ids[i]]) {
      ctx= ctx.value.part[ids[i]];
    }
    else if ( ctx.type=='view' && ctx.value && ctx.value.part && ctx.value.part[ids[i]]) {
      ctx= ctx.value.part[ids[i]];
    }
    else if ( ctx.type=='map' ) {
      ctx= ctx.data[ids[i]];
      break;
    }
    else if ( ctx.part && ctx.part[ids[i]] ) {
      ctx= ctx.part[ids[i]];
    }
    else {
      ctx= null;
      break;
    }
  }
  return ctx;
}
// -------------------------------------------------------------------------------------- obj_ref
// funkce vrací složku name daného objeku
// name :: ( .+ | id ) ( . id )*
Ezer.obj_ref= function (name,obj) {
  var ids= name.split('.'), ctx= obj;
  // jednotlivá id již musí být obsaženy v postupně se upřesňujícím kontextu
  // pokud ne, je navrácena hodnota null
  for (var i= 0; i<ids.length; i++) {
    if ( ctx && ctx[ids[i]]!==undefined ) {
      ctx= ctx[ids[i]];
    }
    else {
      ctx= null;
      break;
    }
  }
  return ctx;
}
// ================================================================================================= str
// struktury dostávají jako argumenty ne hodnoty ale kód
Ezer.str= {};
// -------------------------------------------------------------------------------------- each
//fs: str.each (obj,fce,a1,a2,..)
//      zavolá funkci fce(xi,i,a1,a2,...) pro každou složku x objektu obj=[x0,x1,...]
//      (pro objekty typu Ezer.List jsou procházeny vnořené Ezer.ListRow)
//      POZOR: ve fce nesmí být volány asynchronní příkazy (ask ap.)
//s: funkce
Ezer.str['each']= function () {
  var n= 0;
  var that= arguments[0];       // volající objekt Ezer.Eval
  var args= arguments[1];       // hodnoty parametrů a proměnných volajícího objektu Ezer.Eval
  var obj_code= arguments[2];
  var fce_code= arguments[3];
  var pars= [];
  for(var i= 4; i<arguments.length; i++) {
    pars.push(arguments[i]);
  }
  var obj= new Ezer.Eval(obj_code,that.context,args,'each-obj',that.no_trow,that.proc);
  if ( obj.value ) {
    var parts= obj.value instanceof Ezer.List ? obj.value.part : obj.value;
    $each(parts,function(p,k) {
//       var code= [{o:'v',v:p},{o:'c',i:fce_code[0].i,a:1}];
      var code= [{o:'v',v:p},{o:'v',v:k}];
      for(var i= 0; i<pars.length; i++) {
        code.push({o:'v',v:pars[i]});
      }
      code.push({o:'c',i:fce_code[0].i,a:pars.length+2,s:fce_code[0].s});
      new Ezer.Eval(code,that.context,args,'each-part',that.no_trow,that.proc);
      n++;
    });
  }
  else Ezer.error('operátor each není použit na korektní objekt','S',that);
  that.stack[++that.top]= n;
  that.eval();
};
// -------------------------------------------------------------------------------------- new_form
//fs: str.new_form (form_name,left,top[,relative=0])
//      vytvoření instance form - volá se výrazem new_form
//s: funkce
Ezer.str.new_form= function() {
  var that= arguments[0];       // volající objekt Ezer.Eval
  var args= arguments[1];       // hodnoty parametrů a proměnných volajícího objektu Ezer.Eval
  var name= new Ezer.Eval(arguments[2],that.context,args,'new_form-name');
  var _l= new Ezer.Eval(arguments[3],that.context,args,'new_form-l');
  var _t= new Ezer.Eval(arguments[4],that.context,args,'new_form-t');
  var relative= arguments[5];
  var owner= null, form= null;
  var ctx= Ezer.code_name(name.value,null,that.context);
  if ( ctx && ctx[0] && ctx[0].type=='form' ) {
    var panel= null;
    for (var o= that.context; o; o= o.owner) {
      if ( relative && !owner && o.type.substr(0,5)=='form' ) {
        owner= o;
        _l.value+= o._l;
        _t.value+= o._t;
      }
      if ( o.type.substr(0,5)=='panel' ) {
        panel= o;
        break;
      }
    }
    if ( !panel )
      Ezer.error('výraz new_form není zanořen do panelu','S');
    else {
      form= new Ezer.Form(panel,ctx[0],panel.DOM,{_l:_l.value,_t:_t.value},ctx[0].id);
      Ezer.app.start_code(form);
    }
  }
  else Ezer.error(name.value+' je neznámé jméno - očekává se jméno form');
  that.stack[++that.top]= form;
  that.eval();
}
// -------------------------------------------------------------------------------------- switch
//fs: str.switch (test,case1,stmnt1,...)
//   řídící struktura switch-case-...[default]
//   pokud má sudý počet parametrů, použije se poslední jako defaultní
//   pokud má lichý počet parametrů a žádná testovací hodnota nevyhovuje, ohlásí se chyba
//   UPOZORNĚNÍ: v test se nepředpokládá žádná asynchronní operace (modální dialog, dotaz na server)
//   v case-příkazech jsou asynchronní operace povoleny (další příkaz je interpretován
//   až po jejich skončení)
//x: switch(x,
//     'math',{echo(x);echo(2)},
//     'text',echo(x),
//      echo('nic')
//    );
//s: funkce
Ezer.str['switch']= function () {
  Ezer.assert(arguments.length>2,"EVAL: struktura 'switch' má málo argumentů");
  var that= arguments[0];       // volající objekt Ezer.Eval
  var args= arguments[1];       // hodnoty parametrů a proměnných volajícího objektu Ezer.Eval
  var test= new Ezer.Eval(arguments[2],that.context,args,'switch-test',that.continuation,
    that.no_trow,that.proc,that.nvars);
  var len= arguments.length;
  var istmnt= 0;
  for (var i= 3; i<len-1; i+=2) {
    var casa= new Ezer.Eval(arguments[i],that.context,args,'switch-case');
    if ( casa.value==test.value ) {
      istmnt= i;
      break;
    }
  }
  if ( !istmnt && len%2==0)
    istmnt= len-2;
  if ( istmnt ) {
    new Ezer.Eval(arguments[istmnt+1],that.context,args,'switch-stmnt',
      {fce:Ezer.str.switch_,args:[that],stack:true},that.no_trow,that.proc);
    that.eval();
  }
  else
    Ezer.error("EVAL: struktura 'switch' bez default-části nemá variantu pro '"+test.value+"'");
};
Ezer.str.switch_= function (that,value) {
  that.stack[++that.top]= value;
  that.eval();
};
// -------------------------------------------------------------------------------------- if
//fs: str.if (test,then_stmnt[,else_stmnt])
//   řídící struktura if-then-else resp. if-then
//   UPOZORNĚNÍ: v test se nepředpokládá žádná asynchronní operace (modální dialog, dotaz na server)
//   v then-příkaze i else-příkaze jsou asynchronní operace povoleny (další příkaz je interpretován
//   až po jejich skončení)
//x: if(gt(x,0),{echo('kladné')},{echo('záporné')})
//s: funkce
Ezer.str['if']= function () {
  var that= arguments[0];       // volající objekt Ezer.Eval
  var args= arguments[1];       // hodnoty parametrů a proměnných volajícího objektu Ezer.Eval
  var test= new Ezer.Eval(arguments[2],that.context,args,'if-test',that.continuation,
    that.no_trow,that.proc,that.nvars);
  if ( test.value ) {
    new Ezer.Eval(arguments[3],that.context,args,'if-then',
      {fce:Ezer.str.if_,args:[that],stack:true},that.no_trow,that.proc);
  }
  else if ( arguments.length==5 ) {
    new Ezer.Eval(arguments[4],that.context,args,'if-else',
      {fce:Ezer.str.if_,args:[that],stack:true},that.no_trow,that.proc);
  }
  else {
    that.stack[++that.top]= 0;
    that.eval();
  }
};
Ezer.str.if_= function (that,value) {
  that.stack[++that.top]= value;
  that.eval();
};
// ================================================================================================= fce
// funkce dostávají jako argumenty hodnoty
// Ezer.obj= {};                                   // případné hodnoty k funkcím se stavem (trail ap.)
// Ezer.fce= {};                                // přesunuto do hlavního programu
// ------------------------------------------------------------------------------------ object
//ff: fce.object (name1,value1,name2,value2,...)
//      zkonstruuje objekt {name1:value1,name2:value2,...
//s: funkce
Ezer.fce.object= function () {
  var o= {}, n, v;
  for (var i= 0; i<arguments.length; i+=2) {
    n= arguments[i]; v= arguments[i+1];
    o[n]= v;
  }
  return o;
}
// ------------------------------------------------------------------------------------ array
//ff: fce.array (value1,value2,...)
//      zkonstruuje pole [value1,value2,...]
//s: funkce
Ezer.fce.array= function () {
  var o= [], n, v;
  for (var i= 0; i<arguments.length; i++) {
    v= arguments[i];
    o[i]= v;
  }
  return o;
}
// ================================================================================================= fce objektové
// ------------------------------------------------------------------------------------ copy_by_name
//ff: fce.copy_by_name (form|browse|object|string,form|browse|object[,delimiters='|:'])
//      zkopíruje zleva doprava stejně pojmenované hodnoty.
//      Pokud se kopíruje do form, je třeba touto operací naplnit form.key (použije se při definici
//      originality hodnoty, pokud to není žádoucí, je třeba form.key definovat jako 0)
//      Pokud je první parametr string oddělující pomocí '|' dvojice jméno:hodnota.
//      Hodnoty zkopírované do formuláře jsou nastaventy jako originální a
//      po ukončení kopírování nastane událost onload na formulář.
// Pozn.: implementovány jsou tyto kombinace parametrů: fb, bf, of, fo, sf.
//s: funkce
Ezer.fce.copy_by_name= function (x,y,delimiters) {
  var key= y instanceof Ezer.Form ? y._key : 0;
  if ( x.type=='var' ) x= x.value;
  if ( y.type=='var' ) y= y.value;
  var typ_x= x instanceof Ezer.Browse ? 'b' : x instanceof Ezer.Form ? 'f' :
    typeof(x)=='string' ? 's' : typeof(x)=='object' ? 'o' : '?';
  var typ_y= y instanceof Ezer.Browse ? 'b' : y instanceof Ezer.Form ? 'f' :
    typeof(y)=='string' ? 's' : typeof(y)=='object' ? 'o' : '?';
  if ( typ_x=='s' && typ_y=='f' ) {             // string --> form
    if ( x ) {
      var del1= '|', del2= ':';
      if ( delimiters ) {
        del1= delimiters[0]||'|';
        del2= delimiters[1]||':';
      }
      x.split(del1).each(function(pair,i) {
        var d= pair.indexOf(del2);
        var id= pair.substr(0,d);
        var val= pair.substr(d+1);
        if ( y.part[id] && y.part[id]._load ) {
          y.part[id]._load(val,key);
        }
      });
      y.fire('onload');                        // proveď akci formuláře po naplnění daty
    }
  }
  else if ( typ_x=='f' && typ_y=='b' ) {        // form --> browse
    $each(y.part,function(field,id) {
      if ( x.part[id] && x.part[id].get ) {
        field.let(x.part[id].get());
      }
    });
  }
  else if ( typ_x=='b' && typ_y=='f' ) {        // browse --> form
    $each(y.part,function(field,id) {
      if ( field._load && x.part[id] && x.part[id].get ) {
        field._load(x.part[id].get(),key);
      }
    });
    y.fire('onload');                           // proveď akci formuláře po naplnění daty
  }
  else if ( typ_x=='o' && typ_y=='f' ) {        // object --> form
    $each(y.part,function(field,id) {
      if ( field.key && x[id]!==undefined ) {
        field.key(x[id],key);
      }
      else if ( field.set && x[id]!==undefined ) {
        field.set(x[id],key);
      }
    });
    y.fire('onload');                           // proveď akci formuláře po naplnění daty
  }
  else if ( typ_x=='f' && typ_y=='o' ) {        // form --> object
    $each(x.part,function(field,id) {
      if ( id[0]!='$' && field.key ) {          // přednost má definice klíče
        y[id]= field.key();
      }
      else if ( id[0]!='$' && field.get ) {
        y[id]= field.get();
      }
    });
  }
  else Ezer.error('copy_by_name nelze použít pro parametry typu '+typ_x+' a '+typ_y);
  return 1;
};
// ================================================================================================= fce user
// -------------------------------------------------------------------------------------- sys
//ff: fce.sys (id1,id2,...)
//   část hodnoty systémové proměnné Ezer.sys z PHP, totiž Ezer.sys.id1.id2....
//a: idi - selektory objektu Ezer.sys
//s: funkce
Ezer.sys= {};
Ezer.fce.sys= function () {
  var y= Ezer.sys;
  for (var i= 0; i<arguments.length; i++) {
    if ( y[arguments[i]] ) {
      y= y[arguments[i]];
    }
    else {
      y= '';
      break;
    }
  }
  return y;
}
// -------------------------------------------------------------------------------------- has_skill
//ff: fce.has_skill (skills)
//      zjistí zda přihlášený uživatel má aspoň jedno má z daných oprávnění
//a: skills - hodnoty oddělené mezerou
//r: 1 - ano
//s: funkce
Ezer.fce.has_skill= function (skills_query) {
  var ok= 0,
      us= Ezer.sys.user ? Ezer.sys.user.skills : '',    // uživatelská oprávnění
      skills= skills_query.clean().split(';');          // pole dotazovaných oprávnění
  for (var ai= 0; ai<skills.length; ai++) {
    ok= us.contains(skills[ai],' ') ? 1 : 0;
    if ( ok ) break;                                    // stop na prvním úspěšném
  }
  return ok;
}
//--------------------------------------------------------------------------------------- set_cookie
//ff: fce.set_cookie (id,val,[form,refs])
//      format1: zadaná hodnota je zapsána do COOKIES s trváním 100 dnů
//      format2: pokud je definováné form a refs, pak musí obsahovat seznam jmen proměnných a
//      elementů formuláře, cookie potom obsahuje n jejich hodnot oddělených čárkou (val je ignorováno)
//a: id - identifikátor cookie
//   val - hodnota
//s: funkce
Ezer.fce.set_cookie= function (id,val,form,refs) {
  var v= String(val);
  if ( form ) {
    if ( form.type=='var' ) form= form.value;
    Ezer.assert(form.type=='form','set_cookie 2.typu musí mít jako 3.parametr formulář');
    var aref= refs.split(','), del= '';
    for ( var i= 0; i<aref.length; i++ ) {
      var elem= form.part[aref[i]];
//       var ve= elem.typ=='select' ? elem.select_key() : elem.get();
      Ezer.assert(elem,"set_cookie 2.typu - '"+aref[i]+"' není prvek formuláře '"+form.id+"'");
      var ve= elem.get();
      v+= del+(ve||'');
      del= ',';
    }
  }
  Cookie.write(id,v,{duration:100});
  return 1;
}
//--------------------------------------------------------------------------------------- get_cookie
//ff: fce.get_cookie (id,val,[form,refs])
//      format1: reference COOKIES, pokud je definováno val, bude vráceno, pokud id id ještě není definováno
//      format2: pokud je definováné refs, pak musí obsahovat seznam jmen proměnných a elementů formuláře,
//      předpokládá se, že cookie obsahuje n hodnot oddělených čárkou resp. je, že má takový formát val
//a: id - identifikátor cookie
//   val - hodnota
//s: funkce
Ezer.fce.get_cookie= function (id,val,form,refs) {
  var ret= Cookie.read(id)||String(val)||'';
  if ( form ) {
    if ( form.type=='var' ) form= form.value;
    Ezer.assert(form.type=='form','get_cookie 2.typu musí mít jako 3.parametr formulář');
    var aref= refs.split(',');
    var aval= ret.split(',');
    for ( var i= 0; i<aref.length; i++ ) {
      var elem= form.part[aref[i]];
      elem.set(aval[i]);
    }
  }
  return ret;
}
//--------------------------------------------------------------------------------------- contextmenu
//ff: fce.contextmenu (menu,el[,id])
//      zobrazení kontextového menu
//a: menu - [[text_položky_menu,funkce],...]
//   event - událost vyvolaná pravým tlačítkem myši
//   id - nepovinné id
//s: funkce
Ezer.obj.contextmenu= {DOM:null,menu:null};
Ezer.fce.contextmenu= function (menu,event,id) {
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
        a= new Element('a',{text:title[0]=='-' ? title.substr(1) : title})
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
      menu:Ezer.obj.contextmenu.DOM,own_listener:true});
  }
  else {
    Ezer.obj.contextmenu.menu=
      new ContextMenu({event:event,target:event.originalTarget||event.target,
        menu:Ezer.obj.contextmenu.DOM,own_listener:true});
  }
  return 1;
}
// ================================================================================================= fce string
// -------------------------------------------------------------------------------------- decode
//ff: fce.decode (data[,code='base64'])
//      dekódování řetězce ze zadaného kódování
//a: data - zakódovaný řetězec
//   code - kód (zatím jen 'base64')
//s: funkce
Ezer.fce.decode= function (data,code) {
  var decoded= base64_decode(data);
  return decoded;
}
// -------------------------------------------------------------------------------------- match
//ff: fce.match (regexp,str[,flags])
//      porovnání řetezce s regulárním výrazem - vrací objekt jehož složky s0,s1,... obsahují
//      v s0 nalezený vzor a v si i=tý podřetězec získaný pomocí operátorů ();
//      pokud porovnání selže je vrácena 0
//a: regexpr - regulární výraz definovaný javascriptovou funkcí exec
//   str - prohledávaný řetězec
//   flags - nepovinné modifikátory: g, i, m
//s: funkce
Ezer.fce.match= function (pattern,str,flags) {
  var ok= 0;
  var re= new RegExp(pattern,flags);
  var obj= re.exec(str);
  if ( obj ) {
    ok= {};
    $each(obj,function(s,i) {
      ok['s'+i]= s;
    });
  }
  return ok;
}
// -------------------------------------------------------------------------------------- strip_tags
//ff: fce.strip_tags (x[,allowed=''])
//      odstraní z x HTML a PHP tagy. Viz http://phpjs.org/functions/strip_tags
//s: funkce
Ezer.fce.strip_tags= function (input,allowed) {
  // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
  allowed= (((allowed || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('');
  var tags= /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
    commentsAndPhpTags= /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
  return input.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
    return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
  });
}
// -------------------------------------------------------------------------------------- contains
//ff: fce.contains (x,list[,sep=','])
//      zjistí zda x je obsaženo v seznamu hodnot, oddělovačem hodnot je čárka nebo 3. parametr
//r: 1 - ano
//s: funkce
Ezer.fce.contains= function (x,list,sep) {
  return list.contains(x,sep) ? 1 : 0;
}
// -------------------------------------------------------------------------------------- substr
//ff: fce.substr (x,begin,length)
//   funkce vrací podřetězec podle specifikace stejnojmenné funkce PHP
//   Např:  substr('abcdef',0,-1) vrátí 'abcde' narozdíl od javascriptu který vrátí ''
//s: funkce
Ezer.fce.substr= function (x,begin,length) {
  return x ? (length>=0 ? x.substr(begin,length) :
    (length<0 ? x.substr(begin,x.length+length) : x.substr(begin))) : '';
}
// -------------------------------------------------------------------------------------- sort
//ff: fce.sort (list[,del[,comp]])
//   funkce seřadí řetězec chápaný jako seznam hodnot oddělený čárkou nebo daným oddělovačem
//a: list - seznam hodnot
//   del - oddělovač (default je čárka)
//   comp - určuje způsob řazení, dovolena jsou písmena: n=numericky, l=lexikograficky (default)
//s: funkce
Ezer.fce.sort= function (list,del,comp) {
  del= del||',';
  var arr= list.split(del);
  if ( comp=='n' ) {
    arr.sort(function(a,b){return a-b;});
  }
  else {
    arr.sort();
  }
  return arr.join(del);
}
// -------------------------------------------------------------------------------------- split
//ff: fce.split (x,del,i)
//      funkce rozdělí x podle del (stejnojmennou funkcí javascriptu) a vrátí podřetězec
//      s indexem i (první má index 0)
//a: x - řetězec
//   del - dělící vzor
//   i - index
//s: funkce
Ezer.fce.split= function (x,del,i) {
  Ezer.assert(typeof(x)=='string','split: první parametr musí být řetězec');
  var y= x.split(del,i+1);
  return y[i];
}
// -------------------------------------------------------------------------------------- trim
//ff: fce.trim (x)
//      funkce z řetězce x odstraní levostranné i pravostranné mezery
//a: x - řetězec
//s: funkce
Ezer.fce.trim= function (x) {
  Ezer.assert(typeof(x)=='string','trim: parametr musí být řetězec');
  var y= x.trim();
  return y;
}
// -------------------------------------------------------------------------------------- repeat
//ff: fce.repeat (x,n)
//      funkce vrátí zřetězení n kopií stringu s
//a: x - řetězec
//   n - počet opakování
//s: funkce
Ezer.fce.repeat= function (x,n) {
  var s= '';
  for (var i= 1; i<=n; i++) {
    s+= x;
  }
  return s;
}
// -------------------------------------------------------------------------------------- replace
//ff: fce.replace (x,a1,b1,a2,b2...)
//      vrátí x ve kterém provede náhradu ai za bi
//s: funkce
Ezer.fce.replace= function () {
  var x= arguments[0]||'', a, b, r;
  if ( x ) {
    if ( typeof(x)!='string' && x.toString() )
      x= x.toString();
    for (var i= 1; i<arguments.length; i+=2) {
      a= String(arguments[i]); b= arguments[i+1]===undefined?'':arguments[i+1];
      r= new RegExp(a.replace(/\$/,'\\\$'),'g');
      x= x.replace(r,b);
    }
  }
  return x;
}
// -------------------------------------------------------------------------------------- conc
//ff: fce.conc (s1,s2,...)
//   spojení stringů
//a: si - textový řetězec
//r: s1s2... - spojení řetězců
//s: funkce
Ezer.fce.conc= function () {
  var y= '';
  for (var i= 0; i<arguments.length; i++) y+= arguments[i];
  return y;
}
// -------------------------------------------------------------------------------------- cconc
//ff: fce.cconc (a1,b1,a2,b2...[bn])
//      podmíněné spojení stringů, pokud ai==true||1 pak je bi použito, jinak přeskočeno
//      pokud má fce lichý počet argumentů a ani jedno ai není pravdivé, použije se poslední hodnota
//s: funkce
Ezer.fce.cconc= function () {
  var x= '', a, b, used= 0;
  var len= arguments.length;
  len&= 254;
  for (var i= 0; i<len; i+=2) {
    a= arguments[i]; b= arguments[i+1];
    if ( a && a!='0' ) { used++; x= x+b; }
  }
  if ( arguments.length > len && !used )
    x+= arguments[len];
  return x;
}
// -------------------------------------------------------------------------------------- cset
//ff: fce.cset (x,r1,a1,r2,a2...)
//      podmíněné nastavení elementů ai na 1, pokud je bi obsaženo v x, jinak na 0
//s: funkce
Ezer.fce.cset= function () {
  var x= arguments[0], a, b, oa, r, t;
  for (var i= 1; i<arguments.length; i+=2) {
    a= arguments[i]; b= arguments[i+1];
    r= new RegExp(b,'g');
    t= x.search(r);
    oa= eval(a);
    oa.set(t>=0?1:0);
  }
  return x;
}
// -------------------------------------------------------------------------------------- cset
//ff: fce.chr (ascii)
//      vrátí jednoznakový řetězec se znakem odpovídajícím předanému ASCII kódu
//s: funkce
Ezer.fce.chr= function (ascii) {
  return String.fromCharCode(ascii);
}
// ================================================================================================= fce date+time
// -------------------------------------------------------------------------------------- date2sql
//ff: fce.date2sql (date[,wild=0])
//      převod českého formátu data na formát MySQL
//a: [ab]d.m.yyyy[time]  - obecný tvar z dialogu pro zadání času a data (ukázka dlouhého popisu)
//   wild - pokud je 1, pak lze místo čísel d,m,yyyy lze použít zástupný symbol *,
//      který je přepsán do SQL jako % pro m.y je vráceno y-m-%; pro y je vráceno y-%-%
//r:  yyyy-mm-dd - tvar pro SQL
//s: funkce
Ezer.fce.date2sql= function (dmy0,wild) {
  var y, m, d, s= '';
  if ( dmy0.length > 0 ) {
    dmy= dmy0.split('.');
    if ( dmy.length<3 ) {
      dmy.unshift ('*');
      if ( dmy.length<3 ) dmy.unshift ('*');
    }
    if ( !wild && (dmy[0]=='*' || dmy[1]=='*' || dmy[2]=='*') )
      Ezer.fce.warning('datum '+dmy0+' nemá požadovaný tvar d.m.r');
    // den může být předeslán jménem dne v týdnu
    d= dmy[0].split(' ');
    d= d[d.length-1];
    if ( d=='*' )
      d= '%';
    else {
      d= parseInt(d,10);
      d= d<10 ? '0'+d : d;
    }
    m= dmy[1];
    if ( m=='*' )
      m= '%';
    else {
      m= parseInt(m,10);
      m= m<10 ? '0'+m : m;
    }
    // rok může být následován časem
    y= dmy[2].split(' ');
    if ( y[0]=='*' ) y[0]= '%';
    if (y[1])
      s= y[0]+'-'+m+'-'+d+' '+y[1];
    else
      s= y[0]+'-'+m+'-'+d;
  }
  return s;
}
// -------------------------------------------------------------------------------------- sql2date
//ff: fce.sql2date (sql_date)
//      převod MySQL formátu data na český formát
//a: yyyy-mm-dd - tvar pro SQL
//r: d. m. yyyy  - český tvar data
//s: funkce
Ezer.fce.sql2date= function (ymd) {
  var y, m, d, s= '';
  if ( ymd.length > 0 ) {
    ymd= ymd.split('-');
    d= ymd[2]; if ( d[0]=='0' ) d= d[1];
    m= ymd[1]; if ( m[0]=='0' ) m= m[1];
    y= ymd[0];
    s= d+'. '+m+'. '+y;
  }
  return s;
}
// -------------------------------------------------------------------------------------- now
//ff: fce.now (time_too)
//   aktuální datum a čas (je-li time_too==1)
//r:  dd.mm.yyyy - pro time_too==0
//  dd.mm.yyyy hh:mm - pro time_too==1
//s: funkce
Ezer.fce.now= function (time_too) {
  return ae_datum(time_too);
}
// -------------------------------------------------------------------------------------- now_sql
//ff: fce.now_sql (time_too)
//   aktuální datum a čas (je-li time_too==1) ve formátu DATETIME
//r:  yyy-mm-dd          - pro time_too==0
//    yyy-mm-dd hh:mm:ss - pro time_too==1
//s: funkce
Ezer.fce.now_sql= function (time_too) {
  return ae_datum(time_too,1);
}
// -------------------------------------------------------------------------------------- fdate
//ff: fce.fdate (format[,datetime])
//      zjednodušená analogie PHP funkce date
//a:    format - řetězec s řídícími písmeny, implementovány jsou: Y,n,j,w,H,i,s
//      datetime - číslo s významem timestamp nebo textový formát data d.m.y
//s: funkce
Ezer.fce.fdate= function (format,datetime) {
  var result= '', x, y, d;
  if ( datetime===undefined ) {
    d= new Date();
  }
  else {
    if ( isNaN(Number(datetime)) ) {
      var t= ae_time2ymd(datetime);  // [t,m,d,...]
      d= new Date(t[0],t[1]-1,t[2]);
    }
    else
      d= new Date(datetime);
  }
  for (var i=0; i<format.length; i++) {
    x= format.substr(i,1);
    switch (x) {
    case 'Y':  y= d.getFullYear(); break;
    case 'n':  y= d.getMonth()+1; break;
    case 'j':  y= d.getDate(); break;
    case 'w':  y= d.getDay(); break;
    case 'H':  y= padNum(d.getHours(),2); break;
    case 'i':  y= padNum(d.getMinutes(),2); break;
    case 's':  y= padNum(d.getSeconds(),2); break;
    default: y= x;
    }
    result+= y;
  }
  return result;
}
// ================================================================================================= fce math
// -------------------------------------------------------------------------------------- is_number
//ff: fce.is_number (x)
//   zjištění, zda x je číslo nebo string tvořící číslo
//s: funkce
//a: x - testovaná hodnota
//r: 1 - je číslo
//   0 - jinak
Ezer.fce.is_number= function (x) {
  return (x?1:0) && (isNaN(x)?0:1);
}
// -------------------------------------------------------------------------------------- lt
//ff: fce.lt (x,y)
//   porovnání čísel: x<y
//s: funkce
//a: x, y - testované hodnota
//   yi - vzory
//r: 1 - x<y
//   0 - jinak
Ezer.fce.lt= function (x,y) {
  return x<y ? 1 : 0;
}
// -------------------------------------------------------------------------------------- gt
//ff: fce.gt (x,y)
//   porovnání čísel: x>y
//s: funkce
//a: x, y - testované hodnota
//   yi - vzory
//r: 1 - x>y
//   0 - jinak
Ezer.fce.gt= function (x,y) {
  return x>y ? 1 : 0;
}
// -------------------------------------------------------------------------------------- sum
//ff: fce.sum (x1,x2,...)
//   součet hodnot x1, x2, ...
//s: funkce
//a: xi - sčítanec
//r: součet
Ezer.fce.sum= function () {
  var num, sum= 0;
  for (var i= 0; i<arguments.length; i++) {
    num= Number(arguments[i]);
    sum+= num;
  }
  return String(sum);
}
// -------------------------------------------------------------------------------------- min
//ff: fce.min (x1,x2,...)
//   minimum hodnot x1, x2, ...
//s: funkce
//a: xi - číslo
//r: minimum
Ezer.fce.min= function () {
  var x= Number(arguments[0]);
  for (var i= 1; i<arguments.length; i++) {
    x= Math.min(x,Number(arguments[i]));
  }
  return String(x);
}
// -------------------------------------------------------------------------------------- max
//ff: fce.max (x1,x2,...)
//   maximum hodnot x1, x2, ...
//s: funkce
//a: xi - číslo
//r: maximum
Ezer.fce.max= function () {
  var x= Number(arguments[0]);
  for (var i= 1; i<arguments.length; i++) {
    x= Math.max(x,Number(arguments[i]));
  }
  return String(x);
}
// -------------------------------------------------------------------------------------- multiply
//ff: fce.multiply (x,y)
//   x * y
//s: funkce
//a: x, y - multiplikanty
//r: součin
Ezer.fce.multiply= function (x,y) {
  var z= Number(x);
  z*= Number(y);
  return String(z);
}
// -------------------------------------------------------------------------------------- divide
//ff: fce.divide (x,y)
//   x / y - celočíselné dělení (5/2=2)
//s: funkce
//a: x, y - dělenec, dělitel
//r: celočíselný podíl
Ezer.fce.divide= function (x,y) {
  var z= Number(x);
  z/= Number(y);
  return String(Math.floor(z));
}
// -------------------------------------------------------------------------------------- modulo
//ff: fce.modulo (x,y)
//   x % y
//s: funkce
//a: x, y - celá čísla
//r: x % y
Ezer.fce.modulo= function (x,y) {
  var z= Number(x);
  z= z % Number(y);
  return String(z);
}
// -------------------------------------------------------------------------------------- minus
//ff: fce.minus (x)
//   záporná hodnota x
//s: funkce
//a: x
//r: -x
Ezer.fce.minus= function (x) {
  var num= Number(x);
  num= -num;
  return String(num);
}
// -------------------------------------------------------------------------------------- castka_slovy
//ff: fce.castka_slovy (castka [,platidlo,platidla,platidel,drobnych])
//      vyjádří absolutní hodnotu peněžní částky x slovy
//s: funkce
//a: částka - částka
//   platidlo - jméno platidla nominativ singuláru, default 'koruna'
//   platidla - jméno platidla nominativ plurálu, default 'koruny'
//   platidel - jméno platidla genitiv plurálu, default 'korun'
//   drobnych - jméno drobnych genitiv plurálu, default 'haléřů'
//r: slovní vyjádření
Ezer.fce.castka_slovy= function (castka,platidlo,platidla,platidel,drobnych) {
  var text= '', x= Math.abs(castka);
  var cele= Math.floor(castka);
  var mena= [platidlo||'koruna',platidla||'koruny',platidel||'korun'];
  var numero= cele.toString();
  if ( numero.length<7 ) {
    var slovnik= [];
        slovnik[0]= ["","jedna","dvě","tři","čtyři","pět","šest","sedm","osm","devět"];
        slovnik[1]= ["","","dvacet","třicet","čtyřicet","padesát","šedesát","sedmdesát","osmdesát","devadesát"];
        slovnik[2]= ["","sto","dvěstě","třista","čtyřista","pětset","šestset","sedmset","osmset","devětset"];
        slovnik[3]= ["tisíc","tisíc","dvatisíce","třitisíce","čtyřitisíce", "pěttisíc","šesttisíc","sedmtisíc","osmtisíc","devěttisíc"];
        slovnik[4]= ["","deset","dvacet","třicet","čtyřicet", "padesát","šedesát","sedmdesát","osmdesát","devadesát"];
        slovnik[5]= ["","sto","dvěstě","třista","čtyřista","pětset","šestset","sedmset","osmset","devětset"];
    var slovnik2= ["deset","jedenáct","dvanáct","třináct","čtrnáct","patnáct","šestnáct","sedmnáct","osmnáct","devatenáct"];
    for (var x= 0; x <= numero.length-1; x++) {
      if ((x==numero.length-2) && (numero.charAt(x)=="1")) {
        text+= slovnik2[numero.charAt(x+1)];
        break;
      }
      else if ((x==numero.length-5) && (numero.charAt(x)=="1")) {
        text+= slovnik2[numero.charAt(x+1)]+'tisíc';
        x++;
      }
      else {
        text+= slovnik[numero.length-1-x][numero.charAt(x)];
      }
    }
  }
  else {
    text= "********";
  }
  if ( numero.length>1 && numero[numero.length-2]=='1' ) {
    text+= mena[2];
  }
  else {
    var slovnik3= [2,0,1,1,1,2,2,2,2,2];
    text+= mena[slovnik3[numero[numero.length-1]]];
  }
  var drobne= Math.floor(100*(castka-Math.floor(castka)));
  if ( drobne ) {
    text+= drobne.toString()+(drobnych||'haléřů');
  }
  return text;
}
// ================================================================================================= fce logical
// -------------------------------------------------------------------------------------- eq
//ff: fce.eq (x,y1,y2,...)
//   porovnání hodnoty s posloupností hodnot
//a: x - testovaná hodnota
//   yi - vzory
//r: 1 - x==yi pro některé i
//   0 - jinak
//s: funkce
Ezer.fce.eq= function (x) {
  var ok= 0;
  for (var i= 1; i<arguments.length; i++) {
    if ( x==arguments[i] ) {
      ok= 1;
      break;
    }
  }
  return ok;
}
// -------------------------------------------------------------------------------------- and
//ff: fce.and (x1,x2,...)
//   logické AND hodnot x1, x2, ...  (prázdný řetězec a '0' se bere jako 0)
//s: funkce
//a: xi - testovaná hodnota
//r: 1 - všechna xi jsou nenulová
//   0 - jinak
Ezer.fce.and= function () {
  var ok= 1;
  for (var i= 0; i<arguments.length; i++) {
    var xi= arguments[i];
    xi= typeof(xi)=='string' && !isNaN(xi) ? parseInt(xi,10) : xi;
    if ( !xi ) {
      ok= 0;
      break;
    }
  }
  return ok;
}
// -------------------------------------------------------------------------------------- or
//ff: fce.or (x1,x2,...)
//   logické OR hodnot x1, x2, ...   (prázdný řetězec a '0' se bere jako 0)
//s: funkce
//a: xi - testovaná hodnota
//r: 1 - některé xi je nenulové
//   0 - jinak
Ezer.fce.or= function () {
  var ok= 0;
  for (var i= 0; i<arguments.length; i++) {
    var xi= arguments[i];
    xi= typeof(xi)=='string' && !isNaN(xi) ? parseInt(xi,10) : xi;
    if ( xi ) {
      ok= 1;
      break;
    }
  }
  return ok;
}
// -------------------------------------------------------------------------------------- not
//ff: fce.not (x)
//   logické NOT (prázdný řetězec a '0' se bere jako 0)
//s: funkce
//a: x - testovaná hodnota
//r: 1 - x je nulové příp. '' nebo '0'
//   0 - jinak
Ezer.fce.not= function (x) {
  var ix= typeof(x)=='string' && !isNaN(x) ? parseInt(x,10) : x;
  return ix ? 0 : 1;
}
// ================================================================================================= verze 1.3
// -------------------------------------------------------------------------------------- stop
//ff: fce.stop ()
//      STARÉ: prázdná operace
//s: oldies
Ezer.fce.stop= function () {
  return 1;
};
// -------------------------------------------------------------------------------------- menu_fill2
//fm: Label.menu_fill2 ()
//s: oldies
Ezer.Label.prototype.menu_fill2= function () {
//      STARÉ: prázdná operace
  return 1;
};
// -------------------------------------------------------------------------------------- clipboard
//ff: fce.clipboard (msg1,msg2,...)
//      STARÉ: vložení textů do schránky Windows, části textu odděluje znakem \n;
//      NOVĚ: lépe je použít item typu clipboard
//a: msgi - části textu
//s: oldies
Ezer.fce.clipboard= function () {
  var msg= '', del= '';
  for (var i= 0; i<arguments.length; i++) {
    msg+= del+arguments[i];
    del= '\n';
  }
  clipboard_set(msg);
  return 1;
}
// ================================================================================================= fce system
// ------------------------------------------------------------------------------------ href
//ff: fce.href (path,...)
//      přepne aplikaci podle path=m[.s[.l.g.i]][.p]  -- tabs, panel, menu.left, menu.group, menu.item
//      poslední může být jméno procedury, následovat mohou parametry oddělené /
//      další parametry mohou být dány jako druhý a další parametry href
//      EXPERIMENTÁLNÍ - všechny komponenty musí již být ve stavu loaded - jinak warning
//s: funkce
Ezer.fce.href= function (path) {
  Ezer.trace('U','href='+path);
  // nalezení kořene
  var hs= path.split('#');              // oddělení odkazu na name
  var ps= hs[0].split('/');             // oddělení parametrů
  var xs= ps[0].split('.');             // definice cesty k objektu či proceduře
  if ( xs[0] ) {
    var part= Ezer.run.$.part[Ezer.root].part[xs[0]];
    walk:
    if ( part && part._focus ) {
      part._focus();
      for (var i=1; i<xs.length; i++) {
        if ( (part.options.include===undefined || part.options.include=='onload'
           || part.options.include=='loaded')
          && part.part && (part= part.part[xs[i]]) ) {
          switch (part.type) {
          case 'panel':
          case 'panel.plain':
          case 'panel.right':
            if ( part.findProc('onpopstate') )
              part.fire('onpopstate',[location.href]);
            else
              part._focus();
            break;
          case 'menu.left':
            break;
          case 'menu.group':
            part._unfold();
            break;
          case 'item':
            part.click();
            break;
          case 'proc':
            var args= [];
            if ( ps.length>1 ) {
              ps.shift();
              args= ps;
            }
            if ( arguments.length>1 ) {
              var A= $A(arguments);
              A.shift();
              args.extend(A);
            }
            new Ezer.Eval(part.code,part.context||part.owner,args,part.id,false,false,part);
            break;
          default:
            Ezer.fce.warning('odkaz '+path+' má chybnou ',i+1,'. část');
            break walk;
          }
        }
        else {
          Ezer.fce.warning('odkaz '+path+' má nedostupnou ',i+1,'. část ',part===undefined?'':part);
          break walk;
        }
      }
    }
    else Ezer.fce.warning('odkaz '+path+' má nedostupný počátek');
  }
  // případný posun na udanou pozici
  if ( hs[1] ) {
    window.location.hash= hs[1];
    window.location.hash= '';
  }
  // fce musí vracet false kvůli použití v <a href='#' ...>
  return false;
}
// ------------------------------------------------------------------------------------ download
//ff: fce.download (file)
//      nabídne stáhnutí souboru
//s: funkce
Ezer.fce.download= function (file) {
  window.open(file,'Stáhnout!');
  return 1;
}
// ------------------------------------------------------------------------------------ prints
//ff: fce.prints (width,height,css_file,element*)
//      zobrazí v samostatném okně elementy a nabídne dialog tisku
//s: funkce
Ezer.fce.prints= function (width,height,css_file) {
    var html= '';
    var pw= window.open("", 'PreviewPage'
          , "width="+width+",height="+height+",menubar=1,toolbar=0,status=0,scrollbars=1,resizable=1");
    if ( !pw ) {
      alert("Nelze otevřít okno s náhledem tisku, nejsou zakázána 'vyskakovací' okna?");
    }
    else {
      pw.document.open();
      html+= "<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' ";
      html+= "'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'>\n";
      html+= "<html xmlns='http://www.w3.org/1999/xhtml' lang='en' xml:lang='en'>\n";
      html+= " <head><title>Náhled tisku</title>\n";
      html+= "  <meta http-equiv='Content-Type' content='text/html; charset=UTF-8' />\n";
      html+= "  <link type='text/css' rel='stylesheet' href='"+css_file+"' />\n";
      html+= "  <script>function keyPressHandler(e) {\n";
      html+= "    var kC= (window.event) ? event.keyCode : e.keyCode;";
      html+= "    var Esc= (window.event) ? 27 : e.DOM_VK_ESCAPE;";
      html+= "    if ( kC==Esc ) {window.close();}}\n";
      html+= " </script></head><body onkeypress='keyPressHandler(event)'>";
      html+= "\n";
      // klonování elementů
      for (var i= 3; i<arguments.length; i++) {
        html+= arguments[i].DOM_Block.innerHTML;
      }
      // dokončení stránky
      html+= "\n</body></html>";
      pw.focus();
      pw.document.write(html);
      pw.document.close();
      pw.focus();
      pw.print();
    }
    return true;
  }
// -------------------------------------------------------------------------------------- javascript
//ff: fce.javascript (code[,value])
//      pokud je specifikované value, stane se návratovou hodnotou, jinak se použije výsledek kódu
//s: funkce
Ezer.fce.javascript= function(code,value) {
  var x= 0;
  try {
    x= eval(code);
  }
  catch (e) {
    var msg= e.message||'?';
    Ezer.error('chyba '+msg+' ve funkci javascript pro "'+code+'"');
  }
  return value?value:x;
}
// -------------------------------------------------------------------------------------- source
//ff: fce.source (msg)
//s: funkce
Ezer.fce.source= function(block) {
  return Ezer.App.source_text(block);
}
Ezer.fce.source_= function(text,file,app,l,c,reload,root) {
  if ( window.top.dbg ) {
    window.top.dbg.show_text(text,file,app,Number(l),Number(c),reload,root);
    Ezer.drag.text= text;
    Ezer.drag.file= file;
    Ezer.drag.app= app;
  }
}
// -------------------------------------------------------------------------------------- alert
//fj: fce.alert (msg1,...)
//   zobrazí argumenty ve vyskakovacím okně - modální funkce
//s: funkce
Ezer.fce.alert= function () {
  var str= '';
  for (var i=0; i<arguments.length; i++) str+= arguments[i];
  Ezer.fce.DOM.alert(str,Ezer.fce._alert);
//   alert(str)
  return 1;
};
Ezer.fce._alert= function () {
  if ( Ezer.modal_fce ) {
    // konec modálního dialogu - jeho hodnotu (pro alert 1) dej na zásobník
    Ezer.modal_fce.stack[++Ezer.modal_fce.top]= 1;
    Ezer.modal_fce.eval.apply(Ezer.modal_fce,[Ezer.modal_fce.step,true]);
    Ezer.modal_fce= null;
  }
  return 1;
}
// -------------------------------------------------------------------------------------- wait
//fj: fce.wait (ms)
//   pozdrží výpočet na ms milisekund
//s: funkce
Ezer.fce.wait= function (ms) {
  Ezer.fce._wait.delay(ms);
  return 1;
};
Ezer.fce._wait= function () {
  if ( Ezer.modal_fce ) {
    // konec modálního dialogu - jeho hodnotu (pro wait 1) dej na zásobník
    Ezer.modal_fce.stack[++Ezer.modal_fce.top]= 1;
    Ezer.modal_fce.eval.apply(Ezer.modal_fce,[Ezer.modal_fce.step,true]);
    Ezer.modal_fce= null;
  }
  return 1;
}
// -------------------------------------------------------------------------------------- confirm
//ff: fce.confirm (msg,...)
//      ve zvláštním okně položí otázku msg a dvě tlačítka Ano a Ne
//r: 1 - pokud bylo stisknuto Ano
//   0 - pokud bylo stisknuto Ne
//s: funkce
Ezer.fce.confirm= function () {
  var msg= '';
  for (var i=0; i<arguments.length; i++) { msg+= arguments[i]; }
  return confirm(msg) ? 1 : 0;
}
// -------------------------------------------------------------------------------------- prompt
//ff: fce.prompt (msg[,default=''])
//      ve zvláštním okně položí otázku msg a přečte odpověď, ketrou vrátí jako výsledek
//r: odpověď
//a: msg - text otázky
//   default - nabídnutá odpověď
//s: funkce
Ezer.fce.prompt= function (msg,odpoved) {
  odpoved= odpoved||'';
  return prompt(msg,odpoved);
}
// -------------------------------------------------------------------------------------- clear
//ff: fce.clear ()
// vymaže obsah trasovacího okna
//s: funkce
Ezer.fce.clear= function () {
  Ezer.App._clearTrace();
  Ezer.App._clearError();
  Ezer.fce.DOM.warning_();
  return 1;
}
// -------------------------------------------------------------------------------------- echo
//ff: fce.echo (a1,...)
//      vypíše argumenty do trasovací části aplikace
//s: funkce
Ezer.fce.echo= function () {
  var str= '';
  for (var i=0; i<arguments.length; i++) str+= arguments[i];
  Ezer.trace('U',str);
  return str;
};
// -------------------------------------------------------------------------------------- warning
//ff: fce.warning (a1,...)
//   vypíše argumenty do dočasné plochy, která vyjede ze spodní lišty
//   a která po pokračování v práci zase zmizí. Zobrazuje jen poslední varování.
//s: funkce
Ezer.fce.warning= function () {
  var str= '';
  for (var i=0; i<arguments.length; i++) str+= arguments[i];
  Ezer.fce.DOM.warning(str);
  return str;
};
// -------------------------------------------------------------------------------------- help
//ff: fce.help (html,title[,ykey[,xkey[,seen]]])
//   zobrazí v systémovém popup menu předané html, pokud jsou předány i klíče, je možná editace
//   ykey=klíč zobrazeného helpu, xkey=klíč z místa vyvolání (různý pokud nebyl přesný help)
//   kde klíč je hodnota získaná funkcí self_sys. Poslední parametr se zobrazuje jako title
//   v nadpisu (ve standardním helpu obsahuje zkratky uživatelů, kteří viděli help)
//s: funkce
Ezer.fce.help= function (html,title,ykey,xkey,seen,refs) {
  Ezer.fce.DOM.help(html,title,ykey,xkey,seen,refs);
  return 1;
};
// -------------------------------------------------------------------------------------- set_trace
//ff: fce.set_trace (id,on) nebo fce.set_trace (on)
//      změní chování systémového trasování podle parametrů, je-li použit jen jeden parametr
//      umožňuje zobrazit nebo skrýt testovací okno
//a: id - písmeno označující druh trasování
//   on - 1 pro zapnutí, 0 pro vypnutí
//s: funkce
Ezer.fce.set_trace= function (id,on) {
  if ( arguments.length==1 ) {
    // ovládá zobrazení trasovacího okna
    Ezer.App._showTrace(id);
  }
  else {
    // ovládá jednotlivé přepínače
    for (var i=0; i<id.length; i++) {
      Ezer.App._setTraceOnOff(id[i],on);
    }
  }
  return 1;
}
// -------------------------------------------------------------------------------------- debug
//ff: fce.debug (o[,label=''[,depth=5]])
//      vrací html kód přehledně zobrazující strukturu objektu nebo pole;
//      zobrazit lze například pomocí fce echo v trasovacím části
//s: funkce
Ezer.debug= function (o,label) {
  Ezer.trace('u',debug(o,label));
  return o;
}
Ezer.fce.debug= function (o,label,depth) {
  return "<div class='dbg'>"+debug(o,label,depth)+"</div>";
};
// -------------------------------------------------------------------------------------- assert
//ff: fce.assert (test,msg[,block])
//   pokud test selže, vypíše argumenty do trasovací části aplikace a ukončí výpočet procedury
//a: test - 0 | 1
//   msg - zpráva vypsaná při selhání testu
//   block - (nepovinně) Ezer-blok, kterého se týká test
//s: funkce
Ezer.assert=
Ezer.fce.assert= function(test,msg,block) {
  if ( !test ) {
    block= block||Ezer.calee;
    Ezer.fce.error(msg+'<br/>',block?'S':'E',block);
    throw {level:block?'S':'E',msg:msg};
  }
  return 1;
}
// -------------------------------------------------------------------------------------- error
//ff: fce.error (msg,level[,block[,lc]])
//   vypíše argumenty do trasovací části aplikace a ukončí výpočet procedury
//a: str - chybové hlášení
//   level - 'user' (default) výpočet bude přerušen, 'msg' jen zobrazení zprávy
//   block - (nepovinně pro level='S') Ezer-blok s chybou, pokud je uveden vypíše se informace o místě ve zdrojvém textu
//   lc - (nepovinně pro level='S') případné upřesnění polohy
//s: funkce
Ezer.error=
Ezer.fce.error= function (str,level,block,lc,calls) {
  // oprav počáteční podmínky čitačů
  Ezer.app._ajax_init();
  Ezer.app.evals_init();
  level= level||'user';
  // pokus ošetřit chybu uživatelskou funkcí onerror
  var fce, ok= 0;
  if ( block ) {
    for (var o= block; o; o= o.owner) {
      if ( o.findProcArg ) {
        fce= o.findProcArg('onerror');
        if ( fce ) break;
      }
    }
    if ( fce ) {
      ok= fce({msg:str,level:level});
    }
  }
  // přidání trail na konec výpisu
  var estr= "<b>ERROR:</b> "+str;
  var inside= "";
  var trail= Ezer.fce.trail('show_err');
  if ( !ok ) {
    // systémové zpracování chyby
    if ( level=='S' ) {
      // volání z funkce Ezer.Eval.eval
      if ( block )
        inside= Ezer.App.block_info(block,lc,true);
      Ezer.trace(0,str);
      Ezer.fce.DOM.error(estr+(inside?(" <b>in</b> "+inside):'')+" <b>after</b> "+trail);
      Ezer.fce.touch('error',str,[inside,trail]);
      throw 'S';
    }
    else if ( level=='C') {
      // hlášení kompilátoru o syntaktické chybě
      inside= "compiler";
      Ezer.fce.DOM.error(str);
      Ezer.fce.DOM.error(estr+" <b>in compiler</b>");
    }
    else if ( level=='s' ) {
      // s: volání z funkce volané z Ezer.Eval.eval
      Ezer.trace(0,str);
      if ( block ) {
        inside= block.id;
        inside+= ' at '+Ezer.App.block_info(block,lc,true);
        // pokud je to možné zobraz zásobník volání
        if ( calls ) {
          inside+= ' called ';
          for(var i= calls.length-1; i>0; i--) {
            if ( calls[i].proc ) {
              inside+= ' from '+calls[i].proc.id;
            }
          }
        }
      }
      Ezer.fce.DOM.error(estr+(inside?(" <b>in</b> "+inside):'')+" <b>after</b> "+trail);
      Ezer.fce.touch('error',str,[inside,trail]);
    }
    else if ( level=='E') {
      // zachycená chybová hláška
      if ( self.navigator.product=='Gecko' && block ) {
        inside= ' line '+block.lineNumber+' in '+block.fileName;
      }
      Ezer.trace(0,str);
      Ezer.fce.DOM.error(estr+(inside?(" <b>in</b> "+inside):'')+" <b>after</b> "+trail);
      Ezer.fce.touch('error',str,[inside,trail]);
    }
    else {
      // jiná chyba (mimo Ezer.Eval.eval)
      Ezer.fce.DOM.error(estr+" <b>after</b> "+trail);
      if ( level!=='msg' ) throw {level:level,msg:str};
    }
  }
};
// pokračování výpisu chyby, až se ze serveru vrátí žádost block_info o zdrojový text
Ezer.fce.error_= function (info) {
  Ezer.fce.DOM.error(info);
}
// -------------------------------------------------------------------------------------- touch
//ff: fce.touch (type,block|msg|fce[,args])
//      funkce pošle na server informaci o práci s aplikací.
//              pokud type=='error' pak předá text chyby
//              pokud type=='logout' pak odhlásí uživatele
//              pokud type=='touch' předá cestu ke kořenu (pokud blok má jméno)
//              pokud type=='server' zavolá funkci fce na serveru bez vrácení hodnoty, předá args
//              pokud type=='speed' zapíše msg do _touch
//      Ezer.sys.activity.touch_limit je počet dotyků (ae_hits) po kterých je nejpozději
//        uskutečněn zápis do _touch
//s: funkce
Ezer.fce.touch= function (type,block,args) {
 server_write:
  if ( Ezer.sys.user.id_user ) {
    Ezer.App.hits++;
    Ezer.App.clock_tics= 0;
    Ezer.App.bar_clock_show(true);
    var to_send= to_logout= false;
    var x= {cmd:'touch',user_id:Ezer.sys.user.id_user,user_abbr:Ezer.sys.user.abbr};
    x.root= Ezer.root;                  // název/složka aplikace
    x.session= Ezer.options.session;    // způsob práce se SESSION
    switch ( type ) {
    case 'server':
      // provede funkci (jako ASK ale nečeká se na výsledek)
      x.cmd= 'server';
      x.fce= block;
      x.args= args;
      var r= new Request({method:'post', url:Ezer.App.options.server_url, onComplete:null}).post(x);
      break;
    case 'logout':
      // odhlásí uživatele
      Ezer.app.logoff();
      Ezer.app.logout();
      to_send= true;
      to_logout= true;
      break;
    case 'panel':
      // zapíše do _user.options.context[root] cestu pro active:*
      x.path= [block.owner.id,block.id];
//                                                 Ezer.trace('*','touch panel '+block.owner.id+'.'+block.id);
      var r= new Request({method:'post', url:Ezer.App.options.server_url, onComplete:null}).post(x);
      break;
    case 'block':
      // nejprve najdeme první nadřazený blok s _sys
      var block_sys= null;
      if ( block ) {
        for (var b= block; b.owner; b= b.owner) {
          if ( b.options && b.options._sys ) {
            block_sys= b;
                                                Ezer.trace('*','touch block '+b.id);
            break;
          }
        }
        if ( args ) {
          // pokud je definována metoda, zapíšeme do trail
          Ezer.fce.trail('add',block,args);
        }
      }
      else {
//                                                 Ezer.trace('*','touch block null');
      }
      // vlastní zápis se provede při odchodu na jiný nadřazený blok
      if ( Ezer.App.hits_block && Ezer.App.hits_block!=block_sys ) {
        // čitelná cesta ke kořenu zapamatovaného bloku
        var id= Ezer.App.hits_block.self_sys().sys;
//         var id= '';                                                                              SMAZAT
//         for (var o= Ezer.App.hits_block; o.owner; o= o.owner) {
//           if ( o.options._sys ) {
//             id= (o.options._sys=='*'?o.id:o.options._sys)+(id ? '.'+id : '');
//           }
//         }
//         if ( !id ) id= '@';
        Ezer.App.hits_block= block_sys;
        Ezer.App.hits_block_id= id;
        to_send= true;
      }
      // nebo po Ezer.sys.ezer.activity.touch_limit počtu dotyků
      else if ( Ezer.App.hits > Ezer.sys.ezer.activity.touch_limit ) {
        to_send= true;
      }
      if ( !Ezer.App.hits_block ) Ezer.App.hits_block= block_sys;
      x.module= type;
      x.menu= Ezer.App.hits_block_id;
      break;
    case 'error':
      x.module= type;
      x.msg= block;
      to_send= true;
      if ( args ) {
        x.inside= args[0];
        x.after= args[1];
      }
//                                                 Ezer.trace('*','touch error '+x.msg);
      break;
    }
    if ( to_send ) {
      if ( to_logout && (Ezer.App.hits==Ezer.App.last_hits || !Ezer.App.hits_block_id) ) {
        // pokud jde pouze o odhlášení, zapiš odhlášení v prvním volání
        x.logout= 1;
        to_logout= false;
      }
      else {
        // zapiš přechozí blok
        x.module= 'block';
        x.menu= Ezer.App.hits_block_id;
      }
      x.hits= Ezer.App.hits-1;                    // zapiš hits (poslední patřil dalšímu)
      Ezer.App.hits= 1;                           // zapomeň je
//                                                 Ezer.trace('*','touch send '+x.menu+' '+x.hits+'x');
      var r= new Request({method:'post', url:Ezer.App.options.server_url,
        onComplete:
        to_logout ? function() {
          // zapiš odhlašení v druhém volání
          x.logout= 1;
          var r= new Request({method:'post', url:Ezer.App.options.server_url,
            onComplete:function() {
              window.location.reload(true);
            }
          }).post(x);
        } :
        x.logout ? function() {
          window.location.reload(true);
        }
        : null}).post(x);
    }
  }
  return true;
}
// --------------------------------------------------------------------------------------- trail
//ff: fce.trail (op,...)
// funkce podle parametru op
//    'show'     -- vrátí uživatelskou stopu
//    'show_err' -- vrátí uživatelskou stopu ve formátu pro hlášení chyby
//    'add',o,m  -- přidá záznam o použití objektu o metodou m do Ezer.obj.trail, spolu s časem
//s: funkce
Ezer.obj.trail= {max:5, elems:[]};              // kruhový seznam událostí
Ezer.fce.trail= function (op) {
  var ret= true, del0= '<br>';
  switch (op) {
  case 'show_err':
    del0= ',';
  case 'show':
    var del= '', t, o;
    ret= '';
    try {                                       // kvůli použití v Ezer.error
      Ezer.obj.trail.elems.each(function(ot){
        var r= (ot.o.options.title || ot.o.id)+':'+ot.m;
        if ( ot.o.type.substr(0,5)!='panel' ) {
          // zkusíme zjistit panel
          for (var o= ot.o; o; o= o.owner) {
            if ( o.type.substr(0,5)=='panel' ) {
              r= o.options.title+'.'+r;
              break;
            }
          }
        }
        ret+= del+ot.t+' '+r;
        del= del0;
      });
    } catch (e) {
    }
    break;
  case 'add':
    if ( Ezer.obj.trail.elems.length > Ezer.obj.trail.max ) {
      Ezer.obj.trail.elems.shift();
    }
    Ezer.obj.trail.elems.push({o:arguments[1],m:arguments[2],t:new Date().format("%M:%S")});
    break;
  }
  return ret;
}
// --------------------------------------------------------------------------------------- speed
//ff: fce.speed (op,...)
// funkce pro zobrazení výsledku měření času a objemu dat;
// čitače: on, sql,php,net,data,ezer;
// funkce podle parametru op
//    'on'      -- zapne sledování výkonu
//    'off'     -- vypne sledování výkonu
//    'show'    -- zobrazí aktuální stav čitačů v okně SPEED
//    'clear'   -- vynuluje čitače
//    'hour'    -- zobrazí aktuální stav globálních čitačů  a vynuluje čitače
//s: funkce
Ezer.obj.speed= {
  sql:0,   php:0,   net:0,   data:0,   ezer:0,          // lokální čitače
  sql_g:0, php_g:0, net_g:0, data_g:0, ezer_g:0,        // globální čitače
  msg:'', span:null};                                   // stavové informace
Ezer.fce.speed= function (op) {
  var ret= true, del0= '<br>', x= null;
  switch (op) {
  case 'clear':                         // přičte lokální čitače ke globálním a vynuluje lokální
    with (Ezer.obj.speed) {
      sql_g+= sql; php_g+= php; ezer_g+= ezer; net_g+= net; data_g+= data;
      sql= php= net= data= ezer= 0;
      msg= '';
    }
    break;
  case 'hour':                         // vrátí globální čitače a vynuluje je (spolu s lokálními)
    with (Ezer.obj.speed) {
      sql_g+= sql; php_g+= php; ezer_g+= ezer; net_g+= net; data_g+= data;
      x= sql_g.round()+','+php_g.round()+','+ezer_g.round()+',';
      x+= net_g.round()+','+(data_g/1024).round();
      sql_g= php_g= net_g= data_g= ezer_g= 0;
      sql= php= net= data= ezer= 0;
    }
    break;
  case 'show':
    with (Ezer.obj.speed) {
      msg= 'SQL:'+sql.round()+', PHP:'+php.round()+', Ezer:'+ezer.round();
      msg+= ', NET:' + net.round()+' / '+(data/1024).round();
    }
    Ezer.app._showSpeed();
    break;
  }
  return x;
}
