/** volně podle JUSH a ADMINER - http://php.vrana.cz */
/* ------------------------------------------------------------------------------------------------ functions.js */
function isCtrl(event){
  return(event.ctrlKey||event.metaKey)&&!event.altKey;
}

function getTarget(event){
  return event.target||event.srcElement;
}

function bodyKeydown(event,button){
  var target=getTarget(event);
  if(target.jushTextarea){
    target=target.jushTextarea;
  }
  if(isCtrl(event)&&(event.keyCode==13||event.keyCode==10)&&isTag(target,'select|textarea|input')){
    target.blur();
    if(button){
      target.form[button].click();
    }
    else{
      target.form.submit();
    }
    target.focus();
    return false;
  }
  return true;
}

function bodyClick(event){
  var target=getTarget(event);
  if((isCtrl(event)||event.shiftKey)&&target.type=='submit'&&isTag(target,'input')){
    target.form.target='_blank';setTimeout(function(){target.form.target='';},0);
  }
}

/* ------------------------------------------------------------------------------------------------ editing.js */
function bodyLoad(version){
  if(window.jush){
  var tag=$('dbg');
  if(/(^|\s)jush-/.test(tag.className)){
    var pre=jush.textarea(tag);
  }
}}
/* ------------------------------------------------------------------------------------------------ jush.js */
var jush={
  create_links:true,
  timeout:1000,
  custom_links:{},
  api:{},
  php:/<\?(?!xml)(?:php)?|<script\s+language\s*=\s*(?:"php"|'php'|php)\s*>/i,num:/(?:0x[0-9a-f]+)|(?:\b[0-9]+\.?[0-9]*|\.[0-9]+)(?:e[+-]?[0-9]+)?/i,
  regexps:undefined,
  subpatterns:{},

  highlight:function(language,text){
    this.last_tag='';
    this.last_class='';
    return'<span class="jush">'+this.highlight_states([language],text.replace(/\r\n?/g,'\n'),!/^(htm|tag|xml|txt)$/.test(language))[0]+'</span>';
  },

  link_manual:function(language,text){
    var code=document.createElement('code');
    code.innerHTML=this.highlight(language,text);
    var as=code.getElementsByTagName('a');
    for(var i=0;i<as.length;i++){
      if(as[i].href){return as[i].href;}
    }
    return'';
  },

  create_link:function(link,s,attrs){
    return'<a'+(this.create_links&&link?' href="'+link+'" class="jush-help"':'')+(typeof
    this.create_links=='string'?this.create_links:'')+(attrs||'')+'>'+s+'</a>';
  },

  keywords_links:function(state,s){ // obaluje klíčová slova
    // if(/^js(_write|_code)+$/.test(state)){state='js';}
    // if(/^(php_quo_var|php_php|php_sql|php_sqlite|php_pgsql|php_mssql|php_oracle|php_echo|php_phpini|php_http|php_mail)$/.test(state)){state='php2';}
    if(state=='sql_code'){state='sql';}
    if(this.links2&&this.links2[state]){
      var url=this.urls[state];var links2=this.links2[state];
      s=s.replace(links2,function(str,match1){
        for(var i=arguments.length-4;i>1;i--){
          if(arguments[i]){
            var link=(/^http:/.test(url[i-1])||!url[i-1]?url[i-1]:url[0].replace(/\$key/g,url[i-1]));
            var title=''; // tady lze vložit komentář ke klíčovému slovu
            return(match1?match1:'')
              +jush.create_link(link,arguments[i],(title?' title="'+jush.htmlspecialchars_quo(title)+'"':''))
              +(arguments[arguments.length-3]?arguments[arguments.length-3]:'');
          }
        }
      });
    }
    return s;
  },
  build_regexp:function(key,tr1){
  var re=[];
  subpatterns=[''];
  for(var k in tr1){
    var in_bra=false;subpatterns.push(k);
    var s=tr1[k].source.replace(/\\.|\((?!\?)|\[|]|([a-z])(?:-([a-z]))?/gi,
      function(str,match1,match2){
        if(str==(in_bra?']':'[')){in_bra=!in_bra;}
        if(str=='('){subpatterns.push(k);}
        if(match1&&tr1[k].ignoreCase){
          if(in_bra){return str.toLowerCase()+str.toUpperCase();}
          return'['+match1.toLowerCase()+match1.toUpperCase()+']'+(match2?'-['+match2.toLowerCase()+match2.toUpperCase()+']':'');
        }
        return str;
      });
      re.push('('+s+')');
    }
    this.subpatterns[key]=subpatterns;
    this.regexps[key]=new RegExp(re.join('|'),'g');
  },

  highlight_states:function(states,text,in_php,escape){
    if(!this.regexps){
      this.regexps={};
      for(var key in this.tr){
        this.build_regexp(key,this.tr[key]);
      }
    }
    else{
      for(var key in this.tr){
        this.regexps[key].lastIndex=0;
      }
    }
    var state=states[states.length-1];
    if(!this.tr[state]){
      return[this.htmlspecialchars(text),states];
    }
    var ret=[];
    for(var i=1;i<states.length;i++){
      ret.push('<span class="jush-'+states[i]+'">');
    }
    var  match;var child_states=[];var s_states;var start=0;
    while(start<text.length&&(match=this.regexps[state].exec(text))){
      if(states[0]!='htm'&&/^<\/(script|style)>$/i.test(match[0])){continue;}
      var key,m=[];
      for(var i=match.length;i--;){
        if(match[i]||!match[0].length){
          key=this.subpatterns[state][i];
          while(this.subpatterns[state][i-1]==key){i--;}
          while(this.subpatterns[state][i]==key){m.push(match[i]);i++;}
          break;
        }
      }
      if(!key){ return['regexp not found',[]];}
      if(in_php&&key=='php'){ continue;}
      var out=(key.charAt(0)=='_');
      var division=match.index+(key=='php_halt2'?match[0].length:0);
      var s=text.substring(start,division);
      var prev_state=states[states.length-2];
      s=this.htmlspecialchars(s);
      s_states=[s,[]]; /* úprava */
      s=s_states[0];
      child_states=s_states[1];
      s=this.keywords_links(state,s);
      ret.push(s);
      s=text.substring(division,match.index+match[0].length);
      s=(m.length<3?(s?'<span class="jush-op">'+this.htmlspecialchars(escape?escape(s):s)+'</span>':''):(m[1]?'<span class="jush-op">'+this.htmlspecialchars(escape?escape(m[1]):m[1])+'</span>':'')+this.htmlspecialchars(escape?escape(m[2]):m[2])+(m[3]?'<span class="jush-op">'+this.htmlspecialchars(escape?escape(m[3]):m[3])+'</span>':''));
      if(!out){
//         if(this.links&&this.links[key]&&m[2]){
//           if(/^tag/.test(key)){
//             this.last_tag=m[2].toUpperCase();
//           }
//           var link=(/^tag/.test(key)&&!/^(ins|del)$/i.test(m[2])?m[2].toUpperCase():m[2].toLowerCase());
//           var k_link='';
//           var att_tag=(this.att_mapping[link+'-'+this.last_tag]?this.att_mapping[link+'-'+this.last_tag]:this.last_tag);
//           for(var k in this.links[key]){
//             if(key=='att'&&this.links[key][k].test(link+'-'+att_tag)&&!/^http:/.test(k)){
//               link+='-'+att_tag;
//               k_link=k;
//               break;
//             }
//             else{
//               var m2=this.links[key][k].exec(m[2]);
//               if(m2){
//                 if(m2[1]){
//                   link=(/^tag/.test(key)&&!/^(ins|del)$/i.test(m2[1])?m2[1].toUpperCase():m2[1].toLowerCase());
//                 }
//                 k_link=k;
//                 if(key!='att'){break;}
//               }
//             }
//           }
//           if(key=='php_met'){
//             this.last_class=(k_link&&!/^(self|parent|static|dir)$/i.test(link)?link:'');
//           }
//           if(k_link){
//             s=(m[1]?'<span class="jush-op">'+this.htmlspecialchars(escape?escape(m[1]):m[1])+'</span>':'');
//             s+=this.create_link((/^http:/.test(k_link)?k_link:this.urls[key].replace(/\$key/,k_link)).replace(/\$val/,(/^http:/.test(k_link)?link.toLowerCase():link)),this.htmlspecialchars(escape?escape(m[2]):m[2]));
//             s+=(m[3]?'<span class="jush-op">'+this.htmlspecialchars(escape?escape(m[3]):m[3])+'</span>':'');
//           }
//         }
        ret.push('<span class="jush-'+key+'">',s);
        states.push(key);
//         if(state=='php_eot'){
//           this.tr.php_eot2._2=new RegExp('(\n)('+match[1]+')(;?\n)');
//           this.build_regexp('php_eot2',(match[2]=="'"?{_2:this.tr.php_eot2._2}:this.tr.php_eot2));
//         }
//         else if(state=='pgsql_eot'){
//           this.tr.pgsql_eot2._2=new RegExp('\\$'+text.substring(start,match.index)+'\\$');
//           this.build_regexp('pgsql_eot2',this.tr.pgsql_eot2);
//         }
      }
      else{
//         if(state=='php_met'&&this.last_class){
//           s=this.create_link(this.urls[state].replace(/\$key/,this.last_class)+'.'+s.toLowerCase(),s);
//         }
        ret.push(s);
        for(var i=Math.min(states.length,+key.substr(1));i--;){
          ret.push('</span>');states.pop();
        }
      }
      start=match.index+match[0].length;
      if(!states.length){break;}
      state=states[states.length-1];
      this.regexps[state].lastIndex=start;
    }
    ret.push(this.keywords_links(state,this.htmlspecialchars(text.substring(start))));
    for(var i=1;i<states.length;i++){
      ret.push('</span>');
    }
    states.shift();
    return[ret.join(''),states];
  },

  htmlspecialchars_quo: function (string) {
    return jush.htmlspecialchars(string).replace(/"/g, '&quot;'); // jush - this.htmlspecialchars_quo is passed as reference
  },

  htmlspecialchars:function(string){
    return string.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  },

  html_entity_decode:function(string){
    return string
      .replace(/&lt;/g,'<')
      .replace(/&gt;/g,'>')
      .replace(/&quot;/g,'"')
      .replace(/&nbsp;/g,'\u00A0')
      .replace(/&#(?:([0-9]+)|x([0-9a-f]+));/gi,
        function(str,p1,p2){return String.fromCharCode(p1?p1:parseInt(p2,16));})
      .replace(/&amp;/g,'&');
  },

  addslashes:function(string){return string.replace(/\\/g,'\\$&');},

  addslashes_apo:function(string){return string.replace(/[\\']/g,'\\$&');},

  addslashes_quo:function(string){return string.replace(/[\\"]/g,'\\$&');},

  stripslashes:function(string){return string.replace(/\\([\\"'])/g,'$1');}
};

jush.tr={
  quo:{php:jush.php,esc:/\\/,_1:/"/},
  apo:{php:jush.php,esc:/\\/,_1:/'/},
  com:{php:jush.php,_1:/\*\//},
  com_nest:{com_nest:/\/\*/,_1:/\*\//},
  php:{_1:/\?>/},
  esc:{_1:/./},
  one:{_1:/(?=\n)/},
  num:{_1:/()/},
  sql_apo:{esc:/\\/,_0:/''/,_1:/'/},
  sql_quo:{esc:/\\/,_0:/""/,_1:/"/},
  sql_var:{_1:/(?=[^_.$a-zA-Z0-9])/},
  // sqlite_apo:{_0:/''/,_1:/'/},
  // sqlite_quo:{_0:/""/,_1:/"/},
  bac:{_1:/`/},bra:{_1:/]/}
};
jush.urls={};jush.links={};jush.links2={};

jush.textarea=(function(){

  function findPosition(el,container,offset){
    var pos={pos:0};findPositionRecurse(el,container,offset,pos);
    return pos.pos;
  }

  function findPositionRecurse(child,container,offset,pos){
    if(child.nodeType==3){
      if(child==container){
        pos.pos+=offset;
        return true;
      }
      pos.pos+=child.textContent.length;
    }
    else if(child==container){
      for(var i=0;i<offset;i++){
        findPositionRecurse(child.childNodes[i],container,offset,pos);
      }
      return true;
    }
    else{
      if(/^(br|div)$/i.test(child.tagName)){pos.pos++;}
      for(var i=0;i<child.childNodes.length;i++){
        if(findPositionRecurse(child.childNodes[i],container,offset,pos)){return true;}
      }
      if(/^p$/i.test(child.tagName)){pos.pos++;}
    }
  }

  function findOffset(el,pos){
    return findOffsetRecurse(el,{pos:pos});
  }

  function findOffsetRecurse(child,pos){
    if(child.nodeType==3){
      if(child.textContent.length>=pos.pos){
        return{container:child,offset:pos.pos};
      }
      pos.pos-=child.textContent.length;
    }
    else{
      for(var i=0;i<child.childNodes.length;i++){
        if(/^br$/i.test(child.childNodes[i].tagName)){
          if(!pos.pos){
            return{container:child,offset:i};
          }
          pos.pos--;
          if(!pos.pos&&i==child.childNodes.length-1){
            return{container:child,offset:i};
          }
        }
        else{
          var result=findOffsetRecurse(child.childNodes[i],pos);
          if(result){return result;}
        }
      }
    }
  }

  function setHTML(pre,html,text,pos){
    pre.innerHTML=html;
    pre.lastHTML=pre.innerHTML;
    pre.jushTextarea.value=text;
    if(pos){
      var start=findOffset(pre,pos);
      if(start){
        var range=document.createRange();
        range.setStart(start.container,start.offset);
        var sel=getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }

  function keydown(event){
    event=event||window.event;
    if((event.ctrlKey||event.metaKey)&&!event.altKey){
      var isUndo=(event.keyCode==90);
      var isRedo=(event.keyCode==89);
      if(isUndo||isRedo){
        if(isRedo){
          if(this.jushUndoPos+1<this.jushUndo.length){
            this.jushUndoPos++;
            var undo=this.jushUndo[this.jushUndoPos];
            setHTML(this,undo.html,undo.text,undo.end);
          }
        }
        else if(this.jushUndoPos>=0){
          this.jushUndoPos--;
          var undo=this.jushUndo[this.jushUndoPos]||{html:'',text:''};
          setHTML(this,undo.html,undo.text,this.jushUndo[this.jushUndoPos+1].start);
        }
        return false;
      }
    }
    else{
      setLastPos(this);
    }
  }

  function setLastPos(pre){
    var sel=getSelection();
    if(sel.rangeCount){
      var range=sel.getRangeAt(0);
      if(pre.lastPos===undefined){
        pre.lastPos=findPosition(pre,range.endContainer,range.endOffset);
      }
    }
  }

  function highlight(pre,forceNewUndo){
    var start=pre.lastPos;pre.lastPos=undefined;
    var innerHTML=pre.innerHTML;
    if(innerHTML!=pre.lastHTML){
      var end;var sel=getSelection();
      if(sel.rangeCount){
        var range=sel.getRangeAt(0);
        end=findPosition(pre,range.startContainer,range.startOffset);
      }
      innerHTML=innerHTML.replace(/<br>((<\/[^>]+>)*<\/?div>)(?!$)/gi,
        function(all,rest){if(end){end--;}return rest;}
      );
      pre.innerHTML=innerHTML.replace(/<(br|div)\b[^>]*>/gi,'\n').replace(/&nbsp;(<\/[pP]\b)/g,'$1').replace(/<\/p\b[^>]*>($|<p\b[^>]*>)/gi,'\n');
      var text=pre.textContent;
      var lang='txt';
      if(text.length<1e4){
        var match=/(^|\s)(?:jush|language)-(\S+)/.exec(pre.jushTextarea.className);
        lang=(match?match[2]:'htm');
      }
      var html=jush.highlight(lang,text).replace(/\n/g,'<br>');
      setHTML(pre,html,text,end);
      pre.jushUndo.length=pre.jushUndoPos+1;
      if(forceNewUndo||!pre.jushUndo.length||pre.jushUndo[pre.jushUndoPos].end!==start){
        pre.jushUndo.push({html:pre.lastHTML,text:pre.jushTextarea.value,start:start,end:(forceNewUndo?undefined:end)});
        pre.jushUndoPos++;
      }
      else{
        pre.jushUndo[pre.jushUndoPos].html=pre.lastHTML;
        pre.jushUndo[pre.jushUndoPos].text=pre.jushTextarea.value;
        pre.jushUndo[pre.jushUndoPos].end=end;
      }
    }
  }

  function keyup(){
    highlight(this);
  }
  function paste(event){
    event=event||window.event;
    if(event.clipboardData){
      setLastPos(this);
      if(document.execCommand('insertHTML',false,jush.htmlspecialchars(event.clipboardData.getData('text')))){
        event.preventDefault();
      }
      highlight(this,true);
    }
  }
  return function textarea(el){
    if(!window.getSelection){return;}
    var pre=document.createElement('pre');
    pre.contentEditable=true;
    pre.className=el.className+' jush';
  //   pre.style.border='1px inset #ccc';
  //   pre.style.width=el.clientWidth+'px';
  //   pre.style.height=el.clientHeight+'px';
  //   pre.style.padding='3px';
  //   pre.style.overflow='auto';
  //   pre.style.resize='both';
    if(el.wrap!='off'){pre.style.whiteSpace='pre-wrap';}
    pre.jushTextarea=el;
    pre.jushUndo=[];
    pre.jushUndoPos=-1;
    pre.onkeydown=keydown;
    pre.onkeyup=keyup;
    pre.onpaste=paste;
    pre.appendChild(document.createTextNode(el.value));
    highlight(pre);
    if(el.spellcheck===false){document.documentElement.spellcheck=false;}
    el.parentNode.insertBefore(pre,el);
    if(document.activeElement===el&&!/firefox/i.test(navigator.userAgent)){pre.focus();}
    el.style.display='none';
    return pre;
  };
})();

jush.tr.sql={
  sql_code:/()/
};
jush.tr.sql_code={
  sql_apo:/'/,
  sql_quo:/"/,
  bac:/`/,
  one:/\/\/|#/,                      // komentáře
  com_code:/\/\*![0-9]*|\*\//,
  com:/\/\*/,
  sql_var:/\B@/,
  num:jush.num,                                 // čísla
};
jush.urls= {sql_sqlset:'',sql:[],sqlset:[],sqlstatus:[]};
jush.links2.sql=/(\b)((echo|panel|form|var))\b(\s*)/g;
