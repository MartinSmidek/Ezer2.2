<?php // ezer 2.2
/**
 * $app_name      - zobrazený název aplikace
 * $app_login     - username/password (pouze pro automatické přihlášení)
 * $ezer_root     - podsložka aplikace
 * $kontakt       - kontakt zobrazený na přihlašovací stránce
 * $app_js        - seznam *.js umístěných v $ezer_root
 * $app_css       - seznam *.css umístěných v $ezer_root
 * $skin=default  - počáteční skin aplikace 
 * $abs_roots     - [server,local]
 * $rel_roots     - [server,local]
 * $add_pars      - (array) doplní resp. přepíše obsah $pars
 */
//  global $ezer_root;
//  $ezer_root= $app_root;
  
  global $app_root, $ezer_root;
  $ezer_root= $app_root;
  
  // platí buďto is_null($ezer_local) nebo is_null($ezer_server)
  global $ezer_local, $ezer_server;
  if ( is_null($ezer_local) && is_null($ezer_server) ) 
    fce_error("inconsistent server setting (2)");
  $is_local= is_null($ezer_local) ? !$ezer_server : $ezer_local;

  // nastavení zobrazení PHP-chyb klientem při &err=1
  if ( isset($_GET['err']) && $_GET['err'] ) {
    error_reporting(E_ALL ^ E_NOTICE);
    ini_set('display_errors', 'On');
  }

//  // rozlišení lokální a ostré verze
//  $ezer_local= preg_match('/^\w+\.bean$/',$_SERVER["SERVER_NAME"])?1:0;

  // parametry aplikace
  $app= $app_root;
  $CKEditor= isset($_GET['editor'])  ? $_GET['editor']  : '4.6';
  $dbg=      isset($_GET['dbg'])     ? $_GET['dbg']     : 1;                          /* debugger */
  $gapi=     isset($_GET['gapi'])    ? $_GET['gapi']    : 0; //!($ezer_local || $ezer_ksweb);
  $gmap=     isset($_GET['gmap'])    ? $_GET['gmap']    : 0; //!($ezer_local || $ezer_ksweb);

  // inicializace SESSION
  if ( !isset($_SESSION) ) {
    session_unset();
    session_start();
  }

  if ( isset($ezer_server) ) $_SESSION[$app]['ezer_server']= $ezer_server;
  $_SESSION[$app]['ezer']= '2.2';
  $_SESSION[$app]['GET']= array();

  // nastavení cest
  $abs_root= isset($ezer_server) ? $abs_roots[$ezer_server] : $abs_roots[$ezer_local];
  $_SESSION[$app]['abs_root']= $abs_root;

  $http_rel_root= isset($ezer_server) ? $rel_roots[$ezer_server] : $rel_roots[$ezer_local];
  list($http,$rel_root)= explode('://',$http_rel_root);
  $_SESSION[$app]['rel_root']= $rel_root;
  
  $_SESSION[$app]['app_path']= "";

  // nastavení cest

  // kořeny pro LabelDrop
  $path_files_href= "$http_rel_root/docs/$app";
  $path_files_s= "$abs_root/docs/$app";
  $path_files_h= substr($abs_root,0,strrpos($abs_root,'/'))."/files/$app/";

  set_include_path(get_include_path().PATH_SEPARATOR.$abs_root);
  $_POST['root']= $ezer_root;
  require_once("$app.inc.php");
  
  $cms= "$http://$rel_root/$ezer_root";
  $client= "$http://$rel_root/{$EZER->version}/client";
  $licensed= "$client/licensed";

  // detekce dotykových zařízení
  $android=    preg_match('/android|x11/i',$_SERVER['HTTP_USER_AGENT']);
  $ipad=       preg_match('/iPad/i',$_SERVER['HTTP_USER_AGENT']) || isset($_GET['ipad']);

  // ----------------------------------------------------- JS verze Ezer 2.2
  $js= array_merge(
    // ckeditor a mootools
    array("$licensed/ckeditor$CKEditor/ckeditor.js","$licensed/clientcide.js"),
    // clipboard.js
    array("$licensed/clipboard.min.js"),
    // datum
    array("$licensed/datepicker.js"),
    // jádro Ezer
    array("$client/lib.js","$client/ezer_fdom1.js","$client/ezer.js","$client/ezer_report.js",
      "$client/area.js", "$client/ezer_fdom2.js","$client/app.js",
      "$licensed/mootree.js"),
    // debugger                                                                
    $dbg ? array("$licensed/jush/mini_jush.js"):array(),                       
    // rozhodnout zda používat online mapy
    $gmap ? array("https://maps.googleapis.com/maps/api/js?sensor=false") : array(),
    // uživatelské skripty
    $app_js
  );
  
  $css= array_merge(
     array(
       $dbg ? "$licensed/jush/mini_jush.css" : '',                                    
      "$client/ezer.css.php", 
      "$client/licensed/datepicker/datepicker_vista/datepicker_vista.css",
      "$client/licensed/font-awesome/css/font-awesome.min.css",
      $android ? "$client/android.css" : "",
      $ipad ? "$client/ipad.css" : ""
     ),
     $app_css 
  );

  // nastavení jádra
  $options= (object)array(              // přejde do Ezer.options...
    'awesome' => 3,
    'gmap' => $gmap,                    // zda používat mapy Google
    'curr_version' => 0,                // při přihlášení je nahrazeno nejvyšší ezer_kernel.version
    'path_files_href' => "'$path_files_href'",  // relativní cesta do složky docs/{root}
    'path_files_s' => "'$path_files_s'",        // absolutní cesta do složky docs/{root}
    'path_files_h' => "'$path_files_h'"         // absolutní cesta do složky ../files/{root}
  );

  $pars= (object)array(
    'favicon' => isset($ezer_server) 
      ? ($ezer_server ? "{$app}.png" : "{$app}_local.png")
      : ($ezer_local ? "{$app}_local.png" : "{$app}.png"),
    'app_root' => "$rel_root",      // startovní soubory app.php a app.inc.php jsou v kořenu
    'dbg' => $dbg,                                              
    'watch_ip' => false,
    'watch_key' => false,
    'contact' => isset($kontakt) ? $kontakt : '',
    'CKEditor' => "{
      version:'$CKEditor',
      EzerHelp2:{
        toolbar:[['PasteFromWord','-','Bold','Italic','TextColor','BGColor',
          '-','JustifyLeft','JustifyCenter','JustifyRight',
          '-','Link','Unlink','HorizontalRule','Image',
          '-','NumberedList','BulletedList',
          '-','Outdent','Indent',
          '-','Source','ShowBlocks','RemoveFormat']],
        extraPlugins:'ezersave,imageresize', removePlugins:'image'
      }
    }"
  );
    
  // případná úprava $pars podle $add_pars
  if ( isset($add_pars) ) {
    foreach ($add_pars as $key=>$val) {
      $pars->$key= $val;
    }
  }
    
  // případná úprava $options podle $add_options
  if ( isset($add_options) ) {
    foreach ($add_options as $key=>$val) {
      $options->$key= $val;
    }
  }

  // způsob přihlášení  
  if ( isset($app_login) && $app_login ) {
    $pars->autologin= $app_login;   
    $options->must_log_in= 0;
  }
  else {
    $options->must_log_in= 1;
  }
  root_php($app,$app_name,'chngs',$skin,$options,$js,$css,$pars);
?>
