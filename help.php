<?php

  $item= $_GET['item'];
  // otevření databáze a tabulky
//       'ezer_test'     => array(0,'localhost','gandi','','utf8'),
  $ezer_db= @mysql_connect('localhost','gandi','');
  $res= @mysql_select_db('ezer_test',$ezer_db);
  @mysql_query("SET NAMES 'utf8'");
//   $trace.= "<br>mysql_pconnect=$ezer_db,$res";
  $rt= @mysql_query("SELECT * FROM ezer_doc2 WHERE part='$item'");
  if ( $rt && $t= mysql_fetch_object($rt) ) {
    $text= $t->text;
  }


  // definice povinného začátku a konce HTML stránky
  $html_header= "\xEF\xBB\xBF";    // DOM pro UTF-8
  $html_header.= <<<__EOD
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en" dir="ltr">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=8" />
  <link rel="shortcut icon" href="./$ezer_root/img/$favicon" />
  <title>Ezer help</title>
  <script type="text/javascript">
//     function ask_help(status) {
//       // ok:hodnota nebo ko:chyba
//       var ok= top.postMessage(status,'http://fis2.ezer');
//     }
//     ask_help('me');
  </script>
  <link charset="utf-8" media="screen" type="text/css" href="./ezer2.2/client/ezer.css.php" rel="stylesheet">
  $head
</head>
__EOD;
  // definice možných HTML template stránky
# ------------------------------------------------------------------------------- HTML panel
# template pro zobrazení Ezer.PanelPlain jako hlavního objektu aplikace
$template= <<<__EOD
$html_header
<body id="body">
    <div id="work">$text</div>
<!-- paticka -->
  <div id="dolni" style="height:0">
    <div id="status_bar" style="width:100%;height:16px;padding: 1px 0pt 0pt;">
      <div id='status_left' style="float:left;">$item</div>
      <div id='status_center' style="float:left;"></div>
      <div id='status_right' style="float:right;"></div>
    </div>
    <pre id="kuk">$trace</pre>
  </div>
<!-- konec -->
</body>
</html>
__EOD;

echo $template;

?>
