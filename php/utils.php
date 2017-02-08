<?php

$salt = '$1a$2107$usessillystringforsalt$35$';
$mongoDBAddr = "";

function connect2DB($dbName)
{
	global $mongoDBAddr;
	
	try{
		$m = new MongoClient("mongodb://".$mongoDBAddr);
		return $m->selectDB($dbName);
	}
	catch( MongoConnectionException $e){
		echo "<p>Couldn't connect to mongoDB<br><pre>$e</pre></p>";
		exit();
	}
	catch( MongoException $e){
		echo "<p>MongoException<br><pre>$e</pre></p>";
		exit();
	}
	return 0;
}

?>