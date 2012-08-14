<?php

header("Content-type: application/javascript; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

$dir = $_GET['file'];

if(!is_dir($dir)) {
  if($file_contents = file_get_contents($dir)) {
    echo $file_contents;
  } else {
    echo 'dir error'; 
  }
  
  die;
}

$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir), RecursiveIteratorIterator::CHILD_FIRST);
                                              
foreach ($iterator as $path) {
  if(!$path->isDir()) {
    if(substr($path->__toString(), -2) == 'js') {
      // echo "//";
      // echo $path->__toString();
      // echo "\n";
      // readfile($path->__toString());
      $files[$path->__toString()] = file_get_contents($path->__toString());
    }
  }
}

ksort($files);
echo implode('', $files);

// EOF