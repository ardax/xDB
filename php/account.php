<?php

function checkAccountCmds($cmd)
{
	global $salt;
	
	if( $cmd == "get_experiments_list" ){
	
		try{
			$experiments = array('results' => array());

			$db = connect2DB("XDB");
			$user = $db->Users->findOne(array('user' => $_SESSION['user']));
			if( $user ){
				if( ISSET($user['shared_experiments']) ){
					
					foreach($user['shared_experiments'] as $sharedExperiment){
						$info = $db->Experiments->findOne(array('_id' => new MongoId($sharedExperiment['experiment_id'])));
						if( $info ){
							$shown_results = array('accuracy' => 1, 'precision' => 0, 'recall' => 0, 'fscore' => 0);
							if( ISSET($info['shown_results']) )
								$shown_results = $info['shown_results'];

							$devFiles = array();
							$devFileEntries = $db->selectCollection("DevFiles-".$sharedExperiment['experiment_id'])->find();
							foreach( $devFileEntries as $devFileEntry){
								if( $devFileEntry['file'] == $sharedExperiment['shared_file'] || $sharedExperiment['shared_file'] == "" ){
									$entry = array('file' => $devFileEntry['file']);
									if( ISSET($devFileEntry['latest_result']) )
										$entry['latest_result'] = $devFileEntry['latest_result'];
									if( ISSET($devFileEntry['best_result']) )
										$entry['best_result'] = $devFileEntry['best_result'];
									array_push($devFiles, $entry);
								}
							}
	
							$experimentEntry = array('id' => $sharedExperiment['experiment_id'], 'name' => $info['name'], 'shown_results' => $shown_results, 'dev_files' => $devFiles, 'sharer' => $sharedExperiment['sharer']);
							array_push($experiments['results'], $experimentEntry);
						}
					}
				}
				
				foreach($user['experiments'] as $experimentID){
					$info = $db->Experiments->findOne(array('_id' => new MongoId($experimentID)));
					if( $info ){
						$shown_results = array('accuracy' => 1, 'precision' => 0, 'recall' => 0, 'fscore' => 0);
						if( ISSET($info['shown_results']) )
							$shown_results = $info['shown_results'];

						$devFiles = array();
						$devFileEntries = $db->selectCollection("DevFiles-".$experimentID)->find();
						foreach( $devFileEntries as $devFileEntry){
							$entry = array('file' => $devFileEntry['file']);
							if( ISSET($devFileEntry['latest_result']) )
								$entry['latest_result'] = $devFileEntry['latest_result'];
							if( ISSET($devFileEntry['best_result']) )
								$entry['best_result'] = $devFileEntry['best_result'];
							array_push($devFiles, $entry);
						}

						$token = null;
						if( !ISSET($info['token']) ){
							$token = (string)(new MongoId());
							$db->Experiments->update(array('_id' => new MongoId($experimentID)), array('$set' => array('token' => $token)));
						}
						else
							$token = $info['token'];
						
						$experimentEntry = array('id' => $experimentID, 'name' => $info['name'], 'token' => $token, 'shown_results' => $shown_results, 'dev_files' => $devFiles);
						if( ISSET($info['shared']) )
							$experimentEntry['shared'] = $info['shared'];
							
						array_push($experiments['results'], $experimentEntry);
					}
				}
			}
				
			print json_encode($experiments);
		}
		catch( MongoConnectionException $e){
			echo "<p>Couldn't connect to mongoDB<br><pre>$e</pre></p>";
			exit();
		}
		catch( MongoException $e){
			echo "<p>MongoException<br><pre>$e</pre></p>";
			exit();
		}
	}
	else if( $cmd == "create_new_experiment" ){
	
		try{
			$db = connect2DB("XDB");
			$user = $db->Users->findOne(array('user' => $_SESSION['user']));
			if( $user ){
				foreach($user['experiments'] as $experimentID){
					$dbInfo = $db->Experiments->findOne(array('_id' => new MongoId($experimentID)));
					if( $dbInfo ){
						if( strcasecmp($dbInfo['name'], $_GET['name']) == 0 ){
							// already experiment with given name
							$output = array('msg' => 'Already experiment exists with given name');
							print json_encode($output);
							exit();
						}
					}
				}
	
				$token = (string)(new MongoId());
				
				$newExpeimentEntry = array('name' => $_GET['name'],
										   'token' => $token,
										   'shown_results' => array('accuracy' => 1, 'precision' => 0, 'recall' => 0, 'fscore' => 0));

				$info = $db->Experiments->insert($newExpeimentEntry);
				
				$newExperimentID = "XDB-".(string)$newExpeimentEntry['_id'];

				$newExperiment = array('new_experiment' => array('name' => $_GET['name'], 'id' => $newExperimentID, 'token' => $token, 'shown_results' => array('accuracy' => 1, 'precision' => 0, 'recall' => 0, 'fscore' => 0)));
				
				print json_encode($newExperiment);
	
				// update user account
				$db->Users->update(array('user' => $_SESSION['user']), array('$addToSet' => array('experiments' => (string)$newExpeimentEntry['_id'])));
			}
		}
		catch( MongoConnectionException $e){
			echo "<p>Couldn't connect to mongoDB<br><pre>$e</pre></p>";
			exit();
		}
		catch( MongoException $e){
			echo "<p>MongoException<br><pre>$e</pre></p>";
			exit();
		}
	}
	else if( $cmd == "change_password" ){

		$db = connect2DB("XDB");
		$user = $db->Users->findOne(array('user' => $_SESSION['user']));
		if( $user ){
			$hashed_password = crypt($_GET['curr'], $salt);
			if( $user['pass'] == $hashed_password ){
				$newhashed_password = crypt($_GET['new'], $salt);
				$db->Users->update(array('user' => $_SESSION['user']), array('$set' => array('pass' => $newhashed_password)));
				
				$output = array('msg' => "Your password changed successfully!");
				print json_encode($output);
			}
			else{
				$output = array('msg' => "Given password is wrong");
				print json_encode($output);
			}
		}
	}
	else
		return false;
	return true;
}
?>