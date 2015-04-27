<?php # (c) 2008 Martin Smidek <martin@smidek.eu>
  error_reporting(E_ALL & ~E_NOTICE);
  session_start();
  # -------------------------------------------------------------------------------------- file_send
  $name=   $_SERVER['HTTP_EZER_FILE_NAME'];
  $name=   utf2ascii(urldecode($name));
  $chunk=  $_SERVER['HTTP_EZER_FILE_CHUNK'];
  $chunks= $_SERVER['HTTP_EZER_FILE_CHUNKS'];
  $relpath=$_SERVER['HTTP_EZER_FILE_RELPATH'];
  $path=   $_SERVER['DOCUMENT_ROOT'].DIRECTORY_SEPARATOR.$relpath;
  $pname= "$path$name";

  $data= file_get_contents("php://input");
  $end= "";
  // nastavení začátku
  $err= '';
  $size= 0;
  if ( $chunk==1 ) {
    $_SESSION['upload'][$name]= array();
    if ( file_exists($pname) ) {
      $err= "ERROR soubor $name již existuje, lze smazat přes kontextové menu";
      goto end;
    }
  }
  // test konce
  if ( count($_SESSION['upload'][$name])==($chunks-1) ) {
    // poskládej a ulož soubor
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
# ---------------------------------------------------------------------------------------- utf2ascii
# konverze z UTF-8 do písmen, číslic, teček a podtržítka, konvertují se i html entity
function utf2ascii($val) {
  $txt= preg_replace('~&(.)(?:acute|caron);~u', '\1', $val);
  $txt= preg_replace('~&(?:nbsp|amp);~u', '_', $txt);
  $ref= preg_replace('~[^\\pL0-9_\-\.]+~u', '_', $txt);
  $ref= trim($ref, "_");
//     setLocale(LC_CTYPE, "cs_CZ.utf-8");                      bohužel nebývá nainstalováno
//     $url= iconv("utf-8", "us-ascii//TRANSLIT", $url);
  $ref= strtr($ref,array('ě'=>'e','š'=>'s','č'=>'c','ř'=>'r','ž'=>'z','ý'=>'y','á'=>'a','í'=>'i',
                         'é'=>'e','ů'=>'u','ú'=>'u','ó'=>'o','ď'=>'d','ť'=>'t','ň'=>'n'));
  $ref= strtr($ref,array('Ě'=>'E','Š'=>'S','Č'=>'C','Ř'=>'R','Ž'=>'Z','Ý'=>'Y','Á'=>'A','Í'=>'I',
                         'É'=>'E','Ů'=>'U','Ú'=>'U','Ó'=>'O','Ď'=>'D','Ť'=>'T','Ň'=>'N'));
  $ref= mb_strtolower($ref);
  $ref= preg_replace('~[^-a-z0-9_\.]+~', '', $ref);
  return $ref;
}
?>
