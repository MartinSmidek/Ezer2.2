/** volně podle JUSH a ADMINER - http://php.vrana.cz */
/* ------------------------------------------------------------------------------------------------ functions.js */
function alterClass(el,className,enable){el.className=el.className.replace(RegExp('(^|\\s)'+className+'(\\s|$)'),'$2')+(enable?' '+className:'');}
function toggle(id){var
el=document.getElementById(id);el.className=(el.className=='hidden'?'':'hidden');return true;}
function cookie(assign,days){var date=new
Date();date.setDate(date.getDate()+days);document.cookie=assign+'; expires='+date;}
function verifyVersion(current){cookie('adminer_version=0',1);var
iframe=document.createElement('iframe');iframe.src=location.protocol+'//www.adminer.org/version/?current='+current;iframe.frameBorder=0;iframe.marginHeight=0;iframe.scrolling='no';iframe.style.width='7ex';iframe.style.height='1.25em';if(window.postMessage&&window.addEventListener){iframe.style.display='none';addEventListener('message',function(event){if(event.origin==location.protocol+'//www.adminer.org'){var
match=/version=(.+)/.exec(event.data);if(match){cookie('adminer_version='+match[1],1);}}},false);}document.getElementById('version').appendChild(iframe);}
function selectValue(select){if(!select.selectedIndex){return select.value;}var
selected=select.options[select.selectedIndex];return((selected.attributes.value||{}).specified?selected.value:selected.text);}
function isTag(el,tag){var
re=new RegExp('^('+tag+')$','i');return re.test(el.tagName);}
function parentTag(el,tag){while(el&&!isTag(el,tag)){el=el.parentNode;}return el;}
function trCheck(el){var
tr=parentTag(el,'tr');alterClass(tr,'checked',el.checked);if(el.form&&el.form['all']){el.form['all'].onclick();}}
function selectCount(id,count){setHtml(id,(count===''?'':'('+(count+'').replace(/\B(?=(\d{3})+$)/g,' ')+')'));var
inputs=document.getElementById(id).parentNode.parentNode.getElementsByTagName('input');for(var
i=0;i<inputs.length;i++){var
input=inputs[i];if(input.type=='submit'){input.disabled=(count=='0');}}}
function formCheck(el,name){var
elems=el.form.elements;for(var
i=0;i<elems.length;i++){if(name.test(elems[i].name)){elems[i].checked=el.checked;trCheck(elems[i]);}}}
function tableCheck(){var
tables=document.getElementsByTagName('table');for(var
i=0;i<tables.length;i++){if(/(^|\s)checkable(\s|$)/.test(tables[i].className)){var
trs=tables[i].getElementsByTagName('tr');for(var
j=0;j<trs.length;j++){trCheck(trs[j].firstChild.firstChild);}}}}
function formUncheck(id){var
el=document.getElementById(id);el.checked=false;trCheck(el);}
function formChecked(el,name){var
checked=0;var
elems=el.form.elements;for(var
i=0;i<elems.length;i++){if(name.test(elems[i].name)&&elems[i].checked){checked++;}}return checked;}
function tableClick(event,click){click=(click||!window.getSelection||getSelection().isCollapsed);var
el=getTarget(event);while(!isTag(el,'tr')){if(isTag(el,'table|a|input|textarea')){if(el.type!='checkbox'){return;}checkboxClick(event,el);click=false;}el=el.parentNode;}el=el.firstChild.firstChild;if(click){el.checked=!el.checked;el.onclick&&el.onclick();}trCheck(el);}

var lastChecked;
function checkboxClick(event,el){if(!el.name){return;}if(event.shiftKey&&(!lastChecked||lastChecked.name==el.name)){var
checked=(lastChecked?lastChecked.checked:true);var
inputs=parentTag(el,'table').getElementsByTagName('input');var
checking=!lastChecked;for(var
i=0;i<inputs.length;i++){var
input=inputs[i];if(input.name===el.name){if(checking){input.checked=checked;trCheck(input);}if(input===el||input===lastChecked){if(checking){break;}checking=true;}}}}else{lastChecked=el;}}
function
setHtml(id,html){var
el=document.getElementById(id);if(el){if(html==undefined){el.parentNode.innerHTML='&nbsp;';}else{el.innerHTML=html;}}}
function
nodePosition(el){var
pos=0;while(el=el.previousSibling){pos++;}return pos;}
function
pageClick(href,page,event){if(!isNaN(page)&&page){href+=(page!=1?'&page='+(page-1):'');location.href=href;}}
function
menuOver(el,event){var
a=getTarget(event);if(isTag(a,'a|span')&&a.offsetLeft+a.offsetWidth>a.parentNode.offsetWidth-15){el.style.overflow='visible';}}
function
menuOut(el){el.style.overflow='auto';}
function
selectAddRow(field){field.onchange=function(){selectFieldChange(field.form);};field.onchange();var
row=cloneNode(field.parentNode);var
selects=row.getElementsByTagName('select');for(var
i=0;i<selects.length;i++){selects[i].name=selects[i].name.replace(/[a-z]\[\d+/,'$&1');selects[i].selectedIndex=0;}var
inputs=row.getElementsByTagName('input');for(var
i=0;i<inputs.length;i++){inputs[i].name=inputs[i].name.replace(/[a-z]\[\d+/,'$&1');inputs[i].value='';inputs[i].className='';}field.parentNode.parentNode.appendChild(row);}function
selectSearchKeydown(el,event){if(event.keyCode==13||event.keyCode==10){el.onsearch=function(){};}}function
selectSearchSearch(el){if(!el.value){el.parentNode.firstChild.selectedIndex=0;}}function
columnMouse(el,className){var
spans=el.getElementsByTagName('span');for(var
i=0;i<spans.length;i++){if(/column/.test(spans[i].className)){spans[i].className='column'+(className||'');}}}function
selectSearch(name){var
el=document.getElementById('fieldset-search');el.className='';var
divs=el.getElementsByTagName('div');for(var
i=0;i<divs.length;i++){var
div=divs[i];if(isTag(div.firstChild,'select')&&selectValue(div.firstChild)==name){break;}}if(i==divs.length){div.firstChild.value=name;div.firstChild.onchange();}div.lastChild.focus();}function
isCtrl(event){return(event.ctrlKey||event.metaKey)&&!event.altKey;}

function getTarget(event){return event.target||event.srcElement;}

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

function editingKeydown(event){
  if((event.keyCode==40||event.keyCode==38)&&isCtrl(event)){var
  target=getTarget(event);var
  sibling=(event.keyCode==40?'nextSibling':'previousSibling');var
  el=target.parentNode.parentNode[sibling];if(el&&(isTag(el,'tr')||(el=el[sibling]))&&isTag(el,'tr')&&(el=el.childNodes[nodePosition(target.parentNode)])&&(el=el.childNodes[nodePosition(target)])){el.focus();}return false;}if(event.shiftKey&&!bodyKeydown(event,'insert')){eventStop(event);return false;}return true;
}

function functionChange(select){
var input=select.form[select.name.replace(/^function/,'fields')];if(selectValue(select)){if(input.origType===undefined){input.origType=input.type;input.origMaxLength=input.maxLength;}input.removeAttribute('maxlength');input.type='text';}else
if(input.origType){input.type=input.origType;if(input.origMaxLength>=0){input.maxLength=input.origMaxLength;}}helpClose();
}

function keyupChange(){if(this.value!=this.getAttribute('value')){this.onchange();this.setAttribute('value',this.value);}}function
ajax(url,callback,data){var
request=(window.XMLHttpRequest?new
XMLHttpRequest():(window.ActiveXObject?new
ActiveXObject('Microsoft.XMLHTTP'):false));if(request){request.open((data?'POST':'GET'),url);if(data){request.setRequestHeader('Content-Type','application/x-www-form-urlencoded');}request.setRequestHeader('X-Requested-With','XMLHttpRequest');request.onreadystatechange=function(){if(request.readyState==4){callback(request);}};request.send(data);}return request;}function
ajaxSetHtml(url){return ajax(url,function(request){if(request.status){var
data=eval('('+request.responseText+')');for(var
key
in
data){setHtml(key,data[key]);}}});}function
ajaxForm(form,message,button){var
data=[];var
els=form.elements;for(var
i=0;i<els.length;i++){var
el=els[i];if(el.name&&!el.disabled){if(/^file$/i.test(el.type)&&el.value){return false;}if(!/^(checkbox|radio|submit|file)$/i.test(el.type)||el.checked||el==button){data.push(encodeURIComponent(el.name)+'='+encodeURIComponent(isTag(el,'select')?selectValue(el):el.value));}}}data=data.join('&');setHtml('message','<div class="message">'+message+'</div>');var
url=form.action;if(!/post/i.test(form.method)){url=url.replace(/\?.*/,'')+'?'+data;data='';}return ajax(url,function(request){setHtml('message',request.responseText);if(window.jush){jush.highlight_tag(document.getElementById('message').getElementsByTagName('code'),0);}},data);}function
selectClick(td,event,text,warning){var
target=getTarget(event);if(!isCtrl(event)||isTag(td.firstChild,'input|textarea')||isTag(target,'a')){return;}if(warning){return alert(warning);}var
original=td.innerHTML;text=text||/\n/.test(original);var
input=document.createElement(text?'textarea':'input');input.onkeydown=function(event){if(!event){event=window.event;}if(event.keyCode==27&&!event.shiftKey&&!event.altKey&&!isCtrl(event)){inputBlur.apply(input);td.innerHTML=original;}};var
pos=event.rangeOffset;var
value=td.firstChild.alt||td.textContent||td.innerText;input.style.width=Math.max(td.clientWidth-14,20)+'px';if(text){var
rows=1;value.replace(/\n/g,function(){rows++;});input.rows=rows;}if(value=='\u00A0'||td.getElementsByTagName('i').length){value='';}if(document.selection){var
range=document.selection.createRange();range.moveToPoint(event.clientX,event.clientY);var
range2=range.duplicate();range2.moveToElementText(td);range2.setEndPoint('EndToEnd',range);pos=range2.text.length;}td.innerHTML='';td.appendChild(input);setupSubmitHighlight(td);input.focus();if(text==2){return ajax(location.href+'&'+encodeURIComponent(td.id)+'=',function(request){if(request.status&&request.responseText){input.value=request.responseText;input.name=td.id;}});}input.value=value;input.name=td.id;input.selectionStart=pos;input.selectionEnd=pos;if(document.selection){var
range=document.selection.createRange();range.moveEnd('character',-input.value.length+pos);range.select();}}function
selectLoadMore(a,limit,loading){var
title=a.innerHTML;var
href=a.href;a.innerHTML=loading;if(href){a.removeAttribute('href');return ajax(href,function(request){var
tbody=document.createElement('tbody');tbody.innerHTML=request.responseText;document.getElementById('table').appendChild(tbody);if(tbody.children.length<limit){a.parentNode.removeChild(a);}else{a.href=href.replace(/\d+$/,function(page){return+page+1;});a.innerHTML=title;}});}}function
eventStop(event){if(event.stopPropagation){event.stopPropagation();}else{event.cancelBubble=true;}}function
setupSubmitHighlight(parent){for(var
key
in{input:1,select:1,textarea:1}){var
inputs=parent.getElementsByTagName(key);for(var
i=0;i<inputs.length;i++){setupSubmitHighlightInput(inputs[i])}}}function
setupSubmitHighlightInput(input){if(!/submit|image|file/.test(input.type)){addEvent(input,'focus',inputFocus);addEvent(input,'blur',inputBlur);}}function
inputFocus(){var
submit=findDefaultSubmit(this);if(submit){alterClass(submit,'default',true);}}function
inputBlur(){var
submit=findDefaultSubmit(this);if(submit){alterClass(submit,'default');}}function
findDefaultSubmit(el){if(el.jushTextarea){el=el.jushTextarea;}var
inputs=el.form.getElementsByTagName('input');for(var
i=0;i<inputs.length;i++){var
input=inputs[i];if(input.type=='submit'&&!input.style.zIndex){return input;}}}

function jush_addEvent(el,action,handler){
  if(el.addEventListener){
    el.addEventListener(action,handler,false);
  }
//   else if(el.addEvent){
//     el.addEvent('on'+action,handler);
//   }
  else{
    el.attachEvent('on'+action,handler);
  }
}
function focus(el){setTimeout(function(){el.focus();},0);}function
cloneNode(el){var
el2=el.cloneNode(true);setupSubmitHighlight(el2);return el2;}
/* ------------------------------------------------------------------------------------------------ editing.js */
function bodyLoad(version){
  if(window.jush){
//   var tags=document.getElementsByTagName('textarea');
//   for(var i=0;i<tags.length;i++){
//     if(/(^|\s)jush-/.test(tags[i].className)){
//     var pre=jush.textarea(tags[i]);
//   }}
  var tag=$('dbg');
  if(/(^|\s)jush-/.test(tag.className)){
    var pre=jush.textarea(tag);
  }
}}
function
formField(form,name){for(var
i=0;i<form.length;i++){if(form[i].name==name){return form[i];}}}function
typePassword(el,disable){try{el.type=(disable?'text':'password');}catch(e){}}function
loginDriver(driver){var
trs=parentTag(driver,'table').rows;for(var
i=1;i<trs.length-1;i++){alterClass(trs[i],'hidden',/sqlite/.test(driver.value));}}var
dbCtrl;var
dbPrevious={};function
dbMouseDown(event,el){dbCtrl=isCtrl(event);if(dbPrevious[el.name]==undefined){dbPrevious[el.name]=el.value;}}function
dbChange(el){if(dbCtrl){el.form.target='_blank';}el.form.submit();el.form.target='';if(dbCtrl&&dbPrevious[el.name]!=undefined){el.value=dbPrevious[el.name];dbPrevious[el.name]=undefined;}}function
selectFieldChange(form){var
ok=(function(){var
inputs=form.getElementsByTagName('input');for(var
i=0;i<inputs.length;i++){if(inputs[i].value&&/^fulltext/.test(inputs[i].name)){return true;}}var
ok=form.limit.value;var
selects=form.getElementsByTagName('select');var
group=false;var
columns={};for(var
i=0;i<selects.length;i++){var
select=selects[i];var
col=selectValue(select);var
match=/^(where.+)col\]/.exec(select.name);if(match){var
op=selectValue(form[match[1]+'op]']);var
val=form[match[1]+'val]'].value;if(col
in
indexColumns&&(!/LIKE|REGEXP/.test(op)||(op=='LIKE'&&val.charAt(0)!='%'))){return true;}else
if(col||val){ok=false;}}if((match=/^(columns.+)fun\]/.exec(select.name))){if(/^(avg|count|count distinct|group_concat|max|min|sum)$/.test(col)){group=true;}var
val=selectValue(form[match[1]+'col]']);if(val){columns[col&&col!='count'?'':val]=1;}}if(col&&/^order/.test(select.name)){if(!(col
in
indexColumns)){ok=false;}break;}}if(group){for(var
col
in
columns){if(!(col
in
indexColumns)){ok=false;}}}return ok;})();setHtml('noindex',(ok?'':'!'));}var
added='.',rowCount;function
delimiterEqual(val,a,b){return(val==a+'_'+b||val==a+b||val==a+b.charAt(0).toUpperCase()+b.substr(1));}function
idfEscape(s){return s.replace(/`/,'``');}function
editingNameChange(field){var
name=field.name.substr(0,field.name.length-7);var
type=formField(field.form,name+'[type]');var
opts=type.options;var
candidate;var
val=field.value;for(var
i=opts.length;i--;){var
match=/(.+)`(.+)/.exec(opts[i].value);if(!match){if(candidate&&i==opts.length-2&&val==opts[candidate].value.replace(/.+`/,'')&&name=='fields[1]'){return;}break;}var
table=match[1];var
column=match[2];var
tables=[table,table.replace(/s$/,''),table.replace(/es$/,'')];for(var
j=0;j<tables.length;j++){table=tables[j];if(val==column||val==table||delimiterEqual(val,table,column)||delimiterEqual(val,column,table)){if(candidate){return;}candidate=i;break;}}}if(candidate){type.selectedIndex=candidate;type.onchange();}}function
editingAddRow(button,focus){var
match=/(\d+)(\.\d+)?/.exec(button.name);var
x=match[0]+(match[2]?added.substr(match[2].length):added)+'1';var
row=parentTag(button,'tr');var
row2=cloneNode(row);var
tags=row.getElementsByTagName('select');var
tags2=row2.getElementsByTagName('select');for(var
i=0;i<tags.length;i++){tags2[i].name=tags[i].name.replace(/[0-9.]+/,x);tags2[i].selectedIndex=tags[i].selectedIndex;}tags=row.getElementsByTagName('input');tags2=row2.getElementsByTagName('input');var
input=tags2[0];for(var
i=0;i<tags.length;i++){if(tags[i].name=='auto_increment_col'){tags2[i].value=x;tags2[i].checked=false;}tags2[i].name=tags[i].name.replace(/([0-9.]+)/,x);if(/\[(orig|field|comment|default)/.test(tags[i].name)){tags2[i].value='';}if(/\[(has_default)/.test(tags[i].name)){tags2[i].checked=false;}}tags[0].onchange=function(){editingNameChange(tags[0]);};tags[0].onkeyup=function(){};row.parentNode.insertBefore(row2,row.nextSibling);if(focus){input.onchange=function(){editingNameChange(input);};input.onkeyup=function(){};input.focus();}added+='0';rowCount++;return true;}function
editingRemoveRow(button,name){var
field=formField(button.form,button.name.replace(/[^\[]+(.+)/,name));field.parentNode.removeChild(field);parentTag(button,'tr').style.display='none';return true;}var
lastType='';function
editingTypeChange(type){var
name=type.name.substr(0,type.name.length-6);var
text=selectValue(type);for(var
i=0;i<type.form.elements.length;i++){var
el=type.form.elements[i];if(el.name==name+'[length]'){if(!((/(char|binary)$/.test(lastType)&&/(char|binary)$/.test(text))||(/(enum|set)$/.test(lastType)&&/(enum|set)$/.test(text)))){el.value='';}el.onchange.apply(el);}if(lastType=='timestamp'&&el.name==name+'[has_default]'&&/timestamp/i.test(formField(type.form,name+'[default]').value)){el.checked=false;}if(el.name==name+'[collation]'){alterClass(el,'hidden',!/(char|text|enum|set)$/.test(text));}if(el.name==name+'[unsigned]'){alterClass(el,'hidden',!/((^|[^o])int|float|double|decimal)$/.test(text));}if(el.name==name+'[on_update]'){alterClass(el,'hidden',text!='timestamp');}if(el.name==name+'[on_delete]'){alterClass(el,'hidden',!/`/.test(text));}}helpClose();}function
editingLengthChange(el){alterClass(el,'required',!el.value.length&&/var(char|binary)$/.test(selectValue(el.parentNode.previousSibling.firstChild)));}function
editingLengthFocus(field){var
td=field.parentNode;if(/(enum|set)$/.test(selectValue(td.previousSibling.firstChild))){var
edit=document.getElementById('enum-edit');var
val=field.value;edit.value=(/^'.+'$/.test(val)?val.substr(1,val.length-2).replace(/','/g,"\n").replace(/''/g,"'"):val);td.appendChild(edit);field.style.display='none';edit.style.display='inline';edit.focus();}}function
editingLengthBlur(edit){var
field=edit.parentNode.firstChild;var
val=edit.value;field.value=(/^'[^\n]+'$/.test(val)?val:"'"+val.replace(/\n+$/,'').replace(/'/g,"''").replace(/\n/g,"','")+"'");field.style.display='inline';edit.style.display='none';}function
columnShow(checked,column){var
trs=document.getElementById('edit-fields').getElementsByTagName('tr');for(var
i=0;i<trs.length;i++){alterClass(trs[i].getElementsByTagName('td')[column],'hidden',!checked);}}function
editingHideDefaults(){if(innerWidth<document.documentElement.scrollWidth){document.getElementById('form')['defaults'].checked=false;columnShow(false,5);}}function
partitionByChange(el){var
partitionTable=/RANGE|LIST/.test(selectValue(el));alterClass(el.form['partitions'],'hidden',partitionTable||!el.selectedIndex);alterClass(document.getElementById('partition-table'),'hidden',!partitionTable);helpClose();}function
partitionNameChange(el){var
row=cloneNode(parentTag(el,'tr'));row.firstChild.firstChild.value='';parentTag(el,'table').appendChild(row);el.onchange=function(){};}function
foreignAddRow(field){field.onchange=function(){};var
row=cloneNode(parentTag(field,'tr'));var
selects=row.getElementsByTagName('select');for(var
i=0;i<selects.length;i++){selects[i].name=selects[i].name.replace(/\]/,'1$&');selects[i].selectedIndex=0;}parentTag(field,'table').appendChild(row);}function
indexesAddRow(field){field.onchange=function(){};var
row=cloneNode(parentTag(field,'tr'));var
selects=row.getElementsByTagName('select');for(var
i=0;i<selects.length;i++){selects[i].name=selects[i].name.replace(/indexes\[\d+/,'$&1');selects[i].selectedIndex=0;}var
inputs=row.getElementsByTagName('input');for(var
i=0;i<inputs.length;i++){inputs[i].name=inputs[i].name.replace(/indexes\[\d+/,'$&1');inputs[i].value='';}parentTag(field,'table').appendChild(row);}function
indexesChangeColumn(field,prefix){var
columns=parentTag(field,'td').getElementsByTagName('select');var
names=[];for(var
i=0;i<columns.length;i++){var
value=selectValue(columns[i]);if(value){names.push(value);}}field.form[field.name.replace(/\].*/,'][name]')].value=prefix+names.join('_');}function
indexesAddColumn(field,prefix){field.onchange=function(){indexesChangeColumn(field,prefix);};var
select=field.form[field.name.replace(/\].*/,'][type]')];if(!select.selectedIndex){while(selectValue(select)!="INDEX"&&select.selectedIndex<select.options.length){select.selectedIndex++;}select.onchange();}var
column=cloneNode(field.parentNode);select=column.getElementsByTagName('select')[0];select.name=select.name.replace(/\]\[\d+/,'$&1');select.selectedIndex=0;var
input=column.getElementsByTagName('input')[0];input.name=input.name.replace(/\]\[\d+/,'$&1');input.value='';parentTag(field,'td').appendChild(column);field.onchange();}var
that,x,y;function
schemaMousedown(el,event){if((event.which?event.which:event.button)==1){that=el;x=event.clientX-el.offsetLeft;y=event.clientY-el.offsetTop;}}function
schemaMousemove(ev){if(that!==undefined){ev=ev||event;var
left=(ev.clientX-x)/em;var
top=(ev.clientY-y)/em;var
divs=that.getElementsByTagName('div');var
lineSet={};for(var
i=0;i<divs.length;i++){if(divs[i].className=='references'){var
div2=document.getElementById((/^refs/.test(divs[i].id)?'refd':'refs')+divs[i].id.substr(4));var
ref=(tablePos[divs[i].title]?tablePos[divs[i].title]:[div2.parentNode.offsetTop/em,0]);var
left1=-1;var
id=divs[i].id.replace(/^ref.(.+)-.+/,'$1');if(divs[i].parentNode!=div2.parentNode){left1=Math.min(0,ref[1]-left)-1;divs[i].style.left=left1+'em';divs[i].getElementsByTagName('div')[0].style.width=-left1+'em';var
left2=Math.min(0,left-ref[1])-1;div2.style.left=left2+'em';div2.getElementsByTagName('div')[0].style.width=-left2+'em';}if(!lineSet[id]){var
line=document.getElementById(divs[i].id.replace(/^....(.+)-.+$/,'refl$1'));var
top1=top+divs[i].offsetTop/em;var
top2=top+div2.offsetTop/em;if(divs[i].parentNode!=div2.parentNode){top2+=ref[0]-top;line.getElementsByTagName('div')[0].style.height=Math.abs(top1-top2)+'em';}line.style.left=(left+left1)+'em';line.style.top=Math.min(top1,top2)+'em';lineSet[id]=true;}}}that.style.left=left+'em';that.style.top=top+'em';}}function
schemaMouseup(ev,db){if(that!==undefined){ev=ev||event;tablePos[that.firstChild.firstChild.firstChild.data]=[(ev.clientY-y)/em,(ev.clientX-x)/em];that=undefined;var
s='';for(var
key
in
tablePos){s+='_'+key+':'+Math.round(tablePos[key][0]*10000)/10000+'x'+Math.round(tablePos[key][1]*10000)/10000;}s=encodeURIComponent(s.substr(1));var
link=document.getElementById('schema-link');link.href=link.href.replace(/[^=]+$/,'')+s;cookie('adminer_schema-'+db+'='+s,30);}}var
helpOpen,helpIgnore;function
helpMouseover(el,event,text,side){var
target=getTarget(event);if(!text){helpClose();}else
if(window.jush&&(!helpIgnore||el!=target)){helpOpen=1;var
help=document.getElementById('help');help.innerHTML=text;jush.highlight_tag([help]);alterClass(help,'hidden');var
rect=target.getBoundingClientRect();help.style.top=(rect.top-(side?(help.offsetHeight-target.offsetHeight)/2:help.offsetHeight))+'px';help.style.left=(rect.left-(side?help.offsetWidth:(help.offsetWidth-target.offsetWidth)/2))+'px';}}function
helpMouseout(el,event){helpOpen=0;helpIgnore=(el!=getTarget(event));setTimeout(function(){if(!helpOpen){helpClose();}},200);}
function helpClose(){alterClass(document.getElementById('help'),'hidden',true);}
/* ------------------------------------------------------------------------------------------------ jush.js */
var jush={
  create_links:true,
  timeout:1000,
  custom_links:{},
  api:{},
  php:/<\?(?!xml)(?:php)?|<script\s+language\s*=\s*(?:"php"|'php'|php)\s*>/i,num:/(?:0x[0-9a-f]+)|(?:\b[0-9]+\.?[0-9]*|\.[0-9]+)(?:e[+-]?[0-9]+)?/i,
  regexps:undefined,
  subpatterns:{},
  highlight:function(language,text){this.last_tag='';this.last_class='';
    return'<span class="jush">'+this.highlight_states([language],text.replace(/\r\n?/g,'\n'),!/^(htm|tag|xml|txt)$/.test(language))[0]+'</span>';
  },
  link_manual:function(language,text){
    var code=document.createElement('code');code.innerHTML=this.highlight(language,text);var
    as=code.getElementsByTagName('a');for(var
    i=0;i<as.length;i++){if(as[i].href){return as[i].href;}}return'';},create_link:function(link,s,attrs){return'<a'+(this.create_links&&link?' href="'+link+'" class="jush-help"':'')+(typeof
    this.create_links=='string'?this.create_links:'')+(attrs||'')+'>'+s+'</a>';
  },
  keywords_links:function(state,s){
    // if(/^js(_write|_code)+$/.test(state)){state='js';}
    // if(/^(php_quo_var|php_php|php_sql|php_sqlite|php_pgsql|php_mssql|php_oracle|php_echo|php_phpini|php_http|php_mail)$/.test(state)){state='php2';}
    if(state=='sql_code'){state='sql';}
    if(this.links2&&this.links2[state]){
      var url=this.urls[state];var links2=this.links2[state];
      s=s.replace(links2,function(str,match1){
        for(var i=arguments.length-4;i>1;i--){
          if(arguments[i]){
            var link=(/^http:/.test(url[i-1])||!url[i-1]?url[i-1]:url[0].replace(/\$key/g,url[i-1]));
            var title='';
            return(match1?match1:'')+jush.create_link(link,arguments[i],(title?' title="'+jush.htmlspecialchars_quo(title)+'"':''))+(arguments[arguments.length-3]?arguments[arguments.length-3]:'');
          }
        }
      });
    }
    return s;
  },
  build_regexp:function(key,tr1){
  var re=[];subpatterns=[''];for(var k in tr1){var
  in_bra=false;subpatterns.push(k);var
  s=tr1[k].source.replace(/\\.|\((?!\?)|\[|]|([a-z])(?:-([a-z]))?/gi,function(str,match1,match2){if(str==(in_bra?']':'[')){in_bra=!in_bra;}if(str=='('){subpatterns.push(k);}if(match1&&tr1[k].ignoreCase){if(in_bra){return str.toLowerCase()+str.toUpperCase();}return'['+match1.toLowerCase()+match1.toUpperCase()+']'+(match2?'-['+match2.toLowerCase()+match2.toUpperCase()+']':'');}return str;});re.push('('+s+')');}this.subpatterns[key]=subpatterns;this.regexps[key]=new
  RegExp(re.join('|'),'g');
  },

  highlight_states:function(states,text,in_php,escape){
    if(!this.regexps){this.regexps={};
    for(var key in this.tr){this.build_regexp(key,this.tr[key]);}
    }else{for(var key in this.tr){this.regexps[key].lastIndex=0;}}var
    state=states[states.length-1];if(!this.tr[state]){return[this.htmlspecialchars(text),states];}var
    ret=[];for(var
    i=1;i<states.length;i++){ret.push('<span class="jush-'+states[i]+'">');}var
    match;var
    child_states=[];var
    s_states;var
    start=0;while(start<text.length&&(match=this.regexps[state].exec(text))){if(states[0]!='htm'&&/^<\/(script|style)>$/i.test(match[0])){continue;}var
    key,m=[];for(var
    i=match.length;i--;){if(match[i]||!match[0].length){key=this.subpatterns[state][i];while(this.subpatterns[state][i-1]==key){i--;}while(this.subpatterns[state][i]==key){m.push(match[i]);i++;}break;}}if(!key){return['regexp not found',[]];}if(in_php&&key=='php'){continue;}var
    out=(key.charAt(0)=='_');var
    division=match.index+(key=='php_halt2'?match[0].length:0);var
    s=text.substring(start,division);var prev_state=states[states.length-2];
    s=this.htmlspecialchars(s);
    s_states=[
s,[]
];
    s=s_states[0];child_states=s_states[1];s=this.keywords_links(state,s);ret.push(s);s=text.substring(division,match.index+match[0].length);s=(m.length<3?(s?'<span class="jush-op">'+this.htmlspecialchars(escape?escape(s):s)+'</span>':''):(m[1]?'<span class="jush-op">'+this.htmlspecialchars(escape?escape(m[1]):m[1])+'</span>':'')+this.htmlspecialchars(escape?escape(m[2]):m[2])+(m[3]?'<span class="jush-op">'+this.htmlspecialchars(escape?escape(m[3]):m[3])+'</span>':''));if(!out){if(this.links&&this.links[key]&&m[2]){if(/^tag/.test(key)){this.last_tag=m[2].toUpperCase();}var
    link=(/^tag/.test(key)&&!/^(ins|del)$/i.test(m[2])?m[2].toUpperCase():m[2].toLowerCase());var
    k_link='';var att_tag=(this.att_mapping[link+'-'+this.last_tag]?this.att_mapping[link+'-'+this.last_tag]:this.last_tag);
    for(var k in this.links[key]){if(key=='att'&&this.links[key][k].test(link+'-'+att_tag)&&!/^http:/.test(k)){link+='-'+att_tag;k_link=k;break;}else{var
    m2=this.links[key][k].exec(m[2]);if(m2){if(m2[1]){link=(/^tag/.test(key)&&!/^(ins|del)$/i.test(m2[1])?m2[1].toUpperCase():m2[1].toLowerCase());}k_link=k;if(key!='att'){break;}}}}if(key=='php_met'){this.last_class=(k_link&&!/^(self|parent|static|dir)$/i.test(link)?link:'');}if(k_link){s=(m[1]?'<span class="jush-op">'+this.htmlspecialchars(escape?escape(m[1]):m[1])+'</span>':'');s+=this.create_link((/^http:/.test(k_link)?k_link:this.urls[key].replace(/\$key/,k_link)).replace(/\$val/,(/^http:/.test(k_link)?link.toLowerCase():link)),this.htmlspecialchars(escape?escape(m[2]):m[2]));s+=(m[3]?'<span class="jush-op">'+this.htmlspecialchars(escape?escape(m[3]):m[3])+'</span>':'');}}ret.push('<span class="jush-'+key+'">',s);states.push(key);if(state=='php_eot'){this.tr.php_eot2._2=new
    RegExp('(\n)('+match[1]+')(;?\n)');this.build_regexp('php_eot2',(match[2]=="'"?{_2:this.tr.php_eot2._2}:this.tr.php_eot2));}else
    if(state=='pgsql_eot'){this.tr.pgsql_eot2._2=new
    RegExp('\\$'+text.substring(start,match.index)+'\\$');this.build_regexp('pgsql_eot2',this.tr.pgsql_eot2);}}else{if(state=='php_met'&&this.last_class){s=this.create_link(this.urls[state].replace(/\$key/,this.last_class)+'.'+s.toLowerCase(),s);}ret.push(s);for(var
    i=Math.min(states.length,+key.substr(1));i--;){ret.push('</span>');states.pop();}}start=match.index+match[0].length;if(!states.length){break;}state=states[states.length-1];this.regexps[state].lastIndex=start;}ret.push(this.keywords_links(state,this.htmlspecialchars(text.substring(start))));for(var
    i=1;i<states.length;i++){ret.push('</span>');}states.shift();return[ret.join(''),states];
  },
  htmlspecialchars:function(string){return string.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');},
  html_entity_decode:function(string){return string.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&nbsp;/g,'\u00A0').replace(/&#(?:([0-9]+)|x([0-9a-f]+));/gi,function(str,p1,p2){return String.fromCharCode(p1?p1:parseInt(p2,16));}).replace(/&amp;/g,'&');},
  addslashes:function(string){return string.replace(/\\/g,'\\$&');},
  addslashes_apo:function(string){return string.replace(/[\\']/g,'\\$&');},
  addslashes_quo:function(string){return string.replace(/[\\"]/g,'\\$&');},
  stripslashes:function(string){return string.replace(/\\([\\"'])/g,'$1');}
};

jush.tr={quo:{php:jush.php,esc:/\\/,_1:/"/},
apo:{php:jush.php,esc:/\\/,_1:/'/},
com:{php:jush.php,_1:/\*\//},
com_nest:{com_nest:/\/\*/,_1:/\*\//},
php:{_1:/\?>/},esc:{_1:/./},one:{_1:/(?=\n)/},
num:{_1:/()/},
sql_apo:{esc:/\\/,_0:/''/,_1:/'/},
sql_quo:{esc:/\\/,_0:/""/,_1:/"/},
sql_var:{_1:/(?=[^_.$a-zA-Z0-9])/},
sqlite_apo:{_0:/''/,_1:/'/},
sqlite_quo:{_0:/""/,_1:/"/},
bac:{_1:/`/},bra:{_1:/]/}
};
jush.urls={};jush.links={};jush.links2={};

jush.textarea=(function(){
  function findPosition(el,container,offset){var
  pos={pos:0};findPositionRecurse(el,container,offset,pos);return pos.pos;}function
  findPositionRecurse(child,container,offset,pos){if(child.nodeType==3){if(child==container){pos.pos+=offset;return true;}pos.pos+=child.textContent.length;}else
  if(child==container){for(var
  i=0;i<offset;i++){findPositionRecurse(child.childNodes[i],container,offset,pos);}return true;}else{if(/^(br|div)$/i.test(child.tagName)){pos.pos++;}for(var
  i=0;i<child.childNodes.length;i++){if(findPositionRecurse(child.childNodes[i],container,offset,pos)){return true;}}if(/^p$/i.test(child.tagName)){pos.pos++;}}}function
  findOffset(el,pos){return findOffsetRecurse(el,{pos:pos});}function
  findOffsetRecurse(child,pos){if(child.nodeType==3){if(child.textContent.length>=pos.pos){return{container:child,offset:pos.pos};}pos.pos-=child.textContent.length;}else{for(var
  i=0;i<child.childNodes.length;i++){if(/^br$/i.test(child.childNodes[i].tagName)){if(!pos.pos){return{container:child,offset:i};}pos.pos--;if(!pos.pos&&i==child.childNodes.length-1){return{container:child,offset:i};}}else{var
  result=findOffsetRecurse(child.childNodes[i],pos);if(result){return result;}}}}}function
  setHTML(pre,html,text,pos){pre.innerHTML=html;pre.lastHTML=pre.innerHTML;pre.jushTextarea.value=text;if(pos){var
  start=findOffset(pre,pos);if(start){var
  range=document.createRange();range.setStart(start.container,start.offset);var
  sel=getSelection();sel.removeAllRanges();sel.addRange(range);}}}function
  keydown(event){event=event||window.event;if((event.ctrlKey||event.metaKey)&&!event.altKey){var
  isUndo=(event.keyCode==90);var
  isRedo=(event.keyCode==89);if(isUndo||isRedo){if(isRedo){if(this.jushUndoPos+1<this.jushUndo.length){this.jushUndoPos++;var
  undo=this.jushUndo[this.jushUndoPos];setHTML(this,undo.html,undo.text,undo.end);}}else
  if(this.jushUndoPos>=0){this.jushUndoPos--;var
  undo=this.jushUndo[this.jushUndoPos]||{html:'',text:''};setHTML(this,undo.html,undo.text,this.jushUndo[this.jushUndoPos+1].start);}return false;}}else{setLastPos(this);}}function
  setLastPos(pre){var
  sel=getSelection();if(sel.rangeCount){var
  range=sel.getRangeAt(0);if(pre.lastPos===undefined){pre.lastPos=findPosition(pre,range.endContainer,range.endOffset);}}}function
  highlight(pre,forceNewUndo){var
  start=pre.lastPos;pre.lastPos=undefined;var
  innerHTML=pre.innerHTML;if(innerHTML!=pre.lastHTML){var
  end;var
  sel=getSelection();if(sel.rangeCount){var
  range=sel.getRangeAt(0);end=findPosition(pre,range.startContainer,range.startOffset);}innerHTML=innerHTML.replace(/<br>((<\/[^>]+>)*<\/?div>)(?!$)/gi,function(all,rest){if(end){end--;}return rest;});pre.innerHTML=innerHTML.replace(/<(br|div)\b[^>]*>/gi,'\n').replace(/&nbsp;(<\/[pP]\b)/g,'$1').replace(/<\/p\b[^>]*>($|<p\b[^>]*>)/gi,'\n');var
  text=pre.textContent;var
  lang='txt';if(text.length<1e4){var
  match=/(^|\s)(?:jush|language)-(\S+)/.exec(pre.jushTextarea.className);lang=(match?match[2]:'htm');}var
  html=jush.highlight(lang,text).replace(/\n/g,'<br>');setHTML(pre,html,text,end);pre.jushUndo.length=pre.jushUndoPos+1;if(forceNewUndo||!pre.jushUndo.length||pre.jushUndo[pre.jushUndoPos].end!==start){pre.jushUndo.push({html:pre.lastHTML,text:pre.jushTextarea.value,start:start,end:(forceNewUndo?undefined:end)});pre.jushUndoPos++;}else{pre.jushUndo[pre.jushUndoPos].html=pre.lastHTML;pre.jushUndo[pre.jushUndoPos].text=pre.jushTextarea.value;pre.jushUndo[pre.jushUndoPos].end=end;}}}function
  keyup(){highlight(this);}function
  paste(event){event=event||window.event;if(event.clipboardData){setLastPos(this);if(document.execCommand('insertHTML',false,jush.htmlspecialchars(event.clipboardData.getData('text')))){event.preventDefault();}highlight(this,true);}}return function
  textarea(el){if(!window.getSelection){return;}
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
  pre.jushUndo=[];pre.jushUndoPos=-1;pre.onkeydown=keydown;pre.onkeyup=keyup;pre.onpaste=paste;pre.appendChild(document.createTextNode(el.value));highlight(pre);if(el.spellcheck===false){document.documentElement.spellcheck=false;}el.parentNode.insertBefore(pre,el);if(document.activeElement===el&&!/firefox/i.test(navigator.userAgent)){pre.focus();}el.style.display='none';return pre;};
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
