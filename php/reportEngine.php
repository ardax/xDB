<?php

function checkReportQueryCmds($cmd)
{
	if( ISSET($_GET['experiment_id']) ){
		
		$experimentID = $_GET['experiment_id'];
		$db = connect2DB("XDB");
			
		if( $cmd == "get_new_tasks" ){
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
						#if( strpos($paramKey, "bug") === false ){
						if( $paramList != "" ) $paramList .= " ";
						$paramList .=  "--".$paramKey." ".$paramValue;
						#}
					}

					$newTask = $paramList." --run_id ".((string)$task['_id']);
					array_push($output['tasks'], $newTask);

					$i++;
					if( $i == $num )
						break;
			}

			print json_encode($output);
		}
		else if( $cmd == "create_new_run" ){
		
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
		
			$group_feature = $_GET['group_feature'];
			$group_values = array();
			$results = $db->selectCollection("Runs-".$experimentID)->find($query);
		
			$alreadyExists = false;
			foreach( $results as $res ){
				// check for existing one
			}
		
			if( $alreadyExists == false ){
				// else create new one
		
				$newRun = array('dev' => $_GET['dev'],
								'test' => $_GET['test'],
								'start_date' => new MongoDate(),
								'params' => $params);
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
				
				foreach($params as $key => $value){
					if( $key != "dev" && $key != "test" && $key != "experiment_id" && $key != "restore" && $key != "log" ){
						$param = $key."=".$value;
						if( $experimentDB->selectCollection("Params-".$experimentID)->findOne(array('param' => $param)) ){
							// exists
						}
						else{
							$newParam = array('param' => $param);
							$experimentDB->selectCollection("Params-".$experimentID)->insert($newParam);
						}
					}
				}

				print (string)$newRun['_id'];
			}
		}
		else if( $cmd == "report_iteration_result" ){
			$runID = $_GET['run_id'];
			$runOID = new MongoId($runID);
			
			$result = array('i' => $_GET['iteration'], 
							'a' => (float)$_GET['accuracy'], 
							'p' => (float)$_GET['precision'],
							'r' => (float)$_GET['recall'],
							'f' => (float)$_GET['fscore'],
							'l' => (float)$_GET['loss'],
							't' => (int)$_GET['is_test']);
			
			$db->selectCollection("Runs-".$experimentID)->update(array('_id' => $runOID), array('$addToSet' => array('results' => $result)));
			
			# check if this is the best so far
			if( $_GET['is_best'] == "1" ){
				$result = array('a' => (float)$_GET['accuracy'], 
								'p' => (float)$_GET['precision'],
								'r' => (float)$_GET['recall'],
								'f' => (float)$_GET['fscore']);
			
				if( $_GET['is_test'] == "1" )
					$db->selectCollection("Runs-".$experimentID)->update(array('_id' => $runOID), array('$set' => array('max_test' => $result)));
				else
					$db->selectCollection("Runs-".$experimentID)->update(array('_id' => $runOID), array('$set' => array('max_dev' => $result)));
			}
	
			# update the finish date
			$db->selectCollection("Runs-".$experimentID)->update(array('_id' => $runOID), array('$set' => array('finish_date' => new MongoDate())));
			
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
		else if( $cmd == "report_running" ){
		
			$runID = $_GET['run_id'];
			$task = $db->selectCollection("Tasks-".$experimentID)->findOne(array('_id' => new MongoId($runID)));
			if( $task ){
				$db->selectCollection("Tasks-".$experimentID)->update(array('_id' => new MongoId($runID)), array('$set' => array('is_running' => True, 'finished' => False)));
		
				$params = array();
				if( ISSET($_GET['params']) ){
						
					$paramsArr = array();
					$p = strtok($_GET['params'], ";");
					while($p !== false){
						array_push($paramsArr, $p);
						$p = strtok(";");
					}
						
					for($i = 0; $i < count($paramsArr); $i++){
						$key = strtok($paramsArr[$i], "=");
						$value = strtok("=");
						if( $key != "dev" && $key != "test" && $key != "experiment_id" && $key != "restore" && $key != "log" )
							$params[$key] = $value;
					}
				}

				// check for new params, dev and test file
				$devFile = $db->selectCollection("DevFiles-".$experimentID)->findOne(array('file' => $_GET['dev']));
				if( $devFile ){
					// exists
				}
				else{
					$newDevFile = array('file' => $_GET['dev']);
					$db->selectCollection("DevFiles-".$experimentID)->insert($newDevFile);
				}
				
				$run = $db->selectCollection("Runs-".$experimentID)->findOne(array('_id' => new MongoId($runID)));
				if( $run ){
					$db->selectCollection("Runs-".$experimentID)->update(array('_id' => new MongoId($runID)),
							array('$set' => array('dev' => $_GET['dev'],
									'test' => $_GET['test'],
									'start_date' => new MongoDate(),
									'finish_date' => null,
									'results' => array(),
									'max_dev' => null,
									'max_test' => null,
									'params' => $params)));
				}
				else{
					$newRun = array('_id' => new MongoId($runID),
									'dev' => $_GET['dev'],
									'test' => $_GET['test'],
									'start_date' => new MongoDate(),
									'finish_date' => null,
									'results' => array(),
									'max_dev' => null,
									'max_test' => null,
									'params' => $params);
					$db->selectCollection("Runs-".$experimentID)->insert($newRun);
				}
			}
		}
		else if( $cmd == "report_finished_running" ){
			$db->selectCollection("Tasks-".$experimentID)->remove(array('_id' => new MongoId($_GET['run_id'])));
		
			$db->selectCollection("Runs-".$experimentID)->update(array('_id' => new MongoId($runID)), array('$set' => array('finish_date' => new MongoDate())));
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
		$latestResult['finish_date'] = $res['finish_date']->sec;

		if( $isTestFile ){
			$latestResult['fscore'] = $res['max_test']['f'];
			$latestResult['acc'] = $res['max_test']['a'];
			$latestResult['p'] = $res['max_test']['p'];
			$latestResult['r'] = $res['max_test']['r'];
		}
		else{
			$latestResult['fscore'] = $res['max_dev']['f'];
			$latestResult['acc'] = $res['max_dev']['a'];
			$latestResult['p'] = $res['max_dev']['p'];
			$latestResult['r'] = $res['max_dev']['r'];
		}

		$db->selectCollection("DevFiles-".$experimentID)->update(array('file' => $file), array('$set' => array('best_result' => $latestResult)));
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
		$latestResult['finish_date'] = $res['finish_date']->sec;

		if( $isTestFile ){
			$latestResult['fscore'] = $res['max_test']['f'];
			$latestResult['acc'] = $res['max_test']['a'];
			$latestResult['p'] = $res['max_test']['p'];
			$latestResult['r'] = $res['max_test']['r'];
		}
		else{
			$latestResult['fscore'] = $res['max_dev']['f'];
			$latestResult['acc'] = $res['max_dev']['a'];
			$latestResult['p'] = $res['max_dev']['p'];
			$latestResult['r'] = $res['max_dev']['r'];
		}

		$db->selectCollection("DevFiles-".$experimentID)->update(array('file' => $file), array('$set' => array('latest_result' => $latestResult)));
	}
}
?>