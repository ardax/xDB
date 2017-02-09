<?php

function checkAdminCmds($cmd)
{
	global $xdbMongoDBName;
	
	if( $cmd == "get_new_user_requests" ){

		$db = connect2DB($xdbMongoDBName);
		if( $db ){
			$userRequests = $db->UserRequests->find();
			
			$output = array('results' => array());
			foreach( $userRequests as $userRequest ){
				$request = array('id' => (string)$userRequest['_id'], 'user' => $userRequest['user'], 'request_date' => $userRequest['request_date']->sec, 'request_ip' => $userRequest['request_ip']);
				array_push($output['results'], $request);
			}

			print json_encode($output);
		}
	}
	else if( $cmd == "approve_new_user_request" ){
		
		if( ISSET($_GET['request_id']) ){
			$requestID = $_GET['request_id'];

			$db = connect2DB($xdbMongoDBName);
			if( $db ){
				$request = $db->UserRequests->findOne(array('_id' => new MongoId($requestID)));
				if( $request ){
					$newUser = array('user' => $request['user'], 'pass' => $request['pass'], 'experiments' => array());
					$db->Users->insert($newUser);
					$db->UserRequests->remove(array('_id' => new MongoId($requestID)));
					print "OK";
				}
			}
		}
	}
	else if( $cmd == "remove_new_user_request" ){

		if( ISSET($_GET['request_id']) ){
			$requestID = $_GET['request_id'];
		
			$db = connect2DB($xdbMongoDBName);
			if( $db ){
				$db->UserRequests->remove(array('_id' => new MongoId($requestID)));
				print "OK";
			}
		}
	}
	else
		return false;
	return true;
}
?>