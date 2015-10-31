<?php # (c) 2008 Martin Smidek <martin@smidek.eu>

  // nastavení zobrazení PHP-chyb klientem při &err=1
  if ( isset($_GET['err']) && $_GET['err'] ) {
    error_reporting(E_ALL ^ E_NOTICE);
    ini_set('display_errors', 'On');
  }

  // parametry aplikace DBG
  $app=      'dbg';
  $app_name= 'Debugger pro framework Ezer';
  $skin=     'default';

  $src= $_GET['src'].".ezer";
  $url= "../$src";

  $html= "
    <ol id='dbg_src'>
  ";
  $lns= file($url,FILE_IGNORE_NEW_LINES);
  foreach($lns as $i=>$ln) {
    $lnx= htmlentities($ln);
    $iii= str_pad($i+1,3,' ',STR_PAD_LEFT);
    $html.= "\n<li><span>$iii</span>$lnx</li>";
  }
  $html.= "
    </ol>
  ";
  $html= html_closure($src,$html);
  echo $html;

function html_closure($win_name,$body) {
  $html= <<<__EOD
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en" dir="ltr">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=9" />
    <link rel="shortcut icon" href="./ezer2.2/client/img/dbg.ico" />
    <title>$win_name</title>
    <script type="text/javascript">

      function dbg_onclick_start(win) {
        win= win ? win : window;
        var dbg_src= win.document.getElementById('dbg_src');
        if ( dbg_src ) {
          dbg_src.addEvents({
            click: function(el) {
              var chs= el.target.getParent().getChildren(), x= 0;
              for (var i=0; i<chs.length; i++) {
                if ( chs[i]==el.target ) {
                  x= i+1;
                  break;
                }
              }
              if ( x ) {
                proc= opener.dbg_onclick_line(x);
                if ( proc ) {
                  chs[x-1].toggleClass('break');
                }
              }
              return x;
            }
          })
        }
      };

    </script>
    <script src="http://ys2.ezer:8080/ezer2.2/client/licensed/clientcide.js" type="text/javascript" charset="utf-8"></script>
    <style>
      ol {
        padding: 0;
      }
      li {
        white-space: pre;
        font-family: monospace,consolas;
        font-size: 8pt;
        list-style-type: none;
      }
      li span {
        background-color: silver;
        padding-right: 5px;
        margin-right: 5px;
      }
      li.break span {
        background-color: darkred;
        color: yellow;
      }
    </style>
  </head>
  <body onload="dbg_onclick_start()" style="background-color:oldlace;">
  $body
  </body>
</html>
__EOD;
  return $html;
}

?>

