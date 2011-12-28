<?php # (c) 2009 Martin Smidek <martin@smidek.eu>
# uživatelská varianta správy $_SESSION
# spolupracuje s tabulkou _user, ze které kopíruje záznam přihlášeného klienta do $USER
# je volána ze server.php a z hlavního programu
# -------------------------------------------------------------------------------------------------- sess_open
function sess_open($save_path, $session_name) {
//                                         display("sess_open($save_path,$session_name)");
  global $sess_save_path;
  $sess_save_path= $save_path;
  return true;
}
# -------------------------------------------------------------------------------------------------- sess_close
function sess_close() {
//                                         display("sess_close");
  return true;
}
# -------------------------------------------------------------------------------------------------- sess_read
# přečte informace o uživateli
# z prostředí obsluhy $_SESSION je voláno bez druhého parametru
# $login=true při přihlášení
function sess_read($id,$login=false) {
  global $sess_save_path, $ezer_user_id, $json, $USER, $ezer_system;
  ezer_connect('ezer_system');   // používá se kvůli mysql_query
  $return= '';
  $from= '';
  if ( $ezer_user_id ) {
    // čtení z _user
    $qry= "SELECT * FROM $ezer_system._user WHERE id_user=$ezer_user_id /*sess_read*/";
    $res= @mysql_query($qry);
//                                                 display("sess_read($id,$login)=$qry,$res,".mysql_error());
    if ( $res ) {
      $u= mysql_fetch_object($res);
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
      $return= $u->sess_data;
      $from.= 'db';
//                                         debug($USER);
    }
  }
  if ( !$return /*&& !$login*/ ) {
    $sess_file= "$sess_save_path/sess_$id";
    $return= (string)@file_get_contents($sess_file);
    $from.= 'file';
  }
//                                         display("sess_read($id,$ezer_user_id,$from)=".substr($return,0,36));
  return $return;
}
# -------------------------------------------------------------------------------------------------- sess_write
function sess_write($id, $sess_data) {
  global $sess_save_path, $ezer_user_id, $ezer_system;
  ezer_connect('ezer_system');   // používá se kvůli mysql_query
  $return= false;
  $into='';
  if ( $ezer_user_id ) {
    // zapiš do _user
    $data= mysql_real_escape_string($sess_data);
    $qry= "UPDATE $ezer_system._user SET sess_data='$data',sess_id='$id',sess_time=now()
      WHERE id_user=$ezer_user_id";
    $res= mysql_query($qry);
//                                         display("sess_write res:$res,qry:$qry");
    $return= $res ? true : false;
    $into.= "db:$res";
  }
//   else {
    // zapiš do souboru
    $sess_file= "$sess_save_path/sess_$id";
    if ($fp= @fopen($sess_file, "w")) {
      $return= fwrite($fp, $sess_data);
      $into.= ",file:$return";
      fclose($fp);
    }
//   }
//                                         display("sess_write($id,$ezer_user_id,$into)");
  return $return;
}
# -------------------------------------------------------------------------------------------------- sess_destroy
function sess_destroy($id) {
//                                         display("sess_destroy");
  global $sess_save_path, $USER;
  $USER= null;
  $sess_file= "$sess_save_path/sess_$id";
  session_id('');
  return(@unlink($sess_file));
}
# -------------------------------------------------------------------------------------------------- sess_revive
function sess_revive() {
  global $sess_save_path;
  // změň datum souboru
  $id= session_id();
  $time= time();
  $sess_file= "$sess_save_path/sess_$id";
  $ok= @touch($sess_file,$time,$time);
//                                         display("sess_revive($id)=".($ok?'ok':'ko'));
  return true;
}
# -------------------------------------------------------------------------------------------------- sess_gc
function sess_gc($maxlifetime) {
//                                         display("sess_gc");
  global $sess_save_path;
  foreach (glob("$sess_save_path/sess_*") as $filename) {
    if (filemtime($filename) + $maxlifetime < time()) {
      @unlink($filename);
    }
  }
  return true;
}
# -------------------------------------------------------------------------------------------------- sess_start
function sess_start($omitt_user=false) {
  global $ezer_root, $sess_save_path, $ezer_user_id;
//   if ( !function_exists('display') ) {
//     function display($x) { echo "$x<br>"; }
//   }
//   if ( !function_exists('debug') ) {
//     function debug() { return true; }
//   }
//                                         display("sess_start");
//   ini_set("session.gc_maxlifetime", "1440"); -- nastavuje se v ae_slib
//!   $sess_save_path= ini_get('session.save_path')."/tmp_ezer";
//                                         display("sess_start: sess_save_path=$sess_save_path");
//                                         display("sess_start: session_id=".session_id());
//!   if (!is_dir($sess_save_path)) mkdir($sess_save_path, 0777);
  ini_set('session.save_path', $sess_save_path);
  session_set_save_handler("sess_open","sess_close","sess_read","sess_write","sess_destroy","sess_gc");
  session_start();
  if ( $_SESSION[$ezer_root]['user_id'] && !$omitt_user ) {
//                                         display("sess_start: user_id={$_SESSION[$ezer_root]['user_id']}");
    $ezer_user_id= $_SESSION[$ezer_root]['user_id'];
    sess_read('',true);
  }
}
?>
