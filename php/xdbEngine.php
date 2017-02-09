<?php
session_start();

include '../vendor/autoload.php';
include 'utils.php';
include 'reportEngine.php';
include 'admin.php';
include 'taskQuery.php';
include 'experiment.php';
include 'account.php';

if( ISSET($_SESSION['user']) == FALSE ){

	if( ISSET($_GET['token']) ){
		// only special commands work in this case
	
		// find the user from given token and set for this call only
		$userName = "";
		$db = connect2DB($xdbMongoDBName);
		$users = $db->Users->find();
		foreach( $users as $user ){
			if( ISSET($user['experiments']) ){
				foreach($user['experiments'] as $experimentID){
					$dbInfo = $db->Experiments->findOne(array('_id' => new MongoId($experimentID)));
					if( $dbInfo ){
						if( $dbInfo['token'] == $_GET['token'] ){
							$userName = $user['user'];
							break;
						}
					}
				}
			}
			if( $userName != "" )
				break;
		}
	
		if( $userName != "" || True ){
			$_SESSION['user'] = $userName;
	
			if( ISSET($_GET['cmd']) && ISSET($_GET['experiment_id']) ){
				$cmd = $_GET['cmd'];
				checkReportQueryCmds($cmd);
			}
			unset($_SESSION['user']);
		}
	}
	else{
		$output = array('response' => 'Unknown user name');
		print json_encode($output);
		
		session_unset();
		session_destroy();
	}
	
	exit();
}

if( ISSET($_GET['cmd']) && $_GET['cmd'] == "logout" ){
	unset($_SESSION['user']);
	session_unset();
	session_destroy();
	exit();
}
else if( ISSET($_GET['cmd']) ){
	$cmd = $_GET['cmd'];

	if( $_SESSION['user'] == "admin" )
		checkAdminCmds($cmd);
	else{
		checkExperimentCmds($cmd);
		checkAccountCmds($cmd);
		checkTaskQueryCmds($cmd);
	}
}

?>