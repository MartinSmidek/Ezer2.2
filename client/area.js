// Tento modul doplňuje ezer.js o Ezer.Area
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
//c: Area ([options])
//      základní třída
//s: Block
//e: area_onstart - (this) po vytvoření area, parametrem je vytvořený objekt
//e: area_onclick - (p) pokud dojde ke kliknutí na element <a href=p ...> v area (viz metoda set)
Ezer.Area= new Class({
  Extends:Ezer.Block,
  tree: null,                   // vnořený objekt MooTreeControl
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - initialize
// quiet způsobí potlačení události area_onstart
  initialize: function(owner,desc,DOM,options,id,par,quiet) {
    this.parent(owner,desc,DOM,id);
    this.setOptions(options);
    // substituce předaných parametrů do title
    var subst= {};
    if ( desc.options.title ) {
      var i= 0;
      var title= desc.options.title.replace(/\\?\{([\w]+)\}/g, function(match, name) {
        var value= '';
        if ( i<par.length ) {
          value= subst[name]= par[i++];
        }
        return value;
      }.bind(this));
      this.DOM_add(title);
    }
    else {
      // area bude "přilepena" na DOM element pro který je ID=par[0]
      this.DOM_attach(par[0]);
    }
    // vložení podčástí
    this.subBlocks(desc,this.DOM_Area);
    // definice hodnot proměnných podle substituovaných hodnot
    for (var name in subst) {
      var area_var= this.part[name];
      if ( area_var && area_var instanceof Ezer.Var ) {
        area_var.set(subst[name]);
      }
    }
    if ( !quiet )
      this.fire('area_onstart',[this]);
  },
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  DOM_attach
  // DOM - DOM_Block - DOM_Area
  DOM_attach: function(id) {
    // nalezení DOM elementu a připojení událostí
    this.DOM_Block= this.DOM_Block= $(id);
    // obsluha podporovaných událostí
    var fce= this.desc.part ? this.desc.part.onclick : null;
    if ( fce ) {
      this.DOM_Block.addEvent('click', function(ev) {
        new Ezer.Eval(fce.code,this,[],'onclick',false,false,fce,0);
        return false;
      }.bind(this))
    }
  },
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  DOM_add
  // DOM - DOM_Block - DOM_Area
  DOM_add: function(title) {
    // vytvoření instance area
    this.DOM_Block= new Element('div',{'class':'Area'}).inject(this.DOM);
    this.DOM_optStyle(this.DOM_Block);
    // obsluha podporovaných událostí
    var fce= this.desc.part ? this.desc.part.onclick : null;
    if ( fce ) {
      this.DOM_Block.addEvent('click', function(ev) {
        new Ezer.Eval(fce.code,this,[],'onclick',false,false,fce,0);
        return false;
      }.bind(this))
    }
    this.DOM_Block.set('html',title);
    this.DOM_Area= this.DOM_Block.firstChild ? this.DOM_Block.firstChild : null;
//     if ( !this.DOM_Area )
//       Ezer.error(name.value+' nemá správný formát html kódu');
  },
// ----------------------------------------------------------------------------------------- delete
//fm: Area.delete ()
//      vlastník objektu
  delete: function () {
    this.DOM_Block.destroy();
    this.parent();
    return 1;
  },
// ------------------------------------------------------------------------------------------ empty
//fm: Area.empty ()
//      vymaže obsah area
  empty: function (all) {
    if ( this.DOM_Area instanceof Element ) {
      this.DOM_Area.empty();
    }
    else if ( this.DOM_Area ) {
      this.DOM_Block.set('html','');
      this.DOM_Area= null;
    }
    return 1;
  },
// ------------------------------------------------------------------------------------------- init
//fm: Area.init ([all=0])
//      obnoví podle podle aktuálního obsahu proměnných
//      pokud all=1 pak smaže obsah area
  init: function (all) {
    if ( all ) {
      this.DOM_Block.set('html','');
      this.DOM_Area= null;
    }
    else {
      var title= this.desc.options.title.replace(/\\?\{([\w]+)\}/g, function(match, name) {
        var value= '';
        var area_var= this.part[name];
        if ( area_var && area_var instanceof Ezer.Var ) {
          value= area_var.get();
        }
        return value;
      }.bind(this));
      this.DOM_Block.set('html',title);

      var path= location.protocol+'//'+location.hostname+(location.port?':'+location.port:'');
      path+= location.pathname;
      this._set_onclick(this.DOM_Block);
      this.DOM_Area= this.DOM_Block.firstChild ? this.DOM_Block.firstChild : null;
    }
    return 1;
  },
// -------------------------------------------------------------------------------------------- set
//fm: Area.set (id,html)
//      vymění html elementu area daného ID
  set: function (id,html) {
    var elem= this.DOM_Block.getElementById(id);
    if ( elem ) {
      elem.set('html',html);
      // doplnění lokálních odkazů o onclick s argumentem href a u globálních doplnění target
      var path= location.protocol+'//'+location.hostname+(location.port?':'+location.port:'');
      path+= location.pathname;
      this._set_onclick(elem);
    }
    return 1;
 },
// ------------------------------------------------------------------- _set_onclick
// odkazům dovnitř aplikace zamění defaultní událost za area_onclick
  _set_onclick: function(elem) {
    var path= location.protocol+'//'+location.hostname+(location.port?':'+location.port:'');
    path+= location.pathname;
    elem.getElements('a').each(function(el){
      var href= el.href, prefix= href.substr(0,path.length);
      if ( prefix==path ) {
        el.addEvent('click',function(ev){
          history.pushState(null,null,href);
          // ------------------------------------------------- událost area_onclick
          this.fire('area_onclick',[href,ev.target.id],ev);
          return false;
        }.bind(this));
      }
      else if ( !el.target ) {
        el.target= 'panel';
      }
    }.bind(this));
  },
// ------------------------------------------------------------------------------------------ focus
//fm: Area.focus (id_element)
//      označí element a jeho rodičovský element jako aktivní tzn. definuje
//      jim jako jediným v Area class='active'
  focus: function (id_elem) {
    var oblast= this.DOM_Block; //.getElementById(id_oblast);
    if ( oblast ) {
      oblast.getElements('.active').each(function(ael){
        ael.removeClass('active');
      });
      var elem= oblast.getElementById(id_elem);
      if ( elem ) {
        elem.addClass('active');
        elem.parentNode.addClass('active');
      };
    }
    return 1;
  },
// ================================================================================================= AREA TREE
// ------------------------------------------------------------------------------------ tree_insert
//fm: Area.tree_insert (id)
//      vloží uzel pod daný uzel
  tree_insert: function (id) {
    var node= null, old= this.tree.get(id);
    if ( old ) {
      var node_id= id+',*';
      node= old.insert({id:node_id,text:'*'});
    }
    return node;
  },
// -------------------------------------------------------------------------------------- tree_stub
//fm: Area.tree_stub (id)
//      odstraní všechny následníky
  tree_stub: function (id) {
    var node= this.tree.get(id);
    if ( node ) {
      node.clear();
    }
    return 1;
  },
// ------------------------------------------------------------------------------------ tree_remove
//fm: Area.tree_remove (id)
//      odstraní uzel, aktivní bude předchůdce
  tree_remove: function (id) {
    var node= this.tree.get(id);
    if ( node && node.parent ) {
      var p= node.parent;
      node.remove();
      this.tree.select(p);
    }
    return 1;
  },
// ------------------------------------------------------------------------------------- tree_shift
//fm: Area.tree_shift (id,down)
//      posune uzel pokud down=1 dolů, down=0 nahoru
  tree_shift: function (id,down) {
    var node= this.tree.get(id);
    if ( node && node.parent ) {
      var p= node.parent;
      var len= p.nodes.length;
      for (var i= 0; i<len; i++) {
        if ( p.nodes[i].id==id ) {
          break;
        }
      }
      if ( down && i<len-1 ) {
        p.nodes[i]= p.nodes[i+1];
        p.nodes[i+1]= node;
      }
      else if ( !down && i>0 ) {
        p.nodes[i]= p.nodes[i-1];
        p.nodes[i-1]= node;
      }
      p.update();
    }
    return 1;
  },
// ------------------------------------------------------------------------------------ tree_update
//fm: Area.tree_update (id,new_idn,data)
//      zamění obsah uzlu daného id, poslední část se zamění za new_idn pouze, je-li neprázdné
  tree_update: function (id,new_idn,data) {
    var node= this.tree.get(id);
    if ( node ) {
      node.data= data;
      if ( new_idn ) {
        delete this.tree.index[id];
        var fid= id.split(',');
        fid[fid.length-1]= new_idn;
        node.text= new_idn;
        node.id= fid.toString();
        this.tree.index[node.id]= node;
        node.update();
      }
    }
    return 1;
  },
// -------------------------------------------------------------------------------------- tree_dump
//fm: Area.tree_dump ()
//      vytvoří obraz celého stromu ve formátu JSON
  tree_dump: function () {
    var js= '';
    function walk(root) {
      var id= root.id.split(',');
      js+= '{"prop":{"id":"'+id[id.length-1]+'","data":'+JSON.stringify(root.data, undefined, 2)+'}';
      if ( root.nodes.length ) {
        js+= ',\n "down":[';
        var n= 0;
        for (var i= 0; i<root.nodes.length; i++) {
          js+= n ? ',' : '';
          walk(root.nodes[i]);
          n++;
        };
        js+= ']';
      }
      js+= '}';
    }
    walk(this.tree.root);
    return js;
  },
// -------------------------------------------------------------------------------------- tree_show
//fm: Area.tree_show (desc[,id])
//      zobrazí v area strom pomocí balíku MooTree, desc je popis ve formátu
//      pokud je dáno id, bude strom pod tímto elementem
//   nodes: [ node, ... ]
//   node:  {prop:{text:<string>,down:nodes}}
//e: tree_onclick - (id,node,node.data.json,merge.data.json)
  tree_show: function (desc,id) {
    // načte další generaci pod root podle popisu v desc
    function load(root,desc) {
      if ( desc.down ) {
        for (var i= 0; i<desc.down.length; i++) {
          var down= desc.down[i];
          down.prop.text= down.prop.data.name||down.prop.id;
          // úprava down.prop.id na složené jméno
          down.prop.id= root.id+','+down.prop.id;
          var node= root.insert(down.prop);
          load(node,down);
        }
      }
    }
    var active= null;
    if ( !this.tree ) {
      var root= {text:'site',open:true};
      this.tree= new MooTreeControl({div:id ? id : this.DOM_Block,grid:true,
        mode:'files',                   // folders|files
        path:Ezer.paths.images_lib,     // cesta k mootree.gif
        theme:'mootree_white.gif',
        // ----------------------------------------------------------------- onclick
        onClick: function(node) { // při kliknutí na libovolný uzel
          // spočítáme sumu data - shora dolů
          if ( node ) {
            var data= {}, datas= [];
            for (var x= node; x; x= x.parent) {
              datas.unshift(x.data);
            }
            datas.each(function(d){
              Object.merge(data,d);
            })
            var ndata= JSON.stringify(node.data, undefined, 2);
            var adata= JSON.stringify(data, undefined, 2);
            var fid= node.id.split(',');
            var idn= fid[fid.length-1];
            this.fire('tree_onclick',[node.id,idn,node.data,ndata,adata]);
          }
          return false;
        }.bind(this)
      }, root);
    }
    else {
      active= this.tree.selected ? this.tree.selected.id : null;
      this.tree.root.clear();
    }
    this.tree.disable(); // potlačí zobrazení
    if ( desc && desc.prop ) {
      Object.append(this.tree.root,desc.prop);
      this.tree.root.text= this.tree.root.data.name||this.tree.root.id;
      this.tree.index[this.tree.root.id]= this.tree.root;
      load(this.tree.root,desc);
      this.tree.expand();
    }
    if ( active && this.tree.get(active) )
      this.tree.select(this.tree.get(active));
    this.tree.enable(); // zviditelní
    return 1;
  }
});
// ================================================================================================= STRUKTURY
// --------------------------------------------------------------------------------------- new_area
//fs: str.new_area (name,parent[,par])
//      vytvoření instance area podle name, obsahujícím buďto string s úplným jménem area
//      nebo Ezer objekt
//      A) vnořené do parent zadaného jako ID (string) nebo jak Ezer objekt
//         nebo jako DOM element (například výsledek volání new_area)
//  ?   B) pokud není zadán parent, dojde k napojení nové area na element s ID=par1
//      - volá se výrazem new_area
//s: funkce
Ezer.str.new_area= function() {
  var that= arguments[0];       // volající objekt Ezer.Eval
  var args= arguments[1];       // hodnoty parametrů a proměnných volajícího objektu Ezer.Eval
  var name= new Ezer.Eval(arguments[2],that.context,args,'new_area-name');
  var area_desc= name.value;
  var parent= new Ezer.Eval(arguments[3],that.context,args,'new_area-parent');
  var npar= arguments.length-4, par= [];
  for (var i=0; i<npar; i++) {
    var val= new Ezer.Eval(arguments[4+i],that.context,args,'new_area-par-'+i);
    par[i]= val.value;
  }
  var ezer_area= null;
  var DOM= null;
  var owner= null;      // vlastník area
  var owner= that.context;
  var desc= null;       // popis area
  var ctx= null;
  if ( typeof(area_desc)=='string' ) {
    // jméno musí být úplné
    area_desc= Ezer.code_name(area_desc,null,that.context);
    if ( area_desc ) area_desc= area_desc[0];
  }
  if ( area_desc && area_desc.type=='area' ) {
    area_desc= area_desc.desc ? area_desc.desc : area_desc;
    // nalezení instance vlastnícího panelu
    var panel= null;
    for (var o= that.context; o; o= o.owner) {
      if ( o.type.substr(0,5)=='panel' ) {
        panel= o;
        break;
      }
    }
    if ( !panel )
      Ezer.error('výraz new_form není zanořen do panelu','S');
    if ( !parent.value ) {
    }
    else {
      if ( typeof(parent.value)=='string' ) {
        DOM= $(parent.value);
        if ( !DOM ) Ezer.error(name.value+" nelze najít id='"+parent.value+"' ");
      }
      else if ( typeof(parent.value)=='object' ) {
        if ( parent.value instanceof Element )
          DOM= parent.value;
        else if ( parent.value.DOM_Block || parent.value.DOM ) {
          DOM= parent.value.DOM_Block || parent.value.DOM;
        }
      }
      if ( !DOM )
        Ezer.error(name.value+' nelze napojit na 2.parametr');
    }
    // vytvoření Ezer representace s událostí area_oncreate
    ezer_area= new Ezer.Area(panel,area_desc,DOM,{},area_desc.id,par,false);
  }
  else
    Ezer.error(name.value+' je neznámé jméno - očekává se jméno area');
  that.stack[++that.top]= ezer_area;
  that.eval();
}
// ================================================================================================= FCE
// ---------------------------------------------------------------------------------------- url_get
//ff: fce.url_get ([get])
//   vrátí aktuální url z window.history, pokud je definován parametr get
//   vrátí se jen hodnota GET parametru jehož je jménem
//s: funkce
Ezer.fce.url_get= function (get) {
  return get ? get_url_param(get) : location.href;
}
// --------------------------------------------------------------------------------------- url_push
//ff: fce.url_push (url)
//   vloží url do zásobníku window.history
//s: funkce
Ezer.fce.url_push= function (url) {
  history.pushState(null,null,url);
  return 1;
}
// ------------------------------------------------------------------------------------ json_decode
//ff: fce.json_decode (string)
//   převede JSON zápis objektu na objekt
//s: funkce
Ezer.fce.json_decode= function (string) {
  var obj= null;
  try {
    obj= JSON.decode(string);
  }
  catch (e) {
    Ezer.fce.warning("json_decode: chybná syntaxe");
  }
  return obj;
}
// ------------------------------------------------------------------------------------ json_encode
//ff: fce.json_encode (obj)
//   převede objekt na jeho JSON zápis
//s: funkce
Ezer.fce.json_encode= function (obj) {
  return JSON.encode(obj);
}
