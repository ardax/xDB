<?php

function checkExperimentCmds($cmd)
{
	if( ISSET($_GET['experiment_id']) ){
		
		$experimentID = $_GET['experiment_id'];
		$db = connect2DB("XDB");
	
		if( $cmd == "onload" ){
			// output test files and parameters
			
			// check if it is shared
			$shared = False;
			$user = $db->Users->findOne(array('user' => $_SESSION['user']));
			if( $user ){
				$userExperiment = False;
				foreach($user['experiments'] as $eID){
					if( $eID == $experimentID ){
						$userExperiment = True;
						break;
					}
				}
				if( $userExperiment == false )
					$shared = True;
			}
			else
				$shared = True;
			
			if( $shared ){
				if( $user && ISSET($user['shared_experiments']) ){

					$output = array('params' => array(), 'dev_files' => array(), 'experiment_info' => array());
					foreach($user['shared_experiments'] as $sharedExperiment){
						if( $sharedExperiment['experiment_id'] == $experimentID ){

							$info = $db->Experiments->findOne(array('_id' => new MongoId($sharedExperiment['experiment_id'])));
							if( $info ){
								$output['experiment_info'] = array('name' => $info['name'], 'shown_results' => $info['shown_results']);
								
								if( ISSET($info['hidden_features']) )
									$output['experiment_info']['hidden_features'] = $info['hidden_features'];

								$devFiles = array();
								$devFileEntries = $db->selectCollection("DevFiles-".$experimentID)->find();
								foreach( $devFileEntries as $devFileEntry){
									if( $devFileEntry['file'] == $sharedExperiment['shared_file'] || $sharedExperiment['shared_file'] == "" ){
										$entry = array('file' => $devFileEntry['file']);
										if( ISSET($devFileEntry['latest_result']) )
											$entry['latest_result'] = $devFileEntry['latest_result'];
										if( ISSET($devFileEntry['best_result']) )
											$entry['best_result'] = $devFileEntry['best_result'];
										array_push($output['dev_files'], $entry);
									}
								}

								$results = $db->selectCollection("Params-".$experimentID)->find();
								foreach( $results as $res )
									array_push($output['params'], $res['param']);
							}
							break;
						}
					}

					print json_encode($output);
				}
			}
			else{
				$output = array('params' => array(), 'dev_files' => array(), 'experiment_info' => array());
				$results = $db->selectCollection("Params-".$experimentID)->find();
				foreach( $results as $res )
					array_push($output['params'], $res['param']);
						
				$results = $db->selectCollection("DevFiles-".$experimentID)->find();
				foreach( $results as $res ){
					$entry = array('file' => $res['file']);
					
					if( ISSET($res['latest_result']) )
						$entry['latest_result'] = $res['latest_result'];
					if( ISSET($res['best_result']) )
						$entry['best_result'] = $res['best_result'];
					if( ISSET($res['baselines']) )
						$entry['baselines'] = $res['baselines'];
					
					array_push($output['dev_files'], $entry);
				}
				
				$info = $db->Experiments->findOne(array('_id' => new MongoId($experimentID)));
				if( $info ){
					$output['experiment_info'] = array('name' => $info['name']);

					if( ISSET($info['hidden_features']) )
						$output['experiment_info']['hidden_features'] = $info['hidden_features'];
					
				}
				print json_encode($output);
			}
		}
		else if( $cmd == "get_best_results" ){
			$topN = 50;
			$startAt = 0;
			if( ISSET($_GET['start_at']) )
				$startAt = $_GET['start_at'];
		
			$count = $db->selectCollection("Runs-".$experimentID)->find(array('test' => $_GET['dev_file']))->count();
	
			$maxType = "max_dev";
	
			$sortCriteria = array($maxType.".f" => -1, $maxType.".a" => -1);

			$dbInfo = $db->Experiments->findOne(array('_id' => new MongoId($experimentID)));
			if( $dbInfo ){
				if( $dbInfo['shown_results']['fscore'] == 0 ){
					if( $dbInfo['shown_results']['accuracy'] == 0 ){
						if( $dbInfo['shown_results']['precision'] == 0 )
							$sortCriteria = array($maxType.".r" => -1);
						else
							$sortCriteria = array($maxType.".p" => -1);
					}
					else{
						$sortCriteria = array($maxType.".a" => -1);
						if( $dbInfo['shown_results']['precision'] == 1 )
							$sortCriteria = array($maxType.".a" => -1, $maxType.".p" => -1);
					}
				}
				else{
					if( $dbInfo['shown_results']['accuracy'] == 0 ){
						if( $dbInfo['shown_results']['precision'] == 0 )
							$sortCriteria = array($maxType.".f" => -1, $maxType.".r" => -1);
						else
							$sortCriteria = array($maxType.".f" => -1, $maxType.".p" => -1);
					}
				}
			}

			$query = array('dev' => $_GET['dev_file']);
		
			if( ISSET($_GET['fixed_features']) ){
				$ffs = Array();
				$ff = strtok($_GET['fixed_features'], ";");
				while($ff){
					array_push($ffs, $ff);
					$ff = strtok(";");
				}
				for($i = 0; $i < count($ffs); $i++){
					$feature = strtok($ffs[$i], "=");
					$value = strtok("=");
					$query['params.'.$feature] = $value;
				}
			}

			$results = $db->selectCollection("Runs-".$experimentID)->find($query)->sort($sortCriteria)->skip($startAt)->limit($topN);

			$i = 0;
			$output = array('results' => array(), 'numof_results' => $count, 'page_size' => $topN, 'start_at' => $startAt);
			foreach( $results as $res ){
				$run = array();

				$paramsStr = "";
				foreach($res['params'] as $p => $v){
					if( $paramsStr != "" ) $paramsStr .= " ";
					$paramsStr .= $p."=".$v;
				}

				$run['params'] = $paramsStr;
				$run['runid'] = (string)$res['_id'];
				$run['start_date'] = $res['start_date']->sec;
				if( ISSET($res['finish_date']) )
					$run['finish_date'] = $res['finish_date']->sec;
				$run['dev'] = $res['dev'];
				$run['test'] = $res['test'];

				$run['fscore'] = $res['max_dev']['f'];
				$run['acc'] = $res['max_dev']['a'];
				$run['p'] = $res['max_dev']['p'];
				$run['r'] = $res['max_dev']['r'];
					
				array_push($output['results'], $run);
				$i += 1;
			}

			print json_encode($output);
		}
		else if( $cmd == "get_latest_results" ){
			$topN = 50;
			$startAt = 0;
			if( ISSET($_GET['start_at']) )
				$startAt = $_GET['start_at'];
		
			$count = $db->selectCollection("Runs-".$experimentID)->find(array('dev' => $_GET['dev_file']))->count();
			$query = array('dev' => $_GET['dev_file']);
						
			if( ISSET($_GET['fixed_features']) ){
				$ffs = Array();	
				$ff = strtok($_GET['fixed_features'], ";");
				while($ff){
					array_push($ffs, $ff);
					$ff = strtok(";");
				}
				for($i = 0; $i < count($ffs); $i++){
					$feature = strtok($ffs[$i], "=");
					$value = strtok("=");
					$query['params.'.$feature] = $value;
				}
			}
			
			$results = $db->selectCollection("Runs-".$experimentID)->find($query)->sort(array('_id' => -1))->skip($startAt)->limit($topN);
	
			$i = 0;
			$output = array('results' => array(), 'numof_results' => $count, 'page_size' => $topN, 'start_at' => $startAt);
			foreach( $results as $res ){
				$run = array();

				$paramsStr = "";
				foreach($res['params'] as $p => $v){
					if( $paramsStr != "" ) $paramsStr .= " ";
					$paramsStr .= $p."=".$v;
				}

				$run['params'] = $paramsStr;
				$run['runid'] = (string)$res['_id'];
				$run['start_date'] = $res['start_date']->sec;
				$run['finish_date'] = $res['finish_date']->sec;
				$run['dev'] = $res['dev'];
				$run['test'] = $res['test'];

				$run['fscore'] = $res['max_dev']['f'];
				$run['acc'] = $res['max_dev']['a'];
				$run['p'] = $res['max_dev']['p'];
				$run['r'] = $res['max_dev']['r'];

				array_push($output['results'], $run);
				$i += 1;
			}

			print json_encode($output);
		}
		else if( $cmd == "get_grouped_results" ){
			$topN = 10;
			$ffs = Array();
		
			if( ISSET($_GET['fixed_features']) ){
				$ff = strtok($_GET['fixed_features'], ";");
				while($ff){
					array_push($ffs, $ff);
					$ff = strtok(";");
				}
			}
		
			$query = array('dev' => $_GET['dev_file']);
		
			for($i = 0; $i < count($ffs); $i++){
				$feature = strtok($ffs[$i], "=");
				$value = strtok("=");
				$query['params.'.$feature] = $value;
			}

			$group_feature = $_GET['group_feature'];
			$group_values = array();
			$results = $db->selectCollection("Runs-".$experimentID)->find($query);
			foreach( $results as $res ){
				if( ISSET($res[$group_feature]) ){
					$group_values[$res[$group_feature]] = true;
				}
			}

			$results = $db->selectCollection("Runs-".$experimentID)->find($query)->sort(array('max_dev.f' => -1, 'max_dev.a' => -1));

			$output = array('grouped_results' => array(), 'group_feature' => $group_feature);
			foreach( $results as $res ){
				if( $res['params'][$group_feature] != "" ){
					$group_value = $res['params'][$group_feature];
						
					if( !ISSET($output['grouped_results'][$group_value]) )
						$output['grouped_results'][$group_value] = array('results' => array());

						if( count($output['grouped_results'][$group_value]['results']) < $topN ){
							$run = array();

							$paramsStr = "";
							foreach($res['params'] as $p => $v){
								if( $paramsStr != "" ) $paramsStr .= " ";
								$paramsStr .= $p."=".$v;
							}

							$run['params'] = $paramsStr;
							$run['runid'] = (string)$res['_id'];
							$run['start_date'] = $res['start_date']->sec;
							$run['finish_date'] = $res['finish_date']->sec;
							$run['dev'] = $res['dev'];
							$run['test'] = $res['test'];

							$run['fscore'] = $res['max_dev']['f'];
							$run['acc'] = $res['max_dev']['a'];
							$run['p'] = $res['max_dev']['p'];
							$run['r'] = $res['max_dev']['r'];

							array_push($output['grouped_results'][$group_value]['results'], $run);
						}
				}
			}

			print json_encode($output);
		}
		else if( $cmd == "get_run_results" ){
		
			$result = $db->selectCollection("Runs-".$experimentID)->findOne(array('_id' => new MongoId($_GET['run_id'])));
			if( $result ){
				$output = array('run_id' => $_GET['run_id'], 'results' => array());
		
				foreach( $result['results'] as $res){
					array_push($output['results'], array('a' => $res['a'], 'f' => $res['f'], 'i' => $res['i'], 'p' => $res['p'], 'r' => $res['r'], 'l' => $res['l'], 't' => $res['t']));
				}
				print json_encode($output);
			}
		}
		else if( $_GET['cmd'] == "clear_previous_results" ){
			$runID = $_GET['run_id'];
			$db->Results->remove(array('run_id' => $runID));
			$db->selectCollection("Runs-".$experimentID)->remove(array('id' => $runID));
		}
		
		else if( $_GET['cmd'] == "update_shown_results" ){
			$acc = $prec = $recall = $fscore = 0;
		
			if( $_GET['accuracy'] == "yes" )
				$acc = 1;
			if( $_GET['precision'] == "yes" )
				$prec = 1;
			if( $_GET['recall'] == "yes" )
				$recall = 1;
			if( $_GET['fscore'] == "yes" )
				$fscore = 1;
		
			$entry = $db->Experiments->update(array('_id' => new MongoId($experimentID)), array('$set' => array('shown_results' => array('accuracy' => $acc, 'precision' => $prec, 'recall' => $recall, 'fscore' => $fscore))));
		}
		else if( $cmd == "delete_run" ){
			$runID = $_GET['id'];
			$runOID = new MongoId($runID);

			$run = $db->selectCollection("Runs-".$experimentID)->findOne(array('_id' => $runOID));
			if( $run ){
				$testFile = $run['test'];
				$devFile = $run['dev'];
				
				$db->selectCollection("Runs-".$experimentID)->remove(array('_id' => $runOID));

				updateBestResult($db, $experimentID, $testFile, True);
				updateLatestResult($db, $experimentID, $testFile, True);
				updateBestResult($db, $experimentID, $devFile, False);
				updateLatestResult($db, $experimentID, $devFile, False);
			}
		}
		else if( $cmd == "delete_experiment_file_results" ){
			
			if( ISSET($_GET['dev_file']) )
				$db->selectCollection("Runs-".$experimentID)->remove(array('dev' => $_GET['dev_file']));
		}
		else if( $cmd == "delete_experiment_file_bad_results" ){
			
			if( ISSET($_GET['dev_file']) && ISSET($_GET['metric']) && ISSET($_GET['value']) ){
				if( $_GET['metric'] == "Accuracy" )
					$db->selectCollection("Runs-".$experimentID)->remove(array('dev' => $_GET['dev_file'], 'max_dev.a' => array( '$lt' => (float)$_GET['value'])));
				else if( $_GET['metric'] == "FScore" )
					$db->selectCollection("Runs-".$experimentID)->remove(array('dev' => $_GET['dev_file'], 'max_dev.f' => array( '$lt' => (float)$_GET['value'])));
				else if( $_GET['metric'] == "Precision" )
					$db->selectCollection("Runs-".$experimentID)->remove(array('dev' => $_GET['dev_file'], 'max_dev.p' => array( '$lt' => (float)$_GET['value'])));
				else if( $_GET['metric'] == "Recall" )
					$db->selectCollection("Runs-".$experimentID)->remove(array('dev' => $_GET['dev_file'], 'max_dev.r' => array( '$lt' => (float)$_GET['value'])));
			}
		}
		else if( $cmd == "delete_experiment" ){
		
			$db->Experiments->remove(array("_id" => new MongoId($experimentID)));
			
			$db->selectCollection("Runs-".$experimentID)->drop();
			$db->selectCollection("Params-".$experimentID)->drop();
			$db->selectCollection("DevFiles-".$experimentID)->drop();
			$db->selectCollection("Tasks-".$experimentID)->drop();
		
			// remove the experiment from user's account
			$db->Users->update(array('user' => $_SESSION['user']), array('$pull' => array('experiments' => $experimentID)));
		}
		else if( $cmd == "share_experiment_file" ){
			if( ISSET($_GET['shared_user_name']) ){
				$sharedUserName = $_GET['shared_user_name'];
				$sharedFile = "";
				if( ISSET($_GET['shared_file']) )
					$sharedFile = $_GET['shared_file'];
				
				$sharedUser = $db->Users->findOne(array('user' => $sharedUserName));
				if( $sharedUser ){
					$db->Users->update(array('user' => $sharedUserName), array('$addToSet' => array('shared_experiments' => array('experiment_id' => $experimentID, 'shared_file' => $sharedFile, 'sharer' => $_SESSION['user']))));
					$db->Experiments->update(array('_id' => new MongoId($experimentID)), array('$addToSet' => array('shared' => array('user' => $sharedUserName, 'shared_file' => $sharedFile))));
				}
				else{
					$output = array('msg' => 'There is no such user named '.$sharedUserName);
					print json_encode($output);
				}
			}
		}
		else if( $cmd == "unshare_experiment_file" ){
			if( ISSET($_GET['shared_user_name']) ){
				$sharedUserName = $_GET['shared_user_name'];
				$sharedFile = "";
				if( ISSET($_GET['shared_file']) )
					$sharedFile = $_GET['shared_file'];
				
				$sharedUser = $db->Users->findOne(array('user' => $sharedUserName));
				if( $sharedUser ){
					$db->Users->update(array('user' => $sharedUserName), array('$pull' => array('shared_experiments' => array('experiment_id' => $experimentID, 'shared_file' => $sharedFile))));
					$db->Experiments->update(array('_id' => new MongoId($experimentID)), array('$pull' => array('shared' => array('user' => $sharedUserName, 'shared_file' => $sharedFile))));

					$output = array('msg' => 'OK');
					print json_encode($output);
				}
				else{
					$output = array('msg' => 'There is no such user named '.$sharedUserName);
					print json_encode($output);
				}
			}
		}
		else if( $cmd == "set_hidden_features" ){

			if( ISSET($_GET['features']) ){
				$features = Array();
				$ff = strtok($_GET['features'], ";");
				while($ff){
					array_push($features, $ff);
					$ff = strtok(";");
				}

				$db->Experiments->update(array('_id' => new MongoId($experimentID)), array('$set' => array('hidden_features' => $features)));
			}
		}
		else if( $cmd == "add_feature" ){
			$feature = str_replace("::", "=", $_GET['feature']);
			$newFeature = array('param' => $feature);
			$db->selectCollection("Params-".$experimentID)->insert($newFeature);
		}
		else if( $cmd == "remove_feature" ){
			$feature = str_replace("::", "=", $_GET['feature']);
			$db->selectCollection("Params-".$experimentID)->remove(array('param' => $feature));
		}
		else if( $cmd == "add_baseline" ){
			
			$file = $_GET['dev_file'];
			$collection = $db->DevFiles;
			
			$baselineName = $_GET['baseline_name'];
			$baselineAccuracy = $_GET['baseline_accuracy'];
			$baselineFScore = $_GET['baseline_fscore'];
			$baselinePrecision = $_GET['baseline_precision'];
			$baselineRecall = $_GET['baseline_recall'];
			
			$collection->update(array('file' => $file), 
								array('$addToSet' => array('baselines' => array('name' => $baselineName, 
																			    'accuracy' => $baselineAccuracy,
																			    'fscore' => $baselineFScore,
																			    'precision' => $baselinePrecision,
																			    'recall' => $baselineRecall))));
		}
		else if( $cmd == "delete_baseline" ){
			$baselineName = $_GET['baseline_name'];

			$file = $_GET['dev_file'];
			$collection = $db->DevFiles;
			
			$collection->update(array('file' => $file), array('$pull' => array('baselines' => array('name' => $baselineName))));
		}
		else
			return false;
	}
	else
		return false;
	return true;
}

?>