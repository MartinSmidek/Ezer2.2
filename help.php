<?php
  $text= '?';
  $item= $_GET['item'];
  // otevření databáze a tabulky
  $ezer_db= @mysql_connect('localhost','gandi','');
//                                         echo "connect=$ezer_db";
  $res= @mysql_select_db('ezer_kernel',$ezer_db);
//                                         echo "db=$res";
  @mysql_query("SET NAMES 'utf8'");
  $rt= @mysql_query("SELECT * FROM ezer_doc2 WHERE class='$item'");
//                                         echo "query=$rt";
  if ( $rt && $t= mysql_fetch_object($rt) ) {
    $text= $t->text;
  }

  echo_page($text);
//                                         echo "text=$text";

function echo_page($text) {
  // definice povinného začátku a konce HTML stránky
  $html_header= "\xEF\xBB\xBF";    // DOM pro UTF-8
  $html_header.= <<<__EOD
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en" dir="ltr">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=8" />
  <title>Ezer help</title>
  <script type="text/javascript">
//     function ask_help(status) {
//       // ok:hodnota nebo ko:chyba
//       var ok= top.postMessage(status,'http://fis2.ezer');
//     }
//     ask_help('me');
  </script>
  <link charset="utf-8" media="screen" type="text/css" href="./client/ezer.css.php" rel="stylesheet">
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
  </div>
<!-- konec -->
</body>
</html>
__EOD;

echo $template;
}
?>
