<?php # (c) 2008 Martin Smidek <martin@smidek.eu>

# screen=1 zobrazí rozměr klientské části

  # identifikace ostrého serveru
  $ezer_local= preg_match('/^\w+\.ezer/',$_SERVER["SERVER_NAME"]);
  $favicon= $ezer_local ? "comp_local.png" : "comp.png";

  if ( $_GET['spec'] ) {
    switch ($_GET['spec']) {
    case 'phpinfo': phpinfo(); break;
    }
    exit;
  }

  $root= $_GET['root'];
  $option_state= $_GET['trace'];
  $option_list= $_GET['list'];
  $option_source= $_GET['source'];
  global $display, $trace, $json, $ezer_path_serv, $ezer_path_appl, $ezer_path_code, $ezer_root;

  list($url)= explode('?',$_SERVER['HTTP_REFERER']);

  require_once("server/ae_slib.php");
  require_once("server/licensed/JSON.php");

  $json= new Services_JSON();
  // verze kompilátoru
  clearstatcache();
  $xname= "server/comp2.php";
  $xtime= @filemtime($xname);                   // modifikace kompilátoru

  // nalezení dostupných aplikací a zřetězení souborů comp.css
  $appls= array();
  $css= '';
  if ($dh= opendir('..')) {
    while (($appl= readdir($dh)) !== false) {
      if ( $appl[0]!='.' && is_dir("../$appl") ) {
        if ( glob("../$appl/*.ezer") ) {
          $appls[]= $appl;
        }
        if ( glob("../$appl/comp.css") ) {
          $css.= "\n  <link rel='stylesheet' href='../$appl/comp.css' type='text/css' media='screen' charset='utf-8' />";
        }
      }
    }
    closedir($dh);
  }
  ksort($appls);
  // ------------------------------------------------------------------------------------ select
  $sel= "<select onchange='go(this.value)'>";
  foreach ($appls as $appl) {
    if ( !$root ) $root= $appl;
    $jo= $appl==$root ? " selected" : '';
    $sel.= "<option$jo>$appl</option>";
  }
  $sel.= "</select>";
  // ------------------------------------------------------------------------------------ options
  $checked= $option_state==1 ? 'checked' : '';
  $checks= "\n\n<input type='checkbox' $checked  onchange='set_option_trace(this.checked,1)'/> trace proc";
  $checked= $option_state==4 ? 'checked' : '';
  $checks.= "\n\n<input type='checkbox' $checked  onchange='set_option_trace(this.checked,4)'/> trace all";
  $checked= $option_source==1 ? 'checked' : '';
  $checks.= "\n<input type='checkbox' $checked  onchange='set_option_source(this.checked)'/> zdroj";
  $checked= $option_state==7 ? 'checked' : '';
  $checks.= "<br>\n<input type='checkbox' $checked  onchange='set_option_trace(this.checked,7)'/> list proc";
  $checks.= "<input type='text' value='$option_list' size=7 onchange='set_option_list(this)'/>";
  $checks.= "<br>\n<input type='submit' value='celou aplikaci' onclick='go_all(\"yes\");' />";
  $checks.= "<br>\n<input type='submit' value='... včetně err' onclick='go_all(\"err\");' />";
  $checks.= "<br>\n<input type='submit' value='obnova tabulek' onclick='go_tables();' />";
  $checks.= "<br>\n<input type='submit' value='PHPinfo' onclick='go_phpinfo();' />";
  $ip= "<br>remote:{$_SERVER["REMOTE_ADDR"]}<br>forwarded:{$_SERVER["HTTP_X_FORWARDED_FOR"]}";
  $ip.= "<br>client:{$_SERVER["HTTP_CLIENT_IP"]}<br>proc:".get_ip_address();
  // východ a západ slunce pro 49°11'33.633"N, 16°31'52.405"E
  function gps2float($deg, $min, $sec = 0) {
    return $deg + $min/60 + $sec/60/60;
  }
  $lat= gps2float(49,11,33.633);
  $lon= gps2float(16,31,52.405);
  $ip.= "<br>sun: " . date_sunrise(time(),SUNFUNCS_RET_STRING,$lat,$lon,90,1)
    . ' - ' . date_sunset(time(),SUNFUNCS_RET_STRING,$lat,$lon,90,1);
  $checks.= "\n$ip";
  // seznam složky aplikace
  $ezer_root= $root;
  $state= '';
  $ezer_path_root= str_replace("/ezer2.2/comp.php","",$_SERVER['SCRIPT_FILENAME']);
  $ezer_path_appl= "$ezer_path_root/$root";
  $ezer_path_code= "$ezer_path_root/$root/code";
  $ezer_path_serv= "$ezer_path_root/ezer2.2/server";
  require_once("server/comp2.php");
  require_once("server/comp2def.php");
  $files= array();
  if ($dh= opendir($ezer_path_appl)) {
    while (($file= readdir($dh)) !== false) {
      if ( substr($file,-5)=='.ezer' ) {
        $name= substr($file,0,strlen($file)-5);
        $etime= @filemtime("$ezer_path_appl/$name.ezer");
        $ctime= @filemtime("$ezer_path_code/$name.json");
        if ( !$ctime)
          $files[$name]= 'err';
        else
          $files[$name]= !$ctime || $ctime<$etime || $ctime<$xtime ? "old" : "ok";
      }
    }
    closedir($dh);
  }
  ksort($files);
  // ------------------------------------------------------------------------------------ obnova tabulek
  if ( $_GET['refresh']=='tables' ) {
    require_once("server/reference.php");
    require_once("$ezer_path_root/$root.inc");
    ezer_connect();
    $lst.= i_doc('javascript');
    $lst.= $trace;
    $lst.= $display;
  }
  // kompilace
  else if ( $_GET['all']=='yes' ) {
    // kompilace neaktuálních modulů celé aplikace
    $lst= comp_application($ezer_root,$state);
    $compiled= '';
  }
  else if ( $_GET['all']=='err' ) {
    // kompilace neaktuálních modulů celé aplikace včetně chyb
    $lst= comp_application($ezer_root,$state,true);
    $compiled= '';
  }
  else {
    // kompilace jednoho modulu
    if ( $name= $_GET['file'] ) {
      $txt= comp_module($name,$ezer_root,$state);
      $compiled= $name;
      $lst.= $trace;
      $lst.= $display;
    }
  }
  // doplnění o výsledky kompilace
  foreach($files as $name=>$status) {
    $etime= @filemtime("$ezer_path_appl/$name.ezer");
    $ctime= @filemtime("$ezer_path_code/$name.json");
    if ( !$ctime)
      $files[$name]= 'err';
    else
      $files[$name]= !$ctime || $ctime<$etime || $ctime<$xtime ? "old" : "ok";
  }

  $h1= $compiled
    ? "<h1>Ezer2 / kompilace modulu '$compiled'</h1>"
    : "<h1>Ezer2 / kompilace aplikace '$root'</h1>";
  // ------------------------------------------------------------------------------------ menu
  $menu= "<table>";
  foreach($files as $name=>$status) {
    $menu.= <<<__EOD
      <tr>
        <td class='menu' onclick="go('$root','$name')">$name</td>
        <td class='menu $status'>$status</td>
      </tr>
__EOD
    ;
  }
  $menu.= "</table>";
  // ------------------------------------------------------------------------------------ layout
  // výsledek
  if ( $_GET['all']!='yes' ) {
    global $call_php;
    $calls= "<b>Kompilace:</b> $state";
    $calls.= "<br><br><b>PHP funkce volané ask a make:</b> "; $del= '';
    if ( $call_php ) {
      sort($call_php);
      foreach($call_php as $ask) {
        $calls.= "$del $ask";
        $del= ',';
      }
    }
    // ? debug a trace
    $lst.= $calls;
  }
/** ************************************************************************************************ generování HTML */
echo <<<__EOF
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 4.01 Strict">
<html>
<head>
  <meta http-equiv="content-type" content="text/html; charset=utf-8">
  <link rel="shortcut icon" href="$favicon" />
  <title>kompilace $root</title>$css
  <script type="text/javascript">
    var option_state= '$option_state';
    var option_list= '$option_list';
    var option_source= '$option_source';
    var browserWidth = 0, browserHeight = 0;
    if ( location.href.match('screen=1') )  {
      GetWindowProps();
      alert("width="+browserWidth+", height="+browserHeight);
    }
    function GetWindowProps() {
      //For checking non-IE browsers Mozilla, Safari, Opera, Chrome.
      if (typeof (window.innerWidth) == 'number') {
          browserWidth = window.innerWidth;
          browserHeight = window.innerHeight;
      }
      //All IE except version 4
      else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
          browserWidth = document.documentElement.clientWidth;
          browserHeight = document.documentElement.clientHeight;
      }
      //IE 4
      else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
          browserWidth = document.body.clientWidth;
          browserHeight = document.body.clientHeight;
      }
    }
    function go(appl,file) {
      var url= "$url"+"?root="+appl+(file?"&file="+file:'')
       +(option_list?'&list='+option_list:'')
       +(option_state?'&trace='+option_state:'')+(option_source?'&source=1':'');
      location.href= url;
    }
    function go_all(mode) {
      var url= "$url"+"?root=$root"+"&all="+mode
       +(option_state?'&trace='+option_state:'')+(option_source?'&source=1':'');
      location.href= url;
    }
    function go_tables() {
      var url= "$url"+"?root=$root"+"&refresh=tables"
       +(option_state?'&trace='+option_state:'')+(option_source?'&source=1':'');
      location.href= url;
    }
    function go_phpinfo() {
      var url= "$url"+"?root=$root"+"&spec=phpinfo";
      location.href= url;
    }
    function set_option_trace(x,n) {
      option_state= x ? n : 0;
    }
    function set_option_list(x) {
      option_list= x.value;
    }
    function set_option_source(x) {
      option_source= x ? 1 : 0;
    }
  </script>
</head>
<body>
  <table class='layout' width='100%'>
    <tr>
      <td class='layout levy' style='width:155px'>$sel</td>
      <td class='layout' colspan=2>$h1 </td>
    </tr><tr>
      <td class='layout levy' valign='top'>$menu $checks</td>
      <td class='layout pravy' valign='top'>$lst<hr></td>
      <td class='layout pravy' valign='top'>$txt</td>
    </tr>
  </table>
</body>
</html>
__EOF;
/** ************************************************************************************************ procedury */
function comp_module($name,$root='',&$state) {
  global $display, $trace, $json, $ezer_path_appl, $ezer_path_code;
  global $code, $option_source, $option_list;
//   $trace= $option_state;
  $state= comp_file($name,$root,$option_list);
  $txt= '';
  if ( $option_source ) {
    $src= file_get_contents("$ezer_path_appl/$name.ezer");
    $src= str_replace(' ','&nbsp;',$src);
    $src= nl2br($src);
    $note= false;
    for ($i= 0; $i<strlen($src); $i++) {
      $ch= $src[$i];
      if ( $ch=='#' ) $note= true;
      if ( $ch=='<' ) $note= false;
      if ( !$note ) $txt.= $ch;
    }
  }
//   debug($code,"COMPILED $name");
  display($state);
  return $txt;
}

// kompilace neaktuální modulů aplikace
function comp_application($root='',&$state,$errs=false) {
  global $files, $display, $trace, $err, $errors;
  $txt= '';
  foreach($files as $name=>$status) {
    if ( $status=='old' || ($errs && $status=='err') ) {
      $trace= '';
      $state= comp_file($name,$root).'<hr />';
      display($state);
      $txt.= $trace;
//                                         if ( substr($state,0,2)=='ko' ) break;
    }
  }
  return $txt;
}
// zjištění IP adresy
function get_ip_address() {
  $ip= isset($_SERVER['HTTP_X_FORWARDED_FOR'])
    ? $_SERVER['HTTP_X_FORWARDED_FOR'] : $_SERVER['REMOTE_ADDR'];
  return $ip;
}
?>
