// doplnění tříd Ezer o jejich zobrazení v DOM architektuře
// jména začínající podtržítkem jsou lokální pro DOM-doplnění, nesmí se používat v ezer.js
// ================================================================================================= Block
Ezer.Block.implement({
// ------------------------------------------------------------------------------------ DOM_destroy
//f: Block-DOM.DOM_destroy ()
//      zruší DOM-elementů vnořených bloků
  DOM_destroy: function() {
    if ( this.DOM_Block )
      this.DOM_Block.getChildren().destroy();
    else
      for (var o in this.part) {
        if ( this.part[o].DOM_destroy ) {
          this.part[o].DOM_destroy();
        }
      }
  },
// ------------------------------------------------------------------------------------ DOM_enabled
//f: Block-DOM.DOM_enabled (on)
//      změní vzhled na enabled/disabled podle parametru nebo this.options.enabled
  DOM_enabled: function(on) {
    if ( this.DOM_Block ) {
      if (on!==false && this.options.enabled) {
        this.DOM_Block.removeClass('jxDisabled');
        if (this.DOM_Input) {
          this.DOM_Input.disabled= false;
        }
      }
      else {
        this.DOM_Block.addClass('jxDisabled');
        if (this.DOM_Input) {
          this.DOM_Input.disabled= true;
        }
      }
    }
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  DOM_optStyle
// doplní případný styl, css-třídu a title
  DOM_optStyle: function(dom) {
    // atribut style definuje styly pro parametr
    if ( this.options.style ) {
      var oss= this.options.style.split(';');
      for (var io= 0; io < oss.length; io++ ) {
        var os= oss[io].split(':');
        Ezer.assert(os[0],'prázdný název stylu',this);
        dom.setStyle(os[0],os[1]);
      }
    }
    // atribut css definuje jméno css třídy pro this.DOM_Block
    if ( this.options.css ) {
      this.DOM_Block.addClass(this.options.css);
    }
    if (this.DOM_Input ) {
      // nepovinná hodnota title
      if ( this.title )
        this.DOM_Input.set('title',this.title);
      if ( this._fc('h') )
        this.DOM_Input.set('type','hidden');
    }
    if (this.DOM_Block ) {
      if ( this._fc('n') )
        this.DOM_Block.setStyles({display:'none'})
    }
  },
// ------------------------------------------------------------------------------------ DOM_owner
// nalezne takového vlastníka, který má definované zobrazení
  DOM_owner: function () {
    var o= null;
    for (o= this; o.owner; o= o.owner)  {
      if ( o.DOM_Block ) break;
    }
    return o;
  },
// ------------------------------------------------------------------------------------ DOM_set_properties
// nastaví panelu maximální rozumnou výšku
  DOM_set_properties: function(prop) {
    var div= this.DOM_Block;
    if ( div ) {
      if ( prop.height=='*' ) {
        if ( this.type=='panel' )
          div= div.getElement('.inAccordion') || div;                             // !!!!!!!!!!!!!!!!!
        var hs= div.getElements('div').getCoordinates().map(function(o){return o.height});
        var h= prop.min_height ? [hs.max(),prop.min_height].max() : hs.max();
        div.setStyles({height:h+50});
      }
      if ( prop.width=='*' ) {
        var ws= div.getElements('div,table').getCoordinates().map(function(o){return o.width});
        var w= prop.min_width ? [ws.max(),prop.min_width].max() : ws.max();
        div.setStyles({width:w});
      }
      else if ( prop.width ) {
        div.setStyles({width:prop.width});
      }
    }
  },
// ------------------------------------------------------------------------------------ coord
// dopočet hodnot souřadnic - záporně vlevo=kladně vpravo
  coord: function(ext) {
    var c= {};
    if ( this._l>=0 ) c.left= this._l;
    if ( this._l<0 )  c.right= -this._l;
    if ( this._t>=0 ) c.top= this._t;
    if ( this._t<0 )  c.bottom= -this._t;
    c.width= this._w;
    c.height= this._h;
    if ( ext ) {
      $extend(c,ext);
    }
    return c;
  }
});
// ================================================================================================= Menu-DOM
// zobrazení Menu - pokud je options.type='main' bude to hlavní menu
// ------------------------------------------------------------------------------------------------- MenuMain-DOM
//c: MenuMain-DOM ([options])
//      hlavní menu aplikace, obsahuje Tabs
//t: Block-DOM,Menu-DOM
//s: Block-DOM
Ezer.MenuMain.implement({
  DOM_SelectedTabs: null,
// ------------------------------------------------------------------------------------ DOM_add2
//f: MenuMain-DOM.DOM_add2 ()
//      zobrazí hlavní menu
  DOM_add2: function () {
    this._menuDom= $('menu');
    // zjisti aktivní Tabs
    if ( this.part ) {
      $each(this.part,function(desc,id) {
        var href= make_url_menu([id]); // 'ezer://'+id;
        if ( desc.type=='tabs' ) {
          var a= new Element('a',{href:href,html:desc.options.title||id}).inject(new Element('div').inject(
          desc.DOM_li= new Element('li',{
  //           'class': id==active ? 'Active' : '',
            events:{
              click: function(event) {
                Ezer.pushState(href);
                Ezer.fce.touch('block',this,'click');     // informace do _touch a trail na server
                Ezer.fce.DOM.help_hide();
                this._focus();
                return false;
              }.bind(desc)
            }
          }).inject(this._menuDom)));
          // zvýraznění nadpisu, pokud právě k němu existuje _help - help pro tabs nelze vynutit
          var key= desc.self_sys().sys;
          if ( key && desc.options._sys && Ezer.sys.ezer.help_keys
            && Ezer.sys.ezer.help_keys.contains(key,',') ) {
//             a.innerHTML+= "<sub>&hearts;</sub>";
            a.innerHTML+= "<sub> ?</sub>";
          }
        }
        // odhlášení (i když není požadováno přihlášení)
        else if ( desc.type=='tabs.logoff' ) {
          new Element('a',{html:desc.options.title||id}).inject(new Element('div').inject(
          desc.DOM_li= new Element('li',{
            events:{
              click: function(event) {
                Ezer.fce.touch('logout');
              }.bind(desc)
            }
          }).inject(this._menuDom)));
        }
      },this);
    }
  },
// ------------------------------------------------------------------------------------ DOM_destroy
//f: MenuMain-DOM.DOM_destroy ()
//      zruší zobrazení hlavního menu
  DOM_destroy: function () {
    Ezer.app.domMenu.getChildren().destroy();
//     $('submenu').getChildren().destroy();
    $('submenu').getElements('li[id^=_help]').destroy();
    $('work').getChildren().destroy();
    $('body').getElements('div[id^=StickyWin]').destroy();
    $('body').getElements('ul.ContextMenu');
//     $('shield').setStyles({visibility:'hidden'});
    Ezer.app.clearDom();
  },
// ------------------------------------------------------------------------------------ DOM_setSelectedTabs
//f: MenuMain-DOM.DOM_setSelectedTabs (id)
//      zobrazí dané Tabs jako vybrané
  DOM_setSelectedTabs: function(tabs_id) {
    if ( this.part[tabs_id] ) {
      if ( this.DOM_SelectedTabs ) this.DOM_SelectedTabs._hide();
      this.DOM_SelectedTabs= this.part[tabs_id]._show();
    }
  }
});
// ================================================================================================= MenuLeft
//c: MenuLeft-DOM ([options])
//      levostranné menu, obsahuje MenuGroup+ je vnořeno do Tabs
//s: Block-DOM
Ezer.MenuLeft.implement({
// ------------------------------------------------------------------------------------ DOM_add1
//f: MenuLeft-DOM.DOM_add1 ()
//      první zobrazení obalu levého menu
  DOM_add1: function() {
    Ezer.assert(this.owner.type=='panel.right',"menu typu 'left' může být pouze v panelu typu 'right'");
    // vložení accordionu do panelu na připravené místo
    this.DOM_Block= new Element('div',{'class':'Accordion',styles:{display:'none'}}).inject($('work'));
//     this.owner.DOM_Block=
//        new Element('div',{'class':'Panel inAccordion'}).inject(this.owner.DOM_Block);
//     this.owner._tabDom.setStyles({display:'none'});
    this.owner.sel_group= null;
  },
// ------------------------------------------------------------------------------------ DOM_re1
//f: MenuLeft-DOM.DOM_re1 ()
//      další zobrazení obalu levého menu
  DOM_re1: function() {
    Ezer.assert(this.owner.type=='panel.right',"menu typu 'left' může být pouze v panelu typu 'right'");
    this.owner.sel_group= null;
  },
// ------------------------------------------------------------------------------------ DOM_start
//f: MenuLeft-DOM.DOM_start ()
//      oživení levého menu po naplnění všemi Group a Item
  DOM_start: function() {
  },
// ------------------------------------------------------------------------------------ DOM_excite
//f: MenuLeft-DOM.DOM_excite ()
//      prvotní zobrazení levého menu
  DOM_excite: function (active) {
    var DOM= this.DOM_Block, div;
    // nalezení aktivního
    if ( active && active.type=='item' ) {
      this.sel_group= null;
      div= active.DOM_Block.getElement('a');
      if ( div ) {
        div.addClass('MSelected');
        this.sel_group= div.getParent().getParent();
      }
    }
    // inicializace efektů accordionu - musí být vidět
    if ( this.owner.DOM_Block.getStyle('display')=="block" )
      DOM.setStyle('display','block');                  // ale pouze, je-li viditelný panel
    DOM.getParent().setStyle('display','block');
    DOM.getElements('.MGroupContent').setStyle('display', 'block');
    var selected= DOM.getElement('.MSelected');
    var current= (selected) ? selected.getParent() : false;
    $each(this.part,function(group) { if ( group instanceof Ezer.MenuGroup ) {
      var link= group.domA;
      var block= group.DOM_Block;
      if (block != current )
        group.DOM_fx.hide();
      if (block == this.sel_group)
        group.DOM_fx.show();
      link.addEvents({
        click: function() {
          group.DOM_fx.toggle();
          return false;
        }
      });
    }});
    if ( this.sel_menugroup ) {
      this.sel_menugroup.DOM_fx.show();
      this.sel_menugroup= null;
    }
  }
});
// ================================================================================================= MenuGroup
Ezer.MenuGroup.implement({
  Implements: [Ezer.Help],
  DOM_add1: function() {
    Ezer.assert(this.owner.type=='menu.left','chybné menu - group mimo accordion');
    this.DOM= new Element('div',{'class':'MGroup MEntry'}).inject(this.owner.DOM_Block);
    var href= make_url_menu([this.owner.owner.owner.id,this.owner.owner.id,this.owner.id,this.id]);
    // 'ezer://'+this.owner.owner.owner.id+'.'+this.owner.owner.id+'.'+this.owner.id+'.'+this.id;
    this.domA= new Element('a',{href:href,text:this.options.title||this.id}).inject(this.DOM);
    this.DOM_Block= new Element('div',{'class':'MGroupContent'}).inject(this.DOM);
    if ( !this.owner.sel_group ) {
      this.owner.sel_group= this.DOM;
      this.owner.sel_menugroup= this;
    }
    this.DOM_fx= new Fx.Slide(this.domA.getNext(),{link:'cancel'});
  },
// ------------------------------------------------------------------------------------ _fold
  _fold: function() {
    this.DOM_fx.hide();
  },
// ------------------------------------------------------------------------------------ _unfold
  _unfold: function() {
    this.DOM_fx.show();
//     var a= this.DOM_Block.getElement('a');
//     a.fireEvent('click',{target:a});
  }
});
// ================================================================================================= MenuContext
Ezer.MenuContext.implement({
  DOM_add1: function() {
    this.DOM= new Element('ul',{'class':'ContextMenu'}).inject($('body'));
    this.ContextMenu= new ContextMenu({target:this.owner.DOM_Block,menu:this.DOM,ezer_owner:null});
  },
  DOM_add2: function() {
    this.ContextMenu.ezer_owner= this;
  }
});
// ================================================================================================= Tabs
//c: Tabs-DOM ([options])
//      realizace vzhledu Tabs vnořených do Menu typu main
//s: Block-DOM
Ezer.Tabs.implement({
  Implements: [Ezer.Help],
  _tabsDom: null,                       // ul-element pro submenu
// ------------------------------------------------------------------------------------ DOM_add1
  DOM_add1: function() {
    this._tabsDom= $('submenu');
  },
// ------------------------------------------------------------------------------------ DOM_add2
  DOM_add2: function() {
  },
// ------------------------------------------------------------------------------------ _setActivePanel
// pro Menu typu main: zviditelni submenu
  _setActivePanel: function(panel_id) {
    if ( this.activePanel ) {
      this.activePanel._tabDom.removeClass('Active').addClass('Pasive');
    }
    this.activePanel= this.part[panel_id];
    this.activePanel._tabDom.addClass('Active').removeClass('Pasive');
    Ezer.panel= this.activePanel;               // informace o aktivním panelu pro dump etc.
  },
// ------------------------------------------------------------------------------------ _hide
  _hide: function() {
    if ( this.part ) $each(this.part,function(desc,id) {
      if ( desc.type=='panel.plain' || desc.type=='panel.right' )
        desc._tabDom.setStyles({display:'none'});
    },this);
    this.active= false;
    if ( this.activePanel ) this.activePanel._hide();
    return this;
  },
// ------------------------------------------------------------------------------------ _show
  _show: function() {
    if ( this.options.include && this.options.include.substr(0,7)=='onclick' ) {
      this.include2('_show');
    }
    else {
      if ( this.part ) {
        $each(this.part,function(desc,id) {
          if ( desc.type=='panel.plain' || desc.type=='panel.right' ) {
            desc._tabDom.setStyles({display:'block'});
          }
        },this);
      }
      this.active= true;
      if ( this.activePanel ) {
        Ezer.panel= this.activePanel;           // informace o aktivním panelu pro dump etc.
        this.activePanel._show();
      }
    }
    return this;
  },
// ------------------------------------------------------------------------------------ _focus
  _focus: function() {
    if ( this.options.where ) {
      location.replace(this.options.where);
    }
    if ( this.options.include && this.options.include.substr(0,7)=='onclick' ) {
      this.include2('_focus');
    }
    else {
      this.owner.DOM_setSelectedTabs(this.id);
      this.owner._menuDom.getChildren('li').each(function(li){
        li.removeClass('Active').addClass('Pasive');
      });
      this.DOM_li.addClass('Active').removeClass('Pasive');;
      this.excite();
    }
  },
// ------------------------------------------------------------------------------------ _loaded
// po zavedení pomocí include:onclick
  loaded: function() {
    if ( this.active ) {
      this.owner.DOM_setSelectedTabs(this.id);
    }
    return true;
  },
// ------------------------------------------------------------------------------------ addTabDom
  addTabDom: function(tabs,part) {
  },
// ------------------------------------------------------------------------------------ DOM_excite
//f: Tabs-DOM.DOM_excite ()
//      vyznačení aktivní položky hlavního menu
  DOM_excite: function () {
    this.DOM_li.addClass('Active').removeClass('Pasive');;
    this.owner.DOM_SelectedTabs= this._show();
  }
});
// ================================================================================================= Item
Ezer.Item.implement({
  Implements: [Ezer.Help],
// ------------------------------------------------------------------------------------  DOM_add1
  DOM_add1: function() {
  },
// ------------------------------------------------------------------------------------  DOM_add2
  DOM_add2: function() {
    var a;
    switch (this.owner.type) {
    case 'menu.group':
      this.DOM_Block= new Element('div',{'class':'MFile MEntry'}).inject(this.owner.DOM_Block);
      var href= make_url_menu([this.owner.owner.owner.owner.id,this.owner.owner.owner.id,
        this.owner.owner.id,this.owner.id,this.id]);
      // 'ezer://'+this.owner.owner.owner.owner.id+'.'+this.owner.owner.owner.id+'.'
      // +this.owner.owner.id+'.'+this.owner.id+'.'+this.id;
      this.domA= new Element('a',{href:href,text:this.options.title||this.id}).inject(this.DOM_Block);
      this.domA.addEvents({
        click: function(el) {
          if ( !el.target.hasClass('disabled') ) {
            Ezer.pushState(href);
            this._click(el);
            Ezer.fce.touch('block',this,'click');     // informace do _touch na server
          }
          return false;
        }.bind(this)
      });
      if ( this._fc('d') ) {
        this.domA.addClass('disabled');
      }
      break;
    case 'menu.context':
      var title= this.options.title||this.id;
      new Element('li').adopt(
        a= new Element('a',{text:title[0]=='-' ? title.substr(1) : title})
      ).inject(this.owner.DOM);
      if ( title[0]=='-' ) {
        a.setStyles({borderTop:"1px solid #AAAAAA"});
      }
      if ( this.type=='item.clipboard' ) {
        // pokud je definováno
        a.set('id','clipboard');
        clipboard_init();
        a.addEvent(Ezer.browser=='CH' ? 'mouseover' : 'mousedown',
          function(el) {
            this.fire('onclick',[],el);
            return false;
          }.bind(this)
        );
      }
      else {
        a.addEvents({
          click: function(el) {
            if ( !el.target.hasClass('disabled') ) {
              Ezer.fce.touch('block',this,'click');       // informace do _touch na server
              this.fire('onclick',[],el);
            }
          }.bind(this)
        });
      }
      break;
    default:
      Ezer.error('chybné menu - item mimo group nebo context');
    }
  },
// ------------------------------------------------------------------------------------ DOM_enabled
//f: Item-DOM.DOM_enabled (on)
//      změní vzhled na enabled/disabled podle parametru nebo this.options.enabled
  DOM_enabled: function(on) {
    if (this.owner.type=='menu.group') {
      if ( on )
        this.domA.removeClass('disabled');
      else
        this.domA.addClass('disabled');
    }
  },
// ------------------------------------------------------------------------------------  _click
  _click: function(el) {
    this._focus();
    if ( this.findProc('onclick') )
      this.fire('onclick',[this],el);
    else if ( this.owner.findProc('onclick') )
      this.owner.fire('onclick',[this],el);
    else if ( this.owner.owner.findProc('onclick') )
      this.owner.owner.fire('onclick',[this],el);
    return this;
  },
// ------------------------------------------------------------------------------------  _focus
  _focus: function() {
    Ezer.assert(this.owner.type=='menu.group','_focus');
    this.owner.owner.excite();
    var s= this.owner.owner.DOM_Block.getElement('.MSelected');
    if ( s ) s.removeClass('MSelected');
    this.domA.addClass('MSelected');
//     var g= this.owner;
//     g.DOM_fx.show();
  },
// ------------------------------------------------------------------------------------  _show
  _show: function(el) {
    this.owner.owner.excite();
    this.owner._unfold();
    this._focus();
  }
});
// ================================================================================================= Panel
//c: Panel-DOM ()
//      implementace panelů
//t: Block-DOM
//s: Block-DOM
//-
// ------------------------------------------------------------------------------------------------- Panel
Ezer.Panel.implement({
  Implements: [Ezer.Help],
  _DOM_displayed: false,         // true pokud již měl display:block a má upravené rozměry
// ------------------------------------------------------------------------------------ DOM_add1
//f: Panel-DOM.DOM_add1 ()
  DOM_add1: function() {
    Ezer.assert(this.owner.DOM_Block,'panel '+this.id+' nelze vnořit do '+this.owner.id);
    this.DOM_Block=
      new Element('div',{'class':'Panel',styles:{display:'none'}}).inject(this.owner.DOM_Block);
  },
// ------------------------------------------------------------------------------------ DOM_add2
//f: Panel-DOM.DOM_add2 ()
  DOM_add2: function() {
    if ( this.options.css ) this.DOM_Block.addClass(this.options.css);
  },
// ------------------------------------------------------------------------------------  _show
//f: Panel-DOM._show ()
  _show: function(l,t,noevent) {
    this.DOM_Block.setStyles({display:'block',left:l,top:t});
//   this.DOM_Block.setStyles({display:'block'});
//   if ( !this._DOM_displayed ) {
//     // při prvním zobrazení upravíme rozměry
//     Ezer.fce._DOM_size(this,this);
//     var c= this.DOM_Block.getCoordinates();
//     this.DOM_Block.setStyles({width:this._w_max-c.left,height:this._h_max-c.top});
//   }
    if ( !noevent ) {
      if ( this.virgin ) {
        this.virgin= false;
        Ezer.app.onfirstfocus(this);
        if ( this.part && this.part['onfirstfocus'] )
          this.fire('onfirstfocus',[]);
        else
          this.fire('onfocus',[]);
      }
      else
        this.fire('onfocus',[]);
    }
    return this;
  },
// ------------------------------------------------------------------------------------  _hide
//f: Panel-DOM._hide ()
  _hide: function() {
    this.fire('onblur',[]);
    this.DOM_Block.setStyles({display:'none'});
    return this;
  },
// ------------------------------------------------------------------------------------  _focus
//f: Panel-DOM._focus ()
  _focus: function(noevent) {
    if ( this.options.include && this.options.include.substr(0,7)=='onclick' ) {
      this.include2('_focus');
    }
    else {
      if ( this.owner.activePanel ) this.owner.activePanel._hide();
      this.owner._setActivePanel(this.id);
      if ( this.owner.activePanel ) this.owner.activePanel._show(undefined,undefined,noevent);
      Ezer.fce.touch('block',this,'focus');   // informace do _touch na server
      Ezer.fce.touch('panel',this);           // informace do _touch na server
      this.excite();
    }
  }
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  _DOM_size
// spočítá rozměry ohraničujícího obdélníku (projde všechny vnořené)
Ezer.fce._DOM_size= function(top,block) {
  if ( block.part ) {
    for (var o in block.part) {
      var sub= block.part[o];
      switch (sub.type) {
      // podbloky s rozměry
      case 'browse':
      case 'button':
      case 'button.submit':
      case 'button.reset':
      case 'case':
      case 'chat':
      case 'check':
      case 'edit':
      case 'field':
      case 'field.date':
      case 'label':
      case 'select':
      case 'select.map':
        if ( sub.DOM_Block ) {
          var c= sub.DOM_Block.getCoordinates();
          top._w_max= Math.max(top._w_max,(c.left||0)+(c.width||0));
          top._h_max= Math.max(top._h_max,(c.top||0)+(c.height||0));
//                                 Ezer.trace('*',top._w_max+','+top._h_max+' -- '+sub.type+' '+sub.id);
        }
        break;
      // podbloky bez vnořených bloků s rozměry
      case 'browse':
      case 'case':
      case 'menu.main':
      case 'menu.left':
      case 'menu.context':
      case 'const':
      case 'report':
      case 'table':
      case 'map':
      case 'proc':
        break;
      // use form
      case 'var':
        if ( sub._of=='form' && sub.value && sub.value.type=='form' ) {
          Ezer.fce._DOM_size(top,sub.value);
        }
        break;
      // podbloky s vnořenými bloky s rozměry
      default:
        Ezer.fce._DOM_size(top,sub);
      }
    }
  }
};
// ----------------------------------------------------------------------------------- PanelMain-DOM
// panel jako hlavní plocha aplikace
Ezer.PanelMain.implement({
  DOM_add1: function() {
    this.DOM_Block=
      new Element('div',{'class':'Panel',styles:{display:'block'}}).inject($('work'));
  },
  DOM_add2: function() {
  }
});
// ================================================================================================= Panel pod Tabs
// --------------------------------------------------------------------------- fce pro panely v Tabs
// zobrazí záložku panelu a podle stavu helpu ji označí, pokud je help pro tuto záložku
// a přihlášeného uživatele vynucený, naplní panel.force_help
Ezer.PanelInTabs_add= function(panel) {
  var href= make_url_menu([panel.owner.id,panel.id]); // 'ezer://'+panel.owner.id+'.'+panel.id;
  var a= new Element('a',{href:href,html:panel.options.title||panel.id}).inject(
    new Element('div').inject(
      panel._tabDom= new Element('li',{styles:{display:'none'},events:{
        click: function(event) {
          if ( !this.owner.activePanel
            || (this.owner.activePanel && !this.owner.activePanel.is_fixed) ) {
            // pokud panel není blokován proti ztrátě focusu
            Ezer.pushState(href);
            Ezer.fce.DOM.help_hide();
            this._focus();
          }
          return false;
        }.bind(panel)
      }
    }).inject(panel.owner._tabsDom)
  ));
  // zvýraznění nadpisu, pokud právě k němu existuje _help
  var key= panel.self_sys().sys;
  if ( panel.options._sys && Ezer.sys.ezer.help_keys.contains(key,',') ) {
//     a.innerHTML+= "<sub>&hearts;</sub>";
    a.innerHTML+= "<sub> ?</sub>";
    // posouzení, zda má být help navíc vnucen při firstfocus
    if ( Ezer.sys.ezer.help_keys.contains('*'+key,',') ) {
      a.innerHTML+= "<sub>!</sub>";
      panel.force_help= true;
    }
  }
}
// ---------------------------------------------------------------------------------- PanelPlain-DOM
// panel vnořený do Tabs
Ezer.PanelPlain.implement({
  _tabDom: null,                                // li-element zanořený do Tabs nebo null
  DOM_add1: function() {
    Ezer.PanelInTabs_add(this);                 // položka v Tabs
    this.DOM_Block=
      new Element('div',{'class':'Panel',styles:{display:'none'}}).inject($('work'));
  },
  DOM_add2: function() {
  },
  _show: function(l,t,noevent) {
    this.DOM_Block.setStyles({display:'block',left:l,top:t+Ezer.Shield.top});
    if ( !noevent ) {
      if ( this.virgin ) {
        this.virgin= false;
        Ezer.app.onfirstfocus(this);
        if ( this.part && this.part['onfirstfocus'] )
          this.fire('onfirstfocus',[]);
        else
          this.fire('onfocus',[]);
      }
      else
        this.fire('onfocus',[]);
    }
    return this;
  },
  _hide: function() {
    this.fire('onblur',[]);
    this.DOM_Block.setStyles({display:'none'});
    return this;
  }
});
// ---------------------------------------------------------------------------------- PanelRight-DOM
// panel vnořený do Tabs společně s MenuLeft
Ezer.PanelRight.implement({
  DOM_add1: function() {
    Ezer.PanelInTabs_add(this);                 // položka v Tabs
    this.DOM_Block=
//     this.owner.DOM_Block=
//        new Element('div',{'class':'Panel inAccordion'}).inject(this.owner.DOM_Block);
//     this.owner._tabDom.setStyles({display:'none'});
      new Element('div',{'class':'PanelRight',styles:{display:'none'}}).inject($('work'));
    this.DOM_Block.setStyles({width:this._w,height:this._h});
  },
  DOM_add2: function() {
  },
  _show: function(l,t) {
    this.parent();
    if ( this.menuleft ) {
      this.menuleft.DOM_Block.setStyles({display:'block'});
    }
    return this;
  },
  _hide: function() {
    this.parent();
    if ( this.menuleft ) {
      this.menuleft.DOM_Block.setStyles({display:'none'});
    }
    return this;
  }
});
// ---------------------------------------------------------------------------------- PanelPopup-DOM
Ezer.PanelPopup.implement({
  DOM_shown: false,                           // true - pokud bylo poprvé ukázáno
  // ---------------------------------------------------------------------------------- DOM_add1
  DOM_add1: function() {
    var close= this.options.par && this.options.par.close=='no' ? false : true;
    this.DOM= $(this.StickyWin= new StickyWin({draggable:true,
      content:StickyWin.ui(this.options.title||'',null,{
        cornerHandle:true, width:this._w+55,
        cssClassName:'PanelPopup',closeButton:close
      })
    }));
    if ( close ) {
      this.DOM.getElement('div.closeButton').addEvents({
        click:function(){
          this.hide(0);
        }.bind(this)
      })
    };
    this.DOM.setStyles({display:'none'});
    this.DOM_Block= this.DOM.getElement('.body');
    this.DOM_Block.setStyles({width:this._w,height:this._h});
  },
  // ---------------------------------------------------------------------------------- DOM_add2
  DOM_add2: function() {
  },
  // ---------------------------------------------------------------------------------- _show
  _show: function(l,t,noevent,title) {
    this.DOM.setStyles({display:'block'});
    if ( !this.DOM_shown && l!==undefined && t!==undefined ) {
      // pokud není definován počátek, bude dialog centrální
      this.DOM.setStyles({left:l,top:t+Ezer.Shield.top});
    }
    this.DOM_shown= true;
    this.StickyWin.showWin();
    if ( title )
      this.DOM.getElement('.caption').set('text',title);
    if ( !noevent ) {
      if ( this.virgin ) {
        this.virgin= false;
        Ezer.app.onfirstfocus(this);
        if ( this.part && this.part['onfirstfocus'] )
          this.fire('onfirstfocus',[]);
        else
          this.fire('onfocus',[]);
      }
      else
        this.fire('onfocus',[]);
    }
    return this;
  },
  // ---------------------------------------------------------------------------------- _hide
  _hide: function() {
    this.fire('onblur',[]);
    this.DOM.setStyles({display:'none'});
    return this;
  },
  // ---------------------------------------------------------------------------------- DOM_modal
  DOM_modal: function(on) {
    if ( on )
      Ezer.Shield.show();
    else
      Ezer.Shield.hide();
  }
});
// ================================================================================================= Form, View
// -------------------------------------------------------------------------------------------- Form
Ezer.Form.implement({
  Implements: [Ezer.Drag,Ezer.Help],
  DOM_add1: function() {
    // nalezení nadřazeného bloku (vynechání var,group)
    var owner= this.DOM_owner();
    // zobrazení rámečku
    this.DOM_Block= new Element('div',{'class':'Form',styles:this.coord()
    }).inject(owner.DOM_Block);
//     }).inject(this.owner.owner.DOM_Block);
    this.DOM_optStyle(this.DOM_Block);
  },
  DOM_add2: function() {
  }
});
// ================================================================================================= části Form
// ------------------------------------------------------------------------------------------- Label
Ezer.Label.implement({
  Implements: [Ezer.Drag,Ezer.Help],
  DOM_add: function() {
    // zobrazení label
    var owners_block= this.owner.DOM_Block ? this.owner.DOM_Block : this.owner.value.DOM_Block;
    var align= this._fc('c') ? 'center' : this._fc('r') ? 'right' : 'left';
    this.DOM_Block= new Element('div',{'class':'Label',html:this.options.title||'',
      styles:this.coord({textAlign:align}),events:{
        click: function(el) {
          if ( !Ezer.design && (this.options.enabled || this.options.enabled===undefined) ) {
            Ezer.fce.touch('block',this,'click');           // informace do _touch na server
            this.fire('onclick',[],el);
          }
        }.bind(this)
      }
    }).inject(owners_block);
    this.DOM_optStyle(this.DOM_Block);
    if ( this.options.help )
      this.DOM_Block.set('title',this.options.help);
  },
  DOM_set: function (str) {
    this.DOM_Block.set('html',str);
    // přidá obsluhu vnořeným elementům <a href='ezer://....'>
    // obdobný kód je v Ezer.App.start_href_modify
    this.DOM_Block.getElements('a').each(function(el) {
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
    });
  },
  DOM_get: function () {
    return this.DOM_Block.get('html');
  },
// ------------------------------------------------------------------------------- Label.DOM_enabled
//f: Label-DOM.DOM_enabled (on)
//      změní vzhled na enabled/disabled podle parametru nebo this.options.enabled
  DOM_enabled: function(on) {
    if ( this.DOM_Block ) {
      if (on!==false && this.options.enabled) {
        this.DOM_Block.removeClass('disabled');
      }
      else {
        this.DOM_Block.addClass('disabled');
      }
    }
  }
});
// ======================================================================================= LabelDrop
Ezer.LabelDrop.implement({
  Implements: [Ezer.Drag,Ezer.Help],
  DOM_files: [],
  DOM_BlockRows: null,
  DOM_add: function() {
    // zobrazení prázdného label.drop
    var owners_block= this.owner.DOM_Block ? this.owner.DOM_Block : this.owner.value.DOM_Block;
    var h= this.options.title ? 15 : 0;
    this.DOM_Block= new Element('div',{'class':'LabelDrop',styles:this.coord(),
      events:{
        dragover: function(evt) {
          evt.preventDefault();
          this.DOM_Block.addClass('LabelDropHover');
        }.bind(this),
        dragleave: function(evt) {
          evt.preventDefault();
          this.DOM_Block.removeClass('LabelDropHover');
        }.bind(this),
        drop: function(evt) {
          evt.stopPropagation();
          evt.preventDefault();
          this.DOM_Block.removeClass('LabelDropHover');
          for (var i= 0; i<evt.event.dataTransfer.files.length; i++) {
            var f= evt.event.dataTransfer.files[i];
            this.DOM_addFile(f);
            var r= new FileReader();
            r.Ezer= {file:f,bind:this};
            r.onload= function(e) {
              var tf= this.Ezer.file;
              tf.data= new Blob([e.target.result],{type:tf.type});
              tf.orig= 'drop';
              this.Ezer.bind.DOM_ondrop(tf);
            }
            r.readAsArrayBuffer(f);
          };
        }.bind(this)
      }})
      .adopt(new Element('div',{html:this.options.title||'',styles:{height:h}}))
      .adopt(new Element('div',{styles:{height:this._h-h}})
        .adopt(new Element('table',{cellspacing:0})
          .adopt(this.DOM_BlockRows= new Element('tbody'))))
      .inject(owners_block);
    this.DOM_optStyle(this.DOM_Block);
    if ( this.options.help )
      this.DOM_Block.set('title',this.options.help);
  },
// ------------------------------------------------------------------------------ LabelDrop.DOM_init
//f: LabelDrop-DOM.DOM_init (on)
//      inicializace dat a oblasti pro drop - set(0) ji deaktivuje, set(1) aktivuje
  DOM_init: function() {
    this.DOM_files= [];
    this.DOM_BlockRows.getChildren().destroy();
  },
// ------------------------------------------------------- LabelDrop.DOM_href
// přidá odkaz na soubor s případným kontextovým menu
  DOM_href: function(fname) {
    // kontextové menu, pokud je přítomna procedura onremove
    var m= '';
    if ( this.part && (obj= this.part['onmenu']) ) {
      m= " oncontextmenu=\"var obj=[];if(Ezer.run_name('"+this.self()+"',null,obj)==1){"
      + "obj=obj[0].value||obj[0];Ezer.fce.contextmenu(["
        + "['vyjmout',function(el){obj.callProc('onmenu',['remove','"+fname+"'])}],"
        + "['vyjmout vše',function(el){obj.callProc('onmenu',['remove-all',''])}]"
      + "],arguments[0])};return false;\"";
    }
    return "<a target='docs' href='"+this.relpath+fname+"'"+m+">"+fname+"</a>";
  },
// ------------------------------------------------------- LabelDrop.DOM_addFile
// přidá řádek pro informaci o vkládaném souboru
// obohatí f o td1,td2 a volitelně td3
  DOM_addFile: function(f) {
    var td3w= 0; // nebo volitelně šířka třetího informačního sloupce
    var td2w= 60;
    var td1w= this._w - (td2w + td3w + (td3w?16:14) + 16);
    var tr= new Element('tr').adopt(
      f.td1= new Element('td',{width:td1w,html:f.status ? this.DOM_href(f.name) : f.name}),
      f.td2= new Element('td',{width:td2w,align:'right',html:f.status||"čekám"})
    ).inject(this.DOM_BlockRows);
    if ( td3w )
      tr.adopt(f.td3= new Element('td',{width:60}));
    this.DOM_files.push(f);
  },
// -------------------------------------------------------- LabelDrop.DOM_ondrop
// zavolá proc ondrop, pokud existuje - vrátí-li 0 bude upload zrušen,
// jinak jej provede s předaným jménem (možnost odstranit diakritiku)
// pokud proc ondrop neexistuje, zahájí upload
  DOM_ondrop: function(f) {
    // zavolání funkce ondrop ex-li
    if ( this.part && (obj= this.part['ondrop']) ) {
      var continuation= {fce:this.DOM_upload,args:[f],stack:true,obj:this};
      new Ezer.Eval(obj.code,this,[f],'ondrop',continuation,false,obj,obj.desc.nvar);
    }
    else {
      // nebo přímo zavolat upload
      this.DOM_upload(f,1);
    }
  },
// -------------------------------------------------------- LabelDrop.DOM_upload
// konec vkládání a případný upload
  DOM_upload: function(f,do_upload) {
    if ( do_upload ) {
      f.name= do_upload;
      // upload rozdělený na části s referováním do <progrress>
      f.td2.innerHTML= "";
      var bar= new Element('progress',{max:100,value:0,title:"kliknutí přeruší přenos",events:{
        click: function(evt) {
          f.cancel= true;
        }.bind(this)
      }}).inject(f.td2);
      const CHUNK= 100000; //512 * 1024; // 0.5MB chunk sizes.
      if (bar) bar.value= 0;
      var max= Math.ceil(f.data.size/CHUNK);
      this.DOM_upload_chunk(1,max,CHUNK,f,bar);
    }
    else {
      // zrušení progress
      f.td2.innerHTML= "zrušeno";
    }
  },
// --------------------------------------------------- LabelDrop.DOM_upload_chunk
// konec vkládání a případný upload s volání funkce onload po ukončení přesunu na server
  DOM_upload_chunk: function(n,max,CHUNK,f,bar) {
    if ( f.cancel ) {
      f.td2.innerHTML= "přerušeno";
      return 0;
    }
    // postupné poslání dat
    var data= f.data.slice((n-1)*CHUNK,n*CHUNK);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', Ezer.version+'/server/file_send.php', true);
    xhr.setRequestHeader("EZER-FILE-NAME", encodeURIComponent(f.name));
    xhr.setRequestHeader("EZER-FILE-CHUNK", n);
    xhr.setRequestHeader("EZER-FILE-CHUNKS", max);
    xhr.setRequestHeader("EZER-FILE-RELPATH", this.relpath);
    xhr.onload = function(e) {
      if (e.target.status == 200) {
        // vraci pole:name|chunk/chunks|path|strlen
//                                                         Ezer.trace('*',e.target.response);
        var resp= e.target.response.split('|');
        if ( n < max ) {
          var value= Math.round(100*(n*CHUNK/f.data.size));
          if (bar) bar.value= value;
          this.DOM_upload_chunk(n+1,max,CHUNK,f,bar);
        }
        else {
          if ( bar ) bar.value= 100;
          // záměna jména souboru za vrácené, obohacení o odkaz a délku
          f.status= resp[5] ? "error" : resp[3];
          f.td2.innerHTML= f.status;
          f.td1.innerHTML= this.DOM_href(resp[0]);
          // kontrola korektnosti
          if ( resp[5] ) {
            Ezer.error(resp[5],'S',this);
          }
          else if ( this.part && (obj= this.part['onload']) ) {
            // zavolání funkce onload ex-li s kopií f
            var ff= {name:resp[0], relpath:this.relpath, size:f.size, status:f.status};
            new Ezer.Eval(obj.code,this,[ff],'onload',null,false,obj,obj.desc.nvar);
          }
        }
      }
    }.bind(this);
    xhr.send(data);
    return 1;
  }
});
// ================================================================================================= Button-DOM
Ezer.Button.implement({
  Implements: [Ezer.Drag,Ezer.Help],
  DOM_add: function() {
    // zobrazení tlačítka
    var owners_block= this.owner.DOM_Block;
    if ( !owners_block )
      owners_block= this.owner.value.DOM_Block;
    this.DOM_Block= this.DOM_Input= new Element('input',{
      'class':this.type=='button.submit'?'ButtonSubmit':'Button',
      styles:this.coord({height:undefined,width:undefined}),
      type:this.type=='button.submit'?'submit':'submit',events:{
        mouseup: function(el) {
//                                                       Ezer.trace('*','button:mouseup');
          if ( !Ezer.design ) {
            Ezer.fce.touch('block',this,'click');     // informace do _touch na server
            this.fire('onclick',[],el);
          }
        }.bind(this)
      },
      value:this.options.title||''                      // u Opery záleží na pořadí
    }).inject(owners_block);
    this.DOM_optStyle(this.DOM_Block);
    if ( this._fc('d') )
      this.DOM_enabled(0);
  },
// ------------------------------------------------------------------------------------ DOM_set
// zobrazí this.value v DOM
  DOM_set: function () {
    this.DOM_Input.value= this.value;
  },
// ------------------------------------------------------------------------------------ DOM_get
// přenese hodnotu z DOM do this.value
  DOM_get: function () {
    this.value= this.DOM_Input.hasClass('empty') ? '' : this.DOM_Input.value;
  }
});
// ================================================================================================= Elem-DOM
//c: Elem-DOM ()
//      abstraktní třída pro části formuláře mající hodnotu v DOM_Input a podporující události
//t: Block-DOM
//s: Block-DOM
Ezer.Elem.implement({
  Implements: [Ezer.Drag,Ezer.Help],
//o: Elem-DOM.DOM_Input - DOM element INPUT
  DOM_Input: null,                      // prvek <input ...>
// ------------------------------------------------------------------------------------ DOM_set
//f: Elem-DOM.DOM_set ()
//      zobrazí this.value v DOM
  DOM_set: function () {
    if ( this.DOM_Input ) {
      // pokud má element zobrazení
      var value= this.value, spec= this._f(':');
      if ( value==0 && spec=='e' ) value= '';
      this.DOM_Input.value= value;
      this.DOM_empty(!value);
    }
  },
// ------------------------------------------------------------------------------------ DOM_get
//f: Elem-DOM.DOM_get ()
//      přenese hodnotu z DOM do this.value
  DOM_get: function () {
    if ( this.DOM_Input ) {
      // pokud má element zobrazení
      this.value= this.DOM_Input.hasClass('empty') ? '' : this.DOM_Input.value;
    }
  },
// ------------------------------------------------------------------------------------ DOM_changed
//f: Elem-DOM.DOM_changed (on[,quiet=0))
//      označení příznaku změny elementu formuláře, pokud je quiet=0
  DOM_changed: function(on,quiet) {
    if ( this.DOM_Input ) {
      // pokud má element zobrazení
      if ( on ) {
        Ezer.fce.touch('block',this,'changed');     // informace do _touch na server
        if ( !quiet )
          this.DOM_Input.addClass('changed');
        this.DOM_Input.removeClass('empty').removeClass('empty_focus');
        this._changed= true;
      }
      else if ( !quiet )
        this.DOM_Input.removeClass('changed');
    }
  },
// ------------------------------------------------------------------------------------ DOM_fixed
//f: Elem-DOM.DOM_fixed (on)
//      označení příznaku fixování hodnoty elementu formuláře
  DOM_fixed: function(on) {
    if ( this.DOM_Input ) {
      // pokud má element zobrazení
      if ( on )
        this.DOM_Input.addClass('fixed');
      else
        this.DOM_Input.removeClass('fixed');
    }
  },
// ------------------------------------------------------------------------------------ DOM_focus
//f: Elem-DOM.DOM_focus ()
//      označení focus elementu formuláře (s uvážením prázdnosti)
  DOM_focus: function () {
    if ( this.DOM_Input ) {
      this.DOM_Input.focus();
      if ( this.DOM_Input.hasClass('empty') ) {
        this.DOM_Input.value= this.value;
        this.DOM_Input.removeClass('empty').addClass('empty_focus');
      }
    }
  },
// ------------------------------------------------------------------------------------ DOM_blur
//f: Elem-DOM.DOM_blur ()
//      odznačení focus elementu formuláře (s uvážením prázdnosti)
  DOM_blur: function () {
    if ( this.DOM_Input ) {
      this.DOM_Input.blur();
      if ( this.DOM_Input.hasClass('empty_focus') ) {
        this.DOM_Input.value= this.help;
        this.DOM_Input.removeClass('empty_focus').addClass('empty');
      }
      if ( this._changed ) {
        this.fire('onchanged');
      }
    }
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  DOM_empty
// označí/odznačí DOM_Input jako prázdný
  DOM_empty: function (on) {
    if ( this.DOM_Input ) {
      if ( on && !this.DOM_Input.hasClass('empty') ) {
        this.DOM_Input.addClass('empty');
        this.DOM_Input.value= this.help;
      }
      if ( !on && this.DOM_Input.hasClass('empty') ) {
        this.DOM_Input.removeClass('empty');
        this.DOM_Input.value= this.value;
      }
    }
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  DOM_ElemEvents
// doplní společné události pro DOM_Input
// při zvednutí klávesy Enter resp. Esc zavolá button.submit resp. button.reset formuláře
  DOM_ElemEvents: function (no_focus_blur) {
    this.DOM_Input.addEvents({
      click: function(el) {
        if ( el && el.control ) {
          Ezer.fce.source(this);
          return false;
        }
        else if ( this.type=='check' ) {
          this.change();
        }
      }.bind(this),
      change: function() {
        this.DOM_changed(1,this._fc('t'));     // když není format:'t' se zvýrazněním změny
      }.bind(this),
      keyup: function(event) {
        if ( event.key=='tab' ) {
          if ( this._changed ) {
            if ( event.target.value!=this.value )
              this.change();
            else
              this.DOM_changed(0);     // když byla změna vrácena
          }
        }
        else if ( event.key=='enter' ) {
          if ( this._changed ) {
            // pokud byl Enter a pole bylo změněno, vznikne událost onchanged
            this.fire('onchanged');
          }
//                                                         Ezer.trace('*','DOM_ElemEvents:enter');
          $each(this.owner.part,function(field,id) {
            if ( field instanceof Ezer.Button && field.type=='button.submit' ) {
//                                                         Ezer.trace('*','DOM_ElemEvents:enter=>submit');
              field.fire('onclick');
            }
          },this);
        }
        else if ( event.key=='esc' ) {
//                                                         Ezer.trace('*','DOM_ElemEvents:esc');
          $each(this.owner.part,function(field,id) {
            if ( field instanceof Ezer.Button && field.type=='button.reset' ) {
//                                                         Ezer.trace('*','DOM_ElemEvents:esc=>reset');
              field.fire('onclick');
            }
          },this);
        }
        else  {
          this.fire('onchange',[]);
        }
      }.bind(this)
    });
    if ( !no_focus_blur ) {
      this.DOM_Input.addEvents({
        focus: function() {
          this.DOM_focus();
          this.fire('onfocus');
        }.bind(this),
        blur: function() {
          this.DOM_blur();
          this.fire('onblur');
        }.bind(this)
      });
    }
    if ( this.title ) this.DOM_Input.set('title',this.title);
    // společné formáty
    if ( this._fc('o') && this.DOM_Block ) {
      this.DOM_Block.addClass('readonly');
      if ( this.DOM_Input )
        this.DOM_Input.set('readonly','readonly');
    }
    if ( this._fc('r') && this.DOM_Input ) this.DOM_Input.setStyle('text-align','right');
  }
});
// ================================================================================================= Field-DOM
// ------------------------------------------------------------------------------------------------- Field-DOM
//c: Field-DOM ()
//      prvek nesoucí textovou nebo číselnou hodnotu
//t: Block-DOM,Elem-DOM
//s: Block-DOM
Ezer.Field.implement({
//   Implements: [Ezer.Drag],
// ------------------------------------------------------------------------------------ DOM_add
//f: Field-DOM.DOM_add ()
//      zobrazí prvek field
  DOM_add: function() {
    var owners_block= this.owner.DOM_Block ? this.owner.DOM_Block : this.owner.value.DOM_Block;
    this.DOM_Block= this.DOM_Input= new Element('input',{'class':'Field',
      styles:this.coord({height:this._h||15}),
      type:this._f('p')==-1?'text':'password'
    }).inject(owners_block);
    this.DOM_ElemEvents();
    this.DOM_optStyle(this.DOM_Block);
  }
});
// ================================================================================================= FieldDate-DOM
//c: FieldDate-DOM ()
//      prvek nesoucí datovou hodnotu
//t: Block-DOM,Elem-DOM
//s: Block-DOM
Ezer.FieldDate.implement({
// ------------------------------------------------------------------------------------ DOM_add
//f: FieldDate-DOM.DOM_add ()
//      zobrazí prvek field
  DOM_add: function() {
    this.DOM_Block= new Element('div',{'class':'FieldDate',styles:this.coord()}).adopt(
        this.DOM_icon= new Element('img',{align:'right',src:Ezer.paths.images_cc+'/calendar.gif'}),
        this.DOM_Input= new Element('input',{type:'text',value:this.options.title||'',styles:{
          width:(this._w||87)-18,height:this._h||16}})
    ).inject(this.owner.DOM_Block);
    this.DOM_ElemEvents();
    this.DOM_optStyle(this.DOM_Block);
    if ( this.skill==2 && !this._fc('d') && !this._fc('o') ) {
      var ox= this._fc('R') ? -106 :  -7;                          // 44
      var oy= this._fc('U') ? -200 : -20;                          // 30
      // viz http://www.monkeyphysics.com/mootools/script/2/datepicker
      new DatePicker(this.DOM_Input, { //debug:true,
        pickerClass: 'datepicker_vista', format:'j.n.Y', inputOutputFormat:'j.n.Y',
        toggleElements:this.DOM_icon, positionOffset:{x:ox,y:oy}, allowEmpty:true,
        days:Locale.getCurrent().sets.Date.days, months:Locale.getCurrent().sets.Date.months,
        animationDuration:200, useFadeInOut:true,
        onSelect:function(){
          this.DOM_Input.removeClass('empty');
          this.DOM_Input.value= this.DOM_Input2.value;
          this.DOM_changed(1,this._fc('t'));     // když není format:'t' se zvýrazněním změny
          this.fire('onchanged',[]);
        }.bind(this),
        onStart:function(){
          this.DOM_Input.value= this.value;
        }.bind(this),
        onClose:function(){
          if ( this.DOM_Input.hasClass('empty') ) {
            this.DOM_Input.value= this.help;
          }
        }.bind(this)
      });
      this.DOM_Input2= this.DOM_Input.getNext();
      this.DOM_Input.setStyles({display:'block'});
      this.DOM_Input2.setStyles({visibility:'hidden',position:'absolute'});
//       this.DOM_Input2.setStyles({marginTop:20,backgroundColor:'#eeeeaa'});
    }
  }
});
// ================================================================================================= FieldList-DOM
//c: FieldList-DOM ()
//      prvek nesoucí datovou hodnotu s volitelným rozbalením obsahu podle oddělovače
//t: Block-DOM,Elem-DOM
//s: Block-DOM
Ezer.FieldList.implement({
  _values: [],                          // rozložené hodnoty
  _focus: 0,                            // 0 když rozbalené prvky nemají focus
// ------------------------------------------------------------------------------------ DOM_add
//f: FieldList-DOM.DOM_add ()
//      zobrazí prvek field
  DOM_add: function() {
    var img= true;
    this._h= this._h||16;         // defaultní výška prvku
    this.DOM_Block= new Element('div',{'class':'Select FieldList',styles:this.coord()
    }).inject(this.owner.DOM_Block);
    this.DOM_Closure= new Element('div',{'class':'SelectClosure'}).inject(this.DOM_Block);
    new Element('img',{align:'right',src:Ezer.version+'/client/img/field_list.gif',events:{
      click: function() {
//                                                         Ezer.trace('*','onfocus B '+this._focus);
        if ( this.DOM_Input.hasClass('empty') ) {
          this.DOM_Input.value= this.value;
          this.DOM_Input.removeClass('empty').addClass('empty_focus');
        }
        this._focus++;
        this.fire('onfocus');
        this.DOM_show();
      }.bind(this)
    }}).inject(this.DOM_Closure);
    this.DOM_Input= new Element('input',{type:'text',value:this.options.title||'',styles:{
        width:this._w-(img ? 20 : 0),height:this._h-4}
    }).inject(this.DOM_Closure);
    this.DOM_ElemEvents(true);
    this.DOM_optStyle(this.DOM_Block);
    // obal pro jednotlivé řádky
    var dl_w= this.options.par && this.options.par.width
      ? this.options.par.width : this._w-1;
    this.DOM_DropList= new Element('div',{'class':'SelectDrop',styles:{
        width:dl_w,display:'none'}}).inject(this.DOM_Block);
    if ( this._fc('u') )           // pokud je format:'u' budou řádky nad field
      this.DOM_DropList.setStyle('bottom',this._h);
    else                           // jinak pod field
      this.DOM_DropList.setStyle('top',this._h+3);
    // definice obsluhy událostí
    this.DOM_Input.addEvents({
      focus: function(event) {
//                                                         Ezer.trace('*','onfocus A '+this._focus);
        if ( !this._focus ) {
          this._focus++;
          this.DOM_focus();
          this.fire('onfocus');
        }
        this.DOM_hide();
      }.bind(this),
      blur: function (event) {
//                                                         Ezer.trace('*','onblur A '+this._focus);
        this._focus--;
        this.DOM_hide();
        this.DOM_blur();
        this.fire('onblur');
      }.bind(this),
      change: function() {
        this.DOM_changed(1,this._fc('t')?1:0); // když není format:'t' se zvýrazněním změny
      }.bind(this),
      keydown: function (event) {
        event.stopPropagation();
        if (event.key=='enter') event.stop();
      }.bind(this),
      keyup: function (event) {
        if ( event.key=='esc' )
          this.DOM_Input.fireEvent('blur');
      }.bind(this)
    });
  },
// ------------------------------------------------------------------------------------ DOM_show
//f: FieldList-DOM.DOM_show
//      zobrazí hodnoty
  DOM_show: function() {
    // odstraň předchozí hodnoty
    this.DOM_DropList.getChildren().destroy();
    // rozbal hodnotu s oddělovačem a vytvoř seznam
    var values= this.DOM_Input.value.split(this._split);
    var theFocus= null;
    this._values= [];
    values.each(function(value) {
      var li= new Element('input',{'class':'FieldList',value:value,events:{
        focus: function(event) {
          this._focus++;
        }.bind(this),
        blur: function (event) {
          this._focus--;
          // počkáme chvilku a pak otestujeme _fokus (mohl být zvýšen klikem na jinou podhodnotu)
          setTimeout(function() {
//                                                         Ezer.trace('*','onblur B '+this._focus);
            if ( this._focus==1 ) {
              this.DOM_hide();
              this.DOM_blur();
              this.fire('onblur');
            }
          }.bind(this), 50);
        }.bind(this),
        change: function() {
          this.DOM_changed(1,this._fc('t')?1:0);
          this.DOM_refresh();
        }.bind(this),
        keyup: function(event) {
          this.DOM_refresh();
        }.bind(this)
      }}).inject(this.DOM_DropList);
      if ( !theFocus )
        theFocus= li;
      this._values.push(li);
    },this);
    // zobraz seznam
    this.DOM_DropList.setStyle('display','block');
    this.DOM_Block.setStyle('zIndex',999);
    if ( theFocus )
      theFocus.focus();
  },
// ------------------------------------------------------------------------------------ DOM_hide
//f: FieldList-DOM.DOM_hide
//      skryje hodnoty
  DOM_hide: function() {
    this.DOM_DropList.setStyle('display','none');
    this.DOM_Block.setStyle('zIndex',1);
    this._focus= 0;
  },
// ------------------------------------------------------------------------------------ DOM_refresh
//f: FieldList-DOM.DOM_refresh
//      obnoví hodnotu ze složek
  DOM_refresh: function() {
    this.DOM_Input.value= '';
    var del= '';
    this._values.each(function(li) {
      this.DOM_Input.value+= del+li.value;
      del= this.options.par ? this.options.par.delim||',' : ',';
    },this);
  }
});
// ================================================================================================= Edit-DOM
//c: Edit-DOM ()
//      prvek nesoucí dlouhou textovou hodnotu
//t: Block-DOM,Elem-DOM
//s: Block-DOM
//-
// ------------------------------------------------------------------------------------ DOM_add
//f: Edit-DOM.DOM_add ()
//      zobrazí prvek field
// ------------------------------------------------------------------------------------ ...
Ezer.Edit.implement({
  DOM_add: function() {
    var owners_block= this.owner.DOM_Block ? this.owner.DOM_Block : this.owner.value.DOM_Block;
    var corr= Ezer.browser=='CH' ? {height:this._h-4,width:this._w-2} : {height:this._h-2};
    this.DOM_Block= this.DOM_Input= new Element('textarea',{'class':'Edit',
      styles:this.coord(corr)
    }).inject(owners_block);
    this.DOM_ElemEvents();
    this.DOM_optStyle(this.DOM_Block);
  }
});
// ================================================================================================= EditHtml-DOM
//c: EditHtml-DOM ()
//      prvek nesoucí dlouhou textovou hodnotu s WYSIVYG editorem
//t: Block-DOM,Elem-DOM
//s: Block-DOM
Ezer.EditHtml.implement({
  ckeditor: null,                               // instance CKeditoru
  _value: '',                                   // pomocná hodnota iniciovaná při focus
// ------------------------------------------------------------------------------------ DOM_add
//f: EditHtml-DOM.DOM_add ()
//      zobrazí prvek field
//      Ezer.options.CKEditor.version prázdné nebo 4
  DOM_add: function() {
    if ( window.CKEDITOR ) {
      // v aplikaci je použit CKeditor
      this.DOM_Block= new Element('div',{'class':'EditHtml',styles:this.coord()}).adopt(
          this.DOM_Input= new Element('textarea')
        ).inject(this.owner.DOM_Block);
      // --------------------------------- ošetření rozdílu mezi verzemi před startem
      if ( Ezer.options.CKEditor.version=='4' ) {
        // základní nastavení editoru verze 4.0.1
        var options= {
          width:this._w, height:this._h-60, resize_enabled:false,
          entities:false, entities_latin:false, language:'cs', contentsLanguage:'cs',
          skin:'version3'
        };
      }
      else {
        // základní nastavení editoru verze do 3.6.2
        var options= {
          width:this._w, height:this._h-60, resize_enabled:false,
          entities:false, entities_latin:false, language:'cs', contentsLanguage:'cs',
          skin:'office2003'
        };
      }
      // ---------------------------------------------- společná část pro verze 3 i 4
      // úprava options z nastavení aplikace podle options.toolbar z Ezerscriptu
      Object.append(options,this.options.par||{});
      Object.append(options,options.toolbar && Ezer.options.CKEditor[options.toolbar]
        ? Ezer.options.CKEditor[options.toolbar]
        : {toolbar:[[ 'Find','Replace',    // nebo jednoduchý default
            '-','Bold','Italic','Subscript','Superscript',
            '-','JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock',
            '-','Link','Unlink',
            '-','OrderedList','UnorderedList',
            '-','Source','ShowBlocks','RemoveFormat' ]]});
      this.ckeditor= CKEDITOR.replace(this.DOM_Input,options);
      // ------------------------------------ ošetření rozdílu mezi verzemi po startu
      if ( Ezer.options.CKEditor.version=='4' ) {
        // dokončení nastavení editoru verze 4.0.1
      }
      else {
      // dokončení nastavení editoru verze 3.6.2
      }
      // ----------------------------------------------- dokončení nastavení po startu
      this.ckeditor.on('focus', function(ev) {
        this._value= this.ckeditor.getData();
        if ( Ezer.browser!='CH' )
          this.DOM_Block.addClass('focus');
        this.fire('onfocus');
      }.bind(this));
      this.ckeditor.on('blur', function(ev) {
//                                                         Ezer.trace('*','ckeditor:blur');
        if ( Ezer.browser!='CH' )
          this.DOM_Block.removeClass('focus');
        if ( this.ckeditor.checkDirty() && this._value!=this.ckeditor.getData() ) {
          this.DOM_changed(true);
          this.fire('onchanged');
        }
        this.fire('onblur');
      }.bind(this));
      CKEDITOR.on('instanceReady', function(ev) {
        var tags= ['div', 'p', 'ol', 'ul', 'li', 'table', 'tr', 'td', 'h1', 'h2', 'h3']; // etc.
        for (var key in tags) {
          ev.editor.dataProcessor.writer.setRules(tags[key],{
            indent: false,
            breakBeforeOpen: false,
            breakAfterOpen: false,
            breakBeforeClose: false,
            breakAfterClose: false
          });
        }
      });
      this._value= '';
      // oprava výšky DOM_Block podle prohlížeče
      this.DOM_Block.setStyle('height','');
    }
    else {
      this.DOM_Block= this.DOM_Input= new Element('textarea',{'class':'Edit',styles:this.coord()
      }).inject(this.owner.DOM_Block);
    }
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  DOM_empty
//f: EditHtml-DOM.DOM_empty ()
//      voláno z this.init
  DOM_empty: function (on) {
    if ( this.ckeditor ) {
      this.DOM_set();
    }
  },
// ------------------------------------------------------------------------------------ DOM_changed
//f: EditHtml-DOM.DOM_changed (on[,quiet=0))
//      označení příznaku změny elementu formuláře, pokud je quiet=0
  DOM_changed: function(on,quiet) {
    var div= Ezer.browser=='CH' && Ezer.options.CKEditor.version!='4'
      ? this.DOM_Block.getElement('table.cke_editor')
      : this.DOM_Block;
    // pokud má element zobrazení
    if ( div && on ) {
      this._changed= true;
      Ezer.fce.touch('block',this,'changed');     // informace do _touch na server
      if ( !quiet )
        div.addClass('changed');
      div.removeClass('empty').removeClass('empty_focus');
    }
    else if ( div && !quiet )
      div.removeClass('changed');
  },
// ------------------------------------------------------------------------------------ DOM_set
//f: EditHtml-DOM.DOM_set ()
//      zobrazí this.value v DOM
  DOM_set: function () {
    if ( this.DOM_Input ) {
      // pokud má element zobrazení
      if ( this.ckeditor ) {
        // v aplikaci je použit CKeditor
        this.ckeditor.setData(this.value);
      }
      else {
        var value= this.value;
        this.DOM_Input.value= value;
        this.DOM_empty(!value);
      }
    }
  },
// ------------------------------------------------------------------------------------ DOM_get
//f: EditHtml-DOM.DOM_get ()
//      přenese hodnotu z DOM do this.value
  DOM_get: function () {
    if ( this.DOM_Input ) {
      // pokud má element zobrazení
      if ( this.ckeditor ) {
        // v aplikaci je použit CKeditor
        this.value= this.ckeditor.getData();
      }
      else {
        this.value= this.DOM_Input.hasClass('empty') ? '' : this.DOM_Input.value;
      }
    }
  }
});
// ================================================================================================= Check-DOM
//c: Check-DOM ()
//      zaškrtávací políčko
//t: Block-DOM,Elem-DOM
//s: Block-DOM
Ezer.Check.implement({
// ------------------------------------------------------------------------------------ DOM_add
//f: Check-DOM.DOM_add ()
//      zobrazí prvek field, label zobrazí podle atributu format: c-centrovaně, r-doprava
  DOM_add: function() {
    var align= this._fc('c') ? 'center' : this._fc('r') ? 'right' : 'left';
    this.DOM_Block= new Element('label',{'class':'Check',styles:this.coord({textAlign:align})})
      .adopt(this.DOM_Input= new Element('input',{type:'checkbox'})
      ).inject(this.owner.DOM_Block);
    if ( this.options.title )
      this.DOM_Block.appendText(this.options.title);
    this.DOM_ElemEvents();
    this.DOM_optStyle(this.DOM_Block);
  },
// ------------------------------------------------------------------------------------ DOM_set
//f: Check-DOM.DOM_set ()
//      zobrazí this.value v DOM
  DOM_set: function () {
    this.DOM_Input.checked= this.value!=0;
  },
// ------------------------------------------------------------------------------------ DOM_get
//f: Check-DOM.DOM_get ()
//      přenese hodnotu z DOM do this.value
  DOM_get: function () {
    this.value= this.DOM_Input.checked ? 1 : 0;
  }
});
// ================================================================================================= Radio ...
// ------------------------------------------------------------------------------------------------- Radio-DOM
//c: Radio-DOM ()
//      seskupení políček volby
//t: Block-DOM,Elem-DOM
//s: Block-DOM
Ezer.Radio.implement({
// ------------------------------------------------------------------------------------ DOM_add
//f: Radio-DOM.DOM_add ()
//      zobrazí prvek field
  DOM_add: function() {
    this.DOM_Block= new Element('div',{'class':'Radio',styles:this.coord()}
      ).inject(this.owner.DOM_Block);
    this.DOM_optStyle(this.DOM_Block);
  },
// ------------------------------------------------------------------------------------ DOM_set
//f: Radio-DOM.DOM_set ()
//      přepne na volbu s hodnotou this.value
  DOM_set: function () {
    var checked= null, found= false;
    for (var ic in this.part) {
      var c= this.part[ic];
      if ( c instanceof Ezer.Case ) {
        if ( c.DOM_Input.checked )      // zapamatujeme si ten zvolený
          checked= c.DOM_Input;
        if ( this.value==c.options.expr || this.value==c.options.value ) {
          c.DOM_Input.checked= true;
          found= true;                  // zapamatujeme úspěch
          break;
        }
      }
    }
    if ( checked && !found )            // pokud jsme hodnotu nenalezli a je definován nějaký stav
      checked.checked= false;           // nastavíme nedefinovaný stav
    return true;
  },
// ------------------------------------------------------------------------------------ DOM_changed
//f: Radio-DOM.DOM_changed (on[,quiet=0))
//      označení příznaku změny elementu formuláře, pokud je quiet=0
  DOM_changed: function(on,quiet) {
    if ( on ) {
      Ezer.fce.touch('block',this,'changed');     // informace do _touch na server
      if ( !quiet )
        this.DOM_Block.addClass('changed');
      this._changed= true;
    }
    else if ( !quiet )
      this.DOM_Block.removeClass('changed');
  }
});
// ------------------------------------------------------------------------------------------------- Case-DOM
//c: Case-DOM ()
//      políčko volby
//t: Block-DOM,Elem-DOM
//s: Block-DOM
Ezer.Case.implement({
// ------------------------------------------------------------------------------------ DOM_add
//f: Case-DOM.DOM_add ()
//      zobrazí prvek field
  DOM_add: function() {
    this.DOM_Block= new Element('label',{'class':'Case',styles:this.coord()})
      .adopt(
        this.DOM_Input= new Element('input',{type:'radio',name:this.owner.self(),
          events:{
            change: function(el) {
              this.owner.DOM_changed(1,this.owner._fc('t')); // když není format:'t' se zvýrazněním změny
              this.owner.value= this.options.expr||this.options.value;
              this.owner.fire('onchange',[],el);
            }.bind(this)
          }}
        )
      ).inject(this.owner.DOM_Block);
    this.DOM_Block.appendText(this.options.title||this.id);
    this.DOM_optStyle(this.DOM_Block);
  }
});
// ================================================================================================= Chat-DOM
//c: Chat-DOM
//      zobrazení elementu chat
//t: Block-DOM,Elem-DOM
//s: Block-DOM
Ezer.Chat.implement({
// ------------------------------------------------------------------------------------ DOM_clear
//f: Chat-DOM.DOM_clear ()
//      zobrazí prvek chat
  DOM_clear: function() {
    this.DOM_Hist.getChildren().destroy();
    this.DOM_Input.value= '';
  },
// ------------------------------------------------------------------------------------ DOM_add
//f: Chat-DOM.DOM_add ()
//      zobrazí prvek chat
  DOM_add: function() {
    var h1= this._h*(this.options.divide||50)/100 - 1;
    var h2= Math.max(this._h - h1 - 2,0);
    this.DOM= this.DOM_Block= new Element('div',{'class':'Chat',styles:this.coord()
    }).inject(this.owner.DOM_Block);
    this.DOM.adopt(
      this.DOM_Hist= new Element('div',{'class':'Chat_hist', tabIndex:-1, styles:{height:h1}}),
      this.DOM_Input= new Element('textarea', {styles:{height:h2}})
    );
    this.append= this._f('r')>=0 ? 1 : 0;
    if ( this.skill==1 ) this.enable(0);
    this.DOM_ElemEvents();
    this.DOM_optStyle(this.DOM_Block);
  },
// ------------------------------------------------------------------------------------ DOM_append
//f: Chat-DOM.DOM_append (head,tail)
//      přidá řádek do chat
  DOM_append: function(index,head,tail) {
    // trik k rozlišení click a dblclk pomocí timeru
    // viz http://groups.google.com/group/mootools-users/browse_thread/thread/f873371716d338c9
    var timer, node, elem;
    this.DOM_Hist.adopt(
      elem= new Element('div',{'class':'Chat_1', tabIndex:-1, html:head, events:{
        click: function(el) {
          $clear(timer);
          timer= (function(){
//             this.DOM_Input.value= el.target.getNext().innerHTML;
//             this.DOM_Input.addClass('empty');
          }).delay(200, this);
        }.bind(this)
      }}),
      new Element('div',{'class':'Chat_2', tabIndex:-1, html:tail})
    );
    if ( this.changeable ) {
      elem.addEvents({
        dblclick: function(event) {
          $clear(timer);
          if ( !this._changed ) {
            if ( (node= event.target.getParent()) )
              if ( (node= node.getElement('.focus')) )
                node.removeClass('focus');
            event.target.getNext().addClass('focus');
            this.DOM_Input.value= event.target.getNext().innerHTML;
            this.DOM_Input.removeClass('empty');
            this._changedRow= {row:index};
            this.fire('onrowclick',[index,head,tail],event);
          }
        }.bind(this)
    })}
  },
// ------------------------------------------------------------------------------------ DOM_focus
//f: Chat-DOM.DOM_focus ()
//      označení focus elementu formuláře (s uvážením prázdnosti)
  DOM_focus: function () {
    if ( this.DOM_Input ) {
      this.DOM_Input.focus();
      if ( this.DOM_Input.hasClass('empty') ) {
        this.DOM_Input.value= '';
        this.DOM_Input.removeClass('empty').addClass('empty_focus');
      }
    }
  },
// ------------------------------------------------------------------------------------ DOM_changed
//f: Chat-DOM.DOM_changed (on[,quiet=0))
//      provede Elem-DOM.DOM_changed (označení příznaku změny elementu formuláře - přitom
//      ignoruje formát 't' tedy quiet);
//      potom zajistí zápis operace c nebo d
  DOM_changed: function(on,quiet) {
    if ( on ) {
      this.DOM_Input.addClass('changed');
      this.DOM_Input.removeClass('empty').removeClass('empty_focus');
      this._changed= true;
    }
    else {
      this.DOM_Input.removeClass('changed');
    }
    if ( this._changedRow.row ) {
      // pokud byla započata oprava řádku, poznač opravu či smazání
      this._changedRow.op= this.DOM_Input.value ? 'c' : 'd';
    }
  }
});
// ====================================================================================== Select-DOM
//c: Select-DOM
//      Select má společné zobrazení a implementuje třídu Drag
//t: Block-DOM,Elem-DOM
//s: Block-DOM
Ezer.Select.implement({
  _value: '',                                   // pomocná hodnota iniciovaná při focus
// ------------------------------------------------------------------------------------ DOM_add
//f: Select-DOM.DOM_add ()
//      zobrazí prvek select
//      pokud atribut par obsahuje noimg:1 pak se nezobrazí obrázek šipky
//      pokud atribut par.subtype='browse' pak se jedná o select vnořený do Show
  DOM_add: function() {
    // obecné zobrazení select
    var owners_block= this.owner.DOM_Block ? this.owner.DOM_Block : this.owner.value.DOM_Block;
    var img= this.options.par && this.options.par.noimg==1 ? false : true;
    this._h= this._h||16;         // defaultní výška prvku
    this.DOM_Block= new Element('div',{'class':'Select',styles:this.coord()
    }).inject(owners_block);
//o: Select-DOM.DOM_Closure - obal pro input a ikonu
    this.DOM_Closure= new Element('div',{'class':'SelectClosure'}).inject(this.DOM_Block);
    if ( img ) {
      // varianta s obrázkem šipky
      var src= this.type=='select.auto' ? 'select_auto.gif' : 'select.gif';
        new Element('img',{align:'right',src:Ezer.version+'/client/img/'+src,events:this.skill==2? {
          click: function() {this.DOM_Input.focus();}.bind(this)
        }:{}}).inject(this.DOM_Closure);
    }
    this.DOM_Input= new Element('input',{type:'text',value:this.options.title||'',styles:{
        width:this._w-(img ? 20 : 0),height:this._h-4}
    }).inject(this.DOM_Closure);
    this.DOM_optStyle(this.DOM_Input);
//o: Select-DOM.DOM_DropList - obal pro jednotlivé Items (options)
    var dl_w= this.options.par && this.options.par.subtype=='keys' && this.options.par.width
      ? this.options.par.width : this._w-1;
    this.DOM_DropList= new Element('ul',{'class':'SelectDrop',styles:{
        width:dl_w,display:'none'}}).inject(this.DOM_Block);
    if ( this._fc('u') ) {         // pokud je format:'u' budout options nad select
      this.DOM_DropList.setStyle('bottom',this._h);
    }
    else {                         // jinak pod select
      this.DOM_DropList.setStyle('top',this._h+3);
    }
    // definice obsluhy událostí
    this._drop_focus= false;
    this.DOM_DropList.addEvents({
      mousewheel: function(event) {
        return false;
      }.bind(this),
      mouseenter: function(event) {
        this._drop_focus= true;
      }.bind(this),
      mouseleave: function(event) {
        this._drop_focus= false;
      }.bind(this)
    });
    this.DOM_Input.addEvents({
      focus: function(event) {
        if ( this.options.par && this.options.par.subtype=='browse' && this.Items[0]=='?' )
          this.owner._start2();         // owner obsahuje Show pokud je do něj vnořeno
        Ezer.fce.touch('block',this,'focus');   // informace do _touch na server
        event.target.select();
        this.DOM_usedkeys= false;
        this.DOM_DropList.setStyle('display','block');
        this.DOM_Block.setStyle('zIndex',999);
        this.DOM_focus();
        this.value= this._value= this.DOM_Input.value;  // pro změny klávesnicí
      }.bind(this),
      blur: function (event) {
        if ( !this._drop_focus ) {
          this.blur();
          this.DOM_noneItem();
          this.DOM_DropList.setStyle('display','none');
          this.DOM_Block.setStyle('zIndex',2);
          this.DOM_blur();
        }
      }.bind(this),
      change: function() {
        if ( this._fc('t') )
          this.DOM_changed(1,1);     // když není format:'t' se zvýrazněním změny
        else
          this.DOM_changed(1,0);
      }.bind(this),
      keydown: function (event) {
        event.stopPropagation();
        if (event.key=='enter') event.stop();
      }.bind(this),
      keyup: function (event) {
        if (['up','down','enter'].contains(event.key) ) {
          var li= this.DOM_DropList.getElement('li.selected');
          this.DOM_usedkeys= true;
          switch (event.key) {
          case 'up':
            if (li && li.getPrevious() && (li.getPrevious().value!=0 /*|| this.options.typ=='map+'*/))
              li= li.removeClass('selected').getPrevious().addClass('selected');
            else if (!li) {
              var lis= this.DOM_DropList.getElements('li[name!=0]');
              if (lis && lis.length > 0)
                li= lis[lis.length-1].addClass('selected');
            }
            this.DOM_showItem(li);
            break;
          case 'down':
            if (li && li.getNext() && li.getNext().value!=0 ) {
              li.removeClass('selected');
              li= li.getNext().addClass('selected');
            }
            else if (!li) {
              li= this.DOM_DropList.getElement('li[value!=0]');
              if (li) li.addClass('selected');
            }
            this.DOM_showItem(li);
            break;
          case 'enter':
            if (li)
              this.DOM_seekItem(li);
            else {
              this.value= '';
              this._key=  0;
              this.DOM_noneItem();
            }
            this.fire('onchanged');
            break;
          }
        }
        else if ( event.key=='esc' )
          this.DOM_Input.fireEvent('blur');
        else {
          if ( event.target.value!=this.value ) {
            if ( this instanceof Ezer.SelectAuto )  // při změně klávesnicí zruš klíč
              this._key= 0;
            this.change();
          }
          else {
            this.DOM_changed(0);     // když byla změna vrácena
          }
          if ( this._value!=this.DOM_Input.value ) {
            this._value= this.DOM_Input.value;
            this.DOM_DropList.getElements('li').some(function(li,indx) {
              var text= li.get('text');
              if ( text.substr(0,this._value.length)==this._value ) {
                var li0= this.DOM_DropList.getElement('li.selected');
                if ( li0 ) li0.removeClass('selected');
                li.addClass('selected');
                return true;
              }
              return false;
            },this)
          }
        }
      }.bind(this)
    });
  },
// ------------------------------------------------------------------------------------ DOM_showItem
//f: Select-DOM.DOM_showItem
//      konec select bez zvolené hodnoty
  DOM_showItem: function (li) {
    if ( li ) {
      if ( this.options.par && this.options.par.subtype=='keys' ) {
        this.DOM_Input.setProperty('value',li.getProperty('ivalue')).removeClass('empty');
      }
      else {
        this.DOM_Input.setProperty('value',this.Items[li.value]).removeClass('empty');
      }
    }
  },
// ------------------------------------------------------------------------------------ DOM_noneItem
//f: Select-DOM.DOM_noneItem
//      konec select bez zvolené hodnoty
  DOM_noneItem: function (sel) {
    this.DOM_Input.setProperty('value',this.value);
    this.DOM_DropList.setStyle('display','none');
    this.DOM_Block.setStyle('zIndex',2);
  },
// ------------------------------------------------------------------------------------ DOM_seekItem
//f: Select-DOM.DOM_seekItem
//      konec select výběrem hodnoty
  DOM_seekItem: function (sel) {
    if ( this.options.par && this.options.par.subtype=='keys' ) {
      var txt= $(sel).get('ivalue')
      this.value= txt;
      this._key=  sel.value==999998 ? 0 : txt;
    }
    else if ( this.options.par && this.options.par.subtype=='info' ) {
      var txt= $(sel).get('text'), val= sel.value;
      this.options.par.info= sel.get('info');
      this.value= val ? txt : '';
      this.DOM_set();
      this._key=  val==999998 ? 0 : sel.value;
    }
    else {
      var txt= $(sel).get('text'), val= sel.value;
      this.value= txt;
      this.DOM_set();
      this._key=  val==999998 ? 0 : sel.value;
    }
    this.DOM_DropList.setStyle('display','none');
    this.DOM_Block.setStyle('zIndex',2);
    this.change();
  },
// ------------------------------------------------------------------------------------ DOM_set
//f: Select-DOM.DOM_set
//      zobrazí hodnotu
  DOM_set: function () {
    var value= this.options.par && this.options.par.subtype=='keys' ? this.key : this.value;
//     var value= this.value;
    var spec= this._f(':');
    if ( value==0 && spec=='e' ) value= '';
    this.DOM_Input.setProperty('value',value).removeClass('empty');
  },
// ------------------------------------------------------------------------------------ DOM_addItems
//f: Select-DOM.DOM_addItems
//      zobrazí hodnoty z this.Items
  DOM_addItems: function() {
    var create= function(item,key) {
//                                                         Ezer.trace('*',key+':'+item);
      var name= this.options.par && this.options.par.subtype=='info' ? item.name : item;
      var li= new Element('li',{'class':'',name:name,events:{
        mouseover: function (event) {
          if (this.DOM_usedkeys) {
            this.DOM_DropList.getElements('li.selected').each(function (el) {
              el.removeClass('selected');  // po použití klávesnice odstraň zvýraznění
            })};
          this.DOM_usedkeys= false;
          event.target.addClass('selected');
        }.bind(this),
        mouseout: function (event) {
          event.target.removeClass('selected');
        }.bind(this),
        click: function (event) {
          this.DOM_seekItem(event.target);
          this.fire('onchanged');
          return false;
        }.bind(this)
      }}).inject(this.DOM_DropList);
      if ( this.options.par && this.options.par.subtype=='keys' )
        li.setProperties({ivalue:key,text:key+' : '+name});
      else if ( this.options.par && this.options.par.subtype=='info' )
        li.setProperties({value:key,text:name,info:item.info});
      else
        li.setProperties({value:key,text:name});
//                                                         Ezer.trace('*',li.getProperty('ivalue')+':'+li.get('text'));
    };
    this.DOM_DropList.getChildren().destroy();
    if ( this.map_options && this.map_options.data_order ) {
      if ( this instanceof Ezer.SelectMap0 ) {
        create.bind(this)(this.Items[0],0);
      }
      for (var i in this.map_options.data_order) {
        var key= this.map_options.data_order[i];
        create.bind(this)(this.Items[key],key);
      }
    }
    else {
      $each(this.Items,create,this);
    }
  },
// ------------------------------------------------------------------------------------ DOM_blur
//f: Select-DOM.DOM_blur ()
//      odznačení focus elementu formuláře (s uvážením prázdnosti) - bez onchanged
//      které u select vzniká už při výběru alternativy
  DOM_blur: function () {
    if ( this.DOM_Input ) {
      this.DOM_Input.blur();
      if ( this.DOM_Input.hasClass('empty_focus') ) {
        this.DOM_Input.value= this.help;
        this.DOM_Input.removeClass('empty_focus').addClass('empty');
      }
    }
  }
});
// ================================================================================== SelectAuto-DOM
//c: SelectAuto-DOM ([options])
//      výběrový element formuláře definovaný mapou (blok 'select' typ 'map' atribut 'options')
//t: Block-DOM,Elem-DOM,Select-DOM
//s: Block-DOM
//-
Ezer.SelectAuto.implement({
  DOM_add2: function() {
    this.DOM_Input.addEvents({
      focus: function (event) {
        this.fire('onfocus',[]);
        this.ask({cmd:'ask',fce:this.options.par.fce,
          args:[this.DOM_Input.value,this.options.par],nargs:2},'DOM_newItems');
      }.bind(this),
      keyup: function (event) {
        if (!['up','down','enter','esc'].contains(event.key) ) {
          this.ask({cmd:'ask',fce:this.options.par.fce,
            args:[this.DOM_Input.value,this.options.par],nargs:2},'DOM_newItems');
        }
      }.bind(this)
    });
  },
// ------------------------------------------------------------------------------------ DOM_seekItem
//f: SelectAuto-DOM.DOM_seekItem
//      konec select výběrem hodnoty
  DOM_seekItem: function (sel) {
    this.value= !sel.value || sel.value>999990 ? '' : $(sel).get('text');
    this._key=  !sel.value || sel.value>999990 ? 0 : sel.value;
    this.DOM_set();
    this.DOM_DropList.setStyle('display','none');
    this.DOM_Block.setStyle('zIndex',2);
    this.change();
  },
// ------------------------------------------------------------------------------------ DOM_addItems
//f: SelectAuto-DOM.DOM_addItems
//      zobrazí hodnoty z this.Items a nastaví _empty=true pokud je jen jedna a to s nulovým klíčem
  DOM_addItems: function() {
    this.parent();
    this._empty= this.Items[0]!==undefined;
  },
// ------------------------------------------------------------------------------------ DOM_changed
//f: SelectAuto-DOM.DOM_changed (on[,quiet=0))
//      označení příznaku změny elementu formuláře, pokud je quiet=0
//      pokud má element klíč (tzn. byl nalezen na serveru) je příznak zelený
  DOM_changed: function(on,quiet) {
    if ( this.DOM_Input ) {
      // pokud má element zobrazení
      if ( on ) {
        Ezer.fce.touch('block',this,'changed');     // informace do _touch na server
        if ( !quiet ) {
          this.DOM_Input.addClass(this._key||this._empty&&!this.DOM_Input ? 'changed_ok' : 'changed');
          this.DOM_Input.removeClass(this._key||this._empty&&!this.DOM_Input ? 'changed' : 'changed_ok');
        }
        this.DOM_Input.removeClass('empty').removeClass('empty_focus');
        this._changed= true;
      }
      else {
//         if ( !quiet ) {
          this.DOM_Input.removeClass('changed');
          this.DOM_Input.removeClass('changed_ok');
//         }
      }
    }
  },
// ------------------------------------------------------------------------------------ DOM_newItems
//f: SelectAuto-DOM.DOM_newItems
//      zobrazí hodnoty podle informace ze serveru
  DOM_newItems: function(y) {
                                                        Ezer.debug(y.value,'ok');
    this.Items= y.value;
    this.DOM_addItems();
  }
});
// ================================================================================================= SelectMap-DOM
//c: SelectMap-DOM ([options])
//      výběrový element formuláře definovaný mapou (blok 'select' typ 'map' atribut 'options')
//t: Block-DOM,Elem-DOM,Select-DOM
//s: Block-DOM
//-
// ================================================================================================= List ...
//c: List-DOM
//      řádkové zobrazení dat
//t: Block-DOM
//s: Block-DOM
// ------------------------------------------------------------------------------------ ...
Ezer.List.implement({
// ------------------------------------------------------------------------------------ DOM_add
//f: List-DOM.DOM_add ()
//      vytvoří kontejner na řádky
  DOM_add: function() {
    this.DOM= this.DOM_Block= new Element('div',{'class':'List',styles:this.coord()
    }).inject(this.owner.DOM_Block);
  },
// ------------------------------------------------------------------------------------ DOM_destroy_rows
//f: List-DOM.DOM_destroy_rows ()
//      zruší všechny řádky
  DOM_destroy_rows: function() {
    this.DOM_Block.getChildren().destroy();
  }
});
// ================================================================================================= ListRow
//c: ListRow-DOM
//      části v řádkovém zobrazení dat
//t: Block-DOM
//s: Block-DOM
Ezer.ListRow.implement({
// ------------------------------------------------------------------------------------ DOM_add
//f: ListRow-DOM.DOM_add ()
//      vytvoří kontejner na nový řádek v List
//      z-index musí tvořit klesající posloupnost kvůli překryvům SelectDrop
  DOM_add: function() {
    var h= this.owner.options.rows||20;
    this.DOM= this.DOM_Block= new Element('div',{'class':'ListRow',styles:{
        left:0,top:h*this.owner.last,width:this.owner._w,height:h,zIndex:-this.owner.last}
    }).inject(this.owner.DOM_Block);
  }
});
// ================================================================================================= Browse
//c: Browse-DOM
//      tabulkové zobrazení dat s mezipamětí
//t: Block-DOM
//s: Block-DOM
Slider.implement({
  reset: function(steps){ //GN
    this.options.steps= steps;
    this.setRange(this.options.range);
    this.autosize();
    this.set(0);
    this.knob.fade(this.steps?'show':'hide');
}
});
Ezer.Browse.implement({
  Implements: [Ezer.Drag,Ezer.Help],
  _clmns: 0,
  _opened: null,                        // buňka otevřená k editaci po Show.DblClk
  _opened_value: null,                  // původní hodnota této buňky
// ------------------------------------------------------------------------------------ DOM_add1+
//f: Browse-DOM.DOM_add1 ()
//      zobrazí tabulku
  DOM_add1: function() {
    // základní struktura zobrazení browse
    this.DOM= this.DOM_Block= new Element('div',{'class':'BrowseSmart',styles:this.coord()
    }).inject(this.owner.DOM_Block);
    this.DOM.adopt(
      this.DOM_table= new Element('table',{cellspacing:1}).adopt(
        // tady budou hlavičky sloupců
        new Element('thead').adopt(
          this.DOM_head= new Element('tr').adopt(new Element('td',{'class':'th',styles:{width:8}}))),
        // patička s přehledem stavu
        new Element('tfoot').adopt(
          new Element('tr').adopt(
            this.DOM_foot= new Element('th',{colSpan:1}).adopt(
              new Element('div',{styles:{display:'block', textAlign:'center'}}).adopt(
                this.DOM_status= new Element('span',{text:'-'})
        ) ) ) ),
        // tady budou sloupce
        this.DOM_tbody= new Element('tbody')
      ),
      this.DOM_input= new Element('input',{'class':'BrowseFocus',type:'text'})
    );
    // doplnění začátku řádků s dotazy
    this.DOM_qry_row= [];
    for (var i= 1; i<=this.options.qry_rows; i++) {
      this.DOM_tbody.adopt(
        this.DOM_qry_row[i]= new Element('tr',{events:{
          dblclick: function(event) {
            event.stop();
            this.init_queries();
          }.bind(this)
        }}).adopt(
          new Element('td',{'class':'tag0'})
        )
      );
    }
    // scroll bar začíná pod hlavičkou
    if ( this.options.qry_rows>0 )
      this.DOM_th_posun= this.DOM_qry_row[1];     // scrollbar již na úrovni dotazu
    // doplnění začátku datových řádků a přidání události pro mouse.click
    this.DOM_row= [];
    this.DOM_tag= [];
    for (var i= 1; i<=this.tmax; i++) {
      this.DOM_tbody.adopt(
        this.DOM_row[i]= new Element('tr').store('i',i).adopt(
          this.DOM_tag[i]= new Element('td',{'class':'tag0',text:' '})
        )
      );
    }
    if ( !this.DOM_th_posun )
      this.DOM_th_posun= this.DOM_row[1];         // scrollbar na úrovni dat
  },
// ------------------------------------------------------------------------------------ DOM_addEvents+
//f: Browse-DOM.DOM_addEvents ()
//      zobrazí tabulku
  DOM_Input_state: 0,           // 1 se nastaví pomocí ALT - další písmeno je interpretováno
                                // jako jednopísmenný vzor pro skok na hodnotu prvního sloupce
  DOM_addEvents: function() {
    // přidání událostí myši
    for (var i= 1; i<=this.tmax; i++) {
      this.DOM_row[i].addEvents({
        click: function(el) {
          Ezer.fce.touch('block',this,'click');         // informace do _touch na server
          var tr= el.target.tagName=='TD' ? el.target.parentNode : el.target;
          var i= tr.retrieve('i');
          if ( i && i <= this.tlen ) {
            this.DOM_focus();
            this.DOM_hi_row(this.t+i-1,0,0,el.control);
//             this.fire('onrowclick',[this.keys[i-1]],el);
          }
        }.bind(this)
      })
    }
    // přidání událostí klávesnice
    this.DOM_input.addEvents({
      blur: function (event) {
        this.DOM_blur();
      }.bind(this),
      // ovládání hledání prvním písmenem po Alt
      keypress: function(event) {
        event.stop();
        if ( this.DOM_Input_state ) {
          if ( event.code!=27 )                                 // 'esc' - konec bez hledání
            this._row_seek(event.key.toUpperCase());            // jednopísmenné hledání
          this.DOM_Input_state= 0;
        }
      }.bind(this),
      // ovládání tabulky klávesnicí
      keydown: function(event) {
        event.stop();
        if ( event.code==9 )                                    // tab
          return true;
        Ezer.fce.touch('block',this,'keydown');     // informace do _touch na server
        switch (event.code) {
        case 18:                                                // 'alt':
          this.DOM_Input_state= 1;
          break;
        case 45:                                                // 'insert':
          var key= this.keys[this.r-this.b];
          var ikey= this.keys_sel.indexOf(key);
          if ( ikey>=0 )
            this.keys_sel.splice(ikey,1);
          else
            this.keys_sel.push(key);
          this.fire('onchoice');
          this._css_row(this.tact);
          this.DOM_hi_row(this.t+this.tact-1);
          break;
        case 33:                                                // 'page up':
          this._row_move(Math.max(0,this.r-this.tmax));
          break;
        case 34:                                                // 'page down':
          this._row_move(Math.min(this.r+this.tmax,this.slen-1));
          break;
        case 36:                                                // 'home':
          if ( event.control )
            this._row_move(0);
          else {
            this._row_move(this.t);
          }
          break;
        case 35:                                                // 'end':
          if ( event.control )
            this._row_move(this.slen-1);
          else {
            this._row_move(this.t+this.tlen-1);
          }
          break;
        case 38:                                                // 'up':
          if ( event.control ) {                                // skok na dotazy
            if ( this.first_query )
              this.first_query.focus();
          }
          else this._row_move(Math.max(0,this.r-1));
          break;
        case 40:                                                // 'down':
          this._row_move(Math.min(this.r+1,this.slen-1));
          break;
        case 13:                                                // 'enter'
          this._row_submit(event.control?1:0);
          break;
        case 27:                                                // 'esc'
          this.DOM_Input_state= 0;
          this.fire('oncancel');
          break;
        }
        return false;
      }.bind(this)
    });
    // dvojklik vyvolá onsubmit
    this.DOM_table.addEvents({
      dblclick: function(el) {
        Ezer.fce.touch('block',this,'dblclick');     // informace do _touch na server
        var tr= el.target.tagName=='TD' ? el.target.parentNode : el.target;
        var i= tr.retrieve('i');
        if ( i && i <= this.tlen ) {
          // dblclick na datovém řádku
          this.tact= i;
          this.DOM_focus();
          this.DOM_hi_row(this.t+i-1,1);
          this.fire('onsubmit',[this.keys[this.t+i-1-this.b],el.control?1:0]);
        }
      }.bind(this)
    });
  },
// ------------------------------------------------------------------------------------ DOM_add2+
//f: Browse-DOM.DOM_add2 ()
//      zobrazí sloupce tabulky, pokud je tabulka dostatečně definována
  DOM_add2: function() {
    // získání rozměrů
    Ezer.assert(this.DOM_th_posun,'browse nemá korektní vlastnosti',this);
    this._rows= (this.options.qry_rows||0)+this.tmax;
    this._posuv_height= this._rows*17-32;
    // vložení přepínače sloupců
    var browse= this, clicked;
    this.DOM_head.adopt(clicked= new Element('td',{'class':'th',styles:{width:16}}));
    if ( this.findProc('onclick') ) {
      clicked.addClass('BrowseSet');
      clicked.addEvents({
        click: function(el) {
          browse.fire('onclick',[browse],el);
        }.bind(this)
      });
    }
    // vložení sloupce s posuvníkem -----------------------------------------------
    this.DOM_th_posun.adopt(
      new Element('td',{'class':'BrowsePosuv',rowspan:this._rows,events:{
        mouseover: function(ev) {
          if ( this.slen ) {
            this.DOM_posuv_up.addClass('act');
            this.DOM_posuv_dn.addClass('act');
          }
        }.bind(this),
        mouseout: function(ev) {
          this.DOM_posuv_up.removeClass('act');
          this.DOM_posuv_dn.removeClass('act');
        }.bind(this)
      }}).adopt(
        this.DOM_posuv_up= new Element('div',{'class':'BrowseUp',events:{
          click: function(el) {
            this._row_move(this.r-this.tmax+1);
          }.bind(this)
        }}),
        new Element('div',{'class':'BrowsePosuv',styles:{height:this._posuv_height}}).adopt(
          this.DOM_posuv= new Element('div',{styles:{height:this._posuv_height-12}}).adopt(
            this.DOM_handle= new Element('div').adopt(
              new Element('div',{'class':'BrowseHandleUp'}),
              new Element('div',{'class':'BrowseHandleMi'}),
              new Element('div',{'class':'BrowseHandleDn'})
        ))),
        this.DOM_posuv_dn= new Element('div',{'class':'BrowseDn',events:{
          click: function(el) {
            this._row_move(this.r+this.tmax-1);
          }.bind(this)
        }})
      )
    );
    this.DOM_slider();
    this.slider.knob.fade('hide');
    $$(this.DOM_tbody, this.DOM_posuv).addEvents({
      mousewheel: function(e) {
        e= new Event(e).stop();
        var ewh= e.wheel>0 ? this.options.wheel : -this.options.wheel;
        this._row_move(this.r-ewh);
        this.focus();
        return false;
      }.bind(this)
    });
//     $(document.body).addEvents({
//       mouseleave: function () {
//         browse.slider.drag.stop()
//       }
//     });
    // úprava patičky
    this.DOM_foot.setProperty('colSpan',this._clmns+2);
    // dynamické styly pro řádek
    this._css_def(this,this,'css_rows');
    for (var o in this.part) {
      var clmn= this.part[o];
      if ( clmn instanceof Ezer.Show && clmn.options.css_cell ) {
        // dynamický styl pro sloupce
        this._css_def(clmn,this,'css_cell');
      }
    }
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  DOM_slider
  DOM_slider: function () {
    var browse= this;
    this.slider= new Slider(this.DOM_posuv,this.DOM_handle, {
      snap: false,
      steps: 0,
      last: 0,
      mode: 'vertical',
      onComplete: function(step){
        step= step==this.steps ? this.steps+1 : step.toInt();
//                                                 Ezer.trace('*','onComplete:'+step+'/'+this.steps+'-'+this.last);
//         browse._row_move(step*browse.tmax);
        browse._row_move(step);
        browse.DOM_posuv.setProperty('title',step);
        this.last= step;
      },
      onChange: function(step){
//                                                 Ezer.trace('*','onChange:'+step+'/'+(step*browse.tmax));
        browse.DOM_posuv.setProperty('title',step);
      }
    }).set(0);
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  DOM_selected+
//f: Browse-DOM.DOM_selected ()
//      označení i-tého řádku browse jako vybraného, pokud on=true nebo jeho odznačení
  DOM_selected: function (i,on) {
    if ( on )
      this.DOM_row[i].addClass('tr-sel');
    else
      this.DOM_row[i].removeClass('tr-sel');
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  DOM_focus+
//f: Browse-DOM.DOM_focus ()
//      označení browse jako aktivní
  DOM_focus: function () {
    if ( !this.DOM_table.hasClass('focus') ) {
      this.DOM_table.addClass('focus');
      this.fire('onfocus',[]);
      if ( Ezer.browser=='IE' ) {
        try {
         this.DOM_input.focus();
         this.DOM_input.select();
        } catch (e) {
          Ezer.fce.echo('error focus');
        }
      }
      else
        this.DOM_input.focus();
    }
    return true;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  DOM_blur
//f: Browse-DOM.DOM_blur ()
//      označení browse jako pasivní
  DOM_blur: function () {
    this.DOM_table.removeClass('focus');
    return true;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  DOM_hi_row+
//f: Browse-DOM.DOM_hi_row (r,noevent,nofocus,control=false)
//      nastavení a označení aktivního řádku r=t..t+tlen
//      vyvolá onrowclick, pokud není noevent=true
//      nastaví focus, pokud není nofocus=true
  DOM_hi_row: function (r,noevent,nofocus,control) {
//                                                  Ezer.trace('*','smarter hi_row:'+r+','+(noevent||0)+','+(nofocus||0));
    Ezer.assert(this.t<=r&&r<=this.t+this.tlen,"Browse.DOM_hi_row("+r+") - mimo rozsah");
    if ( this.tact ) {
      // pokud je změna zhasni starý řádek
      this.DOM_row[this.tact].removeClass('tr-form');
      this.DOM_tag[this.tact].removeClass('tag1').addClass('tag0');
    }
    // rožni nový, je-li
    if ( r!=-1 ) {
      this.tact= r-this.t+1;
      this.r= r;
      this.DOM_row[this.tact].addClass('tr-form');
      this.DOM_tag[this.tact].removeClass('tag0').addClass('tag1');
      if ( !noevent ) {
        this.fire('onrowclick',[this.keys[r-this.b],control?1:0]);
      }
    }
    this.DOM_show_status();
    if ( !nofocus )
      this.DOM_input.focus();
    return true;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  DOM_clear_focus
// odznačení aktivního řádku
  DOM_clear_focus: function (deep) {
    if ( deep ) {
      // projdi tabulku a zruš všude případné označení aktivního řádku
      for (var i= 1; i<=this.tmax; i++) {
        this.DOM_row[i].removeClass('tr-form');
        this.DOM_tag[i].removeClass('tag1').addClass('tag0');
      }
    }
    else {
      // spolehni se na označení aktivního řádku
      if ( this.tact ) {
        this.DOM_row[this.tact].removeClass('tr-form');
        this.DOM_tag[this.tact].removeClass('tag1').addClass('tag0');
      }
    }
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  DOM_show+
//f: Browse-DOM.DOM_show (noscroll)
//      zobrazí buffer od this.t
//      pokud je noscroll=1 nebude upravována poloha posuvníku
  DOM_show: function (noscroll) {
    for (var it= 0; it<this.tlen; it++) {
      this.DOM_row[it+1].removeClass('tr-form');
      this.DOM_tag[it+1].removeClass('tag1').addClass('tag0');
      for (var vi in this.part) {
        if ( this.part[vi] instanceof Ezer.Show ) {
          // zobrazení hodnoty řádku ve sloupci
          this.part[vi].DOM_show(it+this.t);
        }
      }
    }
    for (it= this.tlen; it<this.tmax; it++) {
      this.DOM_row[it+1].removeClass('tr-form');
      this.DOM_tag[it+1].removeClass('tag1').addClass('tag0');
      for (var vi in this.part) {
        if ( this.part[vi] instanceof Ezer.Show && this.part[vi].DOM_cell ) {
          // vymazání hodnoty řádku ve sloupci
          this.part[vi].DOM_cell[it+1].setProperty('text','');
          this.part[vi].DOM_cell[it+1].className= it%2 ? 'tr-even' : 'tr-odd';
        }
      }
    }
    // stavový řádek
    this._set_css_rows();
    this.DOM_show_status(noscroll);
    return true;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  DOM_show_status+
// funkce pro zobrazení aktuální polohy
//      pokud je noscroll=1 nebude upravována poloha posuvníku
  DOM_show_status: function (noscroll) {
    var text= '-', r= 0;
    if ( this.slen ) {
      text= this.t+1;                                                           // první viditelný
      text+= ' < '+(this.r+1)+' > ';                                            // aktivní
      text+= (this.t+this.tlen);                                                // poslední viditelný
      text+= ' / '+this.slen;                                                   // celkem vůbec
      if ( this.bmax!=this.tmax )
        text+= ' ['+this.blen + '] ';                                           // přečtených
      var keys_sel= this.keys_sel.length;
      if ( keys_sel ) text+= ' ('+keys_sel+')';                                 // vybraných
      if ( !noscroll ) {
//                                                 Ezer.trace('*','status step='+this.r);
        this.slider.set(this.r);
      }
    }
//     if ( this.slider.steps!=this.slen ) {
    if ( Math.abs(this.slider.steps-this.slen)>1 ) {    // HEURISTIKA: rozdíl o 1 nastává po insert
      var height= this.slen>this.tmax
        ? Math.max(9,Math.ceil((this._posuv_height)*this.tmax/this.slen)-9) : 0;
//                                                 Ezer.trace('*','handle_height:'+height);
      this.DOM_handle.setStyle('height',height);
      this.slider.reset(this.slen);
      if ( this.slen<=this.tmax )
        this.slider.knob.fade('hide');
    }
    this.DOM_status.setProperty('text',text);
    this.DOM_posuv.setProperty('title',this.r+1);
    // případné dynamické obarvení řádku podle css_rows
//     this._set_css_rows();
  }
});
// ================================================================================================= Show
//c: Show-DOM
//      řádky tabulkového zobrazení dat
//t: Block-DOM
//s: Block-DOM
Ezer.Show.implement({
  DOM_cell: null,                                 // pole prvků td
  DOM_qry: [],                                    // pole prvků input pro části dotazu
  DOM_qry_select: [],                             // Select, pokud je dotaz typu #
// ------------------------------------------------------------------------------------ DOM_add+
// f: Show-DOM.DOM_add ()
//      zobrazení sloupce tabulky, pokud má šířku>0
  DOM_add: function() {
    this.owner._clmns++;
    // přidání záhlaví sloupce
    var w= this._w;
    var title= this.options.title||'';
    this.owner.DOM_head.adopt(
      this.DOM_th= new Element('td',{'class':'th',title:this.help,styles:{width:w}}).adopt(
        new Element('span',{text:title})
      )
    );
    // změny šířky sloupců
    this.DOM_th.grab(
      this.DOM_resize= new Element('img',{'class':'resize',
        src:Ezer.version+'/client/img/browse_resize.png'}),'top');
    var s, w0, ws0;
    this.DOM_th.makeResizable({
      handle: this.DOM_th.getChildren('.resize'),
      modifiers: {x:'width',y:false},
      onStart:function(el){
        this._resizing= true;
        w0= this.DOM_th.getStyle('width').toInt();
        this.DOM_resize.setProperty('title',w0);
        s= this.DOM_th.getNext('td');
        ws0= s.getStyle('width').toInt();
      }.bind(this),
      onDrag: function(el) {
        if ( s ) {
          var w1= this.DOM_th.getStyle('width').toInt();
          this.DOM_resize.setProperty('title',w1);
          if ( w1 < w0+ws0 ) {
            var w2= ws0-(w1-w0);
            s.setStyle('width',w2);
            this.width(w1);
          }
          else {
            this.width(w0+ws0-1);
            s.setStyle('width',1);
          }
        }
      }.bind(this),
      onComplete: function() {
        this._resizing= false;
      }
    });
    if ( !this._w )
      this.DOM_th.addClass('BrowseNoClmn');
    var sort= this._f('s');
    if ( sort>=0 ) {
      var fs= this.options.format.substr(sort+1,1);
      // požadavek na řazení: format: s s+ s-
      // (lze dynamicky ovlivnit funkcí set_sort(x) kde x=a|d|n pro ASC, DESC a vynechat
      // pokud po s následuje modifikátor + nebo - požaduje se počáteční seřazení
      this.sorting= fs=='+' ? 'a' : (fs=='-' ? 'd' : 'n');
      if ( this.sorting!='n' ) {
        if ( this.data ) {
          this.owner.order= this.view ? this.view.id+'.' : '';
          this.owner.order+= this.data.id + (this.sorting=='a' ? ' ASC' : ' DESC');
          this.owner.order_by= this;
        }
        else if ( this.options.expr ) {
          this.owner.order= this.options.expr + (this.sorting=='a' ? ' ASC' : ' DESC');
          this.owner.order_by= this;
        }
      }
      this.DOM_th.grab(
        this.DOM_img= new Element('img',{'class':'sort'}),'top');
      this.DOM_sort();
      this.DOM_th.addClass('ShowSort');
      this.DOM_th.addEvents({
        click: function() {
          if ( !this._resizing ) {
            this.sorting= this.sorting=='n' ? 'a' : (this.sorting=='a' ? 'd' : 'n');
            this._sort();
            this.owner.DOM_focus();
          }
        }.bind(this)
      });
    }
    // přidání dotazových řádků sloupce
    var qry= this._f('q'), fq= 0;
    if ( qry>=0 ) {
      var fq= this.options.format.substr(qry+1,1);
      if ( !fq || '/=#$%@*.'.indexOf(fq)<0 )
        fq= '*';
    }
    this.qry_type= fq;
    for (var i= 1; i<=this.owner.options.qry_rows||0; i++) {
      if ( qry<0 )
        // bez výběrového pole
        this.owner.DOM_qry_row[i].adopt(new Element('td',{'class':'BrowseNoQry'}));
      else {
        if ( fq=='#' ) {
          // výběr z číselníkových hodnot - musí být definován atribut map_pipe
          Ezer.assert(this.options.map_pipe,"formát 'q#' předpokládá atribut 'map_pipe'",this);
          var td= new Element('td',{'class':'BrowseQry'});
          this.owner.DOM_qry_row[i].adopt(td);
          // vytvoření procedury onchange
          var code= [{o:'t'},{o:'m',i:'_owner'},{o:'m',i:'_owner'},{o:'x',i:'browse_load'}];
          var sel_desc= {type:'select.map0',options:{_w:this._w,par:{noimg:1,subtype:'browse'},
              format:'t',map_pipe:this.options.map_pipe,options:this.options.map_pipe,
              help:'výběr z číselníkových hodnot'},
            part:{onchange:{type:'proc',par:{},code:code}}};
          var sel_owner= {DOM_Block:td,_option:{}};
          var sel= new Ezer.SelectMap0(sel_owner,sel_desc,td,'','');
          sel.Items[0]= '?';
          sel.owner= this;
          sel.DOM_Block.setStyles({marginTop:1});
          td.adopt(sel.DOM_Block);
          this.DOM_qry[i]= sel.DOM_Input;
          this.DOM_qry_select[i]= sel;
        }
        else {
          // ostatní výběrová pole
          this.DOM_qry_select[i]= null;
          this.owner.DOM_qry_row[i].adopt(
            new Element('td',{'class':'BrowseQry'}).adopt(
              this.DOM_qry[i]= new Element('input',{
                title:
                  fq=='=' ? 'výběr zadaných hodnot' :
                  fq=='@' ? 'výběr podle vzorů s ?*' :
                  fq=='*' ? 'výběr podle vzorů včetně diakritiky s ?*-$' :
                  fq=='$' ? 'výběr podle vzorů bez diakritiky s ?*-$' :
                  fq=='%' ? 'výběr podle vzorů bez diakritiky s ?*-$ s počáteční *' :
                  fq=='/' ? 'výběr všeho od-do' : 'výběrové pole',
                styles:{textAlign:this._f('r')>=0 ? 'right' : this._f('c')>=0 ? 'center' : 'left'}
              })
          ) );
        }
        if ( !this.owner.first_query )
          this.owner.first_query= this.DOM_qry[i];
        this.DOM_qry[i].addEvents({
          focus: function(event) {
              this.owner.DOM_table.addClass('changed');
            }.bind(this),
          blur:  function(event) {
              this.owner.DOM_table.removeClass('changed');
            }.bind(this),
          // ovládání pásu dotaz; klávesnicí
          keypress: function(event) {
              switch (event.key) {
              case 'esc':   // zrušit hledací vzory
                event.stop();
                this.owner.init_queries();
                break;
              case 'enter': // provést hledání
                event.stop();
                event.stopPropagation();
                this.owner._ask_queries();
                break;
              }
//               return false;
            }.bind(this)
        });
      }
    }
    // přidání datových řádků sloupce
    this.DOM_cell= [];
    for (var i= 1; i<=this.owner.tmax; i++) {
      this.owner.DOM_row[i].adopt(
        this.DOM_cell[i]= new Element('td',{'class':i%2?'tr-odd':'tr-even'
          ,styles:{textAlign:this._f('r')>=0 ? 'right' : this._f('c')>=0 ? 'center' : 'left'}
        })
      );
      // pokud je ve format 'u' pak dvojklik vyvolá onsubmit,
      // pokud má user pro show skill na zápis
      if ( this._fc('u') && this.skill==2 ) {
        this.DOM_cell[i].addEvents({
          dblclick: function(el) {
            var td= el.target, tr= td.getParent(), show= this, browse= this.owner;
            var i= tr.retrieve('i');
            if ( i && i <= browse.tlen ) {
              // uzavření případně předchozí otevřené - jakoby bylo blur
              if ( browse._opened ) {
                var td1= browse._opened.getParent();
                if ( td1 )
                  td1.setProperty('text',browse._opened_value);
                browse._opened_value= null;
                browse._opened.destroy();
                browse._opened= null;
              }
              // dblclick na datovém řádku
              browse.tact= i;
              var val= td.getProperty('text');
              browse._opened_value= val;
              td.setProperty('text','');
              td.adopt( browse._opened= new Element('input',{'class':'td_input',type:'text',
                value:val,styles:{width:w},events:{
                  keypress: function(event) {
                    switch (event.key) {
                    case 'esc':   // vrátit původní hodnotu
                      event.stop();
                      td.setProperty('text',val);
                      browse._opened_value= null;
                      this.destroy();
                      browse._opened= null;
                      break;
                    case 'enter': // zavolat onsubmit
                      event.stop();
                      event.stopPropagation();
                      show.let(this.value);
                      show.fire('onsubmit',[browse.keys[browse.t+i-1-browse.b],event.control?1:0]);
                      break;
                    }
                  },
                  blur: function(event) {
                    td.setProperty('text',val);
                    browse._opened_value= null;
                    this.destroy();
                    browse._opened= null;
                  }
              }}));
              browse._opened.setAttribute('tabIndex',0);
            }
            return false;
          }.bind(this)
        });
      }
    }
  },
// ------------------------------------------------------------------------------------ DOM_set+
//f: Show-DOM.DOM_set (i)
//      zobrazí hodnotu i-tého řádku (1..tlen) s uvážením případné specifikace za ':'
//      pro datové hodnoty lze uvádět: d.m;
//      pokud format obsahuje 't' bude hodnota zobrazena i v title
//      pokud format obsahuje 'h' nebudou zobrazeny HTML a PHP tagy
  DOM_set: function (ti) {
    if ( this.DOM_cell ) {
      var val= this.owner.buf[ti-1][this.id], spec= this._f(':');
      if ( val==0 && spec=='e' )
        val= '';
      if ( val && spec=='d.m' ) {
        var dmy= val.split('.');
        val= dmy[0]+'.'+dmy[1];
      }
      if ( val && Ezer.browser=='IE' ) {           // IE8 nezvládá white-space:nowrap
        val= val.replace(/\n/g,' ').replace(/\r/g,'');
      }
      if ( this._fc('h') ) {
        // potlačení zobrazení HTML a PHP tagů
        val= Ezer.fce.strip_tags(val);
      }
      val= val==null ? '' : val;
      this.DOM_cell[ti].setProperty('text',val);
      if ( this._fc('t') ) {
        // zobrazení hodnoty i jako title pro format:'t'
        this.DOM_cell[ti].setProperty('title',val);
      }
    }
  },
// ------------------------------------------------------------------------------------ DOM_show+
//f: Show-DOM.DOM_show (r)
//      zobrazí hodnotu svého sloupce záznamu r (b..b+blen) v řádku tabulky
//      s uvážením případné specifikace za ':' - pro datové hodnoty lze uvádět: d.m;
//      pokud format obsahuje 't' bude hodnota zobrazena i v title
//      pokud format obsahuje 'h' nebudou zobrazeny HTML a PHP tagy
  DOM_show: function (r) {
    if ( this.DOM_cell ) {
      var browse= this.owner;
      Ezer.assert(browse.b<=r&&r<=browse.b+browse.blen,"Show.DOM_show("+r+") - mimo rozsah");
      // získání transformovanou hodnotu ti-tého řádku v buferu
      var val= browse.buf[r-browse.b][this.id];
      // zjištění případných transformací
      var spec= this._f(':');
      if ( val==0 && spec=='e' )
        val= '';
      if ( val && spec=='d.m' ) {
        var dmy= val.split('.');
        val= dmy[0]+'.'+dmy[1];
      }
//       if ( val && Ezer.browser=='IE' ) {           // IE8 nezvládá white-space:nowrap
//         val= val.replace(/\n/g,' ').replace(/\r/g,'');
//       }
      if ( this._fc('h') ) {
        // potlačení zobrazení HTML a PHP tagů
        val= Ezer.fce.strip_tags(val);
      }
      val= val==null ? '' : val;
      this.DOM_cell[r-browse.t+1].setProperty('text',val);
      if ( this._fc('t') ) {
        // zobrazení hodnoty i jako title pro format:'t'
        this.DOM_cell[r-browse.t+1].setProperty('title',val);
      }
    }
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  DOM_qry_set+
// funkce pro nastavení hodnoty dotazu na i-tém qry-řádku
  DOM_qry_set: function (i,val) {
    if ( this.DOM_qry_select[i] ) {
      this.DOM_qry_select[i]._key= 0;
    }
    this.DOM_qry[i].value= val;
  },
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  DOM_qry_get+
// funkce pro vrácení hodnoty dotazu na i-tém qry-řádku
  DOM_qry_get: function (i) {
    return this.DOM_qry_select[i]
      ? this.DOM_qry_select[i]._key
      : this.DOM_qry[i].value;
  }
});
// ================================================================================================= fce
// části standardních funkcí závislé na DOM architektuře
Ezer.fce.DOM= {};
Ezer.obj.DOM= {};
// -------------------------------------------------------------------------------------- warning
// zobrazí varovnou hlášku místo případné staré
// Ezer.fce.DOM.warning_status= 0;
Ezer.fce.DOM.warning_timer1= null;
Ezer.fce.DOM.warning_timer2= null;
Ezer.fce.DOM.warning= function (str) {
  if ( !Ezer.App.mooWarn )
    alert(str);
  else {
    $clear(Ezer.fce.DOM.warning_timer1);
    $clear(Ezer.fce.DOM.warning_timer2);
    var msg= str;
//     msg+= '<br>'+Ezer.App.mooWarn.element.get('html');
//     Ezer.fce.echo(msg);
    Ezer.App.mooWarn.element.setStyles({'display':'block'});
    Ezer.App.mooWarn.element.set('html',msg);
//     if ( !Ezer.fce.DOM.warning_status) {
      Ezer.App.mooWarn.slideIn();
      Ezer.fce.DOM.warning_status= 2;
      // minimálně ponechej hlášku po dobu 10s maximálně 60s, hlášku zhasíná fce Eval
      Ezer.fce.DOM.warning_timer1= (function(){Ezer.fce.DOM.warning_status= 1;}).delay(10000);
      Ezer.fce.DOM.warning_timer2= (function(){Ezer.fce.DOM.warning_()}).delay(60000);
//     }
  }
};
// konec hlášky
Ezer.fce.DOM.warning_= function () {
  if ( Ezer.fce.DOM.warning_status==1 ) {
    Ezer.App.mooWarn.element.set('html','');
    Ezer.App.mooWarn.slideOut();
    Ezer.fce.DOM.warning_status= 0;
  }
};
// -------------------------------------------------------------------------------------- error
// zobrazí chybovou hlášku, pokud je nonl neprovede odřádkování
Ezer.fce.DOM.error= function (str,nonl) {
  var dom= $('error'), old;
  if ( !dom )
    alert(str);
  else {
    dom.setStyle('display','block');
    old= dom.get('html');
    if ( !old )
      dom.set('html',str);
    else {
      dom.set('html',old+(old&&!nonl?'<br>':'')+str);
      dom.scrollTo(0,dom.getSize().x);
    }
  }
};
// -------------------------------------------------------------------------------------- alert
Ezer.fce.DOM.alert= function (str,continuation) {
  var win= null;
  if ( continuation ) {
    win= new StickyWin.Alert('Upozornění',str,{hideOnClick:false,closeOnEsc:true,
      uiOptions:{closeButton:false,buttons:[{text:'Ok',onClick: function(){ continuation();}}]},
      maskOptions:{style:{opacity:0.2,backgroundColor:'#333',zIndex:2}}
    });
  }
  else {
    win= StickyWin.alert('Upozornění',str,{
      uiOptions:{closeButton:false},
      maskOptions:{style:{opacity:0.2,backgroundColor:'#333',zIndex:2}}
    });
  }
  return win;
};
// -------------------------------------------------------------------------------------- help
// zobrazení helpu v popup okně s možností editace
Ezer.obj.DOM.help= null;                                // popup StickyWin
Ezer.fce.DOM.help= function (html,title,ykey,xkey,seen) {
  // konstrukce elementů pro Help při prvním volání
  if ( !Ezer.obj.DOM.help ) {
    Ezer.obj.DOM.help= {};
    var _w= 500, _h= 300, dotaz= null, options= {draggable:true, closeOnClickOut:true,
      relativeTo:document.id('work'), position:'upperLeft',
      content:StickyWin.ui('HELP: informace, otázky a odpovědi k této kartě','',{
        cornerHandle:true, width:_w+55,
        cssClassName:'PanelPopup',closeButton:true
    })};
    Ezer.obj.DOM.help.sticky= $(Ezer.obj.DOM.help.stickywin= new StickyWin(options));
    Ezer.obj.DOM.help.cap= Ezer.obj.DOM.help.sticky.getElement('.caption');
    Ezer.obj.DOM.help.sticky.getElement('.body').setStyles({width:_w,height:_h}).adopt(
        // formulář dotazu
        Ezer.obj.DOM.help.dotaz= new Element('div',{'class':'Help',styles:{display:'none'}}).adopt(
          new Element('input',{type:'button',value:'Zpět',events:{
            click: function(el) { // zrušení dotazu
              Ezer.obj.DOM.help.dotaz.getElement('textarea').value= '';
              Ezer.obj.DOM.help.dotaz.setStyles({display:'none'});
            }
          }}),
          new Element('input',{type:'button',value:'Uložit',events:{
            click: function(el) { // uložení dotazu na server, skrytí formuláře a obnovení helpu
              Ezer.App.help_ask(Ezer.obj.DOM.help.xkey,
                Ezer.obj.DOM.help.dotaz.getElement('textarea').value,Ezer.fce.DOM.help_);
            }
          }}),
          new Element('span',{text:'Zapište svůj dotaz'}),
          new Element('textarea')),
        // elementy textu helpu
        Ezer.obj.DOM.help.txt= new Element('div',{styles:{
          width:'100%',height:'100%',overflow:'auto'}})
    );
    Ezer.obj.DOM.help.sticky.getElement('div.top_ur').adopt(
      // část pro načtení dotazu
      Ezer.obj.DOM.help.dotaz_butt=
        new Element('input',{type:'button','class':'Button',value:'Chci se zeptat k této kartě',
        title:"dotaz zde bude zobrazen a od autora bude interním mailem vyžádána odpověď",
        styles:{float:'right', position:'absolute',fontSize:'8pt',
          right:'40px',marginTop:'5px',zIndex:5},events:{
          click: function(el) {
            // zobrazení formuláře pro dotaz
            Ezer.obj.DOM.help.dotaz.setStyles({display:'block'});
          }
        }}));
    if ( Ezer.options.CKEditor.version=='4' && Ezer.sys.user.skills.contains('ah',' ') ) {
      Ezer.obj.DOM.help.cap.addEvents({
        contextmenu: function(event) {
          // kontextové menu pro administraci helpu
          Ezer.fce.contextmenu([
            ['editovat obsah',function(el) {
              Ezer.obj.DOM.help.dotaz_butt.setStyles({display:'none'});
              Ezer.obj.DOM.help.txt.innerHTML=
                "<div id='editable' contenteditable='true'>"+Ezer.obj.DOM.help.txt.innerHTML+"</div>";
              CKEDITOR.disableAutoInline= true;
              CKEDITOR.inline('editable',{ startupFocus:true, resize_enabled:false, //skin:'Kama',
                entities:false, entities_latin:false, language:'cs', contentsLanguage:'cs',
                toolbar:Ezer.options.CKEditor['EzerHelp']
                  ? Ezer.options.CKEditor['EzerHelp'].toolbar
                  : [['PasteFromWord','-','Format','Bold','Italic',
                    '-','JustifyLeft','JustifyCenter','JustifyRight',
                    '-','Link','Unlink','HorizontalRule','Image',
                    '-','NumberedList','BulletedList','-','Outdent','Indent',
                    '-','Source','ShowBlocks','RemoveFormat']]
              });
              Ezer.obj.DOM.help.stickywin.attach(true);
            }],
            ["uložit pod '"+Ezer.obj.DOM.help.ykey.title+"'",function(el) {
              var data= CKEDITOR.instances.editable.getData();
              Ezer.obj.DOM.help.txt.innerHTML= data;
              Ezer.App.help_save(Ezer.obj.DOM.help.ykey,data);
              Ezer.obj.DOM.help.stickywin.hide();
            }],
            Ezer.obj.DOM.help.ykey.sys==Ezer.obj.DOM.help.xkey.sys ? null :
            ["uložit pod '"+Ezer.obj.DOM.help.xkey.title+"'",function(el) {
              var data= window.CKEDITOR.instances.editable.getData();
              Ezer.obj.DOM.help.txt.innerHTML= data;
              Ezer.App.help_save(Ezer.obj.DOM.help.xkey,data);
              Ezer.obj.DOM.help.stickywin.hide();
            }],
            ["vynutit zobrazení",function(el) {
              Ezer.App.help_force(Ezer.obj.DOM.help.ykey);
            }],
            ["-neukládat změny",function(el) {
              Ezer.obj.DOM.help.txt.innerHTML= html;
              Ezer.obj.DOM.help.stickywin.hide();
            }],
            ["alert(odkaz na tento help)",function(el) {
              Ezer.fce.alert("  <a href='help://"+Ezer.obj.DOM.help.xkey.sys+"'>"
                +Ezer.obj.DOM.help.xkey.title+"</a> ");
            }]
          ],arguments[0]);
          return false;
        }
      });
    }
  }
  // zobrazení Helpu podle zadaných parametrů
  Ezer.obj.DOM.help.stickywin.attach(false);
  Ezer.obj.DOM.help.xkey= xkey;
  Ezer.obj.DOM.help.ykey= ykey;
  Ezer.obj.DOM.help.cap.setProperty('text',title);
  Ezer.obj.DOM.help.cap.title= (xkey.sys==ykey.sys ? ykey.sys : xkey.sys+"=>"+ykey.sys)+' '+seen;
  Ezer.obj.DOM.help.txt.innerHTML= html; // načtení HTML helpu
  Ezer.obj.DOM.help.dotaz_butt.setStyles({display:'block'});
  // přidá obsluhu vnořeným elementům <a href='help://....'>
  Ezer.obj.DOM.help.txt.getElements('a').each(function(el) {
    if ( el.href && el.href.substr(0,7)=='help://' ) {
      el.addEvents({
        click: function(ev) {
          Ezer.app.help_text({sys:ev.target.href.substr(7)});
          return false;
        }
      })
    }
  });
  Ezer.obj.DOM.help.sticky.show();
}
Ezer.fce.DOM.help_= function (y) {
  Ezer.obj.DOM.help.txt.innerHTML= y.text;
  if ( y.mail!='ok' ) {
    Ezer.fce.alert("dotaz byl zapsán, ale nepodařilo se odeslat mail autorovi aplikace ("+y.mail+").");
  }
  Ezer.obj.DOM.help.dotaz.getElement('textarea').value= '';
  Ezer.obj.DOM.help.dotaz.setStyles({display:'none'});
}
Ezer.fce.DOM.help_hide= function () {
  if ( Ezer.obj.DOM.help ) {
    Ezer.obj.DOM.help.stickywin.hide();
  }
};
// -------------------------------------------------------------------------------------- trace
// b označuje (nepovinný) blok, který je ukázán při kliknutí na trasovací řádek
Ezer.trace= function (typ,msg,b,ms) {
  if ( Ezer.to_trace && (!typ || Ezer.App.options.ae_trace.indexOf(typ)>=0) ) {
    Ezer.trace.n++;
    var t= typ=='U' ? 'x' : typ=='u' ? 'c' : typ=='q' ? 'q' : typ=='E' ? 'q'  : typ=='f' ? 'q'
         : typ=='M' ? 'c' : typ=='m' ? 'q' : typ=='x' ? 'q' : typ=='a' ? 'q' : '-';
    var c= Ezer.trace.h[t]=='a' ? ' trace_hide' : '';
    var kuk= $('kuk'), span;
    if ( kuk ) {
      ms= ms||'';
      kuk.adopt(new Element('div').adopt(
        span= new Element('span',{text:padNum(Ezer.trace.n,3)+' '+ms,'class':'trace_on',ezer:t,events:{
          click:function(event) {
            if ( !event.control ) {
            var t= Ezer.trace.t[this.get('ezer')];
//             this.setStyle('background-position','20px '+Ezer.trace.y[t]);
            if ( Ezer.trace.h[t]=='a' )
              this.getNext().addClass('trace_hide');
            else if ( Ezer.trace.h[t]=='r' )
              this.getNext().removeClass('trace_hide');
            this.set('ezer',t);
            }
            // pokud je aktivováno zobrazení zdrojového textu a chce se
            if ( window.top.dbg && event.control ) {
              Ezer.fce.source(this.retrieve('block'));
            }
          }}
        })/*.setStyle('background-position','20px '+Ezer.trace.y[t])*/,
        new Element('div',{html:msg,'class':'trace'+c})
      ));
      $('kuk').scrollTop = $('kuk').scrollHeight;
    }
    // pokud je aktivováno zobrazení zdrojového textu
    if ( b && window.top.dbg ) {
      span.store('block',b).addClass('trace_click');
    }
  }
};
Ezer.trace.n= 0;
Ezer.trace.y= {'-':'-104px', '+':'-144px', 'o':'-42px', 'c':'-22px', 'x':'0px', 'q':'-116px'};
Ezer.trace.t= {'-':'+', '+':'-', 'o':'c', 'c':'o', 'x':'x', 'q':'x'};
Ezer.trace.h= {'-':'r', '+':'a', 'o':'r', 'c':'a', 'x':'-', 'q':'-'};
// --------------------------------------------------------------------------------------
