<?php # (c) 2007-2009 Martin Smidek <martin@smidek.eu>
/** =====================================================================================> CALLGRAPH */
# ----------------------------------------------------------------------------------------- doc_ezer
# seznam Ezer modulů, vytvoří globální struktury pro debugger, pokud je $info_only nevrací text
# $ezer_dbg_names= [ name: {typ:'php', php:file}, ... ];
function doc_ezer($info_only=false) { trace();
  global $ezer_root, $ezer_php, $ezer_dbg_names;
//                                                 display("$ezer_root, $ezer_php"); return;
  $ezer_dbg_names= array();
  $html= "<div class='CSection CMenu'>";
  $html.= "<h3 class='CTitle'>Komentovaný seznam Ezer modulů aplikace '$ezer_root'</h3>";
  $html.= "
    <i>Seznam <b style='color:blue'>Ezer-modulů</b> aplikace se seznamem PHP-funkcí, volaných
    prostřednictvím <b>ask</b>, <b>make</b> a použitých v atributu <b>sql_pipe</b>, uspořádaným
    podle <b style='color:blueviolet'>PHP modulů</b>. <b style='color:green'>Standardní</b>
    funkce obsažené v seznamu \$ezer_php_libr v $ezer_root.inc[.php]
    a knihovní funkce PHP jsou uvedeny zvlášť.
    Nedefinované funkce jsou označeny <span style='color:red'>červeně</span>.
    </i>";
  $ezers= doc_ezer_list();
  $fce= get_defined_functions();                // seznam dostupných funkcí 'user','internal'
  $cg= doc_php_cg(implode(',',$ezer_php));
  $kap= '';
  $html.= "<dl>";
  foreach($ezers as $ezer=>$desc) {
    $ids= explode('.',$ezer);
    if ( count($ids)==2 && $kap!=$ezer ) {
      $kap= $ezer;
      $html.= "</dl><h3>$kap</h3><dl>";
    }
    $state= $desc->state;
    $info= $desc->info;
    $php= $info->php;
    $html.= "<dt><b  style='color:blue'>$ezer.ezer</b></dt>";
    if ( $php ) {
      $html.= "<dd>";
      foreach($cg->calls as $mod=>$fces) {
        // rejstřík jmen pro debugger
        foreach ($fces as $name=>$def) if ($name!='?') {
          $ezer_dbg_names[$name]= (object)array('typ'=>'php','php'=>$mod);
        }
        // funkce definované v některém modulu
        $lst= array();
        foreach($php as $i=>$f) {
          if ( isset($fces[strtolower($f)]) ) {
            $lst[]= $f;
            unset($php[$i]);
          }
        }
        if ( count($lst) ) {
          $html.= "<dd><b style='color:blueviolet'>$mod</b>: ".implode(', ',$lst)."</dd>";
        }
      }
      // standardní funkce
      $lst= array();
      foreach($php as $i=>$f) {
        if ( in_array($f,$fce['user']) || in_array($f,$fce['internal']) ) {
          $lst[]= $f;
          unset($php[$i]);
        }
      }
      if ( count($lst) ) {
        $html.= "<dd><b style='color:green'>standardní</b>: ".implode(', ',$lst)."</dd>";
      }
      // nedefinované funkce
      if ( count($php) ) {
        $html.= "<dd style='color:red'>".implode(', ',$php)."</dd>";
      }
    }
  }
  $html.= "</dl>";
  $html.= "</div>";
//                                                 $ezer_dbg_names= array(1,2,3);
                                                debug($ezer_dbg_names);
  return $info_only ? $ezer_dbg_names : $html;
}
# ------------------------------------------------------------------------------------------ doc_php
# seznam PHP modulů s označením nepoužitých
function doc_php() {
  global $ezer_root, $ezer_php;
  $html= "<div class='CSection CMenu'>";
  $html.= "<h3 class='CTitle'>Komentovaný seznam PHP modulů aplikace '$ezer_root'</h3>";
  $html.= "
    <i>Seznam ezer-modulů aplikace se seznamem php-funkcí.
    Číslo před jménem funkce označuje hloubku volání vzhledem k Ezerskriptu.
    Jména funkcí jsou označena jako zcela <b style='color:red'>nepoužitá</b>
    resp. jako <b style='color:black'>nepoužitá</b> z Ezerscriptu
    resp. jako volaná <b style='color:limegreen'>přímo </b> resp. <b style='color:blue'>nepřímo </b>
    z Ezerscriptu.
    Jméno funkce je následováno seznamem volaných funkcí
    (standardní funkce obsažené v seznamu \$ezer_php_libr v $ezer_root.inc[.php] jsou vynechány).
    </i>";
  $ezers= doc_ezer_list();
  $cg= doc_php_cg(implode(',',$ezer_php));
  // $used obsahuje volané funkce: $fce => $n kde $n je vzdálenost od ezer-skriptu
  // 1 znamená přímo volané z ezer-skriptu
  $used= array();
  $top= array(); // přímo volané z ezerscriptu
  $flow= array(); // volané z ezerscriptu (transitivní obal)
  foreach($cg->called as $php=>$desc) {
    $used[$php]= 0;
  }
  foreach($ezers as $ezer=>$desc) {
    $info= $desc->info;
    if ( ($phps= $info->php) ) {
      foreach ($phps as $php ) {
        $used[$php]= $top[$php]= $flow[$php]= 1;
      }
    }
  }
  // tranzitivní obal
  $zmena= true;
  while ($zmena) {
    $zmena= false;
    foreach($cg->calls as $fname=>$fces) {
      foreach($fces as $fce=>$calls) {
        if ( count($calls) ) {
          foreach($calls as $call) {
            if ( !$flow[$call] && $flow[$fce] ) {
              $flow[$call]= $flow[$fce]+1;
              $zmena= true;
            }
            if ( !$used[$call] ) {
              $used[$call]= $used[$fce]+1;
              $zmena= true;
            }
          }
        }
      }
    }
  }
  // zpráva
  $html.= "<dl>";
  foreach($cg->calls as $php=>$desc) {
    $html.= "<dt><h3>$php</h3></dt>";
    foreach($desc as $fce=>$calls) {
      if ( $fce=='?' ? count($calls) : true ) {
        $u= $used[$fce]; $f= $flow[$fce]; $t= $top[$fce];
        $clr= $u==0 ? "style='color:red'" : (
              $t==1 ? "style='color:limegreen'" : (
              $f    ? "style='color:blue'" : ''));
        $html.= "<dd style='text-indent:-10px'>$u <b $clr>$fce</b>: ".implode(', ',$calls)."</dd>";
      }
    }
  }
  $html.= "</dl>";
  $html.= "</div>";
  return $html;
}
# --------------------------------------------------------------------------------------- doc_called
# called graph PHP modulů
function doc_called() {
  global $ezer_root, $ezer_php;
  $html= "<div class='CSection CMenu'>";
  $html.= "<h3 class='CTitle'>Seznam PHP funkcí aplikace '$ezer_root'</h3>";
  $html.= "<i>Abecední seznam PHP funkcí se seznamem funkcí, ze kterých jsou volány.<br>
    Volání z modulů Ezer jsou uvedena <b style='color:blue'>tučně</b>.</i>";
  $ezers= doc_ezer_list();
  $cg= doc_php_cg(implode(',',$ezer_php));
//                                                 debug($cg,'CG');
  $html.= "<dl>";
  foreach($cg->called as $fce=>$calls) {
    $html.= "<dt><b>$fce</b></dt>";
    $ezer_calls= array();
    foreach($ezers as $ezer=>$desc) {
      if ( $desc->info->php && in_array($fce,$desc->info->php) ) {
        $ezer_calls[]= "<b style='color:blue'>$ezer.ezer</b>";
      }
    }
    $html.= "<dd>";
    $html.= implode(', ',$ezer_calls);
    if ( count($ezer_calls) && count($calls) )
      $html.= ", ";
    $html.= implode(', ',$calls);
    $html.= "</dd>";
  }
  $html.= "</dl>";
  $html.= "</div>";
  return $html;
}
# ------------------------------------------------------------------------------------ doc_ezer_list
# seznam Ezer modulů s informací o aktuálnost
function doc_ezer_list() {
  global $ezer_path_appl, $ezer_path_code, $ezer_ezer, $ezer_path_root;
  // projití složky aplikace
  $files= array();
  if ($dh= opendir($ezer_path_appl)) {
    while (($file= readdir($dh)) !== false) {
      if ( substr($file,-5)=='.ezer' ) {
        $name= substr($file,0,strlen($file)-5);
        $etime= @filemtime("$ezer_path_appl/$name.ezer");
        $ctime= @filemtime($cname= "$ezer_path_code/$name.json");
        $files[$name]= (object)array();
        if ( !$ctime)
          $files[$name]->state= 'err';
        else
          $files[$name]->state= !$ctime || $ctime<$etime || $ctime<$xtime ? "old" : "ok";
        // získání informace z překladu
        if ( $files[$name]->state=='ok' ) {
          $code= json_decode(file_get_contents($cname));
          $files[$name]->info= $code->info;
        }
      }
    }
    closedir($dh);
  }
  // přidání případných modulů z jiné složky
  foreach($ezer_ezer as $fname) {
    doc_ezer_state($fname,$files);
  }
  ksort($files);
//                                                         debug($files,'ezer files');
  return $files;
}
# ----------------------------------------------------------------------------------- doc_ezer_state
# zjištění stavu souboru
function doc_ezer_state ($fname,&$files) { trace();
  global $ezer_path_root;
  list($appl,$name)= explode('/',$fname);
  $etime= @filemtime("$ezer_path_root/$appl/$name.ezer");
  $ctime= @filemtime($cname= "$ezer_path_root/$appl/code/$name.json");
  $files[$name]= (object)array();
  if ( !$ctime)
    $files[$name]->state= 'err';
  else
    $files[$name]->state= !$ctime || $ctime<$etime || $ctime<$xtime ? "old" : "ok";
  // získání informace z překladu
  if ( $files[$name]->state=='ok' ) {
    $code= json_decode(file_get_contents($cname));
    $files[$name]->info= $code->info;
  }
}
# --------------------------------------------------------------------------------------- doc_php_cg
# test CG
function doc_php_cg ($fnames) {
  global $ezer_path_root, $ezer_php_libr;
  # výstup tokenů
  function token_debug($xs,$fname) {
    $y= array();
    foreach ($xs as $i=>$x) {
      if ( is_array($x) ) {
        if (in_array($x[0],array(T_WHITESPACE,T_COMMENT,T_VARIABLE))) continue;
        $y[$i]= token_name($x[0])."   $x[1]";
      }
      else {
        if (!in_array($x[0],array('{','}','('))) continue;
        $y[$i]= $x;
      }
    }
//     debug($y,$fname);
  }
  // seznam funkcí vynechaných ze seznamu volaných - odvozený z $ezer_php_libr
  $omi= array();
  foreach($ezer_php_libr as $fname) {
    $ts= token_get_all(file_get_contents("$ezer_path_root/ezer2.2/$fname"));
    for ($i= 0; $i<count($ts); $i++) {
      // vynechání mezer
      if ( is_array($ts[$i]) && in_array($ts[$i][0],array(T_WHITESPACE,T_COMMENT,T_VARIABLE)) )
        continue;
      // seznam funkcí
      else if ( is_array($ts[$i]) && $ts[$i][0]==T_FUNCTION ) {
        $i+= 2;
        $omi[]= $ts[$i][1];
      }
    }
  }
  // seznam dostupných funkcí
  $fce_lst= get_defined_functions();   // pozor! převádí jména na lowercase
  $usr= $fce_lst['user'];
  $fce= array();
  foreach($usr as $u) {
    if (!in_array($u,$omi) )
      $fce[$u]= array();
  }
  ksort($fce);
  $phps= array();
  // phps :: [file=>fce, ... ]          -- seznam funkcí
  //  fce :: id=>[id,...]               -- seznam volaných
  foreach(explode(',',$fnames) as $fname) {
    $phps[$fname]= array('?'=>array());
    $last= "?";
    $ts= token_get_all(file_get_contents("$ezer_path_root/$fname"));
    for ($i= 0; $i<count($ts); $i++) {
      // vynechání mezer
      if ( is_array($ts[$i]) && $ts[$i][0]==T_WHITESPACE ) continue;
      // seznam funkcí
      else if ( is_array($ts[$i]) && $ts[$i][0]==T_FUNCTION ) {
        $i+= 2;
        $last= strtolower($ts[$i][1]);
        $phps[$fname][$last]= array();
      }
      // volání funkce
      else if ( is_array($ts[$i]) && $ts[$i][0]==T_STRING
        && in_array($u= strtolower($ts[$i][1]),$usr) ) {
        if ( isset($fce[$u]) ) {
          // pokud není mezi vynechávanými
          if ( !in_array($u,$phps[$fname][$last]) ) {
            $phps[$fname][$last][]= $u;
            $fce[$u][]= $last;
          }
        }
      }
    }
  }
  $html.= "<div class='dbg'>".debugx($phps,'CG')."</div>";
  return (object)array('calls'=>$phps,'called'=>$fce,'html'=>$html);
}
/** =========================================================================================> PSPAD */
# ---------------------------------------------------------------------------------------- pspad_gen
# vygeneruje definici syntaxe pro Ezer pro PSPad
function pspad_gen() {
  global $ezer_path_pspad;
  $html= "<div class='CSection CMenu'>";
  $html.= "<h3 class='CTitle'>Barvení syntaxe EzerScript pro PSPad</h3>";
  $fname= "$ezer_path_pspad/Ezer.ini";
  $now= date('d.m.Y');
  pspad_keys($res,$key1,$key2,$key3);
  $ini= ";PSPad HighLighter definition file pro Ezerscript
;author:  Martin Šmídek
;contact: martin@smidek.eu
;version: $now
[Settings]
Name=Ezer
HTMLGroup=0
Label=1
FileType=*.ezer,*.code
CommentString=#
SharpComment=1
CComment=1
SlashComment=1
;Preprocessors=1
IndentChar=
UnIndentChar=
TabWidth=8
CaseSensitive=1
SingleQuote=1
DoubleQuote=1
KeyWordChars=_
CodeExplorer=ftUnknown
[KeyWords]
array=
desc=
foreach=
object=
return=
this=
while=$key1
[ReservedWords]$res
type=
_sys=
onblur=
oncancel=
onclick=
ondrop=
onerror=
onfocus=
onfirstfocus=
onchange=
onchanged=
onchoice=
onload=
onready=
onbusy=
onresize=
onmarkclick=
onrowclick=
onsave=
onstart=
onsubmit=
[KeyWords2]$key2
[KeyWords3]$key3
ask=";
  $n= @file_put_contents($fname,$ini);
  if ( $n===false ) fce_error("LIBR: nelze zapsat $fname pro PSPad");
  $html.= nl2br($ini)."</div>";
  return $html;
}
# --------------------------------------------------------------------------------------- pspad_keys
# vygeneruje definici syntaxe pro Ezer pro PSPad
function pspad_keys(&$res,&$key1,&$key2,&$key3) {
  global $ezer_path_serv;
  require_once("$ezer_path_serv/comp2.php");
  $res= $key1= $key2= $key3= '';
  get_ezer_keys($keywords,$attribs1,$attribs2);
//                                                             debug($keywords,'$keywords');
//                                                             debug($attribs1,'$attribs1');
//                                                             debug($attribs2,'$attribs2');
  foreach($keywords as $key) {
    $key1.= "\n$key=";
  }
  global $names;                                               // viz comp2tab.php
//                                                             debug($names,'$names');
  foreach($names as $id=>$op) {
    switch($op->op) {
    // funkce bez serveru
    case 'fm': case 'ff':
      $key2.= "\n$id=";
      break;
    // akce na serveru nebo modální nebo struktury
    case 'fx': case 'fi': case 'fj': case 'fs':
      $key3.= "\n$id=";
      break;
    // atributy
    case 'oi': case 'os': case 'on': case 'oc': case 'oo':
      $res.= "\n$id=";
      break;
    default:
      fce_error("LIBR: neznámý typ '{$op->op}' jména '$id'");
    }
  }
}
/** =======================================================================================> NOVINKY */
# zobrazování Novinek z tabulky _TODO
# ---------------------------------------------------------------------------------------- doc_todo2
# vygeneruje přehled Novinek
# source = app|sys
# nic    = text zobrazený při prázdném výsledku
function doc_todo2($item,$source='app',$nic="<dl class='todo'><dt>V tomto období nebyly změny</dt></dl>",$par=null) {
  global $ezer_path_todo, $ezer_path_root;
  $nove= 30;
  $html= '';
  $cond= $source=='app' ? "cast!=1 " : "cast=1 ";
  $order= "kdy_skoncil DESC";
  switch ( $item ) {
  case 'chngs':
    $nove= $par->days;
    $html.= "<div class='karta'>Změny aplikace za posledních $nove dní</div><br>";
    $html.= doc_chngs_show('ak',$nove);
    break;
  case 'nove':
    $html.= "<div class='karta'>Vlastnosti systému přidané za posledních $nove dní</div>";
    $html.= "<i>Věnujte prosím pozornost zejména zvýrazněným řádkům. "
      . "Zvýrazněné úpravy se týkají téměř všech uživatelů.</i>";
    $cond.= " AND SUBDATE(NOW(),$nove)<=kdy_skoncil AND kdy_skoncil!='0000-00-00' ";
    $html.= doc_todo_show($cond,$order);
    break;
  case 'stare':
    $html.= "<div class='karta'>Vlastnosti systému přidané před $nove dny</div>";
    $cond.= " AND SUBDATE(NOW(),$nove)>kdy_skoncil AND kdy_skoncil!='0000-00-00' ";
    $html.= doc_todo_show($cond,$order);
    break;
  case 'todo':
    $html.= "<div class='karta'>Opravy, úpravy a doplnění systému k realizaci</div>";
    $html.= "<i>Požadavky mohou oprávnění uživatelé zapisovat v Systém|Požadavky</i>";
    $cond.= " AND kdy_skoncil='0000-00-00' ";
    $order= "kdy_zadal DESC";
    $html.= doc_todo_show($cond,$order);
    break;
  }
  return $html;
}
# ----------------------------------------------------------------------------------------- doc_todo
# vygeneruje přehled Novinek
# source = app|sys
# nic    = text zobrazený při prázdném výsledku
function doc_todo($item,$source='app',$nic="<dl class='todo'><dt>V tomto období nebyly změny</dt></dl>") {
  global $ezer_path_todo, $ezer_path_root;
  $nove= 30;
  $html= "<div class='CSection CMenu'>";
  $cond= $source=='app' ? "cast!=1 " : "cast=1 ";
  $order= "kdy_skoncil DESC";
  switch ( $item ) {
  case 'nove':
    $html.= "<h3 class='CTitle'>Vlastnosti systému přidané za posledních $nove dní</h3>";
    $html.= "<i>Věnujte prosím pozornost zejména zvýrazněným řádkům. "
      . "Zvýrazněné úpravy se týkají téměř všech uživatelů.</i>";
    $cond.= " AND SUBDATE(NOW(),$nove)<=kdy_skoncil AND kdy_skoncil!='0000-00-00' ";
    break;
  case 'stare':
    $html.= "<h3 class='CTitle'>Vlastnosti systému přidané před $nove dny</h3>";
    $cond.= " AND SUBDATE(NOW(),$nove)>kdy_skoncil AND kdy_skoncil!='0000-00-00' ";
    break;
  case 'todo':
    $html.= "<h3 class='CTitle'>Opravy, úpravy a doplnění systému k realizaci</h3>";
    $html.= "<i>Požadavky mohou oprávnění uživatelé zapisovat v Systém|Požadavky</i>";
    $cond.= " AND kdy_skoncil='0000-00-00' ";
    $order= "kdy_zadal DESC";
    break;
  }
  $html.= doc_todo_show($cond,$order);
  $html.= "</div>";
  return $html;
}
# ------------------------------------------------------------------------------------ doc_todo_show
# zobrazí přehled Novinek resp. Požadavků pro běžného uživatele
#   cond = podmínka
# stav požadavku se zjistí z položky stav a kombinace datumů (stejně jako v ezer2.syst.ezer)
#   požadované    - 0:-,
#   odložené      - 1:blue,
#   zrušené       - 2:red,
#   rozpracované  - 3:yellow,
#   hotové        - 4:green,
#   zkontrolované - 5:green2
function doc_todo_show($cond,$order="kdy_skoncil DESC") { trace();
  $tab= $nic= '';
  $users= map_user();
  $typs= map_cis('s_todo_typ','zkratka');
  $casti= map_cis('s_todo_cast','zkratka');
  $qry= "SELECT *,
    CASE WHEN stav=1 THEN 1 WHEN stav=2 THEN 2
      WHEN kdy_zacal!='0000-00-00' AND kdy_skoncil='0000-00-00' THEN 3
      WHEN kdy_skoncil!='0000-00-00' AND kdy_kontrola='0000-00-00' THEN 4
      WHEN kdy_kontrola!='0000-00-00' THEN 5
      ELSE 0 END as xstav
    FROM _todo WHERE $cond
    ORDER BY $order";
  $res= mysql_qry($qry);
  while ( $res && ($d= mysql_fetch_object($res)) ) {
    // zobrazení
    $id= $d->id_todo;
    $typ= $typs[$d->typ];
    $cast= $casti[$d->cast];
    $kdo_zadal= $users[$d->kdo_zadal];
    $kdy_zadal= sql_date1($d->kdy_zadal);
    $kdy_zacal= sql_date1($d->kdy_zacal);
    $kdy_skoncil= sql_date1($d->kdy_skoncil);
    $kdy_kontrola= sql_date1($d->kdy_kontrola);
    $popis= $d->zprava ? $d->zprava : $d->zadani;
    $class= '';
    if ( substr($popis,0,1)=='+' ) { $class=' class=todo_plus'; $popis= substr($popis,1); }
    if ( $d->typ==4 ) {
      // novinky se zobrazují zkráceně
      if ( $d->xstav>=4 ) { // hotovo či dokonce zkontrolováno
        $tab.= "<dt>ode dne $kdy_skoncil lze používat:</dt><dd$class>$popis</dd>";
      }
    }
    else {
      switch ($d->xstav) {
      case 0:                                                             // požadavek
      case 3:                                                             // rozpracováno
        $note= $d->xstav==3 ? "a od $kdy_zacal se na ní pracuje" : '';
        $tab.= "<dt>ode dne $kdy_zadal je $kdo_zadal "
          . "požadována $typ č. $id v modulu $cast $note</dt><dd$class>$popis</dd>";
        break;
      case 4:                                                             // hotovo
        $tab.= "<dt>dne $kdy_skoncil byla v modulu $cast dokončena $typ č. $id, "
          . "kterou $kdy_zadal požadoval $kdo_zadal</dt><dd$class>$popis</dd>";
        break;
      case 5:                                                             // zkontrolováno
        $kontrola= $kdy_skoncil==$kdy_kontrola ? "a zkontrolována" : "a $kdy_kontrola zkontrolována";
        $tab.= "<dt>dne $kdy_skoncil byla v modulu $cast dokončena $kontrola "
          . "$typ č. $id, kterou $kdy_zadal požadoval $kdo_zadal</dt><dd$class>$popis</dd>";
        break;
      }
    }
  }
  $html= $tab ? "<dl class='todo'>$tab</dl>" : $nic;
  return $html;
}
# ----------------------------------------------------------------------------------------- map_user
# zjištění zkratek uživatelů a vrácení jako překladového pole
#   array (id => abbr, ...)
function map_user() {
  global $ezer_system;
  $users= array();
  $qry= "SELECT * FROM $ezer_system._user ORDER BY id_user";
  $res= mysql_qry($qry,0,0,0,'ezer_system');
  while ( $res && $u= mysql_fetch_object($res) ) {
    $users[$u->id_user]= $u->abbr;
  }
  return $users;
}
/** ==========================================================================================> TODO */
# ----------------------------------------------------------------------------------------- doc_todo
# vygeneruje přehled aktivit podle menu
function doc_todo1($item,$source='app',$nic="<dl class='todo'><dt>V tomto období nebyly změny</dt></dl>") {
  global $ezer_path_todo, $ezer_path_root;
  $html= "<div class='CSection CMenu'>";
  $path= $source=='app' ? $ezer_path_todo : "$ezer_path_root/ezer2.2/wiki/";
  $nove= 12;
  switch ( $item ) {
  case 'nove':
    $html.= "<h3 class='CTitle'>Vlastnosti systému přidané za posledních $nove dní</h3>";
    $html.= "<i>Věnujte prosím pozornost zejména zvýrazněným řádkům. "
      . "Zvýrazněné úpravy se týkají téměř všech uživatelů.</i>";
    $html.= doc_todo_show1('++done','',0,$nove,$path,$nic);
    break;
  case 'stare':
    $html.= "<h3 class='CTitle'>Vlastnosti systému přidané před $nove dny</h3>";
    $html.= doc_todo_show1('++done','',$nove,99999,$path,$nic);
    break;
  case 'idea':
    $html.= "<h3 class='CTitle'>Nápady na doplnění systému</h3>";
    $x= "<br><br><br><br>Odesláno ze stránky Nápověda/Novinky";
    $html.= "<i>Požadavky mi posílejte prosím tímto odkazem "
      . "<a href='mailto:smidek@proglas.cz?subject=Pozadavek na upravu&body=$x'>smidek@proglas.cz</a></i>.";
    $html.= doc_todo_show1('++idea','++todo',0,99999,$path,$nic);
    break;
  case 'todo':
    $html.= "<h3 class='CTitle'>Opravy, úpravy a doplnění systému k realizaci</h3>";
    $x= "<br><br><br><br>Odesláno ze stránky Nápověda/Novinky";
    $html.= "<i>Požadavky mi posílejte prosím tímto odkazem "
      . "<a href='mailto:smidek@proglas.cz?subject=Pozadavek na upravu&body=$x'>smidek@proglas.cz</a></i>.";
    $html.= doc_todo_show1('++todo','++done',0,99999,$path,$nic);
    break;
  }
  $html.= "</div>";
  return $html;
}
# ----------------------------------------------------------------------------------- doc_todo_show1
# vygeneruje přehled aktivit podle menu
function doc_todo_show1($ods,$dos,$odt=0,$dot=99999,$path,$nic='') { trace();
  $file= @file_get_contents("$path/todo.wiki");
  if ( !$file ) fce_error("LIBR: chybi soubor todo.wiki");
  $f1= strpos($file,"\n$ods") + strlen($ods) + 3;
  $f2= $dos ? strpos($file,"\n$dos") : 999999;
  // rozklad na řádky
  $text= substr($file,$f1,$f2-$f1);
  $line= explode("\n",$text);
//                                                 debug($line,'todo.wiki');
  $tab= '';
  for ($i= 1; $i<=count($line); $i++) {
    $j= 1;
    $err= '';
    $todo= explode('|',$line[$i-1]);
    if ( count($todo)==1 ) continue;
    if ( count($todo)!=6 ) $err= "chybná syntaxe: chybný počet sloupců ";
    else {
      $zadano= trim($todo[$j++]);
      if ( $zadano && !verify_datum($zadano,$d,$m,$y,$timestamp) )
        $err.= "chybné datum zadání: $zadano";
      $user= trim($todo[$j++]);
      $typ= trim($todo[$j++]);
      if ( $ods=='++todo' || $ods=='++idea' ) {
        $hotovo= $todo[$j++];
        if ( trim($hotovo) ) $err.= "plán má uvedeno datum ukončení";
      }
      else {
        $hotovo= $todo[$j++];
        if ( !($ok= verify_datum($hotovo,$d,$m,$y,$timestamp)) )
          $err.= "chybné datum ukončení: $hotovo";
        if ( $ok ) {
          // hotové zobrazíme jen v požadovaném intervalu
          $now= time();
          $days= ($now-$timestamp)/(60*60*24);
          if ( $days > $dot || $days < $odt ) continue;
        }
      }
      $datum= date('d.m.Y',$timestamp);
      $popis= trim($todo[$j++]);
      $popis= preg_replace('/\*([^\*]+)\*/','<b>\\1</b>',$popis);
    }
    // vlastní zobrazení
    $class= '';
    if ( substr($popis,0,1)=='+' ) { $class=' class=todo_plus'; $popis= substr($popis,1); }
    switch ( $err ? 'error' : ( $popis ? $ods : 'nic') ) {
    case '++done':
      if ( !$zadano )
        $tab.= "<dt>$hotovo $user přidal</dt><dd$class>$popis</dd>";
      else
        $tab.= "<dt>$hotovo byla dokončena $typ, "
          ."kterou dne $zadano požadoval/a $user</dt><dd$class>$popis</dd>";
      break;
    case '++idea':
      $tab.= "<dt>dne $zadano napadlo $user</dt><dd$class>$popis</dd>";
      break;
    case '++todo':
      $tab.= "<dt>ode dne $zadano je $user "
        . "požadována $typ</dt><dd$class>$popis</dd>";
      break;
    case 'error':
      $tab.= "<dt style='background-color:#ff6'>$err v souboru todo/todo.wiki"
        . " v sekci $ods, řádek $i</dt><dd>{$line[$i]}</dd>";
      break;
    }
  }
  $html= $tab ? "<dl class='todo'>$tab</dl>" : $nic;
  return $html;
}
/** ==========================================================================================> HELP */
# zobrazování položek kontextového helpu _HELP
# ----------------------------------------------------------------------------------------- doc_todo
# vygeneruje přehled _help
function doc_help($cond='all') {
  $html.= "";
  return $html;
}
?>
