<?php # (c) 2008 Martin Smidek <martin@smidek.eu>
  error_reporting(E_ALL & ~E_NOTICE);
  session_start();
  $path= $_SERVER["DOCUMENT_ROOT"].'/';
  # -------------------------------------------------------------------------------------- file_send
  $name=   $_SERVER['HTTP_EZER_FILE_NAME'];
  $chunk=  $_SERVER['HTTP_EZER_FILE_CHUNK'];
  $chunks= $_SERVER['HTTP_EZER_FILE_CHUNKS'];
  $path.=  $_SERVER['HTTP_EZER_FILE_PATH'];
  $data= file_get_contents("php://input");
  $end= "";//"<br>saved:".count($_SESSION['upload'][$name]);
  // nastavení zaèátku
  if ( $chunk==1 ) {
    $_SESSION['upload'][$name]= array();
  }
  // test konce
  if ( count($_SESSION['upload'][$name])==($chunks-1) ) {
    // poskládej a ulož soubor
    $f= fopen("$path$name",'w');
    for  ($i= 1; $i<=$chunks; $i++) {
      if ( $i==$chunk) {
        fwrite($f,$data);
//         $end.= "<br>$i='$data'";
      }
      else {
        $x= $_SESSION['upload'][$name][$i];
        fwrite($f,$x);
//         $end.= "<br>$i:'$x'";
      }
    }
    fclose($f);
  }
  else {
    // uložení èásti
    $_SESSION['upload'][$name][$chunk]= $data;
  }
  // návrat hodnoty
//   $ret= "$name  $chunk/$chunks $path '$data' ? '{$_SESSION['upload'][$name][$chunk]}' ".strlen($data).$end;
  $ret= "$name  $chunk/$chunks $path ".strlen($data).$end;
  echo $ret;
  exit;
?>
