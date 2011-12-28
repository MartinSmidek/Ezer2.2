// ladící modul

var Dbg= {tree:{},button:{},src:{panel:null,file:'',stop:[]}}, Ezer= {};
Dbg.trace= [1,'DBG:'];    // trasovat aplikaci,běh

var loaded= false;
var inited= false;
// ================================================================================================= Application
// funkce spouštěné z aplikace
// ------------------------------------------------------------------------------------- show_run
function show_run() {
  if ( Dbg.tree.run ) Dbg.tree.run.refresh(Ezer.run);
};
// ------------------------------------------------------------------------------------- show_code
function show_code(caller) {
  if ( !Ezer ) Ezer= caller;
  if ( Dbg.tree.code ) Dbg.tree.code.refresh(Ezer.code);
};
// ------------------------------------------------------------------------------------- get_text
// vrátí substring omezený souřadnicemi lc1-lc2
function get_text(lclc) {
  var text= '';
  var k= lclc.split(',');
  var src= $('source');
  // text musí existovat a susbtring být na stejném řádku
  if ( src && k[0]==k[2] ) {
    var l= (k[0]-1).toInt(), c1= k[1].toInt(), c2= k[3].toInt();
    var line= src.getChildren()[l];
    if ( line ) {
      var s= line.getLast('span');
      text= s.get('text').substring(c1,c2+1);
    }
  }
  return text;
}
// ------------------------------------------------------------------------------------- init_text
function init_text() {
  if ( $('source') ) $('source').getChildren().destroy();
  Dbg.src.panel.setLabel('');
  Dbg.src.file= '';
  Dbg.src.app= '';
  Dbg.src.root= null;
  Dbg.button['continue'].setEnabled(false);
  Dbg.button['step'].setEnabled(false);
}
// ------------------------------------------------------------------------------------- show_text
function show_text(source,file,app,l,c,reload,root) {
  var src;
  if ( !Dbg.src.file ) {
    // při prvním volání založ místo pro text
    var panel= Dbg.src.panel.domObj.getElement('.jxPanelContent');
    panel.adopt(
      src= new Element('pre',{id:'source'})
    );
    Dbg.src.panel.setLabel(file);
//     panel.setStyles({width:1000});                           -- bohužel nejde
//     panel.parentNode.setStyles({overflow:'auto'});
  }
  else {
    src= $('source');
  }
  // zobraz text, pokud je nový
  if ( reload || Dbg.src.file!=file || Dbg.src.app!=app ) {
    Dbg.src.root= root;
//     if ( src.firstChild ) src.getChildren().destroy();  // vymaž starý text
    // vymaž starý text
    Ezer.assert(!src.empty().getFirst(),'chyba při rušení starého zdrojového textu');
    var n= 0, line= '', lines= source.split('\n');
//                                                 Ezer.trace('*','::show_text deleted '+Dbg.src.file+', '+file+' has '+lines.length);
    for (var i in lines) {
      if ( typeof(lines[i])!='string' ) break;
      line= padNum(++n,3);
      src.adopt(
        new Element('div').adopt(
        new Element('span',{'class':'SourceNum',text:line,events:{
          click: function(el) {
            if ( seek_proc(file,Number(this.get('text'))) ) {
              if ( this.hasClass('SourceStop') ) {
                // odstraň stop
                Dbg.src.stop[file].erase(this.text);
              }
              else {
                // přidej stop
                if ( !Dbg.src.stop[file] )
                  Dbg.src.stop[file]= [];
                Dbg.src.stop[file].push(this.text);
              }
              this.toggleClass('SourceStop');
            }
          }
        }}),
        new Element('span',{text:' '+lines[i]})
      ));
    }
    Dbg.src.file= file;
    Dbg.src.app= app;
    Dbg.src.panel.setLabel(file);
  }
  // zruš starou aktuální pozici
  var curr= $('sourceCurr');
  if ( curr ) curr.id= null;
  // zobraz aktuální pozici
  if ( l ) {
    curr= src.childNodes[l-1];
    if ( curr ) {
      var pos;
      curr.id= 'sourceCurr';
      pos= curr.getPosition(src);
      src.parentNode.scrollTop= pos.y;
    }
  }
};
// ------------------------------------------------------------------------------------- seek_proc
function seek_proc(file,line) {
  var proc= null;
  if ( Dbg.src.root ) {
//   var proc= find_proc(Ezer.file[file],line);
    proc= find_proc(Dbg.src.root.desc,line);
    if ( proc ) {
      // run tree
      var r_node= find_node(Dbg.tree.run.tree.nodes[0],proc);
      Ezer.App.echo(r_node?' run tree:'+r_node.block.id:' not in run tree');
      if ( r_node ) {
        show_node(r_node);
        scroll_tree(r_node);
      }
      // code tree
      var c_node= find_node(Dbg.tree.code.tree.nodes[0],proc);
      Ezer.App.echo(file+'.'+line+'='+(proc?proc.type+' '+proc.id:'?')
        +(c_node?' tree:'+c_node.block.id:' not in code tree'));
      if ( c_node ) {
        Ezer.App.toggle({desc:c_node.block},'stop');
        show_node(c_node);
      }
    }
    else
      Ezer.App.echo('block on '+line+'not found in '+file);
  }
  return proc;
};
// ------------------------------------------------------------------------------------- show_stop
function show_stop(proc) {
  Dbg.button['continue'].setEnabled(true);
  Dbg.button['step'].setEnabled(true);
  Ezer.App.source_text(proc);
  show_proc(proc);                            // expanduj a scroluj run tree
};
// ------------------------------------------------------------------------------------- show_proc
// ukaž proceduru v RunTree
function show_proc(proc) {
  node= find_node(Dbg.tree.run.tree.nodes[0],proc.desc);
  if ( node ) {
    show_node(node);            // expanduj
    scroll_tree(node);          // scroluj
  }
};
// ------------------------------------------------------------------------------------- show_node
// ukaž uzel
function show_node(node) {
  for ( var x= node.folder ? node : node.owner; x.folder; x= x.owner ) {
    x.expand();
  }
};
// ------------------------------------------------------------------------------------- scroll_tree
// posuň RunTree aby byl vidět uzel
function scroll_tree(node) {
  if ( node ) {
    var treeObj= Dbg.tree.run.tree.subDomObj;
    var pos= node.domObj.getPosition(treeObj);
    treeObj.parentNode.scrollTop= pos.y;
  }
  return node;
};
// ================================================================================================= lokální
// ------------------------------------------------------------------------------------- find_proc
function find_proc(root,line,id) {
  var obj= null, lc= root._lc||'1,1';
  if ( lc ) {
    lc= lc.split(',');
    if ( Number(lc[0])==line && root.type=='proc' ) {
      obj= root;
      if ( id ) obj.id= id;
    }
    else {
      for (ip in root.part) {
        if ( (obj= find_proc(root.part[ip],line,ip)) ) break;
      }
    }
  }
  return obj;
};
// ------------------------------------------------------------------------------------- find_node
function find_node(root,block) {
  var node= null;
  if ( root ) {
    var test= root.block && root.block.desc ? root.block.desc : root.block;
    if ( test==block ) {
      node= root;
    }
    else if ( root.nodes ) {
      for (var ip in root.nodes) if ( ip!='$family' ) {
        if ( (node= find_node(root.nodes[ip],block)) ) break;
      }
    }
  }
  return node;
};
// ------------------------------------------------------------------------------------- init
// funkce bude spuštěna na konci onload z aplikace
function init() {
  if ( loaded ) init2();
  else window.addEvent('load', function() { init2(); });
}

// trace(level,...)
var trace= {
  log: function () {
    if ( Dbg.trace[0] && Dbg.trace.indexOf(arguments[0])>=0 ) console.log.apply(console,arguments); },
  info: function () {
    if ( Dbg.trace[0] && Dbg.trace.indexOf(arguments[0])>=0 ) console.info.apply(console,arguments); },
  error: function () {
    console.error.apply(console,arguments); },
  dir: function () {
    if ( Dbg.trace[0] && Dbg.trace.indexOf(arguments[0])>=0 ) console.dir(arguments[1]); },
  assert: function(test,msg) {
    if ( !test ) {
      console.error('DBG: '+(msg||'assert failure'));
      console.trace();
      chyba();
    }
  }
}

window.addEvent('load', function() {
  loaded= true;
  init();
});

// ------------------------------------------------------------------------------------- init2
function init2() {
  if ( inited ) return;
  inited= true;
  Ezer= window.top.app.Ezer;
  var x= 'app';

  new Jx.Layout(x);
//   var app_all= new Jx.Splitter(x,{layout:'vertical',containerOptions:[null,{height:24}]});
  $(x).resize();
//   var domApp= app_all.elements[0];
//   var domFoot= app_all.elements[1];
//   domFoot.setProperty('text','---');
  var p1= new Jx.Panel({label:'povely',height:60,minHeight:60,collapse:false,maximize:false});
  var p2= new Jx.Panel({label:'moduly',collapse:false,maximize:false,closed:true});
  var p3= new Jx.Panel({label:'objekty',collapse:false,maximize:false});
  Dbg.src.panel= new Jx.Panel({label:'zdroj',collapse:false,maximize:false});
  var p= new Jx.PanelSet({parent:x,panels:[p1,p2,p3,Dbg.src.panel]});
  // _________________
  var context_run= new Jx.Menu.Context().add(
    new Jx.Menu.Item({label:'dump'}).addEvent('click',function(button) {
      Ezer.App.dump(Dbg.tree.run.context);
    }),
    new Jx.Menu.Item({label:'code'}).addEvent('click',function(button) {
      Ezer.App.code(Dbg.tree.run.context);
    }),
    new Jx.Menu.Item({label:'stop'}).addEvent('click',function(button) {
      Ezer.App.toggle(Dbg.tree.run.context,'stop');
    }),
    new Jx.Menu.Item({label:'trace'}).addEvent('click',function(button) {
      Ezer.App.toggle(Dbg.tree.run.context,'trace');
    })
  );
  Dbg.tree.run= new Dbg.Tree({parent:p3.domObj,attr:'options'},context_run);
  // --------------------------------------------------------------------------- APP: reload
  var b1= new Jx.Button({label:'reload'}).addEvent('click',function(button){
    Dbg.tree.code.clear();
    Dbg.tree.run.clear();
    init_text();
    Ezer.App.reload(/*{must_log_in:false}*/);
  });
  // --------------------------------------------------------------------------- APP: save
  // uschovej změněné polohy do zdrojového textu
  var b2a= new Jx.Button({label:'save'}).addEvent('click',function(button){
    Ezer.App.save_drag();
  });
  // --------------------------------------------------------------------------- APP: drag
  var b2= new Jx.Button({label:'drag',toggle:true}).addEvent('down',function(button) {
    Ezer.run.$.dragBlock(true,false);
  });
  b2.addEvent('up',function(button) {
    Ezer.run.$.dragBlock(false,false);
  });
  // --------------------------------------------------------------------------- APP: moduly
  var b3a= new Jx.Button({label:'moduly'}).addEvent('click',function(button){
    Dbg.tree.code.refresh(Ezer.code);
  });
  // --------------------------------------------------------------------------- APP: objekty
  var b3b= new Jx.Button({label:'objekty'}).addEvent('click',function(button) {
    Dbg.tree.run.refresh(Ezer.run);
  });
  // --------------------------------------------------------------------------- APP: continue
  Dbg.button['continue']= new Jx.Button({label:'continue'}).addEvent('click',function(el){
    if ( Ezer.continuation ) {
      el.obj.setEnabled(false);
      Dbg.button['step'].setEnabled(false);
      Ezer.continuation.eval();
    }
  });
  Dbg.button['continue'].setEnabled(false);
  // --------------------------------------------------------------------------- APP: step
  Dbg.button['step']= new Jx.Button({label:'step'}).addEvent('click',function(el){
    if ( Ezer.continuation ) {
      Ezer.continuation.eval(true);
    }
  });
  Dbg.button['step'].setEnabled(false);
  // --------------------------------------------------------------------------- ...
  new Jx.Toolbar.Container({scroll:false}).addTo(p1.domObj).add(b2,b1,Dbg.button['continue'],Dbg.button['step']);
  new Jx.Toolbar.Container({scroll:false}).addTo(p1.domObj).add(b2a,b3a,b3b);
  Dbg.tree.code= new Dbg.Tree({parent:p2.domObj});
};
// ================================================================================================= Dbg.Tree
Dbg.Tree= new Class({
  Implements: [Options],
  options: {
    parent:null,
    attr:'options'
  },
  context:null,
  contextMenu:null,
  tree:null,
  initialize: function(options,contextMenu) {
//     console.info('TREE',options);
    this.contextMenu= contextMenu||null;
    this.setOptions(options);
    this.tree= new Jx.Tree({parent:this.options.parent});
  },
  clear: function() {
    if ( this.tree ) this.tree.clear();
  },
  refresh: function(structure) {
    this.clear();
    this.build(this.tree,structure,null);
  },
  // desc :: {* <key>:{type:<str> [options:<attr>] [part:<desc>] } *}
  build: function (root,desc,id) {
//     trace.info('TRE:',desc,id);
    var label, title, item;
    $each(desc,function(value,key){
//       trace.assert(typeof(value)=='object');
      var idkey= (id?(id+'.'):'')+key;
      label= value ? (value.type||'')+' '+key : key;
      if ( value._file ) {
        label+= ' <b>src='+value._file+'</b> ';
      }
      if ( value.part ) {
        item= new Jx.TreeFolder({label:label});
        item.folder= true;
        //item.expand();
        this.build(item,value.part,idkey);
      }
      else if ( value.type=='var' && value.value && value.value.part ) {
        label+= ' = '+ value.value.type+' '+value.value.id;
        item= new Jx.TreeFolder({label:label});
        item.folder= true;
        // item.expand();
        this.build(item,value.value.part,idkey);
      }
      else {
        item= new Jx.TreeItem({label:label});
        item.folder= false;
        item.addEvent('click',function(el) {
          Ezer.App.source_text(el.block);
        });
      }
      root.append(item);
      item.block= value;
      title= idkey;
      if ( value[this.options.attr] ) $each(value[this.options.attr],function(aval,aid) {
        title+= ' '+aid+':'+aval;
      });
      item.domObj.setProperties({title:title});
      if ( this.contextMenu ) {
        item.contextMenu= this.contextMenu;
        item.domObj.addEvent('mouseover',function(button){
          this.context= {id:key,desc:value,path:id||''};
          return false;
        }.bind(this));
      }
    },this);
  }
});
