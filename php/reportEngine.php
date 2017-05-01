<?php

function checkReportQueryCmds($cmd)
{
	global $xdbMongoDBName;
	
	if( ISSET($_GET['experiment_id']) ){
		
		$experimentID = $_GET['experiment_id'];
		$db = connect2DB($xdbMongoDBName);
			
		if( $cmd == "create_new_run" ){
		
			$query = array('test' => $_GET['test'], 'dev' => $_GET['dev']);
		
			$paramsArr = array();
			$p = strtok($_GET['params'], ";");
			while($p !== false){
				array_push($paramsArr, $p);
				$p = strtok(";");
			}
		
			$params = array();
			for($i = 0; $i < count($paramsArr); $i++){
				$feature = strtok($paramsArr[$i], "=");
				$value = strtok("=");
		
				if( $feature != "dev" && $feature != "test" && $feature != "experiment_id" && $feature != "restore" && $feature != "log" ){
					$query['params.'.$feature] = $value;
					$params[$feature] = $value;
				}
			}

			$alreadyExists = false;
			if( ISSET($_GET['group_feature']) ){
				$group_feature = $_GET['group_feature'];
				$group_values = array();
				$results = $db->selectCollection("Runs-".$experimentID)->find($query);
			
				foreach( $results as $res ){
					// check for existing one
				}
			}
			
			if( $alreadyExists == false ){
				// else create new one
		
				$newRun = array('dev' => $_GET['dev'],
								'test' => $_GET['test'],
								'params' => $params);
				
				if( ISSET($_GET['run_id']) && $_GET['run_id'] != "" )
					$newRun['_id'] = new MongoId($_GET['run_id']);
					

				// check if run already exists
				if( ISSET($newRun['_id']) && $db->selectCollection("Runs-".$experimentID)->findOne(array('_id' => $newRun['_id'])) )
					$db->selectCollection("Runs-".$experimentID)->update(array('_id' => $newRun['_id']), $newRun);
				else
					$db->selectCollection("Runs-".$experimentID)->insert($newRun);
		
				// check for new params, dev and test file
				$devFile = $db->selectCollection("DevFiles-".$experimentID)->findOne(array('file' => $_GET['dev']));
				if( $devFile ){
					// exists
				}
				else{
					$newDevFile = array('file' => $_GET['dev']);
					$db->selectCollection("DevFiles-".$experimentID)->insert($newDevFile);
				}

				if( ISSET($_GET['test']) ){
					// check for new params, dev and test file
					$devFile = $db->selectCollection("TestFiles-".$experimentID)->findOne(array('file' => $_GET['test']));
					if( $devFile ){
						// exists
					}
					else{
						$newDevFile = array('file' => $_GET['test']);
						$db->selectCollection("TestFiles-".$experimentID)->insert($newDevFile);
					}
				}
				
				foreach($params as $key => $value){
					if( $key != "dev" && $key != "test" && $key != "experiment_id" && $key != "restore" && $key != "log" ){
						$param = $key."=".$value;
						if( $db->selectCollection("Params-".$experimentID)->findOne(array('param' => $param)) ){
							// exists
						}
						else{
							$newParam = array('param' => $param);
							$db->selectCollection("Params-".$experimentID)->insert($newParam);
						}
					}
				}

				print (string)$newRun['_id'];
			}
		}
		else if( $cmd == "report_iteration_result" ){
			$runID = $_GET['run_id'];
			$runOID = new MongoId($runID);
			
			$acc = $prec = $recall = $fscore = $loss = 0;
			
			if( ISSET($_GET['accuracy']) )
				$acc = (float)$_GET['accuracy'];
			if( ISSET($_GET['precision']) )
				$prec = (float)$_GET['precision'];
			if( ISSET($_GET['recall']) )
				$recall = (float)$_GET['recall'];
			if( ISSET($_GET['fscore']) )
				$fscore = (float)$_GET['fscore'];
			if( ISSET($_GET['loss']) )
				$loss = (float)$_GET['loss'];
			
			$result = array('i' => $_GET['iteration'], 
							'a' => $acc, 
							'p' => $prec,
							'r' => $recall,
							'f' => $fscore,
							'l' => $loss,
							't' => (int)$_GET['is_test']);

			if( ISSET($_GET['training_loss']) )
				$result['tl'] = (float)$_GET['training_loss'];
			if( ISSET($_GET['training_accuracy']) )
				$result['ta'] = (float)$_GET['training_accuracy'];
			
			$db->selectCollection("Runs-".$experimentID)->update(array('_id' => $runOID), array('$addToSet' => array('results' => $result)));
			
			# check if this is the best so far
			if( $_GET['is_best'] == "1" ){
				$result = array('a' => $acc, 
								'p' => $prec,
								'r' => $recall,
								'f' => $fscore,
								'l' => $loss);

				if( ISSET($_GET['training_loss']) )
					$result['tl'] = (float)$_GET['training_loss'];
				if( ISSET($_GET['training_accuracy']) )
					$result['ta'] = (float)$_GET['training_accuracy'];
							
				if( $_GET['is_test'] == "1" )
					$db->selectCollection("Runs-".$experimentID)->update(array('_id' => $runOID), array('$set' => array('max_test' => $result)));
				else
					$db->selectCollection("Runs-".$experimentID)->update(array('_id' => $runOID), array('$set' => array('max_dev' => $result)));
			}
	
			# update the finish date
			$db->selectCollection("Runs-".$experimentID)->update(array('_id' => $runOID), array('$set' => array('last_report_date' => new MongoDate())));
			
			$run = $db->selectCollection("Runs-".$experimentID)->findOne(array('_id' => $runOID));
			if( $run ){
				if( $_GET['is_test'] == "1" ){
					updateBestResult($db, $experimentID, $run['test'], True);
					updateLatestResult($db, $experimentID, $run['test'], True);
				}
				else{
					updateBestResult($db, $experimentID, $run['dev'], False);
					updateLatestResult($db, $experimentID, $run['dev'], False);
				}
			}
		}
		else if( $cmd == "report_run_start" ){
		
			$runID = $_GET['run_id'];
			if( $runID != "" ){
				$runOID = new MongoId($runID);
				
				$task = $db->selectCollection("Tasks-".$experimentID)->findOne(array('_id' => $runOID));
				if( $task ){
					// mark task as running
					$db->selectCollection("Tasks-".$experimentID)->update(array('_id' => $runOID), array('$set' => array('is_running' => True, 'finished' => False)));
					
					$db->selectCollection("Runs-".$experimentID)->update(array('_id' => $runOID), array('$set' => array('start_date' => new MongoDate())));
				}
			}
		}
		else if( $cmd == "report_finished_running" ){
			$runID = $_GET['run_id'];
			if( $runID != "" ){
				$runOID = new MongoId($runID);
				
				// remove the ask
				$db->selectCollection("Tasks-".$experimentID)->remove(array('_id' => $runOID));
			
				$db->selectCollection("Runs-".$experimentID)->update(array('_id' => $runOID), array('$set' => array('finish_date' => new MongoDate())));
			}
		}
		else if( $cmd == "get_new_tasks" ){
			$num = 100;
			$indexDivident = 0;
			$indexSize = 2;

			$output = array('tasks' => array());
			if( ISSET($_GET['topn']) )
				$num = (int)$_GET['topn'];
			if( ISSET($_GET['index_divident']) )
				$indexDivident = (int)$_GET['index_divident'];
			if( ISSET($_GET['index_size']) )
				$indexSize = (int)$_GET['index_size'];
		
			$i = 0;

			$tasks = $db->selectCollection("Tasks-".$experimentID)->find(array('in_queue' => 1, 'is_running' => False))->sort(array('queue_index'=> 1));
			foreach( $tasks as $task ){
				$index = (int)$task['queue_index'];
				if( $index%$indexSize != $indexDivident )
					continue;

					$paramList = "";
					foreach( $task['params'] as $paramKey => $paramValue){
						if( $paramList != "" ) $paramList .= " ";
						$paramList .=  "--".$paramKey." ".$paramValue;
					}

					$newTask = $paramList." --run_id ".((string)$task['_id']);
					array_push($output['tasks'], $newTask);

					$i++;
					if( $i == $num )
						break;
			}

			print json_encode($output);
		}
		else
			return false;
	}
	else
		return false;
	return true;
}

function updateBestResult($db, $experimentID, $file, $isTestFile)
{
	$maxType = "max_dev";
	if( $isTestFile )
		$maxType = "max_test";

	$sortCriteria = array($maxType.".f" => -1, $maxType.".a" => -1);

	$dbInfo = $db->Experiments->findOne(array('_id' => new MongoId($_GET['experiment_id'])));
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

	if( $isTestFile )
		$results = $db->selectCollection("Runs-".$experimentID)->find(array('test' => $file))->sort($sortCriteria)->limit(1);
	else
		$results = $db->selectCollection("Runs-".$experimentID)->find(array('dev' => $file))->sort($sortCriteria)->limit(1);

	foreach( $results as $res ){
		$latestResult = array('runid' => (string)$res['_id']);
		
		if( ISSET($res['finish_date']) )
			$latestResult['finish_date'] = $res['finish_date']->sec;
		else if( ISSET($res['last_report_date']) )
			$latestResult['finish_date'] = $res['last_report_date']->sec;
		else if( ISSET($res['start_date']) )
			$latestResult['finish_date'] = $res['start_date']->sec;

		if( $isTestFile ){
			if( ISSET($res['max_test']) ){
				$latestResult['fscore'] = $res['max_test']['f'];
				$latestResult['acc'] = $res['max_test']['a'];
				$latestResult['p'] = $res['max_test']['p'];
				$latestResult['r'] = $res['max_test']['r'];

				$db->selectCollection("DevFiles-".$experimentID)->update(array('file' => $file), array('$set' => array('best_result' => $latestResult)));
			}
		}
		else if( ISSET($res['max_dev']) ){
			$latestResult['fscore'] = $res['max_dev']['f'];
			$latestResult['acc'] = $res['max_dev']['a'];
			$latestResult['p'] = $res['max_dev']['p'];
			$latestResult['r'] = $res['max_dev']['r'];

			$db->selectCollection("DevFiles-".$experimentID)->update(array('file' => $file), array('$set' => array('best_result' => $latestResult)));
		}
	}
}

function updateLatestResult($db, $experimentID, $file, $isTestFile)
{
	if( $isTestFile )
		$results = $db->selectCollection("Runs-".$experimentID)->find(array('test' => $file))->sort(array('_id' => -1))->limit(1);
	else
		$results = $db->selectCollection("Runs-".$experimentID)->find(array('dev' => $file))->sort(array('_id' => -1))->limit(1);

	foreach( $results as $res ){
		$latestResult = array('runid' => (string)$res['_id']);

		if( ISSET($res['finish_date']) )
			$latestResult['finish_date'] = $res['finish_date']->sec;
		else if( ISSET($res['last_report_date']) )
			$latestResult['finish_date'] = $res['last_report_date']->sec;
		else if( ISSET($res['start_date']) )
			$latestResult['finish_date'] = $res['start_date']->sec;

		if( $isTestFile ){
			if( ISSET($res['max_test']) ){
				$latestResult['fscore'] = $res['max_test']['f'];
				$latestResult['acc'] = $res['max_test']['a'];
				$latestResult['p'] = $res['max_test']['p'];
				$latestResult['r'] = $res['max_test']['r'];
				
				$db->selectCollection("DevFiles-".$experimentID)->update(array('file' => $file), array('$set' => array('latest_result' => $latestResult)));
			}
		}
		else if( ISSET($res['max_dev']) ){
			$latestResult['fscore'] = $res['max_dev']['f'];
			$latestResult['acc'] = $res['max_dev']['a'];
			$latestResult['p'] = $res['max_dev']['p'];
			$latestResult['r'] = $res['max_dev']['r'];

			$db->selectCollection("DevFiles-".$experimentID)->update(array('file' => $file), array('$set' => array('latest_result' => $latestResult)));
		}
	}
}
?>