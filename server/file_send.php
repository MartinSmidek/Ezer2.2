<?php # (c) 2008 Martin Smidek <martin@smidek.eu>
  error_reporting(E_ALL & ~E_NOTICE);
  session_start();
  # -------------------------------------------------------------------------------------- file_send
  $name=   $_SERVER['HTTP_EZER_FILE_NAME'];
  $chunk=  $_SERVER['HTTP_EZER_FILE_CHUNK'];
  $chunks= $_SERVER['HTTP_EZER_FILE_CHUNKS'];
  $path=   $_SERVER['HTTP_EZER_FILE_PATH'];
  $data= file_get_contents("php://input");
  $end= "";
  // nastavení začátku
  $err= '';
  $size= 0;
  if ( $chunk==1 ) {
    $_SESSION['upload'][$name]= array();
  }
  // test konce
  if ( count($_SESSION['upload'][$name])==($chunks-1) ) {
    // poskládej a ulož soubor
    $pname= "$path$name";
    $errmsg1= "ERROR soubor byl přenesen ale nelze zapsat do '$path$name'";
    $errmsg2= "ERROR soubor byl přenesen ale má nulovou délku";
    $f= @fopen($pname,'w');
    if ( !$f ) { $err= $errmsg1; goto end; }
    for  ($i= 1; $i<=$chunks; $i++) {
      if ( $i==$chunk) {
        $stat= fwrite($f,$data);
        if ( $stat===false ) { $err= $errmsg1; goto end; }
      }
      else {
        $x= $_SESSION['upload'][$name][$i];
        $stat= fwrite($f,$x);
        if ( $stat===false ) { $err= $errmsg1; goto end; }
      }
    }
    fclose($f);
    if ( file_exists($pname) ) {
      $size= filesize($pname);
      if ( !$size ) { $err= $errmsg2; goto end; }
    }
    else { $err= $errmsg1; goto end; }
  }
  else {
    // uložení části
    $_SESSION['upload'][$name][$chunk]= $data;
  }
  // návrat hodnoty
end:
  //     0     1              2     3     4    5
  $ret= "$name|$chunk/$chunks|$path|$size|$end|$err";
  echo $ret;
  exit;
?>
