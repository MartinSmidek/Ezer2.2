<?php # (c) 2007-2009 Martin Smidek <martin@smidek.eu>
/** ================================================================================================ POŽADAVKY */
# -------------------------------------------------------------------------------------------------- abbr2user
# zjištění uživatele podle jeho zkratky
function abbr2user($abbr) {
  $id= select("id_user","_user","abbr='$abbr'",'ezer_system');
  return $id ? $id : 0;
}
/** ================================================================================================ NASTAVENÍ */
# -------------------------------------------------------------------------------------------------- sys_user_record
# přehled osobních údajů
function sys_user_record($id_user=0) {  trace();
  global $json, $ezer_root, $ezer_system;
  $id_user= $id_user ? $id_user : $_SESSION[$ezer_root]['user_id'];
  function row($i,$v,$skill='') {
    global $USER;
    $tr= '';
    if ( $v ) {
      if ( $skill && $USER->skills ) {
        $skills= explode(' ',$USER->skills);
        if ( in_array($skill,$skills) ) {
          $tr= "<tr><td style='color:red' align='right'>$i:</td><td><b>$v</b></td></tr>";
        }
      }
      else {
        $tr= "<tr><td align='right'>$i:</td><td><b>$v</b> $skill</td></tr>";
      }
    }
    return $tr;
  }
  $html= "<table>";
  $qry= "SELECT * FROM $ezer_system._user WHERE id_user='$id_user' /*1*/";
  $res= mysql_qry($qry,0,0,0,'ezer_system');
  if ( $res && ($u= mysql_fetch_object($res)) ) {
    $opt= $json->decode($u->options);
    $html.= row('přihlášení',$u->username);
    $html.= row('heslo','************');
    $html.= row('křestní jméno',$u->forename);
    $html.= row('příjmení',$u->surname);
    $html.= row('zkratka',$u->abbr);
    $html.= row('oprávnění',$u->skills);
    $html.= row('vyřizuje',$opt->vyrizuje);
    $html.= row('telefon',$opt->telefon);
    $html.= row('potvrzuje',$opt->potvrzuje);
    $html.= row('zvláštní styl',$opt->css);
    $html.= row('state',$u->state,'m');
  }
  $html.= "</table>";
  return $html;
}
# -------------------------------------------------------------------------------------------------- sys_user_get
# čtení osobních údajů
# $typ='fld' -- _user.fld
# $typ='opt' -- _user.options.fld
# $typ='oop' -- _user.options.options.fld
function sys_user_get ($id_user,$typ,$fld) {  trace();
  global $json, $ezer_system;
  $val= '';
  $qry= "SELECT * FROM $ezer_system._user WHERE id_user='$id_user'";
  $res= mysql_qry($qry,0,0,0,'ezer_system');
  if ( $res ) {
    $u= mysql_fetch_object($res);
                                                debug($u,'fetch');
    $options= $json->decode($u->options);
    switch ($typ) {
    case 'fld':                                         // _user.fld
      $val= $u->$fld;
      break;
    case 'opt':                                         // _user.options.fld
      $val= $options->$fld;
      break;
    case 'oop':                                         // _user.options.options.fld
      $val= $options->options->$fld;
      break;
    }
  }
  return $val;
}
# -------------------------------------------------------------------------------------------------- sys_user_change_me
# změna osobních údajů pro přihlášeného uživatele
# $typ='fld' -- _user->$fld=$val
# $typ='pas' -- _user->password=$val pokud stávající _user->password==$p1 a $val==$p2
#               fis_user_change(t,nps,ops,rep)
function sys_user_change_me($typ,$fld,$val,$p1='',$p2='') {  trace();
  $id_user= $_SESSION[$ezer_root]['user_id'];
  sys_user_change($id_user,$typ,$fld,$val,$p1,$p2);
}
# -------------------------------------------------------------------------------------------------- sys_user_change
# změna osobních údajů pro libovolného uživatele
# $typ='fld' -- _user->$fld=$val
# $typ='pas' -- _user->password=$val pokud stávající _user->password==$p1 a $val==$p2
function sys_user_change($id_user,$typ,$fld,$val,$p1='',$p2='') {  trace();
  global $json, $ezer_system, $ezer_root;
  $html= '';
  $err= '';
  if ( $id_user ) {
    switch ($typ) {
    case 'fld':                                         // zápis do _user.fld
      $qry= "UPDATE $ezer_system._user SET $fld='$val' WHERE id_user='$id_user'";
      $res= mysql_qry($qry,0,0,0,'ezer_system');
      if (!$res) $err.= "CHYBA:".mysql_error();
      break;
    case 'opt':                                         // zápis do _user.options
    case 'oop':                                         // zápis do _user.options.options
      $qry= "SELECT options FROM $ezer_system._user WHERE id_user='$id_user'";
      $res= mysql_qry($qry,0,0,0,'ezer_system');
      if ( $res ) {
        $u= mysql_fetch_object($res);
        $options= $json->decode($u->options);
        switch ($typ) {
        case 'opt':   // zápis do _user.options
          $options->$fld= $val;
          break;
        case 'oop':   // zápis do _user.options.options
          $options->options->$fld= $val;
          break;
        }
        $options_s= ezer_json_encode($options);
                                                display("old={$u->options};new=$options_s");
        $qry= "UPDATE $ezer_system._user SET options='$options_s' WHERE id_user='$id_user'";
        $res= mysql_qry($qry,0,0,0,'ezer_system');
      };
      if (!$res) $err.= "CHYBA:".mysql_error();
      break;
    case 'pas':                                         // zápis do _user.fld
      if ( $p1!=select('password','_user',"id_user='$id_user'",'ezer_system') )
        $err.= "chybně zapsané původní heslo";
      else if ( !$val )
        $err.= "heslo nesmí být prázdné";
      else if ( $val!=$p2 )
        $err.= "chyba v opakovaném zápise hesla";
      else { // testy jsou ok
        $qry= "UPDATE $ezer_system._user SET password='$val' WHERE id_user='$id_user'";
        $res= mysql_qry($qry,0,0,0,'ezer_system');
        if (!$res) $err.= "CHYBA:".mysql_error();
      }
      break;
    }
    if ( !$err )
      $html.= "Změna se uplatní při příštím přihlášení se do aplikace";
  }
  else
    $err.= "Během práce došlo zřejmě k automatickému odhlášení, přihlašte se prosím znovu a opravu opakujte.";
  return "$html<br><br>$err";
}
# -------------------------------------------------------------------------------------------------- sys_user_skills
# proveden kontrolu konzistence oprávnění, pokud je zadáno jméno souboru
# vygeneruje přehlednou tabulku oprávnění pro Excel
function sys_user_skills($file='') {
  global $ezer_system;
  $result= '';
  $cells= $clmns= $rows= array();
  $qryu= "SELECT * FROM $ezer_system._user ORDER BY surname";
  $resu= mysql_qry($qryu,0,0,0,'ezer_system');
  while ( $resu && $u= mysql_fetch_object($resu) ) {
    $clmns[$u->abbr]= $u->surname;
  }
  $qrys= "SELECT * FROM $ezer_system._skill ORDER BY skill_desc";
  $ress= mysql_qry($qrys,0,0,0,'ezer_system');
  while ( $ress && $s= mysql_fetch_object($ress) ) {
    $skill= $s->skill_abbr;
    $cells[$skill]= array();
    $rows[$skill]= $s->skill_desc;
    $qryu= "SELECT * FROM $ezer_system._user WHERE LOCATE(' $skill ',CONCAT(' ',skills,' ')) ";
    $resu= mysql_qry($qryu,0,0,0,'ezer_system');
    while ( $resu && $u= mysql_fetch_object($resu) ) {
      $cells[$skill][$u->abbr]= '+';
    }
  }
  // export tabulky
  global $ezer_root;
  $title= "Oprávnění k aplikaci {$_SESSION[$ezer_root]['app_name']} ke dni ".date("j. n. Y");
  $xls= "open $file|sheet opravneni;;P;page\n";
  $xls.= "|columns A=*";
  $c= 1;
  $A= 'B';
  $header1= $header2= "";
  foreach($clmns as $user=>$name) {
    $xls.= ",$A=*";
    $header1.= "|{$A}1 $name::vert";
    $header2.= "|{$A}2 $user";
    $del= ',';
    $c++;
    $A0= $A;
    $A= Excel5_n2col($c);
  }
  $r= 3;
  $xls.= ",$A=*\n|$header1|{$A}1 $title::bold middle center size=13\n|$header2";
  $xls.= "\n|B2:{$A0}2 bcolor=aac0e2c2";
  foreach($rows as $skill=>$desc) {
    $xls.= "\n|A$r $skill::bcolor=aac0e2c2";
    $c= 1;
    $A= 'B';
    foreach($clmns as $user=>$name) {
      $x= isset($cells[$skill][$user]) ? 'x' : '';
      $xls.= "|{$A}$r $x::border=t";
      $c++;
      $A= Excel5_n2col($c);
    }
    $xls.= "|{$A}$r $desc";
    $r++;
  }
  // kontrola konzistence - má-li kdo oprávnění xy musí mít i x
  $xls.= "\n";
  $c= 1;
  foreach($clmns as $user=>$name) {
    $r= 3;
    foreach($rows as $skill=>$desc) {
      if ( isset($cells[$skill][$user]) ) {
        for ($i= strlen($skill)-1; $i>0; $i--) {
          $x= substr($skill,0,$i);
          if ( isset($rows[$x]) && !isset($cells[$x][$user]) ) {
            $cells[$x][$user]= '-';
            $A= Excel5_n2col($c);
            $rx= 3;
            foreach($rows as $skillx=>$descx) {
              if ( $skillx==$x ) break;
              $rx++;
            }
            $xls.= "|{$A}$rx:{$A}$rx bcolor=aaffff00|{$A}$r:{$A}$r bcolor=aaff0000";
            $result.= "<br/>pokud $user má $skill musí mít i $x";
          }
        }
      }
      $r++;
    }
    $c++;
  }
  $xls.= "\n|close";
  if ( $file ) {
//                                                 display($xls);
    $inf= Excel5($xls,1);
    $result= $inf ? 0 : 1;
  }
  else if ( !$result )
    $result= "Nebyly nalezeny inkonsistence";
  return $result;
}
# ================================================================================================== backup
# v globálním nastavení musí být definováno
#   $path_backup     -- složka záloh databází
#   $ezer_mysql_path -- cesta k utilitě mysql
# -------------------------------------------------------------------------------------------------- sys_backup_make
# BACKUP: uloží obrazy databází do příslušných složek
# parametry
#   listing  - přehled existujících záloh
#   download - přehled existujících záloh s možností downloadu
#   restore  - přehled existujících záloh s možností obnovit data
#   kaskada  - uložení dnešní zálohy, (je-li pondělí přesun poslední pondělní do jeho týdne)
#              -- days:  dny v týdnu
#              -- weeks: pondělky týdnů roku
#   special  - uložení okamžité zálohy do složky special
#   kontrola - kontrola existence dnešní zálohy
function sys_backup_make($par) {  trace();
  global $path_backup, $ezer_root;
  $html= '';
  $sign= date("Ymd_Hi");
  switch ($par->typ) {
  case 'download':
  case 'listing':
  case 'restore':
    $html.= "<h2>Zálohy v $path_backup/</h2>";
    // denní zálohy
    $html.= "<h3>Denní zálohy</h3><dl>";
    foreach (glob("$path_backup/days/*",GLOB_ONLYDIR) as $dir_d) {
      $files= glob("$dir_d/*");
      $html.= "<dt>".substr($dir_d,1+strlen($path_backup))."/</dt>";
      foreach($files as $file) {
        $size= number_format(filesize($file),0,'.',' ').'B';
        $ref= $par->typ=='restore'||$par->typ=='download'
          ? "<a target='back' href='zaloha.php?root=$ezer_root&{$par->typ}="
              .substr($file,1+strlen($path_backup))."'>".substr($file,1+strlen($dir_d))."</a>"
          : substr($file,1+strlen($dir_d));
        $html.= "<dd>$ref ($size)</dd>";
      }
    }
    $html.= "</dl>";
    // týdenní zálohy
    $html.= "<h3>týdenní zálohy</h3><dl>";
    $dirs= glob("$path_backup/weeks/*",GLOB_ONLYDIR);
    rsort($dirs);
    foreach ($dirs as $dir_d) {
      $files= glob("$dir_d/*");
      $html.= "<dt>".substr($dir_d,1+strlen($path_backup))."/</dt>";
      foreach($files as $file) {
        $size= number_format(filesize($file),0,'.',' ').'B';
        $ref= $par->typ=='restore'||$par->typ=='download'
          ? "<a target='back' href='zaloha.php?root=$ezer_root&{$par->typ}="
              .substr($file,1+strlen($path_backup))."'>".substr($file,1+strlen($dir_d))."</a>"
          : substr($file,1+strlen($dir_d));
        $html.= "<dd>$ref ($size)</dd>";
      }
    }
    $html.= "</dl>";
    // speciální zálohy
    $html.= "<h3>speciální zálohy</h3><dl>";
    $dir_d= "$path_backup/special";
    $files= glob("$dir_d/*");
    rsort($files);
    $html.= "<dt>".substr($dir_d,1+strlen($path_backup))."/</dt>";
    foreach($files as $file) {
      $size= number_format(filesize($file),0,'.',' ').'B';
      $ref= $par->typ=='restore'||$par->typ=='download'
        ? "<a target='back' href='zaloha.php?root=$ezer_root&{$par->typ}="
            .substr($file,1+strlen($path_backup))."'>".substr($file,1+strlen($dir_d))."</a>"
        : substr($file,1+strlen($dir_d));
      $html.= "<dd>$ref ($size)</dd>";
    }
    $html.= "</dl>";
    break;
  case 'special':
    $path= "$path_backup/special";
    $dbs= sys_backup_into($path,$sign);
    $html.= "<br>vytvořena záloha pro $dbs do 'special'";
    break;
  case 'kontrola':
    $d= date('N');                                              // dnešní den v týdnu (pondělí=1)
    sys_backup_test("$path_backup/days/$d",date("Ymd_*"),&$backs,$ok);
//                                         display("$ok:$backs");
    $html.= $backs && $ok ? "Dnešní zálohy byly vytvořeny v pořádku"
      : ($backs ? "Některé":"Žádné") . " dnešní zálohy nebyly vytvořeny";
    $html.= $backs ? "<br/><br/>Databáze jsou uloženy takto: <dl>$backs</dl>" : "";
    break;
  case 'kaskada':
    $d= date('N');                                              // dnešní den v týdnu (pondělí=1)
    // kontrola existence záloh - aby nedošlo k přepsání
    sys_backup_test("$path_backup/days/$d",date("Ymd_*"),&$backs,$ok);
    if ( $ok ) {
      $html.= "<br>dnešní zálohy již v 'days/$d' existují";
    }
    else {
      // kontrola existence denní složky
      if ( !file_exists("$path_backup/days/$d") ) recursive_mkdir("$path_backup/days/$d",'/');
      // pondělní přesun
      if ( $d==1 ) {
        // zjisti minulý týden
        $prev= mktime(0, 0, 0, date("m")  , date("d")-7, date("Y"));
        $w= date("W",$prev) + 1;                                // minulý týden od počátku roku
        // kontrola existence týdenní složky
        if ( !file_exists("$path_backup/weeks/$w") ) recursive_mkdir("$path_backup/weeks/$w",'/');
        // zkopíruj předchozí pondělí do jeho týdne
        sys_backup_delete("$path_backup/weeks/$w");
        sys_backup_move("$path_backup/days/$d","$path_backup/weeks/$w");
        $html.= "<br>přesunuty poslední pondělní zálohy do 'weeks/$w'";
      }
      // nahraď den novou zálohou
      sys_backup_delete("$path_backup/days/$d");
      $dbs= sys_backup_into("$path_backup/days/$d",$sign);
      $html.= "<br>vytvořena záloha pro $dbs do 'days/$d'";
    }
    break;
  }
  return $html;
}
# -------------------------------------------------------------------------- sys_backup_test
# BACKUP: test vytvoření zálohy databází do dané složky
function sys_backup_test($into,$sign,&$backs,&$ok) {   trace();
  global $ezer_db, $ezer_mysql_path;
  $backs= '';
  $ok= true;
  foreach ( $ezer_db as $db_id=>$db_desc ) {
    list($n,$host,$user,$pasw,$lang,$db_name)= $db_desc;
    if ( !isset($ezer_db[$db_name]) ) {
      $name= $db_name ? $db_name : $db_id;
      $files= glob("$into/{$name}_$sign.sql");
      $je= count($files)>0;
      $backs.= "<dt>databáze $name</dt><dd>";
      $backs.= $je ? implode(' ',$files) : "!!! chybí";
      $ok&= $je;
      $backs.= "</dd>";
//                                         debug($files,"$je");
    }
  }
}
# -------------------------------------------------------------------------- sys_backup_into
# BACKUP: vytvoření zálohy databází do dané složky
function sys_backup_into($into,$sign) {   trace();
  global $ezer_db, $ezer_mysql_path;
  $dbs= '';
  if ( file_exists($into) ) {
    foreach ( $ezer_db as $db_id=>$db_desc ) {
      list($n,$host,$user,$pasw,$lang,$db_name,$omitt)= $db_desc;
      if ( !$omitt && !isset($ezer_db[$db_name]) ) {
        $name= $db_name ? $db_name : $db_id;
                                                debug($db_desc,$db_id);
        $file= "{$name}_$sign.sql";
        $path= "$into/$file";
        $cmd= "$ezer_mysql_path/mysqldump --opt -h $host ";
        $cmd.= "-u $user --password=$pasw $name ";
        $cmd.= "> $path";
        if (substr(php_uname(), 0, 7) == "Windows" ) {
                                                display("windows rise:$cmd");
          $WshShell= new COM("WScript.Shell");
//                                                 debug($WshShell,"windows shell");
          $oExec= $WshShell->Run($cmd, 1, false);
          $pid= @popen("start /B ". $cmd, "r");
          if ( $pid ) {
            $msg= fread($pid, 2096);
            $dbs.= "$name:<br>$file -- ukládání bylo odstartováno ($msg)";
            @pclose($pid);
                                                display("windows rised:$cmd");
          }
          else {
            $dbs.= "$name:<br>$file -- start ukládání zhavaroval ";
          }
        }
        else {
                                                display("linux:$cmd");
          $status= exec($cmd);
                                                display("linux:$status:$cmd");
          $dbs.= "$name:<br>$file ";
          $filesize= @filesize($path);
          $size= number_format($filesize,0,'.',' ').'B';
          $dbs.= $filesize ? " ($size)" : " -- <b style='color:red'>soubor má nulovou délku!</b>";
        }
      }
    }
  }
  else $dbs= "nebyla, složka $into neexistuje";
  return $dbs;
}
# -------------------------------------------------------------------------- sys_backup_move
# BACKUP: přesuň jednu složku do druhé
function sys_backup_move($srcDir,$destDir) {   trace();
  $err= '';
  if ( file_exists($destDir) && is_dir($destDir) && is_writable($destDir) ) {
    if ($handle= opendir($srcDir)) {
      while (false !== ($file= readdir($handle))) {
        if (is_file("$srcDir/$file")) {
          rename("$srcDir/$file","$destDir/$file");
        }
      }
      closedir($handle);
    }
    else $err= "sys_backup_move: nelze přesunout soubor z $srcDir";
  }
  else $err= "sys_backup_move: nelze přesunout soubor do $destDir";
  if ( $err ) fce_warning($err);
}
# -------------------------------------------------------------------------- sys_backup_delete
# BACKUP: vymazání obsahu složky
function sys_backup_delete($dir) { trace();
  $ok= true;
  if ($handle= opendir($dir)) {
    while (false !== ($file= readdir($handle))) {
      if (is_file("$dir/$file")) {
        $ok&= @unlink("$dir/$file");
      }
    }
    closedir($handle);
  }
  if ( !$ok ) fce_warning("sys_backup_delete: nelze smazat starou zálohu v $dir");
}
/** ================================================================================================ UŽIVATELÉ */
# -------------------------------------------------------------------------------------------------- sys_session
# vygeneruje tabulku běžného $_SESSION
function sys_session() {
  $html= "<div class='dbg'>".debugx($_SESSION,'$_SESSION')."</div>";
  return $html;
}
# -------------------------------------------------------------------------------------------------- sys_user
# vygeneruje tabulku běžného $USER
function sys_user() {
  global $USER;
  $html= "<div class='dbg'>".debugx($USER,'$USER')."</div>";
  return $html;
}
# -------------------------------------------------------------------------------------------------- sys_ezer
# vygeneruje tabulku běžného $EZER
function sys_ezer() {
  global $EZER;
  $html= "<div class='dbg'>".debugx($EZER,'$EZER')."</div>";
  return $html;
}
# -------------------------------------------------------------------------------------------------- sys_skills_test
# vrátí seznam zkratek oprávnění, které nejsou popsány v tabulce _skill
function sys_skills_test($skills) {
  global $ezer_system;
  $dskills= array();
  $qry= "SELECT skill_abbr FROM $ezer_system._skill";
  $res= mysql_qry($qry,0,0,0,'ezer_system');
  while ( $res && ($s= mysql_fetch_object($res)) ) {
    $dskills[]= $s->skill_abbr;
  }
  $missed= implode(' ',array_diff(explode(' ',$skills),$dskills));
  return $missed ? "<span class='selected'>$missed</span> není definováno" : '';
}
# -------------------------------------------------------------------------------------------------- sys_skills2ids
# vrátí seznam klíčů tabulky _skill odpovídajících seznamu v parametru
function sys_skills2ids($skills) {
  global $ezer_system;
  $skills= str_replace(' ',',',$skills);
  $ids= '';
  $qry= "SELECT GROUP_CONCAT(id_skill) AS _list FROM $ezer_system._skill WHERE FIND_IN_SET(skill_abbr,'$skills')";
  $res= mysql_qry($qry,0,0,0,'ezer_system');
  if ( $res && ($s= mysql_fetch_object($res)) ) {
    $ids= $s->_list;
  }
  else {
    fce_warning("sys_skills2ids:".mysql_error());
  }
  return $ids;
}
# -------------------------------------------------------------------------------------------------- sys_ids2skills
# vrátí uspořádaný seznam zkratek tabulky _skill odpovídajících seznamu v parametru
function sys_ids2skills($ids) {
  global $ezer_system;
  $skills= '';
  $qry= "SELECT GROUP_CONCAT(skill_abbr) AS _list FROM $ezer_system._skill WHERE FIND_IN_SET(id_skill,'$ids')";
  $res= mysql_qry($qry,0,0,0,'ezer_system');
  if ( $res && ($s= mysql_fetch_object($res)) ) {
    $skills= $s->_list;
  }
  else {
    fce_warning("sys_ids2skills:".mysql_error());
  }
  $askills= explode(',',$skills);
  sort($askills);
  return implode(' ',$askills);
}
# -------------------------------------------------------------------------------------------------- sys_watch_key
# vygeneruje přístupový klíč k aplikaci a vrátí odkaz na download
function sys_watch_key() {
  global $ezer_root;
  $key= '';
  for($i=0; $i<32; $i++) {
    $key.= chr(mt_rand(ord('A'),ord('Z')));
  }
  $path= "$ezer_root/code/{$ezer_root}.key";
  $ok= @file_put_contents($path,$key);
  $html= $ok ? "Uložte <a href='$path' target='key'>tento odkaz</a> jako klíč rozeslaný uživatelům"
    : "Klíč se nepovedlo vygenerovat";
  return $html;
}
/** ================================================================================================ AKTIVITY */
# -------------------------------------------------------------------------------------------------- sys_activity
# vygeneruje přehled aktivit podle menu
# pokud ... tak vynechá uživatele, jejichž zkratky jsou v seznamu $EZER->activity->skip
function sys_activity($k,$to_skip=0,$den=0) {
//                                                                 debug($k,'sys_activity');
  global $ezer_root, $json, $user_options, $APLIKACE, $USER, $EZER;
  $user_options= $_SESSION[$ezer_root]['user_options'];
  $skip= $to_skip && $EZER->activity->skip ? $EZER->activity->skip : '';
  $html= "<div class='CSection CMenu'>";
  switch ( "{$k->s} {$k->c}" ) {
  case 'moduly all':
  case 'uzivatele all':
  case 'chyby all':
    $ioptions= "sys_{$k->s}_all";
    if (!isset($user_options->$ioptions) ) $user_options->$ioptions= 0;
    $stav= ($user_options->$ioptions ? 'bez ' : 'včetně ' ).$USER->abbr;
    $user_options->$ioptions= $user_options->$ioptions ? 0 : 1;
    $_SESSION[$ezer_root]['user_options']= $user_options;
    $html.= "stav bude zobrazen $stav";
    break;
  # -------------------------------- modules
  case 'moduly den':
    $day= $den;
    $day_mysql= sql_date($den,1);
    $html.= "<h3 class='CTitle'>Aktuální stav užívání $APLIKACE $day $stav_modules</h3>";
    $html.= sys_day_modules($skip,$day_mysql,$k->short);
    break;
  case 'moduly dnes':
    $day= date('j.n.Y');
    $day_mysql= date('Y-m-d');
    $html.= "<h3 class='CTitle'>Aktuální stav užívání $APLIKACE $day $stav_modules</h3>";
    $html.= sys_day_modules($skip,$day_mysql,$k->short);
    break;
  case 'moduly vcera':
    $day= date('j.n.Y',mktime(0,0,0,date("m"),date("d")-1,date("Y")));
    $day_mysql= date('Y-m-d',mktime(0,0,0,date("m"),date("d")-1,date("Y")));
    $html.= "<h3 class='CTitle'>Stav užívání $APLIKACE $day $stav_modules</h3>";
    $html.= sys_day_modules($skip,$day_mysql,$k->short);
    break;
  case 'moduly dny':
    $day= date('j.n.Y');
    $day_mysql= date('Y-m-d');
    $html.= "<h3 class='CTitle'>Historie užívání modulů $APLIKACE </h3>";
    $html.= sys_days_modules($skip,$day_mysql,$k->days,$k->short);
    break;
  # -------------------------------- users
  case 'uzivatele den':
    $day= $den;
    $day_mysql= sql_date($den,1);
    $html.= "<h3 class='CTitle'>Aktuální stav užívání $APLIKACE $day </h3>";
    $html.= sys_day_users($skip,$day_mysql,$k->short);
    break;
  case 'uzivatele dnes':
    $day= date('j.n.Y');
    $day_mysql= date('Y-m-d');
    $html.= "<h3 class='CTitle'>Aktuální stav užívání $APLIKACE $day </h3>";
    $html.= sys_day_users($skip,$day_mysql,$k->short);
    break;
  case 'uzivatele dny':
    $day= date('j.n.Y');
    $day_mysql= date('Y-m-d');
    $html.= "<h3 class='CTitle'>Historie aktivity uživatelů $APLIKACE </h3>";
    $html.= sys_days_users($skip,$day_mysql,$k->days,$k->short);
    break;
  case 'uzivatele vcera':
    $day= date('j.n.Y',mktime(0,0,0,date("m"),date("d")-1,date("Y")));
    $day_mysql= date('Y-m-d',mktime(0,0,0,date("m"),date("d")-1,date("Y")));
    $html.= "<h3 class='CTitle'>Stav užívání $APLIKACE $day</h3>";
    $html.= sys_day_users($skip,$day_mysql,$k->short);
    break;
  # -------------------------------- errors
  case 'chyby den':
    $day= $den;
    $day_mysql= sql_date($den,1);
    $html.= "<h3 class='CTitle'>Chybová hlášení $APLIKACE $day </h3>";
    $html.= sys_day_errors($skip,$day_mysql);
    break;
  case 'chyby dnes':
    $day= date('j.n.Y');
    $day_mysql= date('Y-m-d');
    $html.= "<h3 class='CTitle'>Chybová hlášení $APLIKACE $day </h3>";
    $html.= sys_day_errors($skip,$day_mysql);
    break;
  case 'chyby vcera':
    $day= date('j.n.Y',mktime(0,0,0,date("m"),date("d")-1,date("Y")));
    $day_mysql= date('Y-m-d',mktime(0,0,0,date("m"),date("d")-1,date("Y")));
    $html.= "<h3 class='CTitle'>Chybová hlášení $APLIKACE $day </h3>";
    $html.= sys_day_errors($skip,$day_mysql);
    break;
  case 'chyby tyden':
    $day= date('j.n.Y',mktime(0,0,0,date("m"),date("d")-8,date("Y")));
    $day_mysql= date('Y-m-d',mktime(0,0,0,date("m"),date("d")-8,date("Y")));
    $html.= "<h3 class='CTitle'>Chybová hlášení $APLIKACE od $day </h3>";
    $html.= sys_day_errors($skip,$day_mysql,'>');
    break;
  case 'chyby mesic':
    $day= date('j.n.Y',mktime(0,0,0,date("m"),date("d")-32,date("Y")));
    $day_mysql= date('Y-m-d',mktime(0,0,0,date("m"),date("d")-32,date("Y")));
    $html.= "<h3 class='CTitle'>Chybová hlášení $APLIKACE od $day </h3>";
    $html.= sys_day_errors($skip,$day_mysql,'>');
    break;
  case 'chyby vsechny':
    $html.= "<h3 class='CTitle'>Všechna chybová hlášení $APLIKACE </h3>";
    $html.= sys_day_errors($skip,$day_mysql,'all');
    break;
  case 'chyby BUG1':
    $html.= "<h3 class='CTitle'>Nevyřešené chyby $APLIKACE klasifikované jako BUG</h3>";
    $html.= sys_bugs(1);
    break;
  case 'chyby BUG2':
    $html.= "<h3 class='CTitle'>Vyřešené chyby $APLIKACE klasifikované jako BUG</h3>";
    $html.= sys_bugs(2);
    break;
  # -------------------------------- logins
  case 'login den':
    $day= $den;
    $day_mysql= sql_date($den,1);
    $html.= "<h3 class='CTitle'>Přihlášení $APLIKACE $day </h3>";
    $html.= sys_day_logins($skip,$day_mysql);
    break;
  case 'login dnes':
    $day= date('j.n.Y');
    $day_mysql= date('Y-m-d');
    $html.= "<h3 class='CTitle'>Přihlášení $APLIKACE $day </h3>";
    $html.= sys_day_logins($skip,$day_mysql);
    break;
  case 'login vcera':
    $day= date('j.n.Y',mktime(0,0,0,date("m"),date("d")-1,date("Y")));
    $day_mysql= date('Y-m-d',mktime(0,0,0,date("m"),date("d")-1,date("Y")));
    $html.= "<h3 class='CTitle'>Přihlášení $APLIKACE $day </h3>";
    $html.= sys_day_logins($skip,$day_mysql);
    break;
  case 'login tyden':
    $day= date('j.n.Y',mktime(0,0,0,date("m"),date("d")-8,date("Y")));
    $day_mysql= date('Y-m-d',mktime(0,0,0,date("m"),date("d")-8,date("Y")));
    $html.= "<h3 class='CTitle'>Přihlášení $APLIKACE od $day </h3>";
    $html.= sys_day_logins($skip,$day_mysql,'>');
    break;
  case 'login mesic':
    $day= date('j.n.Y',mktime(0,0,0,date("m"),date("d")-32,date("Y")));
    $day_mysql= date('Y-m-d',mktime(0,0,0,date("m"),date("d")-32,date("Y")));
    $html.= "<h3 class='CTitle'>Přihlášení $APLIKACE od $day </h3>";
    $html.= sys_day_logins($skip,$day_mysql,'>');
    break;
  case 'login vsechny':
    $html.= "<h3 class='CTitle'>Všechna přihlášení $APLIKACE </h3>";
    $html.= sys_day_logins($skip,$day_mysql,'all');
    break;
  }
  $html.= "</div>";
  return $html;
}
# -------------------------------------------------------------------------------------------------- sys_day_modules
# vygeneruje podrobný přehled aktivity modulů pro daný den
function sys_day_modules($skip,$day,$short=false) {
  global $user_options, $USER;
  $touch= array();
  $hours= array();
  $and=  $skip ? "AND NOT FIND_IN_SET(user,'$skip')" : '';
  $qry= "SELECT day,hour(time) as hour,user,module,menu,count(*) as c,msg FROM _touch
         WHERE day='$day' AND user!='' $and
         GROUP BY module,menu,user,hour(time) ORDER BY module,menu";
  $res= mysql_qry($qry);
  while ( $res &&$row= mysql_fetch_assoc($res) ) {
    $user= $row['user'];
    $hour= $row['hour'];
    $hours[$hour]= true;
    $module= $row['module'];
    $menu= $row['menu'];
    $ip= $row['msg'];
    if ( $short ) {
      $ids= explode('.',$menu);
      $menu= $ids[0];
    }
    $c= $row['c'];
    if ( !$touch[$menu] ) $touch[$menu]= array(array());
    if ( strpos($touch[$menu][$hour][0],$user)==false )
      $touch[$menu][$hour][0].= $user=="---" ? " $ip" : " $user";
  }
  $html= sys_table($touch,$hours,'module','#dce7f4');
  return $html;
}
# -------------------------------------------------------------------------------------------------- sys_days_modules
# vygeneruje podrobný přehled aktivity modulů pro dané období (počátek a délka)
function sys_days_modules($skip,$day,$ndays,$short=false) {
  global $user_options, $USER;
  $touch= array();
  $days= array();
  $and=  $skip ? "AND NOT FIND_IN_SET(user,'$skip')" : '';
  $qry= "SELECT day,user,module,menu,count(*) as c FROM _touch
         WHERE day BETWEEN '$day'-INTERVAL $ndays DAY AND '$day' AND user!='' /*AND module='block'*/ $and
         GROUP BY module,menu,user,day ORDER BY module,menu";
  $res= mysql_qry($qry);
  while ( $res &&$row= mysql_fetch_assoc($res) ) {
    $user= $row['user'];
    $day= $row['day'];
    $days[$day]= true;
    $module= $row['module'];
    $menu= $row['menu'];
    if ( $short ) {
      $ids= explode('.',$menu);
      $menu= $ids[0];
    }
//                                                 display("den=$day");
    $c= $row['c'];
    if ( !$touch[$menu] ) $touch[$menu]= array();
    if ( !$touch[$menu][$day] ) $touch[$menu][$day]= array();
    if ( strpos($touch[$menu][$day][0],$user)==false )
      $touch[$menu][$day][0].= " $user";
  }
//                                                 debug($touch,'$touch');
  $html= sys_days_table($touch,$days,'module','#dce7f4');
  return $html;
}
# -------------------------------------------------------------------------------------------------- sys_day_users
# vygeneruje přehled aktivit uživatelů pro daný den
function sys_day_users($skip,$day,$short=false) {  trace();
  global $user_options, $USER;
  $touch= array();
  $hours= array();
  $AND=  $skip     ? "AND NOT FIND_IN_SET(user,'$skip')" : '';
  $AND=  $short==2 ? "AND module='speed' " : '';
  $qry= "SELECT day,hour(time) as hour,user,module,menu,count(*) as c,sum(hits) as h,
         GROUP_CONCAT(msg SEPARATOR ';') AS _speed FROM _touch
         WHERE day='$day' AND user!='' $AND GROUP BY user,module,menu,hour(time) ORDER BY user,hour";
  $res= mysql_qry($qry);
  while ( $res && $row= mysql_fetch_assoc($res) ) {
    $user= $row['user'];
    $hour= $row['hour'];
    $hours[$hour]= true;
    $module= $row['module'];
    $menu= $row['menu'];
    if ( $short==1 ) {
      $ids= explode('.',$menu);
      $menu= $ids[0];
      $menu= strtr($menu,array("login"=>"&lt;","timeout"=>'&gt;'));
    }
    elseif ( $short==2 ) {
      $menu= str_replace(',','<br>',$row['_speed']);
    }
    $c= $row['c'];
    $h= $row['h'];
    if ( !$touch[$user] ) $touch[$user]= array();
    if ( !$touch[$user][$hour] ) $touch[$user][$hour]= array();
    if ( !isset($touch[$user][$hour]['touch'][$menu]) )
      $touch[$user][$hour]['touch'][$menu]= 1;
    $touch[$user][$hour]['touch'][$menu]+= $h;
  }
  // použít tabulku barev, je-li v config
  $html= sys_table($touch,$hours,$short==2?'speed':'user','#e7e7e7',true);
  return $html;
}
# -------------------------------------------------------------------------------------------------- sys_days_users
# vygeneruje přehled aktivit uživatelů pro dané období (počátek a délka)
function sys_days_users($skip,$day,$ndays,$short=false) {
  global $user_options, $USER;
  $touch= array();
  $days= array();
  $AND=  $skip     ? "AND NOT FIND_IN_SET(user,'$skip')" : '';
  $AND=  $short==2 ? "AND module='speed' " : '';
  $qry= "SELECT day,user,module,menu,count(*) as c,sum(hits) as h,
         GROUP_CONCAT(msg SEPARATOR ';') AS _speed FROM _touch
         WHERE day BETWEEN '$day'-INTERVAL $ndays DAY AND '$day' AND user!='' $AND
         GROUP BY user,module,menu,day ORDER BY user,day";
  $res= mysql_qry($qry);
  while ( $res &&$row= mysql_fetch_assoc($res) ) {
    $user= $row['user'];
    $day= $row['day'];
    $days[$day]= true;
    $module= $row['module'];
    $menu= $row['menu'];
    if ( $short==1 ) {
      $ids= explode('.',$menu);
      $menu= $ids[0];
      $menu= strtr($menu,array("login"=>'&lt;',"timeout"=>'&gt;'));
    }
    elseif ( $short==2 ) {
      $menu= "";
      $speeds= $row['_speed'];
      $amenu= array();
      if ( $speeds ) {
        foreach (explode(';',$speeds) as $speed) {
          foreach (explode(',',$speed) as $i=>$x) {
            $amenu[$i]+= $x;
          }
        }
//                                                 debug($amenu,$speeds);
        $del= "";
        foreach ($amenu as $x) {
          $menu.= "$del$x";
          $del= "<br>";
        }
      }
    }
    $c= $row['c'];
    $h= $row['h'];
//     if ( $module  ) {
      if ( !$touch[$user] ) $touch[$user]= array();
      if ( !$touch[$user][$day] ) $touch[$user][$day]= array();
      if ( !isset($touch[$user][$day]['touch'][$menu]) )
        $touch[$user][$day]['touch'][$menu]= 1;
      $touch[$user][$day]['touch'][$menu]+= $h;
  }
//                                                 debug($touch,'$touch');
  // použít tabulku barev, je-li v config
  $html= sys_days_table($touch,$days,$short==2?'speed':'user','#e7e7e7',true);
  return $html;
}
# -------------------------------------------------------------------------------------------------- sys_bugs
# vygeneruje přehled BUGs
#   _touch.level == 1 BUG čekající na vyřešení
#   _touch.level == 2 BUG opravená
function sys_bugs($level) {
  global $user_options;
  $n= 0;
  $html.= '<dl>';
  $qry= "SELECT max(level) as bug, min(id_touch) as id, msg,
           group_concat(day,' ',time,' ',user,' ',module,' ',menu) as popis
         FROM _touch WHERE msg!='' GROUP BY msg HAVING bug=$level ORDER BY day DESC";
  $res= mysql_qry($qry);
  while ( $res &&$row= mysql_fetch_assoc($res) ) {
    $n++;
    $popis= $row['popis'];
    $id= $row['id'];
    $bug= $row['bug'];
    $msg= $row['msg'];
    // generování
    $color= $bug==1 ? '#fb6' : ($bug==2 ? '#6f6' : '#eee');
    $mark= $bug>0 ? "BUG#$id" : '';
    $html.= <<<__JS
    <dt style='background-color:$color;cursor:default;' oncontextmenu="
      Ezer.fce.contextmenu([
        ['označit jako BUG',function(el){
            el.style.backgroundColor='#fb6';Ezer.fce.touch('server','sys_day_error',[$id,1]);}],
        ['BUG je opravený',function(el){
            el.style.backgroundColor='#6f6';Ezer.fce.touch('server','sys_day_error',[$id,2]);}],
        ['smazat toto hlášení',function(el){
            el.style.backgroundColor='#eee';Ezer.fce.touch('server','sys_day_error',[$id,3]);}]
      ],arguments[0]);return false;">
      $mark $popis $module $menu</dt><dd>$msg</dd>
__JS
    ;                                           //<dd>$msg</dd>
  }
  $result= $n ? "celkem $n" : "nic";
  return $result.$html;
}
# -------------------------------------------------------------------------------------------------- sys_day_logins
# vygeneruje přehled přihlášení pro daný den
#   $sign= 'all' => všechno
function sys_day_logins($skip,$day,$sign='=') {
//                                                         display("sys_day_logins($day,$sign)");
  global $user_options, $USER;
  $max_len= 512;
  $n= 0;
  $and=  $skip ? "AND NOT FIND_IN_SET(user,'$skip')" : '';
  $html.= '<dl>';
  $cond= $sign=='all' ? '1' : "day$sign'$day'";
  $qry= "SELECT id_touch, msg, day, time, user, menu
         FROM _touch WHERE $cond AND msg!='' AND menu IN ('login','acount?') $and
         ORDER BY day DESC,time DESC";
  $res= mysql_qry($qry);
  while ( $res && $t= mysql_fetch_object($res) ) {
    $n++;
    list($user,$ip,$body,$screen,$browser)= explode('|',$t->msg);
    $when=  $sign=='=' ? $t->time : "{$t->day} {$t->time}";
    // generování
    $color= $t->menu=='acount?' ? '#fb6' : '#eee';
    $html.= "<dt style='background-color:$color'>$when $user $ip $body $screen</dt>
             <dd>$browser</dd>";
  }
  $html.= '</dl>';
  $result= $n ? "$n přihlášení" : "bez přihlášení";
  return $result.$html;
}
# -------------------------------------------------------------------------------------------------- sys_day_errors
# vygeneruje přehled chyb pro daný den
#   $sign= 'all' => všechno
function sys_day_errors($skip,$day,$sign='=') {
//                                                         display("sys_day_errors($day,$sign)");
  global $user_options, $USER;
  $max_len= 512;
  $n= 0;
  $and=  $skip ? "AND NOT FIND_IN_SET(user,'$skip')" : '';
  $html.= '<dl>';
  $day1= $sign=='=' ? '' : "day,' ',";
  $cond= $sign=='all' ? '1' : "day$sign'$day'";
  $qry= "SELECT max(level) as bug, min(id_touch) as id, msg,
           group_concat($day1 time,' ',user,' ',module,' ',menu) as popis
         FROM _touch WHERE $cond AND msg!='' AND user!='---' AND module!='speed' AND menu!='login' $and
         GROUP BY msg ORDER BY day DESC";
  $res= mysql_qry($qry);
  while ( $res &&$row= mysql_fetch_assoc($res) ) {
    $n++;
    $popis= $row['popis'];
    $id= $row['id'];
    $bug= $row['bug'];
    $msg= $row['msg'];
    $msg= strtr($msg,array('<'=>'&lt;','>'=>'&gt;'));
    if ( strlen($msg)>$max_len ) $msg= substr($msg,0,$max_len).' ...';
    // generování
    $color= $bug==1 ? '#fb6' : ($bug==2 ? '#6f6' : '#eee');
    $mark= $bug>0 ? "BUG#$id" : '';
    $html.= <<<__JS
    <dt style='background-color:$color;cursor:default;' oncontextmenu="
      Ezer.fce.contextmenu([
        ['označit jako BUG',function(el){
            el.style.backgroundColor='#fb6';Ezer.fce.touch('server','sys_day_error',[$id,1]);}],
        ['BUG je opravený',function(el){
            el.style.backgroundColor='#6f6';Ezer.fce.touch('server','sys_day_error',[$id,2]);}],
        ['smazat toto hlášení',function(el){
            el.style.backgroundColor='#eee';Ezer.fce.touch('server','sys_day_error',[$id,3]);}],
        ['ukázat plný text v trace',function(el){
            el.style.backgroundColor='#eee';Ezer.fce.touch('server','sys_day_error',[$id,4]);}]
      ],arguments[0]);return false;">
      $mark $popis $module $menu</dt><dd>$msg</dd>
__JS
    ;                                           //<dd>$msg</dd>
  }
  $html.= '</dl>';
  $result= $n ? "$n hlášení chyb" : "bez hlášení chyby";
  return $result.$html;
}
# -------------------------------------------------------------------------------------------------- sys_day_error
# callback funkce ze sys_day_errors
function sys_day_error($id,$akce) {
//                                                 display("sys_day_error($id,$akce)");
  switch ( $akce ) {
  case 1:       // označit jako BUG
    $qry= "UPDATE _touch SET level=1 WHERE id_touch=$id";
    $res= mysql_qry($qry);
    break;
  case 2:       // označit jako opravený BUG
    $qry= "UPDATE _touch SET level=2 WHERE id_touch=$id";
    $res= mysql_qry($qry);
    break;
  case 3:       // smazat
    $qry= "SELECT group_concat(id_touch) AS ids FROM _touch WHERE msg="
      . "(SELECT msg FROM _touch WHERE id_touch=$id)";
    $res= mysql_qry($qry);
    if ( $res &&$row= mysql_fetch_assoc($res) ) {
      $ids= $row['ids'];
      $qry= "DELETE FROM _touch WHERE FIND_IN_SET(id_touch,'$ids')";
      $res= mysql_qry($qry);
//                                                 display("sys_day_error($id,$akce)=$ids");
    }
    break;
  case 4:       // plný text
    $qry= "SELECT * FROM _touch WHERE id_touch=$id";
    $res= mysql_qry($qry);
    if ( $res && $row= mysql_fetch_assoc($res) ) {
      debug($row);
    }
    break;
  }
  return '';
}
# -------------------------------------------------------------------------------------------------- sys_table
# zobrazí přehled aktivit pro daný den, pokud není uvedeno $color, použije se definice barev
# z $ezer_root.php $EZER->activity->colors= "80:#f0d7e4,40:#e0d7e4,20:#dce7f4,0:#e7e7e7"; (sestupně)
# (pokud je h>hi použije se jako podklad colori)
# $type= user|module
function sys_table($touch,$hours,$type,$color,$config_colors=false) { #trace();
//                                                 display("sys_table($touch,$hours,$color,$config_colors)");
  $tab= '';
  // tabulka barev pro hit>0
  global $EZER;
  $colors= array();
  if ( $config_colors ) {
    foreach ( explode(',',$EZER->activity->colors) as $mezclr) {
      list($mez,$clr)= explode(':',$mezclr);
      $colors[$mez]= $clr;
    }
  }
  $colors[0]= '#e7e7e7';  // zarážka nakonec
//                                                 debug($colors);
  // vykreslení tabulky
  if ( $hour_min <= $hour_max ) {
    $wt= '100%';
    $wt= '';
    $wh= 100/($hour_max-$hour_min+1).'%';
    $wh= 50;
    // čas
    $tab.= "<table width='$wt' class='systable'><tr><th width='50'></th>";
    for ($h= 0; $h<=24; $h++) if ( $hours[$h] ) $tab.= "<th width='$wh'>$h</th>";
    $tab.= "</tr>";
    // uživatelé
//                                                 debug($touch,'$touch');
    foreach ( $touch as $user => $activity ) {
      $tab.= "<tr><td>$user</td>";
      for ($h= 0; $h<=24; $h++) if ( $hours[$h] )  {
        switch ( $type ) {
        case 'module':
          $act= $activity[$h][0] ? $activity[$h][0] : "";
          $bg= $act ? "bgcolor='$color'" : '';
          $tab.= "<td $bg>$act</td>";
          break;
        case 'speed':
        case 'user':
          if ( $activity[$h] ) {
            $act= implode(' ',array_keys($activity[$h]['touch']));
            $hit= array_sum($activity[$h]['touch']);
            $tit= '';
            foreach ($activity[$h]['touch'] as $menu => $menu_hit ) {
              $tit.= " $menu_hit*$menu ";
            }
            $bg= $type=='speed' ? "align='right' " : '';
            if ( $act ) {
              // volba barvy
              foreach ($colors as $mez => $clr) {
                if ( $hit>=$mez ) {
                  $bg.= "bgcolor='$clr'";
                  break;
                }
              }
            }
            $title= $type=='speed' ? "" : "$tit, celkem $hit";
            $tab.= "<td $bg title='$title'>$act</td>";
          }
          else
            $tab.= "<td></td>";
          break;
        }
      }
      $tab.= "</tr>";
    }
    $tab.= "</table>";
  }
  $tab= "<div class='systable'>$tab</div>";
  return $tab;
}
# -------------------------------------------------------------------------------------------------- sys_days_table
# zobrazí přehled aktivit pro období, pokud není uvedeno $color, použije se definice barev
# z $ezer_root.php $EZER->activity->colors= "80:#f0d7e4,40:#e0d7e4,20:#dce7f4,0:#e7e7e7"; (sestupně)
# (pokud je h>hi použije se jako podklad colori)
# $type= user|module
function sys_days_table($touch,$days,$type,$color,$config_colors=false) { #trace();
//                                                 display("sys_table($touch,$hours,$color,$config_colors)");
  $tab= '';
  // tabulka barev pro hit>0
  global $EZER;
  $colors= array();
  if ( $config_colors ) {
    foreach ( explode(',',$EZER->activity->colors) as $mezclr) {
      list($mez,$clr)= explode(':',$mezclr);
      $colors[$mez]= $clr;
    }
  }
  $colors[0]= '#e7e7e7';  // zarážka nakonec
//                                                 debug($colors);
  $xdays= array();
  foreach ( $touch as $user => $activity ) {
    foreach ($activity as $day => $desc ) {
      if ( !$xdays[$day] ) {
        $date= mktime(0,0,0,substr($day,5,2),substr($day,8,2),substr($day,0,4));
        $xdays[$day]= $date;
      }
    }
  }
  krsort($xdays);
  // vykreslení tabulky
  $wt= '100%';
  $wt= '';
//   $wh= $xdays ? 100/count($xdays).'%' : '50';
  $wh= 50;
  // čas
  $tab.= "<table width='$wt' class='systable'><tr><th width='50'></th>";
  foreach ($xdays as $day=>$date) $tab.= "<th width='$wh'>".date('d/m',$date)."</th>";
  $tab.= "</tr>";
  foreach ( $touch as $user => $activity ) {
    $tab.= "<tr><td>$user</td>";
    foreach ($xdays as $h=>$disp) {
      switch ( $type ) {
      case 'module':
        $act= $activity[$h][0] ? $activity[$h][0] : "";
        $bg= $act ? "bgcolor='$color'" : '';
        $tab.= "<td $bg>$act</td>";
        break;
      case 'speed':
      case 'user':
        if ( $activity[$h] ) {
          $act= implode(' ',array_keys($activity[$h]['touch']));
          $hit= array_sum($activity[$h]['touch']);
          $tit= '';
          foreach ($activity[$h]['touch'] as $menu => $menu_hit ) {
            $tit.= " $menu_hit*$menu ";
          }
          $bg= $type=='speed' ? "align='right' " : '';
          if ( $act ) {
            // volba barvy
            foreach ($colors as $mez => $clr) {
              if ( $hit>=$mez ) {
                $bg.= "bgcolor='$clr'";
                break;
              }
            }
          }
          $title= $type=='speed' ? "" : "$tit, celkem $hit";
          $tab.= "<td $bg title='$title'>$act</td>";
        }
        else
          $tab.= "<td></td>";
        break;
      }
    }
    $tab.= "</tr>";
  }
  $tab.= "</table>";
  $tab= "<div class='systable'>$tab</div>";
  return $tab;
}
/** ================================================================================================ POŽADAVKY */
# -------------------------------------------------------------------------------------------------- sys_todo_notify
# pošle mail na adresu
#  $type= new|upd|att
# změna stavu = změna pole stav nebo změna některého z polí kdy_...
function sys_todo_notify($type,$id_todo,$chng) { trace();
  global $EZER, $ezer_root;
  $todo= sql_query("SELECT * FROM _todo WHERE id_todo=$id_todo");
                                                        debug($chng,"sys_todo_notify($type,$id_todo)");
  $email= $type=='new' ? $EZER->options->mail : $todo->email;
  // poslat nový nebo chce-li se při každé změně nebo při změně stavu
  $poslat= $type=='new' || $todo->email_kdyz==1 || $chng->stav && $todo->stav!=$chng->stav;
  if ( !$poslat && $todo->email_kdyz==2 && $chng ) {
    // posoudíme další změnu stavu - pole kdy_...
    foreach($chng as $id=>$val) {
      if ( substr($id,0,4)=='kdy_' ) {
        $poslat= true;
        break;
      }
    }
  }
  if ( $email && $poslat ) {
    // vytvoření mailu
    $head= $type=='new' ? "nový požadavek" : ( $type=='att' ? "doplněna příloha k požadavku"
      : ($todo->email_kdyz==1 ? "změna požadavku" : "změna stavu požadavku"));
    $subject= "Ezer/$ezer_root NOTIFY:$head $id_todo";
    $html= debugx($chng);
    // poslání mailu - jako odesílatel bude první ze seznamu
    list($from)= explode(',',$email);
    send_mail($subject,$html,$from,$email);   // funkce z ae_slib.php
  }
  return 1;
}
# -------------------------------------------------------------------------------------------------- sys_todo_attach
# přidá přílohu k požadavku jako odkaz, soubor bude v docs/todo
function sys_todo_attach($id_todo,$fileinfo) {
  global $ezer_path_root;
  $f= pathinfo($fileinfo->name);
  $name= utf2ascii($f['filename']).".".date("Ymd_Hi").".{$f['extension']}";
  $path= "$ezer_path_root/docs/todo/$name";
  $ref=  "docs/todo/$name";
  $data64= $fileinfo->text;
  // uložení souboru
  $data= base64_decode($data64);
  $bytes= file_put_contents($path,$data);
  // nalezení záznamu v _todo a přidání názvu souboru
  $names= select('attach','_todo',"id_todo=$id_todo");
  $names= $names ? "$names,$name" : $name;
  query("UPDATE _todo SET attach='$names' WHERE id_todo=$id_todo");
  $refs= sys_todo_refs($names);
  return $refs;
}
# -------------------------------------------------------------------------------------------------- sys_todo_refs
# převede seznam jmen na odkazy
function sys_todo_refs($names) {
  $refs= array();
  foreach(explode(',',$names) as $name) {
    $href= "docs/todo/$name";
    $f= explode('.',$name);
    array_splice($f,count($f)-2,1);
    $ref= implode('.',$f);
    $ref= "<a href='$href' title='$name' target='todo'>$ref</a>";
    $refs[]= $ref;
  }
  return implode('<br>',$refs);
}
# -------------------------------------------------------------------------------------------------- sys_todo_conds
# vrátí první podmínky vyhovující skill uživatele z polí $EZER->todo->select,$EZER->todo->browse
# pro zobrazení požadavků ve tvaru {cond_select:cond,cond_browse:cond}
function sys_todo_conds() {
  global $EZER,$USER;
  $obj= (object)array('cond_select'=>1,'cond_browse'=>1);
  $skills= explode(' ',$USER->skills);
  foreach($obj as $x=>$y) {
    foreach(explode(';',$EZER->todo->$x) as $parts) {
      list($skill,$cond)= explode(':',$parts);
      if ( in_array(trim($skill),$skills) ) {
        $obj->$x= $cond;
        break;
      }
    }
  }
                                                        debug($obj,"sys_todo_conds");
  return $obj;
}
?>
