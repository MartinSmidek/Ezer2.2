<?php # (c) 2008 Martin Smidek <martin@smidek.eu>
  error_reporting(E_ALL & ~E_NOTICE);
  # ------------------------------------------------------------------------------------------------ paths, globals
  # globální objekty ($json bude v PHP6 zrušeno)
  global $ezer_root, $ezer_path_serv, $ezer_path_appl, $ezer_path_root, $ezer_db, $ezer_system;
  global $json, $USER, $EZER, $ezer_user_id;
  # ------------------------------------------------------------------------------------------------ requires
  # vložení a inicializace balíků
  $ezer_root= $_POST['root'];                        // jméno adresáře a hlavního objektu aplikace
  if ( !$ezer_root ) $ezer_root= $_GET['root'];
  $ezer_session= $_POST['session'];                  // způsob práce se $_SESSION php|ezer
  if ( !$ezer_session ) $ezer_session= $_GET['session'];
  # ------------------------------------------------------------------------------------------------ session
  # session - vlastní nebo standardní obsluha $_SESSION
  if ( $ezer_session=='ezer' ) {
    require_once("$ezer_path_serv/session.php");
    sess_start(); // obsahuje volání session_start()
  }
  else {
    session_start(); // defaultní práce se session
    $USER= $_SESSION[$ezer_root]['USER'];
  }
  # ------------------------------------------------------------------------------------------------ root.ini
  require_once("./../../$ezer_root.inc");
  require_once("$ezer_path_serv/ae_slib.php");
  $php_start= getmicrotime();                        // měření času
//                                                         debug(array($mysql_db,$ezer_db),'tabulka databází $mysql_db,$ezer_db');
//                                                         debug($USER,"USER=$ezer_user_id,{$_SESSION['user_id']}");
//                                                         debug($_SESSION,"USER=$ezer_user_id,{$_SESSION['user_id']}");
  // licensované knihovny I
  require_once("$ezer_path_serv/licensed/JSON.php");
  $json= new Services_JSON();
  ezer_connect();
  # ------------------------------------------------------------------------------------------------ json ...
  if ( !function_exists("json_encode") ) {
    function json_encode ($x) {
      global $json;
      return $json->encode($x);
    }
    function json_decode ($x) {
      global $json;
      return $json->decode($x);
    }
  }
  # ------------------------------------------------------------------------------------------------ FancyUpload
  # zpracování požadavku na Upload
  if ( isset($_GET['upload']) ) {
    echo json_encode(upload());
    die;
  }
  # ------------------------------------------------------------------------------------------------ params
  # cmd    - příkaz
  # x      - parametry
  if (get_magic_quotes_gpc()) $_POST= stripSlashes_r($_POST);
//   $x= (object)$_POST;
  $x= array2object($_POST);
  switch ( $x->cmd ) {
  # ================================================================================================ VOLÁNÍ bez návratu
  # ------------------------------------------------------------------------------------------------ touch
  # touch : přijetí informace o práci se serverem
  case 'touch':
    if ( isset($x->logout) ) {
      $user= $_SESSION[$ezer_root]['user_id'];
      $ezer_user_id= $_SESSION[$ezer_root]['user_id']= $y->user_id= 0;
      $_SESSION[$ezer_root]['last_op'].= ' touch/logout';
//       $_SESSION[$ezer_root]= array();
//       if ( $ezer_session=='ezer' )
//         sess_start(); // obsahuje volání session_start()
//       else
//         session_start(); // defaultní práce se session
      $_SESSION[$ezer_root]['sess_state']= 'off';
      // zapiš do aktivity
      $day= date('Y-m-d');
      $time= date('H:i:s');
      $qry= "INSERT _touch (day,time,hits,user,module,menu) "
        . "VALUES ('$day','$time',0,'{$x->user_abbr}','app','timeout')";
      $res= mysql_query($qry);
      // zruš případné sdružené aplikace
      if  ( $_SESSION['group_login'] ) {
        foreach(explode(',',$_SESSION['group_login']) as $root) {
          if ( $root!=$ezer_root ) {
            $_SESSION[$ezer_root]= array('sess_state'=>"$user timeout $day $time due to $ezer_root");
          }
        }
      }
      // zruš session
      $_SESSION[$ezer_root]= array('sess_state'=>"{$_SESSION[$ezer_root]['user_id']} timeout $day $time");
      session_write_close();
//       $x1= session_destroy();
      break;
    }
    elseif ( isset($x->path) ) {
      // zápis do _user.options
      ezer_connect('ezer_system');      // používá se kvůli mysql_query
      $qry= "SELECT options FROM $ezer_system._user WHERE id_user={$x->user_id}";
      try {
        $res= @mysql_query($qry);       // nelze použit mysql_qry - neohlásila by se chyba
        if ( $res ) {
          $u= mysql_fetch_object($res);
          $options= $json->decode($u->options);
          $root= $EZER->options->root;
          if ( !$options->context ) $options->context= (object)array();
          $options->context->$root= $x->path;
          $options_s= ezer_json_encode($options);
          $qry= "UPDATE $ezer_system._user SET options='$options_s' WHERE id_user={$x->user_id}";
          $res= @mysql_query($qry);
        }
      }
      catch  (Exception $e) {  };
    }
    else {
      // zápis do sdílené tabulky
      $day= date('Y-m-d');
      $time= date('H:i:s');
      $text1= $text2= '';
      if ( $x->msg ) {
        $text1= ",msg";
        $text2= ',"'.strtr($x->msg,'"',"'").'"';
      }
//       if ( 1 ) {
//         $qry= "SELECT options FROM $ezer_system._user WHERE id_user={$x->user_id} ";
//         $q= isset($x->path) ? '+' : '-';
//         $text1= ",msg";
//         $text2= ",\"$q$qry".mysql_real_escape_string($json->encode($x)).'"';
//       }
      $qry= "INSERT _touch (day,time,hits,user,module,menu$text1) "
        . "VALUES ('$day','$time','{$x->hits}','{$x->user_abbr}','{$x->module}','{$x->menu}'$text2)";
      $res= mysql_query($qry);
    }
    header('Content-type: text/plain; charset=UTF-8');
    echo "-";
    exit;
  # ------------------------------------------------------------------------------------------------ chat
  # chat : pravidelná relace s klientem se vzkazy: relogme
  case 'chat':
    $answer= (object)array();
    switch ( $x->op ) {
//     case 'log_out':           // {op:'log_out});
//       $answer->msg= "timeout";
//       $answer->log_out= 1;
//       $user= $_SESSION[$ezer_root]['user_id'];
//       $ezer_user_id= $_SESSION[$ezer_root]['user_id']= $y->user_id= 0;
//       $_SESSION[$ezer_root]['last_op'].= ' log_out';
//       $_SESSION[$ezer_root]['sess_state']= 'off';
//       // zapiš do aktivity
//       $day= date('Y-m-d');
//       $time= date('H:i:s');
//       $qry= "INSERT _touch (day,time,hits,user,module,menu) "
//         . "VALUES ('$day','$time',0,'{$x->user_abbr}','app','timeout')";
//       $res= mysql_query($qry);
//       // zruš případné sdružené aplikace
//       if  ( $_SESSION['group_login'] ) {
//         foreach(explode(',',$_SESSION['group_login']) as $root) {
//           if ( $root!=$ezer_root ) {
//             $_SESSION[$ezer_root]= array('sess_state'=>"$user timeout $day $time due to $ezer_root");
//           }
//         }
//       }
//       // zruš session
//       $_SESSION[$ezer_root]= array('sess_state'=>"{$_SESSION[$ezer_root]['user_id']} timeout $day $time");
//       session_write_close();
// //       $x1= session_destroy();
//       break;
    case 're_log_me':         // {op:'re_log_me',user_id:...,hits:n});
      $_SESSION[$ezer_root]['relog']++;
      // obnova SESSION
      $ezer_user_id= $x->user_id;
      if ( $ezer_session=='ezer' )
        sess_revive();
      $_SESSION['ID']= session_id();
      session_regenerate_id();
      $answer->msg= "relog {$x->hits} ID:".session_id()." {$_SESSION[$ezer_root]['user_abbr']}";
      // kontrola verze
      check_version($answer);
      break;
    }
    header('Content-type: application/json; charset=UTF-8');
    echo $json->encode($answer);
    exit;
  # ------------------------------------------------------------------------------------------------ server
  # server(fce,args1, ...) -- zavolání funkce 'fce' na serveru bez navrácení výsledku
  # x: fce,args
  case 'server':
    chdir($ezer_path_root);
    try {
      $answer= (object)array();
      $fce= $x->fce;
      if ( function_exists($fce) )
        call_user_func_array($fce,(array)$x->args);
      else
        $answer->error= "SERVER: funkce '$fce' neexistuje";     // jen pro trasování
    }
    catch (Exception $e) {
      $answer->error= $e->getMessage();                         // jen pro trasování
    }
    header('Content-type: application/json; charset=UTF-8');    // jen pro trasování
    echo $json->encode($answer);
    exit;
  }
  # ================================================================================================ VOLÁNÍ s návratem
  // vlastní knihovny
  $_SESSION[$ezer_root]['touch']= date("j.n.Y H:i:s");
  $_SESSION[$ezer_root]['call']= isset($_SESSION[$ezer_root]['call']) ? 1+$_SESSION[$ezer_root]['call'] : 1;
  require_once("$ezer_path_serv/ae_slib.php");
  require_once("$ezer_path_serv/reference.php");
  require_once("$ezer_path_serv/sys_doc.php");
  chdir($ezer_path_root);
  $y= (object)array();
  $y->cmd= $x->cmd;
  $totrace= $x->totrace;                // kopie ae_trace: používá se k omezení trasovacích informací
  $y->qry_ms= 0;
  switch ( $x->cmd ) {
  # ================================================================================================ VOLÁNÍ z EZER
  # ------------------------------------------------------------------------------------------------ touch
  # touch : přijetí informace o práci se serverem
//   case 'touch':
//     // zápis do sdílené tabulky
//     $day= date('Y-m-d');
//     $time= date('H:i:s');
//     $user= $x->user_abbr;
//     $text1= $text2= '';
//     if ( $x->msg ) {
//       $text1= ",msg";
//       $text2= ',"'.strtr($x->msg,'"',"'").'"';
//     }
//     $qry= "INSERT _touch (day,time,hits,user,module,menu$text1) "
//       . "VALUES ('$day','$time','{$x->hits}','$user','{$x->module}','{$x->menu}'$text2)";
//     $res= mysql_query($qry);
//     return;
  # ------------------------------------------------------------------------------------------------ ask
  # ask(fce,args1, ...) -- zavolání funkce 'fce' na serveru
  # x: fce,args
  # y: value
  case 'ask':
    global $trace_parm;
    try {
      $fce= $x->fce;
      $ok= function_exists($fce);
      if ( !$ok ) {
        list($class,$meth)= explode('::',$fce);
        $ok= method_exists($class,$meth);
        $fce= array($class,$meth);
      }
      if ( $ok ) {
//                                                         display("ask $fce");
        // předání parametrů včetně chybějících hodnot
        $args= array();
        for ($i= 0; $i<$x->nargs; $i++) {
          $args[$i]= isset($x->args->$i) ? $x->args->$i : null;
        }
//                                                         debug($args,"ask $fce/{$x->nargs}");
        if ( $x->lc ) $trace_parm= " &laquo; {$x->lc}";
        $val= call_user_func_array($fce,$args);
        $y->value= $val;// win2utf($val);
      }
      else fce_error("ask: funkce '{$x->fce}' neexistuje");
      $y->args= $x->args;
    }
    catch (Exception $e) {
      $y->error= $e->getMessage();
    }
    break;
  # ------------------------------------------------------------------------------------------------ time
  case 'time':
    $y->y= date('H:i:s');
    break;
  # ------------------------------------------------------------------------------------------------ delete_record
  # smaže záznam vyhovující podmínce, kontroluje, zda je právě jeden takový, jinak ohlásí chybu
  // x: table, cond, count
  // y: ok
  case 'delete_record':
    if ( $x->db ) ezer_connect($x->db);
    // zjištění správného počtu před smazáním
    $y->ok= 0;
    $db= $x->db ? $x->db : $mysql_db; $table= ($ezer_db[$db][5] ? $ezer_db[$db][5] : $db).'.'.$x->table;
    if ( ($count= $x->count) ) {
      $qry= "SELECT count(*) AS _pocet FROM $table WHERE {$x->cond} ";
      $res= mysql_qry($qry);
      if ( $res ) {
        $obj= mysql_fetch_assoc($res);
        if ( $obj->_pocet<=$x->count ) {
          $qryd= "DELETE FROM $table WHERE {$x->cond} LIMIT {$x->count}";
          $resd= mysql_qry($qryd);
          $y->ok= $resd ? 1 : 0;
        }
        else fce_error("delete_record: pokus o smazání {$obj->_pocet} záznamů");
      }
    }
    break;
  # ------------------------------------------------------------------------------------------------ insert_record
  # přidá záznam
  // x: table, par
  // y: vytvořený záznam
  case 'insert_record':
    if ( $x->db ) ezer_connect($x->db);
    $y->ok= 0;
    $db= $x->db ? $x->db : $mysql_db;
    $table= ($ezer_db[$db][5] ? $ezer_db[$db][5] : $db).'.'.$x->table;
    $ids= $vals= ''; $del= '';
    foreach($x->par as $id=>$val) {
      $ids.= "$del$id";
      $vals.= "$del\"".mysql_real_escape_string($val)."\"";
      $del= ',';
    }
    if ( $ids ) {
      $qry= "INSERT INTO $table ($ids) VALUES ($vals) ";
      $res= mysql_qry($qry);
      $n= mysql_insert_id();
      $y->ok= $res ? ($n ? $n : 1) : 0;
    }
    break;
  # ------------------------------------------------------------------------------------------------ form_insert
  # úschova nových hodnot do existujícího záznamu (mode=a vyvolá připojení hodnoty ke stávající)
  // x: db,table, fields ; fields=[...{id:field,val[,pipe]...]
  // y: qry, err, key
  case 'form_insert':
    if ( $x->db ) ezer_connect($x->db);
    $zmeny= array();
    $db= $x->db ? $x->db : $mysql_db; $table= ($ezer_db[$db][5] ? $ezer_db[$db][5] : $db).'.'.$x->table;
    if ( $x->fields ) {
      foreach ($x->fields as $desc) {
        $fld= $desc->id;
        $val= $desc->val;
        if ( $desc->pipe ) { $pipe= $desc->pipe; $val= $pipe($val,1); }
        $zmeny[]= (object)array('fld'=>$fld,'op'=>'i','val'=>$val);
      }
      // insert do tabulky, klíč musí být tvaru id_$table (zdvojení _ je přípustné), vrací nový klíč
      $y->key_id= $x->key_id;
      $y->key= ezer_qry("INSERT",$table,0,$zmeny);
      $y->rows= $y->key ? 1 : 0;
    }
    else
      $y->rows= 0;
    break;
  # ------------------------------------------------------------------------------------------------ form_save
  # úschova nových hodnot do existujícího záznamu (mode=a vyvolá připojení hodnoty ke stávající)
  # x: table, key_id, key, fields ; fields=[...{id:field,val,oldval[,pipe][,mode='a'}...]
  # y: qry, err, rows
  # záznam do _track, pokud operace uspěje
  case 'form_save':
    if ( $x->db ) ezer_connect($x->db);
    $zmeny= array();
    $db= $x->db ? $x->db : $mysql_db; $table= ($ezer_db[$db][5] ? $ezer_db[$db][5] : $db).'.'.$x->table;
    foreach ($x->fields as $desc) {
      $fld= $desc->id;
      $val= $desc->val;
      if ( $pipe= $desc->pipe ) { $val= $pipe($val,1); }
      if ( isset($desc->mode) && $desc->mode ) {
        $zmena= (object)array('fld'=>$fld,'op'=>$desc->mode,'val'=>$val);
        if ( isset($desc->row) ) {
          // row spolu s mode je pro chat
          $zmena= (object)array('fld'=>$fld,'op'=>$desc->mode,'val'=>$val,'row'=>$desc->row);
          if ( isset($desc->old) ) $zmena->old= $desc->old;
        }
        $zmeny[]= $zmena;
      }
      else {
        if ( isset($desc->old) && !$pipe )  // pokud je sql_pipe nelze srovnat původní hodnotu
          $zmeny[]= (object)array('fld'=>$fld,'op'=>'u','val'=>$val,'old'=>$desc->old);
        else
          $zmeny[]= (object)array('fld'=>$fld,'op'=>'i','val'=>$val);
      }
    }
    // update tabulky, klíč musí být tvaru id_$table (zdvojení _ je přípustné), vrací 1 nebo chybu
    $y->rows= ezer_qry("UPDATE",$table,$x->key,$zmeny,$x->key_id);
    $y->key= $x->key;
    break;
  # ------------------------------------------------------------------------------------------------ form_load
  # x: table, key_id, key, [cond,] fields
  # y: values, key
  case 'form_load':
    $fields= ''; $del= '';
    if ( $x->db ) ezer_connect($x->db);
    $db= $x->db ? $x->db : $mysql_db; $table= ($ezer_db[$db][5] ? $ezer_db[$db][5] : $db).'.'.$x->table;
    $y->key= 0;
    foreach ($x->fields as $desc) {
      if ( $desc->expr ) { $f= $desc->id; $fields.= "$del{$desc->expr} as $f"; }
      elseif ( $f= $desc->id ) { $fields.= "$del{$desc->field} as $f"; }
      else { $f= $desc->field; $fields.= "$del$f"; }
      if ( $p= $desc->pipe ) $pipe[$f]= $p;
      $del= ',';
    }
    // kontrukce podminky
    $atable= explode(' AS ',$table);
    $key_id= ($atable[1] ? "{$atable[1]}." : '') . $x->key_id;
    if ( !($xcond= $x->cond) ) {
      $xcond= "$key_id={$x->key}";
    }
    // konstrukce JOIN
    $joins= '';
    if ( $xjoins= $x->joins ) foreach ( $xjoins as $join ) $joins.= " $join";
    $qry= "SELECT $fields,$key_id as the_key FROM $table $joins WHERE $xcond ";
    $res= mysql_qry($qry,$xcond ? 0 : 1);
    if ( $res ) {
      $row= mysql_fetch_assoc($res);
      if ( $row ) {
        foreach ($row as $f => $val) {
          if ( $pipe[$f] ) $val= $pipe[$f]($val);
          $y->values[$f]= $val;
        }
        $y->key= $row['the_key'];
      }
    }
    $y->key_id= $key_id;
    break;
  # ------------------------------------------------------------------------------------------------ form_make
  # form_make(fce,arg1, ...) -- zavolání funkce 'fce' na serveru
  # x: args -- args[0] je fce
  # y: value
  case 'form_make':
    if ( function_exists($x->fce) ) {
      $y->init= $x->init;
      $y->plain= $x->plain;
      // předání parametrů včetně chybějících hodnot
      $args= array();
      for ($i= 0; $i<$x->nargs; $i++) {
        $args[$i]= isset($x->args->$i) ? $x->args->$i : null;
      }
      call_user_func_array($x->fce,$args); // naplní $y->values a $y->keys
    }
    else
      $y->error= "SERVER: funkce '{$x->fce}' není implementována";
    break;
  # ------------------------------------------------------------------------------------------------ browse_map
  # browse_map(args0,args1, ...) -- zavolání funkce 'fce' na serveru nad vybranými řádky browse
  # x.fce je fce
  # x.keys -- klíče vybraných řádků
  # y: value
  case 'browse_map':
    $y->value= '';
    $x->keys= (array)$x->keys;
    if ( function_exists($x->fce) ) {
      $val= call_user_func_array($x->fce,array($x->keys));
      $y->value= $val; //win2utf($val);
    }
    else fce_error("ask: funkce {$x->fce} neexistuje");
//     $y->args= $x->args;
    break;
  # ------------------------------------------------------------------------------------------------ browse_select
  // vrácení klíčů s podmínkou cond - browse bez JOIN a GROUP ale s ORDER
  // x: table, cond, from
  // y: count, from, rows, values[i]
  case 'browse_select':
    $fields= ''; $del= '';
    $x->from= $x->from ? $x->from : 0;
    $y->from= $x->from;
    $db= $x->db ? $x->db : $mysql_db; $table= ($ezer_db[$db][5] ? $ezer_db[$db][5] : $db).'.'.$x->table;
    $as= explode('AS',$x->table);
    $y->key_id= $key_id= $as[1] ? trim($as[1]).'.'.$x->key_id : $x->key_id;
//     $cond= stripslashes(utf2win($x->cond));
    $cond= stripslashes($x->cond);
    // konstrukce JOIN
    $joins= '';
    if ( isset($x->joins) ) {
      foreach ( $x->joins as $join ) $joins.= " $join";
    }
    if ( $x->db ) ezer_connect($x->db);
    $qry= "SELECT $key_id AS _klice_ FROM $table $joins WHERE $cond ";
    if ( $x->order ) $qry.= " ORDER BY {$x->order}";
    $res= mysql_qry($qry);
    $keys= ''; $del= '';
    while ( $res && $row= mysql_fetch_assoc($res) ) {
      $keys.= "$del{$row['_klice_']}";
      $del= ',';
    }
    $y->keys= $keys;
    break;
  # ------------------------------------------------------------------------------------------------ browse_load
  // načtení polí table.fields s podmínkou cond a v pořadí order (od from v počtu maximálně rows)
  // výsledek je ve values[radek][field] - v count je celkový počet
  // x: table, cond, order, fields, from, cursor, rows, [{joins}] [group [having]]   -- field:{id:i, field:f|expr:s}
  // y: count, from, rows, values[i]
  case 'browse_load':
    if ( $x->table=='_file_' ) {
      // scroll files
      load_files($x,$y);
    }
    else {
      // scroll records
      if ( $x->optimize ) {
//                                                                 debug($x->optimize,'browse records optimize');
      }
      if ( $x->db ) ezer_connect($x->db);
      $fields= ''; $del= '';
      $x->from= $x->from>0 ? $x->from : 0;
      $y->from= 0+$x->from;
      $y->cursor= 0+$x->cursor;
      $y->key_id= $x->key_id;
      $y->quiet= $x->quiet;
      if ( isset($x->options) ) $y->options= $x->options;
      $db= $x->db ? $x->db : $mysql_db; $table= ($ezer_db[$db][5] ? $ezer_db[$db][5] : $db).'.'.$x->table;
      $atable= explode(' AS ',$table);
      $key_id= ($atable[1] ? "{$atable[1]}." : '') . $x->key_id;
      $pipe= array();
      // konstrukce JOIN
      $joins= '';
      if ( isset($x->joins) ) {
        foreach ( $x->joins as $join ) $joins.= " $join";
      }
      // konstrukce ORDER
      $order= $x->optimize->qry=='noseek'
      ? ($x->order ? " ORDER BY {$x->order}" : '')
      : ($x->order ? " ORDER BY {$x->order},$key_id" : " ORDER BY $key_id");
      // seznam čtených polí
      foreach ($x->fields as $desc) {
        if ( isset($desc->expr) ) {
          $f= $desc->id;
          $fields.= "$del{$desc->expr} as {$desc->id}";
        }
        else {
          $fld= isset($x->joins) && strpos($desc->field,'.')===false
            ? "$del{$table}.{$desc->field}"
            : "$del{$desc->field}";
          if ( isset($desc->id) ) {
            $f= $desc->id;
            $fields.= "$fld as {$desc->id}";
          }
          else {
            $f= $desc->field;
            $fields.= $fld;
          }
        }
        if ( isset($desc->pipe) ) {
          list($paf,$parg)= explode(':',$desc->pipe);
          if ( !function_exists($paf) )
            $y->error.= "$paf není PHP funkce";
          else {
            $pipe[$f]= array($paf,$parg);
          }
        }
        $del= ',';
      }
      // proveď případný sql příkaz
      if ( $x->sql ) mysql_qry($x->sql);
      // úprava cond s q@
      $cond= stripslashes($x->cond);
      if ( $x->pipe ) {
        $cpipe= explode('|',$x->pipe);
//                                                                 debug($cpipe,'cond.pipe');
        for ($i= 1; $i<count($cpipe); $i+=2) {
          $fce= $cpipe[$i-1];
          $val= $cpipe[$i];
          $pval= $fce($val,1);
//                                                 display("$fce($val,1)=$pval");
          $cond= str_replace("'$val'","'$pval'",$cond);
        }
      }
      // vlastní příkaz
      if ( isset($x->group) || isset($x->having) && $x->having ) {
        // pokud je GROUP musíme použít SQL_CALC_FOUND_ROWS
        $qry= "SELECT SQL_CALC_FOUND_ROWS $fields FROM $table $joins WHERE $cond ";
        if ( $x->group ) {
          $qry.= " GROUP BY {$x->group}";
          if ( $x->having ) $qry.= " HAVING {$x->having}";
        }
        $qry.= $order;
        if ( isset($x->rows) ) $qry.= " LIMIT {$x->from},{$x->rows}";
        $res= mysql_qry($qry);
        $i= 0;
        if ( $res ) {
          // zjištění celkového počtu
          $qry2= "SELECT FOUND_ROWS() AS count";
          $res2= mysql_qry($qry2);
          $row2= mysql_fetch_assoc($res2);
          $y->count= 0+$row2['count'];
          // projití záznamů
          while ( $res && $row= mysql_fetch_assoc($res) ) {
            $i++;
            foreach ($row as $f => $val) {
              $a= $val;
//               if ( $pipe[$f] ) $a= $pipe[$f]($a);
              if ( isset($pipe[$f]) ) $a= $pipe[$f][0]($a,$pipe[$f][1]);
              $y->values[$i][$f]= $a;
            }
          }
        }
        $y->rows= $i;
      }
      else {
        $i= 0;
        // pokud není GROUP můžeme postupovat bez SQL_CALC_FOUND_ROWS
        $qry_base= "FROM $table $joins WHERE $cond ";
        // zjištění celkového počtu
        $y->count= 0;
        $qry= "SELECT count(*) as pocet $qry_base";
        $res= mysql_qry($qry);
        if ( $res ) $y->count= mysql_result($res,0);
        if ( $y->count ) {
          // projití záznamů
          $qry= "SELECT $fields $qry_base $order";
          if ( $x->rows ) $qry.= " LIMIT {$x->from},{$x->rows}";
          $res= mysql_qry($qry);
          $i= 0;
          while ( $res && $row= mysql_fetch_assoc($res) ) {
            $i++;
            foreach ($row as $f => $val) {
              $a= $val;
              if ( isset($pipe[$f]) ) $a= $pipe[$f][0]($a,$pipe[$f][1]);
//               if ( $pipe[$f] ) $a= $pipe[$f]($a);
              $y->values[$i][$f]= $a;
            }
          }
        }
        $y->rows= $i;
      }
    }
    $y->ok= 1;
    break;
  # ------------------------------------------------------------------------------------------------ browse_scroll
  // načtení polí table.fields s podmínkou cond a v pořadí order (od from v počtu maximálně rows)
  // tato varianta funkce je používána pouze pro posuny v browse, počet dostane parametrem count
  // výsledek je ve values[radek][field] - v count je celkový počet
  // x: table, cond, order, fields, from, cursor, rows, [{joins}] [group [having]]   -- field:{id:i, field:f|expr:s}
  // y: count, from, rows, values[i]
  case 'browse_scroll':
//                                                         debug($x,"browse_scroll");

    // předávané zpět pro smarter scroll
    $y->r= 0+$x->r;
    $y->b= 0+$x->b;
    $y->blen= 0+$x->blen;
    $y->t= 0+$x->t;
    $y->tlen= 0+$x->tlen;
    $y->mode= 0+$x->mode;
    // předávané zpět
    $y->active= 0+$x->active;
    $y->init= 0+$x->init;
    $y->val_beg= 0+$x->val_beg;
    $y->val_act= 0+$x->val_act;
    // parametry
    $x->from= $x->from>0 ? $x->from : 0;
    $y->from= 0+$x->from;
    $y->count= 0+$x->count;
    $y->cursor= 0+$x->cursor;
    $y->key_id= $x->key_id;
    if ( $x->options ) $y->options= $x->options;
    // varianty algoritmu
    if ( $x->table=='_file_' ) {
      // scroll files
      load_files($x,$y);
    }
    else {
      // scroll records
      if ( $x->db ) ezer_connect($x->db);
      $fields= ''; $del= '';
      $db= $x->db ? $x->db : $mysql_db; $table= ($ezer_db[$db][5] ? $ezer_db[$db][5] : $db).'.'.$x->table;
      $atable= explode(' AS ',$table);
      $key_id= ($atable[1] ? "{$atable[1]}." : '') . $x->key_id;
      $pipe= array();
      // konstrukce JOIN
      $joins= '';
      if ( $x->joins ) {
        foreach ( $x->joins as $join ) $joins.= " $join";
      }
      // seznam čtených polí
      foreach ($x->fields as $desc) {
        if ( $desc->expr ) {
          $f= $desc->id;
          $fields.= "$del{$desc->expr} as {$desc->id}";
        }
        else {
          $fld= $x->joins && strpos($desc->field,'.')===false
            ? "$del{$table}.{$desc->field}"
            : "$del{$desc->field}";
          if ( $desc->id ) {
            $f= $desc->id;
            $fields.= "$fld as {$desc->id}";
          }
          else {
            $f= $desc->field;
            $fields.= $fld;
          }
        }
        if ( $desc->pipe ) {
          list($paf,$parg)= explode(':',$desc->pipe);
          if ( !function_exists($paf) )
            $y->error.= "$paf není PHP funkce";
          else
            $pipe[$f]= array($paf,$parg);
        }
  //       if ( $desc->pipe ) {
  //         $pipe[$f]= $desc->pipe;
  //         if ( !function_exists($pipe[$f]) ) {
  //           $y->error.= "{$pipe[$f]} není PHP funkce";
  //           unset($pipe[$f]);
  //         }
  //       }
        $del= ',';
      }
      $cond= stripslashes($x->cond);
      // pokud je GROUP musíme použít SQL_CALC_FOUND_ROWS
      $qry= "SELECT $fields FROM $table $joins WHERE $cond ";
      if ( $x->group ) {
        $qry.= " GROUP BY {$x->group}";
        if ( $x->having ) $qry.= " HAVING {$x->having}";
      }
      // konstrukce ORDER
      $order= $x->optimize->qry=='noseek'
        ? ($x->order ? " ORDER BY {$x->order}" : '')
        : ($x->order ? " ORDER BY {$x->order},$key_id" : " ORDER BY $key_id");
      $qry.= $order;
      if ( $x->rows ) $qry.= " LIMIT {$x->from},{$x->rows}";
      $res= mysql_qry($qry);
      $i= 0;
      if ( $res ) {
        // projití záznamů
        while ( $res && $row= mysql_fetch_assoc($res) ) {
          $i++;
          foreach ($row as $f => $val) {
            $a= $val;
            if ( $pipe[$f] ) $a= $pipe[$f][0]($a,$pipe[$f][1]);
  //           if ( $pipe[$f] ) $a= $pipe[$f]($a);
            $y->values[$i][$f]= $a;
          }
        }
      }
      $y->rows= $i;
    }
    $y->ok= 1;
    break;
  # ------------------------------------------------------------------------------------------------ browse_seek
  // stejná funkce jako browse_load, jako první bude vrácen řádek vyhovující podmínce x->seek
  // CORR: pokud je celkový počet řádků <= tmax, vrací se všechny a
  // (které obsahuje nejvýše jednu podmínku)
  // pokud takový není, bude vráceno y->seek==0 jinak y->seek==key
  // ZATIM bez pořadi (jen podle key_id)
  case 'browse_seek':
    $seek_result= 0;
    $fields= ''; $del= '';
    $x->from= $x->from ? $x->from : 0;
    $y->key_id= $x->key_id;
    $key_id= ($x->view ? "{$x->view}." : '').$x->key_id;
    $rows= $x->rows;
    $tmax= $x->tmax;
    $db= $x->db ? $x->db : $mysql_db; $table= ($ezer_db[$db][5] ? $ezer_db[$db][5] : $db).'.'.$x->table;
    $atable= explode(' AS ',$table);
    $key_id= ($atable[1] ? "{$atable[1]}." : '') . $x->key_id;
    $pipe= array();
    foreach ($x->fields as $desc) {
      if ( $desc->expr ) { $f= $desc->id; $fields.= "$del{$desc->expr} as {$desc->id}"; }
      elseif ( $desc->id ) { $f= $desc->id; $fields.= "$del{$desc->field} as {$desc->id}"; }
      else { $f= $desc->field; $fields.= "$del{$desc->field}"; }
      if ( $desc->pipe ) {
        list($paf,$parg)= explode(':',$desc->pipe);
        if ( !function_exists($paf) )
          $y->error.= "$paf není PHP funkce";
        else
          $pipe[$f]= array($paf,$parg);
      }
      $del= ',';
    }
    // konstrukce JOIN, WHERE,
    $joins= '';
    if ( $x->joins ) foreach ( $x->joins as $join ) $joins.= " $join";
    // proveď případný sql příkaz
    if ( $x->sql ) mysql_qry($x->sql);
    // vlastní příkaz
    $cond= stripslashes($x->cond);
    $order= $x->optimize->qry=='noseek'
      ? ($x->order ? " ORDER BY {$x->order}" : '')
      : ($x->order ? " ORDER BY {$x->order},$key_id" : " ORDER BY $key_id");
    $group= '';
    if ( $x->group ) {
      $group= " GROUP BY {$x->group}";
      if ( $x->having ) $group.= " HAVING {$x->having}";
    }
    // zjištění hodnot prvního řádku vyhovujícího x->seek
    $ids= $key_id;
    if ( $xo= $x->order ) {
      $par= 0;
      for ($i=0;$i<strlen($xo);$i++) {
        if ( $xo[$i]=='(' ) $par++;
        elseif ( $xo[$i]==')' ) $par--;
        elseif ( $xo[$i]==',' && !$par) $xo[$i]= '|';
      }
      foreach (explode('|',$xo) as $ord) {
        $n++;
//         $id= strpos($ord,' ')==false ? $ord : substr($ord,0,strpos($ord,' '));
//         $ord_rels[$n]= strstr($ord," DESC") ? ">=" : "<=";
//         $id= str_replace('DESC','',$id);
        $id= strpos($ord,'ASC')!==false ? substr($ord,0,strpos($ord,'ASC')-1) : (
             strpos($ord,'DESC')!==false ? substr($ord,0,strpos($ord,'DESC')-1)
           : $ord);
        $ord_rels[$n]= strstr($ord," DESC") ? ">=" : "<=";
        $id= str_replace('DESC','',$id);
        $ord_ids[$n]= $id;
        $ids.= ", $id AS _order{$n}_";
      }
    }
    if ( $x->db ) ezer_connect($x->db);
    $qry1= "SELECT $ids,$fields FROM $table $joins WHERE $cond AND {$x->seek} $group $order LIMIT 1";
    $res1= mysql_qry($qry1);
    if ( $res1 && $row1= mysql_fetch_assoc($res1) ) {
      $key_val= $row1[$x->key_id];
      // zjištění pořadí záznamu vyhovujícího x->seek (smí obsahovat nejvýše jednu podmínku)
      $scond= "AND $key_id<=$key_val";
      if ( $x->order ) {
        $scond= "AND ";
        foreach ($ord_ids as $n=>$id) {
          $ord_id= "_order{$n}_";
          $ord_val= "'{$row1[$ord_id]}'";
          $scond.= "$id{$ord_rels[$n]}$ord_val AND IF($id=$ord_val,";
        }
        $scond.= "$key_id<=$key_val";
        foreach ($ord_ids as $n=>$id) {
          $scond.= ",1)";
        }
      }
      // zjištění počtu před záznamem, včetně něj
      //       $qry2= "SELECT $fields FROM $table $joins WHERE $cond $scond $group $order";
      $qry2= "SELECT count(*) as _pocet_ FROM $table $joins WHERE $cond $scond $group $order";
      $res2= mysql_qry($qry2);
      $from= mysql_num_rows($res2);
      $from= max(0,$from-1);
//                                                         display("from(1)=$from");
#      $from= intval($from/$rows)*$rows;  ### TZ, 12.1.2012, aby browse_seek odroloval tak že na prvním řádku bude požadovaný záznam
      if ( isset($x->group) || isset($x->having) && $x->having ) {
        // ------------------------- pokud je GROUP musíme použít SQL_CALC_FOUND_ROWS
        $qry3b= "SELECT SQL_CALC_FOUND_ROWS $fields FROM $table $joins
                WHERE $cond $group $order";
        $qry3= "$qry3b LIMIT $from,$rows";
        $res3= mysql_qry($qry3);
        $i= 0;
        if ( $res3 ) {
          // zjištění celkového počtu
          $qry4= "SELECT FOUND_ROWS() AS count";
          $res4= mysql_qry($qry4);
          $row4= mysql_fetch_assoc($res4);
          $count= $row4['count'];
//                                                         display("group: $count, $from, $tmax");
          if ( $count<=$tmax ) {
            // celý výběr se vejde do tabulky
            $from= 0;
            $rows= $count;
            $qry3= "$qry3b LIMIT $from,$rows";
            $res3= mysql_qry($qry3);
          }
          elseif ( $count-$from<$tmax ) {
            // aby byla zaplněná celá tabulka, musíme načíst znovu
            $from= $count-$tmax;
            $rows= $tmax;
            $qry3= "$qry3b LIMIT $from,$rows";
            $res3= mysql_qry($qry3);
          }
          // projití záznamů
          while ( $res3 && $row3= mysql_fetch_assoc($res3) ) {
            $i++;
            foreach ($row3 as $f => $val) {
              $a= $val;
              if ( $pipe[$f] ) $a= $pipe[$f][0]($a,$pipe[$f][1]);
              $y->values[$i][$f]= $a; //win2utf($a);
            }
          }
          $y->count= $count;
        }
      }
      else {
        // ------------------------ pokud není GROUP můžeme postupovat bez SQL_CALC_FOUND_ROWS
        $i= 0;
        $qry_base= "FROM $table $joins WHERE $cond ";
        // zjištění celkového počtu
        $y->count= 0;
        $qry= "SELECT count(*) as pocet $qry_base";
        $res= mysql_qry($qry);
        if ( $res ) {
          $y->count= 0+mysql_result($res,0);
        }
        $row2= mysql_fetch_assoc($res2);
        $from= $row2['_pocet_'];
//                                                         display("negroup: {$y->count}, $from, $tmax");
        // úprava počátečního řádku, aby byl zobrazný konec konec tabulky, bude-li ve výběru
        if ( $y->count<=$from+$tmax ) {
          // za nalezeným řádkem lze všechny další zobrazit
          $from= max($y->count-$tmax,0);
//                                                         display("from(3)=$from");
        }
        else {
          // za nalezeným řádkem je jich více než lze zobrazit => bude jako první
          $from= max(0,$from-1);
        }
        if ( $y->count ) {
          // projití záznamů, jsou-li
          $qry= "SELECT $fields $qry_base $order";
          if ( $y->count>$tmax && $tmax ) {
            $qry.= " LIMIT $from,$tmax";
          }
          else {
            // varianta pro malý počet záznamů
            $from= 0;
          }
          $res= mysql_qry($qry);
          $i= 0;
          while ( $res && $row= mysql_fetch_assoc($res) ) {
            $i++;
            foreach ($row as $f => $val) {
              $a= $val;
              if ( isset($pipe[$f]) ) $a= $pipe[$f][0]($a,$pipe[$f][1]);
              $y->values[$i][$f]= $a;
            }
          }

        }

      }
      $y->from= $from;
      $y->rows= $i;
      $seek_result= $key_val;
    }
//     $y->seek= "seek:{$x->seek} | order:$order | cond:$cond | key:$key_val | ord:$ord_val| count:$count  | scond:$scond";
    $y->seek= $seek_result;
    $y->ok= 1;
    break;
  # ------------------------------------------------------------------------------------------------ browse_export
  # export polí table.fields s podmínkou cond příp. having v pořadí order
  # do souboru par.file ve formátu par.type
  # x: db, table, key_id, cond, order, fields, rows, [{joins}] [group [having]]   -- field:{id:i, field:f|expr:s}
  # y: par, kde par.rows=počet řádků
  # v popisu pole se může objevit (narozdíl od ostatních metod browse) popis "map" pro map_pipe
  #   map = { field:id, table:id, t_options: {db:id,...}, m_options: {where:s, order:s, key_id:id}
  case 'browse_export':
    if ( $x->db ) ezer_connect($x->db);
    $fields= ''; $clmns= ''; $del= '';
    $y->par= $x->par;
    $db= $x->db ? $x->db : $mysql_db; $table= ($ezer_db[$db][5] ? $ezer_db[$db][5] : $db).'.'.$x->table;
    $atable= explode(' AS ',$table);
    $key_id= ($atable[1] ? "{$atable[1]}." : '') . $x->key_id;
    $pipe= array();
    // konstrukce JOIN
    $joins= '';
    if ( isset($x->joins) ) {
      foreach ( $x->joins as $join ) $joins.= " $join";
    }
    // konstrukce ORDER
    $order= $x->order ? " ORDER BY {$x->order}" : '';
    // seznam čtených polí
    $mapi= 0; // čitač map_pipe
    foreach ($x->fields as $desc) {
      // příprava položek FROM
      if ( isset($desc->expr) ) {
        $f= $desc->id;
        $fld= $desc->expr;
      }
      else {
        $fld= isset($x->joins) && strpos($desc->field,'.')===false
          ? "{$table}.{$desc->field}"
          : "{$desc->field}";
        if ( isset($desc->id) ) {
          $f= $desc->id;
        }
        else {
          $f= $desc->field;
        }
      }
      if ( isset($desc->pipe) ) {
        list($paf,$parg)= explode(':',$desc->pipe);
        if ( !function_exists($paf) )
          $y->error.= "$paf není PHP funkce";
        else
          $pipe[$f]= array($paf,$parg);
      }
      // konstrukce JOINs pro map_pipe
      if ( isset($desc->map) ) {
        $map= $desc->map;
        $topt= $map->t_options;
        $mopt= $map->m_options;
        $mapi++;
        $tab= ($topt->db ? "{$topt->db}." : '').$map->table;
        $where= $mopt->where;
        if ( $map->table=='_cis' ) $where= str_replace('druh=',"\$m$mapi.druh=",$where);
        $join= "\nLEFT JOIN $tab AS \$m$mapi ";
        $join.= "ON \$m$mapi.{$mopt->key_id}=$fld AND $where ";
        $joins.= $join;
        $fld= "\$m$m$mapi.{$map->field}";
      }
      // konstrukce položek FROM
      if ( isset($desc->expr) ) {
        $fields.= "$del$fld as {$desc->id}";
        $clmns.= "$del{$desc->id}";
      }
      else {
        if ( isset($desc->id) ) {
          $fields.= "$del$fld as {$desc->id}";
          $clmns.= "$del{$desc->id}";
        }
        else {
          $fields.= "$del$fld";
          $clmns.= "$del$f";
        }
      }
      $del= ',';
    }
    $cond= stripslashes($x->cond);
    // zahájení exportu
    export_head($y->par,$clmns);
    $qry= "SELECT $fields FROM $table $joins \nWHERE $cond ";
    if ( $x->group ) {
      $qry.= " GROUP BY {$x->group}";
      if ( $x->having ) $qry.= " HAVING {$x->having}";
    }
    $qry.= $order;
    $res= mysql_qry($qry);
    // projití záznamů
    $values= array();
    while ( $res && $row= mysql_fetch_assoc($res) ) {
      foreach ($row as $f => $val) {
        $a= $val;
        if ( isset($pipe[$f]) ) $a= $pipe[$f][0]($a,$pipe[$f][1]);
        $values[$f]= $a;
      }
      export_row($values);
    }
    export_tail(); // naplní i $y->par->rows
    $y->ok= 1;
    break; /* browse_export */
  # ------------------------------------------------------------------------------------------------ show_save
  # úschova hodnoty do existujícího záznamu
  # x: table, key_id, key, field, val, old
  # y: qry, err, ok
  # záznam do _track, pokud operace uspěje
  case 'show_save':
    if ( $x->db ) ezer_connect($x->db);
    $zmeny= array();
    $db= $x->db ? $x->db : $mysql_db; $table= ($ezer_db[$db][5] ? $ezer_db[$db][5] : $db).'.'.$x->table;
    $fld= $x->field;
    $val= $x->val;
    if ( $pipe= $desc->pipe ) { $val= $pipe($val,1); }
    if ( isset($desc->mode) && $desc->mode ) {
      $zmeny[]= (object)array('fld'=>$fld,'op'=>$desc->mode,'val'=>$val);
    }
    else {
      if ( isset($desc->old) && !$pipe )  // pokud je sql_pipe nelze srovnat původní hodnotu
        $zmeny[]= (object)array('fld'=>$fld,'op'=>'u','val'=>$val,'old'=>$desc->old);
      else
        $zmeny[]= (object)array('fld'=>$fld,'op'=>'i','val'=>$val);
    }
    // update tabulky, klíč musí být tvaru id_$table (zdvojení _ je přípustné), vrací 1 nebo chybu
    $y->rows= ezer_qry("UPDATE",$table,$x->key,$zmeny,$x->key_id);
    $y->key= $x->key;
    break;
  # ------------------------------------------------------------------------------------------------ map_load
  // načtení všech polí tabulky s podmínkou cond a v pořadí order
  // x :: {table:..,where:...,order:...}
  // y :: {values:[[id1:val1,...]...],rows:...}
  case 'map_load':
    if ( $x->db ) ezer_connect($x->db);
    $db= $x->db ? $x->db : $mysql_db; $table= ($ezer_db[$db][5] ? $ezer_db[$db][5] : $db).'.'.$x->table;
    $qry= "SELECT * FROM $table WHERE {$x->where} ";
    if ( $x->order ) $qry.= " ORDER BY {$x->order}";
    $res= mysql_qry($qry);
    $i= 0;
    while ( $res && $row= mysql_fetch_assoc($res) ) {
      $i++;
      foreach ($row as $f => $val) {
        $y->values[$i][$f]= $val;
      }
    }
    $y->rows= $i;
    break; /* map_load */
  # ================================================================================================ VOLÁNÍ z APP
  # ------------------------------------------------------------------------------------------------ user_login
  # přihlášení uživatele, zápis do SESSION, zápis do historie
  # x: uname, pword      -- uname nesmí být prázdné
  # y: ok, user_id=id_user, user_abbr
  case 'user_login':
    if ( $_SESSION[$ezer_root]['sess_state']=='on' )
      $ezer_user_id= $y->user_id= $_SESSION[$ezer_root]['user_id'];
    else
      $ezer_user_id= $_SESSION[$ezer_root]['user_id']= $y->user_id= 0;
    $_SESSION[$ezer_root]['last_op'].= ' user_login';
    $day= date('Y-m-d');
    $time= date('H:i:s');
    $ip= $_SERVER['REMOTE_ADDR'];
    $browser= $_SERVER['HTTP_USER_AGENT'];
    if ( $x->uname ) {
      $size= "{$x->size->body->x}/{$x->size->body->y}|{$x->size->screen->x}/{$x->size->screen->y}";
      $info= "{$x->uname}|$ip|$size|$browser";
      $where= " WHERE username='{$x->uname}' AND password='{$x->pword}' ";
      $qry= "SELECT * FROM $ezer_system._user $where";
      $res= mysql_qry($qry,0,0,0,'ezer_system');
      if ( $res && ($u= mysql_fetch_object($res)) ) {
        $ezer_user_id= $_SESSION[$ezer_root]['user_id']= $y->user_id= $u->id_user;
#        sess_read('',true); // přečte informace z _user do $USER
        $_SESSION[$ezer_root]['user_start']= date("j.n.Y H:i:s");;
        $_SESSION[$ezer_root]['user_abbr']= $u->abbr;
        $_SESSION[$ezer_root]['sess_state']= 'on';
        $_SESSION[$ezer_root]['relog']= 0;
        $USER= (object)array();
        $USER->id_user= $u->id_user;
        $USER->abbr= $u->abbr;
        $USER->skills= $u->skills;
        $USER->access= $u->access;
        $USER->username= $u->username;
        $USER->forename= $u->forename;
        $USER->surname= $u->surname;
        $USER->login= $u->login;
        $USER->state= $u->state;
        try { $options= $json->decode($u->options); } catch  (Exception $e) { $options= null; };
        $USER->options= $options;
        if ( $ezer_session!='ezer' )
          $_SESSION[$ezer_root]['USER']= $USER;
        #// zapiš do historie přihlášení
        #$history= "history=concat('{$USER->abbr}".date(' d.m.Y H:i')." - login|',history)";
        #$qry= "UPDATE $ezer_system._user SET $history,login=now() WHERE id_user=$ezer_user_id";
        #$res= mysql_qry($qry);
        // zapiš do aktivity
        $qry= "INSERT {$mysql_db}._touch (day,time,hits,user,module,menu,msg)
               VALUES ('$day','$time',0,'{$USER->abbr}','app','login','$info')";
        $res= mysql_query($qry);
      }
      else {
        // chybné přihlašovací údaje
        $qry= "INSERT {$mysql_db}._touch (day,time,user,module,menu,msg)
               VALUES ('$day','$time','---','login','acount?','$info')";
        $res= mysql_query($qry);
                                                display("$res:$qry");
      }
    }
    if ( !$y->sys ) $y->sys= (object)array();
    $y->sys->user= $USER;              // přenos do klienta
    $y->sys->ezer= $EZER;
    break; /* user_login */
  # ------------------------------------------------------------------------------------------------ user_relogin
  # obnova přihlášení uživatele podle záznamů v session
  # y: ok, user_id=id_user, user_abbr
  case 'user_relogin':
    $ezer_user_id= $_SESSION[$ezer_root]['user_id'];
    if ( $ezer_user_id ) {
      $where= " WHERE id_user=$ezer_user_id ";
      $qry= "SELECT * FROM $ezer_system._user $where";
      $res= mysql_qry($qry,0,0,0,'ezer_system');
      if ( $res && ($u= mysql_fetch_object($res)) ) {
#        sess_read('',true); // přečte informace z _user do $USER
        $_SESSION[$ezer_root]['user_start']= date("j.n.Y H:i:s");;
        $_SESSION[$ezer_root]['user_abbr']= $u->abbr;
        $_SESSION[$ezer_root]['sess_state']= 'on';
        $USER= (object)array();
        $USER->id_user= $u->id_user;
        $USER->abbr= $u->abbr;
        $USER->skills= $u->skills;
        $USER->access= $u->access;
        $USER->username= $u->username;
        $USER->forename= $u->forename;
        $USER->surname= $u->surname;
        $USER->login= $u->login;
        $USER->state= $u->state;
        try { $options= $json->decode($u->options); } catch  (Exception $e) { $options= null; };
        $USER->options= $options;
        if ( $ezer_session!='ezer' )
          $_SESSION[$ezer_root]['USER']= $USER;
        $y->user_id= $ezer_user_id;
      }
    }
    else {
      $y->user_id= 0;
    }
    if ( !$y->sys ) $y->sys= (object)array();
    $y->sys->user= $USER;              // přenos do klienta
    $y->sys->ezer= $EZER;
    check_version($y);
    break;
  # ------------------------------------------------------------------------------------------------ user_group_login
  # přihlášení uživatele do sdružených aplikací
  # y: ok, user_id=id_user, user_abbr
  case 'user_group_login':
    $ezer_user_id= $_SESSION[$ezer_root]['user_id'];
    if ( $ezer_user_id ) {
      foreach(explode(',',$x->par) as $app_name) {
        // pro každou sdruženou aplikaci
        if ( !isset($_SESSION[$app_name]) ) {
          $_SESSION[$app_name]= array('sess_state'=>'-');
        }
        if ($app_name!=$ezer_root) {
          $_SESSION[$app_name]['sess_group']= $ezer_root;
          if ( $_SESSION[$app_name]['sess_state']!='on' ) {
            foreach(array('user_id','user_abbr','user_start','sess_state') as $item) {
              $_SESSION[$app_name][$item]= $_SESSION[$ezer_root][$item];
            }
          }
        }
      }
    }
    break;
//   # ------------------------------------------------------------------------------------------------ user_logout
//   # odhlášení uživatele, zrušení v SESSION
//   # y: ok/ko
//   case 'user_logout':
//     $ezer_user_id= $_SESSION[$ezer_root]['user_id']= $y->user_id= 0;
//     // zapiš do aktivity
//     $day= date('Y-m-d');
//     $time= date('H:i:s');
//     $qry= "INSERT _touch (day,time,hits,user,module,menu) "
//       . "VALUES ('$day','$time',0,'{$USER->abbr}','app','logout')";
//     $res= mysql_query($qry);
//     // zruš session
//     $y->ok= session_destroy() ? 'ok' : 'ko';    // vynuluje $USER
//     break;
  # ------------------------------------------------------------------------------------------------ user_status
  # zápis stavu uživatele do _user.state
  case 'user_status':
    $ezer_user_id= $_SESSION[$ezer_root]['user_id'];
    if ( $ezer_user_id && $x->state && $x->state!=$USER->state ) {
      $qry= "UPDATE $ezer_system._user SET state='{$x->state}' WHERE id_user=$ezer_user_id";
      $res= mysql_qry($qry,0,0,0,'ezer_system');
    }
    break;
  # ------------------------------------------------------------------------------------------------ load
  # zavede modul - pokud je zdroj novější, pak jej přeloží
  case 'load': // (id)
    $fname= "$ezer_path_gen/{$x->id}.json";
    $y->exists= file_exists($fname);
    $text= @file_get_contents($fname);
    $y->app= $json->decode($text);
    break;
  # ------------------------------------------------------------------------------------------------ source_line
  # vrátí zdrojový řádek souboru x.file x.lc
  case 'source_line': // (id)
    list($line,$clmn)= explode(',',$x->lc);
    $y->text= source_line($x->file,$x->app,$line,$clmn);
    break;
  # ------------------------------------------------------------------------------------------------ source_text
  # vrátí obsah souboru x.file
  case 'source_text': // (id)
    $y->text= source_text($x->file,$x->app);
    break;
  # ------------------------------------------------------------------------------------------------ save_drag
  # uloží změny podle seznamu [lclc:coord:app:file]*
  # vrátí obsah souboru x.file po provedených změnách
  case 'save_drag': // (id)
    $y->text= '';
    $y->warning= '';
    $del= "˙";
    $path_chs= array();
    foreach($x->drag as $drag) {
      list($lclc,$coord,$app,$file,$tp)= explode($del,$drag);
      $path= "$app/$file";
      if ( !isset($path_chs[$path]) ) $path_chs[$path]= array();
      list($l,$c1,$l2,$c2)= explode(',',$lclc);
      $path_chs[$path][$l]= array();
      $path_chs[$path][$l]= (object)array('l'=>$l,'c1'=>$c1,'c2'=>$c2);
      $path_chs[$path][$l]->new= $coord;
      if ( $tp!='' )
        $path_chs[$path][$l]->old= $tp;
    }
//                                                         debug($path_chs,"save_drag");
    foreach ($path_chs as $path=>$chs) {
      $fpath= "$ezer_path_root/$path.ezer";
      $f= fopen($fpath,'r');
      $text= '';
      $n= 0;
      if ( $f  ) {
        while ( !feof($f) ) {
          $n++;
          $ln= fgets($f);
          if ( isset($chs[$n]) ) {
            $s= $chs[$n];
            if ( isset($s->old) ) {
              // změna hodnoty atributu
              $one= preg_match_all("|(['\"])".preg_quote($s->old)."['\"]|u",$ln,$m);
//                                                         debug($m,$s->old);
              $w= $m[1][0];
              if ( $one==1 )
                $ln= str_replace("$w{$s->old}$w","$w{$s->new}$w",$ln);
              else
                $y->warning.= "DRAG: chyba při ukládání změn pro $n:{$s->old}/{$s->new}.
                <br><b>Pozor na omezení</b>: měněný atribut musí být celý na stejném řádku jako
                souřadnice bloku.\n";
            }
            else {
              // změna souřadnic
              $ln= mb_substr($ln,0,$s->c1-1).$s->new.mb_substr($ln,$s->c2);
            }
          }
          $text.= $ln;
        }
        fclose($f);
        // uschovej starou verzi jako name.yymmddhhii.ezer
        $sgn= date('ymdHi');
        $old= "$ezer_path_root/$app/@/$file.$sgn.ezer";
        if ( copy($fpath,$old) ) {
          // pokud se uschování staré verze povedlo, nahraď původní novou
          $novy= fopen($fpath,'w');
          if ( $novy ) {
            fputs($novy,$text);
            fclose($novy);
          }
          else $y->error.= "nepovedl se otevřít soubor $fpath pro zápis";
        }
        else $y->error.= "nepovedla se kopie $fpath do $old";
      }
//       if ( "{$x->app}/{$x->file}"==$path ) $y->text= $text;
    }
    break;
  # ------------------------------------------------------------------------------------------------ load_code2
  # zavede modul včetně modulů vnořených pomocí options.include:onload[,fname]
  # pokud je zdrojový text modulu novější než přeložený json-text, pak jej napřed přeloží.
  #
  # modul :: { includes:[udesc,...],code:{type:i,options:{...},part:{...},_lc,_c }
  # udesc :: [ {file:fname,block:bname} ... ]
  #       -- soubor s vnořeným modulem a blok, do kterého bude vnořen
  # fname -- jméno aplikace/jméno souboru vnořeného modulu bez přípony
  #          jméno aplikace je jménem složky pod $ezer_root
  # bname -- relativní jméno vlastníka vnořeného bloku,
  #          postupným skládáním bname vznikne absolutní jméno vlastníka
  #
  # Příklady:
  # a/$.ezer:   menu m { tabs t { include:'onload,a.t' } }
  #             => {includes:[{file:'a/a.t',block:'$.m.t'}],...}
  # a/a.t.ezer: panel p { include:'onload,a.p' }
  #             panel q { include:'onload,l' }
  #             => {includes:[{file:'a/a.p',block:'p'},{file:'l/l',block:'q'}],...}
  # a/a.p.ezer: var v: number
  #             => {...}
  # l/l.ezer:   #pragma library;
  #             qroup tab { include:'include:onload,l.tab' }
  #             => {includes:[{file:'l/l.tab',block:'#.tab'}],...}
  # l/tab.ezer: table t { ... }
  #             => {...}
  #
  # žádost o zavedení modulu = {file:fname,block:bname} kde bname musí začínat '$' nebo '#'
  # výstupem bude poskládané code
  #
  case 'load_code2': // (name)
//                                         debug($x,'load_code2');
    try {
      global $ezer_path_serv,$ezer_path_appl, $ezer_path_code, $ezer_root, $code, $errors, $err;
      require_once("$ezer_path_serv/comp2.php");
      require_once("$ezer_path_serv/comp2def.php");
      $y->error= '';
      $y->msg= '';
      $y->app= null;
      $y->file= $x->file;
      $parts= array((object)array('file'=>$x->file,'block'=>isset($x->block)?$x->block:null));
      while ( count($parts) ) {
        $part= array_pop($parts);
        list($app,$fname)= explode('/',$part->file);
        // pokud je $app jádrem (začíná $app=ezer2) zaměníme $all za aktuální verzi Ezer
        $app= $app=='ezer2' ? $EZER->version : $app;
        $ename= "$ezer_path_root/$app/$fname.ezer";
        $cname= "$ezer_path_root/$app/code/$fname.json";
        $xname= "$ezer_path_serv/comp2.php";
        // zdroj musí existovat
        clearstatcache();
        $etime= @filemtime($ename);
        $ctime= @filemtime($cname); if ( !$ctime) $ctime= 0;
        $xtime= @filemtime($xname);
        $state= 'load';
        $loads= 'error';
        if ( !$etime ) {
          $y->error= "INCLUDE - soubor $app/$ename neexistuje";  // zdroj musí existovat
//           display("INCLUDE - soubor $app/$ename neexistuje");  // zdroj musí existovat
          break;
        }
        else if ( !$ctime || $ctime<$etime                  // a pokud je mladší než přeložený kód
          || $ctime<$xtime ) {                              // nebo starší než kompilátor, tak jej překompiluj
          $state= 'compile '.comp_file($fname,$app);
          if ( $errors ) {
            $y->error= $err;
            @unlink($cname);
            break;
          }
          else {
            $y->msg.= " *$cname";
            $loads= json_decode(file_get_contents($cname));
          }
        }
        else {
          $y->msg.= " $cname";
          $loads= json_decode($str= file_get_contents($cname));
        }
        # ------------------------------------------------------------------------------------------
        # v $load je přečtený kód, který je třeba vložit do $part->block
//                                                 display("module $fname into {$part->block}");
        if ( !$y->app ) {
          // iniciace
          $y->app= $loads->code;
        }
        else {
          $obj= $part->code;
          $ids= explode('.',$part->block);
//                                                 debug($obj,"block={$part->block}",0,3);
          for ($i= 0; $i<count($ids); $i++) {
//                                                 display_(" ... {$obj->type}+{$ids[$i]}");
            $obj= $obj->part->$ids[$i];
//                                                 display_("={$obj->type} ");
            if ( !$obj ) fce_error("LOAD_CODE: chybné jméno {$part->block} ve $fname");
          }
          // vnoření modulu

//         if ( desc.part ) {
//           $each(desc.part,function(p,pid) {
//             p._file= pos.file;
//             p._app= pos.app;
//           });
//           $each(y.app.part,function(p,pid) {
//             p._file= file;
//             p._app= app;
//             desc.part[pid]= p;
//           });
//         }
          // ošetření odkazu na zdroj
          if ( isset($loads->code->part) ) {
            foreach($loads->code->part as $id=>$desc) {
              $loads->code->part->$id->_file= $fname;
              $loads->code->part->$id->_app= $app;
            }
          }
          if ( isset($obj->part) ) {
            foreach($obj->part as $id=>$desc) {
              $obj->part->$id->_file= $part->old_file;
              $obj->part->$id->_app= $part->old_app;
            }
          }
          // vložení souboru
          if ( isset($obj->part) && isset($loads->code->part) )
            $obj->part= (object)array_merge((array)$obj->part,(array)$loads->code->part);
          elseif ( isset($loads->code->part) )
            $obj->part= $loads->code->part;
          if ( isset($obj->options) && isset($loads->code->options) )
            $obj->options= (object)array_merge((array)$obj->options,(array)$loads->code->options);
          elseif ( isset($loads->code->options) )
            $obj->options= (array)$loads->code->options;
          if ( isset($loads->code->_app) )  $obj->_app=  $loads->code->_app;
          if ( isset($loads->code->_file) ) $obj->_file= $loads->code->_file;
          if ( isset($loads->code->_lc) )   $obj->_lc=   $loads->code->_lc;
          if ( isset($loads->code->library) ) {
            $obj->library= 1;
            $y->msg.= "#";
          }
        }
        # ------------------------------------------------------------------------------------------
        # přidej includes
        if ( isset($loads->includes) ) {
          foreach($loads->includes as $udesc) {
            $new_part= (object)array('file'=>$udesc->file,'block'=>$udesc->block,'code'=>$loads->code,
              'old_file'=>$fname,'old_app'=>$app);
//                                         debug($new_part,'new_part',0,2);
            array_push($parts,$new_part);
          }
        }
      }
    }
    catch (Exception $e) {
      $y->error= $e->getMessage();
      $y->chyba= 'jo';
    }
//                                         debug($y,'y->app');
//     file_put_contents("snap.json",$y->error);
//     file_put_contents("snap.json",$json->encode($y->app));
    break;
  # ------------------------------------------------------------------------------------------------ code
  case 'code': // (files)
    global $code;
    $code= (object)array();
    uses($x->files);
    $y->code= $code;
    break;
  default:
    $y->error= "SERVER: příkaz '{$x->cmd}' není implementován";
    break;
  }
# ================================================================================================== answer
  global $trace, $warning;
  if ( $trace && strpos($x->totrace,'u')!==false )
    $y->trace= $trace;
//                                         $y->trace.= "\ntotrace={$x->totrace}";
  if ( $warning ) $y->warning= $warning;
  $y->lc= $x->lc;                       // redukce informace místo $y->x= $x;
//   $y->sys->user= $USER;              // redukce informace - přesunuto do user_relogin, user_login
//   $y->sys->ezer= $EZER;              // redukce informace - přesunuto do user_relogin, user_login
  header('Content-type: application/json; charset=UTF-8');
  $y->php_ms= round(getmicrotime() - $php_start,4);
//   $yjson= $json->encode($y);            // protože json_encode chybuje
  $yjson= json_encode($y);
//   $yjson= json_encode($y,JSON_UNESCAPED_UNICODE);

//   // test json_encode
//   $_yjson= json_encode($y->value);
//   if ( !json_decode($_yjson) ) {
//     $y->json_last_error= 'ERROR'.json_last_error(); // vrací 0 i když nic nepřevede
//   }

  $y->php_b= strlen($yjson);
//   $yjson= json_encode($y,JSON_UNESCAPED_UNICODE);
//   $yjson= $json->encode($y);            // protože json_encode chybuje
  $yjson= json_encode($y);
  echo $yjson;
  exit;

# ================================================================================================== servis
function json_encode_short($data) {
  switch ($type = gettype($data)) {
  case 'NULL':
    return 'null';
  case 'boolean':
    return ($data ? 'true' : 'false');
  case 'integer':
  case 'double':
  case 'float':
    return $data;
  case 'string':
    return '"' . addslashes($data) . '"';
  case 'object':
    $data = get_object_vars($data);
  case 'array':
    $output_index_count = 0;
    $output_indexed = array();
    $output_associative = array();
    foreach ($data as $key => $value) {
      $output_indexed[] = json_encode_short($value);
      $output_associative[] = json_encode_short($key) . ':' . json_encode_short($value);
      if ($output_index_count !== NULL && $output_index_count++ !== $key) {
        $output_index_count = NULL;
      }
    }
    if ($output_index_count !== NULL) {
      return '[' . implode(',', $output_indexed) . ']';
    }
    else {
      return '{' . implode(',', $output_associative) . '}';
    }
  default:
    return ''; // Not supported
  }
}
# -------------------------------------------------------------------------------------------------- browse_status
# doplněk metody browse.browse_status - z jejího výsledku zkonstruuje části dotazu a celý dotaz
function browse_status($x) {
  $fields= ''; $clmns= ''; $del= '';
  $y->par= $x->par;
  $db= $x->db ? $x->db : $mysql_db; $table= ($ezer_db[$db][5] ? $ezer_db[$db][5] : $db).'.'.$x->table;
  $atable= explode(' AS ',$table);
  $key_id= ($atable[1] ? "{$atable[1]}." : '') . $x->key_id;
  $pipe= array();
  // konstrukce JOIN
  $joins= '';
  if ( isset($x->joins) ) {
    foreach ( $x->joins as $join ) $joins.= " $join";
  }
  // konstrukce ORDER
  $order= $x->optimize->qry=='noseek'
  ? ($x->order ? " ORDER BY {$x->order}" : '')
  : ($x->order ? " ORDER BY {$x->order},$key_id" : " ORDER BY $key_id");
  // seznam čtených polí
  foreach ($x->fields as $desc) {
    if ( isset($desc->expr) ) {
      $f= $desc->id;
      $fields.= "$del{$desc->expr} as {$desc->id}";
      $clmns.= "$del{$desc->id}";
    }
    else {
      $fld= isset($x->joins) && strpos($desc->field,'.')===false
        ? "$del{$table}.{$desc->field}"
        : "$del{$desc->field}";
      if ( isset($desc->id) ) {
        $f= $desc->id;
        $fields.= "$fld as {$desc->id}";
        $clmns.= "$del{$desc->id}";
      }
      else {
        $f= $desc->field;
        $fields.= $fld;
        $clmns.= "$del$f";
      }
    }
    if ( isset($desc->pipe) ) {
      list($paf,$parg)= explode(':',$desc->pipe);
      if ( !function_exists($paf) )
        $y->error.= "$paf není PHP funkce";
      else
        $pipe[$f]= array($paf,$parg);
    }
    $del= ',';
  }
  $cond= stripslashes($x->cond);
  // redakce odpovědi
  $qry= "SELECT $fields FROM $table $joins WHERE $cond ";
  if ( $x->group ) {
    $qry.= " GROUP BY {$x->group}";
    if ( $x->having ) $qry.= " HAVING {$x->having}";
  }
  $qry.= $order;
  return (object)array(
    'qry'=>$qry,
    'fields'=>$fields, 'table'=>$table, 'joins'=>$joins, 'cond'=>$cond,
    'group'=>$x->group, 'having'=>$x->having, 'order'=>$order
  );
}
# -------------------------------------------------------------------------------------------------- check_version
# předá informaci o změně verze jádra při obnově přihlášení
function check_version($y) {
  // kontrola verze systému
  global $ezer_root, $y;
  $verze= root_svn();
  if ( $verze ) {
    $old= $_SESSION[$ezer_root]['svn_version'];
    $y->verze= $verze;
    if ( $verze!=$old )
      $y->update= "Na serveru je k dispozici nová verze $verze systému (pracujete "
        . ($old?"s $old":"se starou")."), doporučuji obnovit okno prohlížeče (F5 nebo ctrl-r).";
  }
}
# -------------------------------------------------------------------------------------------------- answer
function answer () {
  global $trace, $y, $USER, $EZER;
  if ( $trace ) $y->trace= $trace;
  $y->sys->user= $USER;
  $y->sys->ezer= $EZER;
  header('Content-type: application/json; charset=UTF-8');
  echo json_encode($y);
  exit;
}
# -------------------------------------------------------------------------------------------------- make_get
# převzetí parametrů od funkce form_make
function make_get (&$set,&$select,&$fields) {
  global $x,$y;
  $set= $select= $fields= array();
  if ( $x->save )
  foreach ($x->save as $fld => $tfv) {
    $val= $tfv->val;
    if ( ($pipe= $tfv->pip) ) $val= $pipe($val,1);
    $set[$tfv->tbl][]= "{$tfv->fld}='$val'";
    $y->plain->$fld= 1;
  }
  if ( isset($x->load) )
  foreach ($x->load as $fld => $tf) {
    $select[]= $tf->exp ? "{$tf->exp} AS $fld": "{$tf->tbl}.{$tf->fld} AS $fld";
    $fields[]= $fld;
  }
}
// # -------------------------------------------------------------------------------------------------- connect
// # napojení základní databáze
// function connect() {
//   global $ezer_db, $mysql_db;
// //   $mysql_host= 'localhost'; $mysql_user= 'gandi'; $mysql_pass= ''; $mysql_db= 'ezer_test';
//   $db_link= @mysql_pconnect($mysql_host,$mysql_user,$mysql_pass);
//   mysql_select_db($mysql_db);
//   $res= mysql_qry("SET NAMES 'UTF8'");
// }
# -------------------------------------------------------------------------------------------------- connect_all
// function connect_all() {
//   // napojení databází
//   global $ezer_db, $mysql_db;
//   foreach ( $ezer_db as $db=>$desc) {
//     $ezer_db[$db][3]= @mysql_connect($desc[0],$desc[1],$desc[2]);
//   }
// //                                                         debug($ezer_db);
//   mysql_select_db($mysql_db,$ezer_db[$mysql_db][3]);
//   $res= mysql_query("SET NAMES 'UTF8'");
// }
# -------------------------------------------------------------------------------------------------- stripSlashes_r
# odstraní slashes ze superglobálních polí -- kvůli magic_quotes_gpc do PHP 5.3
function stripSlashes_r($array) {
  return is_array($array) ? array_map('stripSlashes_r', $array) : stripslashes($array);
}
# -------------------------------------------------------------------------------------------------- array2object
function array2object(array $array) {
  $object = new stdClass();
  foreach($array as $key => $value) {
    if(is_array($value)) {
      $object->$key = array2object($value);
    }
    else {
      $object->$key = $value;
    }
  }
  return $object;
}
# ================================================================================================== upload
# -------------------------------------------------------------------------------------------------- upload_ymd
function upload_ymd($tmp_name,$name,$par) {
  global $EZER;
  $path= "{$EZER->options->docs_path}/{$_GET['path']}";
//   $log= "path=".$_GET['path'];
//   file_put_contents("$path/x.log",$log);
  $prefix= preg_match("/^[0-9]{6}_/",$name) ? '' : date('ymd_');
  move_uploaded_file($tmp_name, "$path/{$prefix}$name");
}
# -------------------------------------------------------------------------------------------------- upload
function upload() {
  global $ezer_path_root, $json;
  chdir($ezer_path_root);
  $data= '';
  $error= '';
  $tmp_name= $_FILES['Filedata']['tmp_name'];
  if (!isset($_FILES['Filedata']) || !is_uploaded_file($tmp_name)) {
    $error= 'Invalid Upload';
  }
  // Processing
  $log= date('Y-m-d h:i ').str_pad($_GET['user'],3);
  $name0= $_FILES['Filedata']['name'];
  $name= cz2ascii($name0);
  $size= $_FILES['Filedata']['size'];
  $path= "{$_GET['path']}/$name";
  $md5= md5_file($tmp_name);
  // uložení souboru
  if ( $fce= $_GET['move'] ) {
    $log.= " - USER $fce";
    call_user_func_array($fce,array($tmp_name,$name,$json->decode($_GET['par'])));
  }
  else {
    $log.= " - STND ";
    move_uploaded_file($tmp_name, $path);
  }
  $log.= str_pad($size,9,' ',STR_PAD_LEFT).' '.$path;
  if ( $name!=$name0 )
    $log.= " - $name0";
  if ($error) {
    $log.= " -- $error";
  }
  else {
    // komunikace s klientem - FancyUpload
    $return= array('status'=>'1','name'=>$name,'hash'=>$md5);
    // ... pro obrázky
    $info= @getimagesize($tmp_name);
    if ($info) {
      $return['width']= $info[0];
      $return['height']= $info[1];
      $return['mime']= $info['mime'];
    }
    if ( $name!=$name0 )
      $return['rename']= $name;
  }
  // zápis do logu s omezením velikosti souboru
  $logf= "logs/uploads.log";
  if ( file_exists($logf) && filesize($logf) > 100000 ) {
    rename($logf,"logs/".date('ymd')."_uploads.log");
  }
  $res= @fopen($logf,'a');
  if ($res ) {
    fputs($res,"$log\n");
    fclose($res);
  }
  // Komunikace s FancyUpload
  // The Content-type headers are uncommented, since Flash doesn't care for them
  // anyway. This way also the IFrame-based uploader sees the content.
  if (isset($_REQUEST['response']) && $_REQUEST['response'] == 'xml') {
    // header('Content-type: text/xml');
    $data= '<response>';
    foreach ($return as $key => $value) {
      $data.= "<$key><![CDATA[$value]]></$key>";
    }
    $data.= '</response>';
  }
  else {
    // header('Content-type: application/json');
    $data= $return;
  }
  return $data;
}
# -------------------------------------------------------------------------------------------------- load_files
# načtení atributů souborů ze složky, používá se v browse_load a browse_scroll
# x.cond = path AND elem AND elem ...
# elem= _file_.name=value|...
# name= fdate|fname|ftype   finfo zatím není implementováno
function load_files($x,$y) {
  $x->from= $x->from ? $x->from : 0;
  $y->from= $x->from;
  $y->cursor= $x->cursor;
  // překladové pole field->id
  $field_id= array();
  foreach($x->fields as $if) {
    $field_id[$if->field]= $if->id;
  }
//                                                         debug($field_id,'field_id');
  // rozbor cond
  $xcond= $x->cond;
  $xcond= strtr($xcond,array('_file_.'=>'','?'=>'.','*'=>'.*'));
  $ands= explode(' AND ',$xcond);
//                                                         debug($ands,$xcond);
  $matchs= array();
  $names= array('fdate'=>1,'fname'=>2,'ftype'=>3,'finfo'=>4);
  for($i= 1; $i<count($ands); $i++) {
    $ors= explode('|',$ands[$i]);
    for($j= 0; $j<count($ors); $j++) {
      list($fid,$cond)= explode('=',$ors[$j]);
      if ( isset($names[$fid]) ) {
        $matchs[$names[$fid]].= ($j?'|':'').$cond;
      }
    }
  }
//                                                         debug($matchs,"matchs");
  // projití složky
  $dir= stripslashes($ands[0]);
  $i= 0;
  $files0= array();
  $files1= array();
  $files2= array();
  $files3= array();
  if (is_dir($dir)) {
    if ($dh= opendir($dir)) {
      while (($file= readdir($dh)) !== false) {
        if ( is_file("$dir/$file") && strrpos($file,'.info')!=strlen($file)-5 ) {
//           $ok= preg_match("/([\d]{6}|)[_-]*([^\.]*)[\.](.*)/",$file,$m);
          $ok= preg_match("/([\d]{6}|)[_-]*([^\.]*)(?:[\.](.*)|)/",$file,$m);
//                                                         debug($m,"$i:$dir/$file=$ok");
          foreach($matchs as $if=>$match) {
            $ok= preg_match("/^$match/i",$m[$if]);
//                                                         display("preg_match('/$match/',{$m[$if]})=$ok");
            if ( !$ok ) continue 2;
          }
          $files0[$i]= $file;
          $files1[$i]= $m[1];          // fdate
          $files2[$i]= $m[2];          // fname
          $files3[$i]= $m[3];          // ftype
          $i++;
        }
      }
      closedir($dh);
    }
  }
  // seřazení
  $satr= strpos($x->order,'DESC') ? SORT_DESC : SORT_ASC;
  if    (strpos($x->order,'fid')!==false  ) array_multisort($files0,$satr,$files1,$files2,$files3);
  elseif(strpos($x->order,'fdate')!==false) array_multisort($files1,$satr,$files0,$files2,$files3);
  elseif(strpos($x->order,'fname')!==false) {
    $files2_lc= array_map('strtolower', $files2);
    array_multisort($files2_lc,$satr,$files0,$files1,$files2,$files3);
  }
  elseif(strpos($x->order,'ftype')!==false) array_multisort($files3,$satr,$files0,$files1,$files2);
  // zjištění celkového počtu
  $y->count= count($files0);
  // projití souborů
  $i= 0;
  for ($k= $x->from; $k < min($y->count,$x->from + $x->rows); $k++) {
    // rozklad jména
    $f= $files0[$k];
    $info= file_exists($fn= "$dir/$f.info") ? file_get_contents($fn) : '';
    $i++;
    $y->values[$i]= array();
    $y->values[$i]['fid']= $f;
    $ymd= $files1[$k];
    $y->values[$i][$field_id['fdate']]= $ymd
      ? substr($ymd,4,2).'.'.substr($ymd,2,2).'.20'.substr($ymd,0,2) : '';
    $y->values[$i][$field_id['fname']]= $files2[$k];
    $y->values[$i][$field_id['ftype']]= $files3[$k];
    $y->values[$i][$field_id['finfo']]= $info;
  }
  $y->rows= $i;
}
# -------------------------------------------------------------------------------------------------- cz2ascii
# transformace textu s diakritikou na prosté ASCII bez mezer
function cz2ascii($x) {
  $tab= array(
    'ä'=>'a', 'Ä'=>'A', 'á'=>'a', 'Á'=>'A', 'č'=>'c', 'Č'=>'C', 'ć'=>'c', 'Ć'=>'C', 'ď'=>'d',
    'Ď'=>'D', 'ě'=>'e', 'Ě'=>'E', 'é'=>'e', 'É'=>'E', 'ë'=>'e', 'Ë'=>'E', 'í'=>'i', 'Í'=>'I',
    'ľ'=>'l', 'Ľ'=>'L', 'ń'=>'n', 'Ń'=>'N', 'ň'=>'n', 'Ň'=>'N', 'ó'=>'o', 'Ó'=>'O', 'ö'=>'o',
    'Ö'=>'O', 'ř'=>'r', 'Ř'=>'R', 'ŕ'=>'r', 'Ŕ'=>'R', 'š'=>'s', 'Š'=>'S', 'ś'=>'s', 'Ś'=>'S',
    'ť'=>'t', 'Ť'=>'T', 'ú'=>'u', 'Ú'=>'U', 'ů'=>'u', 'Ů'=>'U', 'ü'=>'u', 'Ü'=>'U', 'ý'=>'y',
    'Ý'=>'Y', 'ž'=>'z', 'Ž'=>'Z', 'ź'=>'z', 'Ź'=>'Z', ' '=>'_'
  );
  $y= strtr($x,$tab);
  $z= '';
  for ($i= 0; $i<mb_strlen($y); $i++) {
    $ch= mb_substr($y,$i,1);
    $z.= ( ord($ch)<33 || ord($ch)>126 ) ? '_' : $ch;
  }
  return $z;
}
?>
