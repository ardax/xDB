<?php

function checkTaskQueryCmds($cmd)
{
	global $xdbMongoDBName;
	
	if( ISSET($_GET['experiment_id']) ){

		$experimentID = $_GET['experiment_id'];
		$db = connect2DB($xdbMongoDBName);
			
		if( $cmd == "get_task_queue" ){
			$startAt = 0;
			$pageSize = 100;
		
			if( ISSET($_GET['start_at']) )
				$startAt = (int)$_GET['start_at'];
		
			$output = array('tasks' => array());
			$i = $k = 0;
	
			$tasks = $db->selectCollection("Tasks-".$experimentID)->find(array('in_queue' => 1))->sort(array('queue_index'=> 1));
			foreach( $tasks as $task ){
				$index = (int)$task['queue_index'];
				if( $index%$indexSize != $indexDivident )
					continue;
	
					if( $i >= $startAt ){
						array_push($output['tasks'], array('params' => $task['params'],
								'experiment_id' => $task['experiment_id'],
								'queue_date' => $task['queue_date']->sec,
								'queue_index' => $task['queue_index'],
								'running' => $task['is_running'],
								'oid' => (string)$task['_id']));
						$k++;
						if( $k == $pageSize )
							break;
					}
					$i++;
			}
	
			print json_encode($output);
		}
		else if( $cmd == "create_new_task" ){
		
			$params = array();
			foreach ($_GET as $key => $value) {
				if( $key != "method" && $key != "features" && $key != "cmd" )
					$params[$key] = $value;
			}
		
			$featureArr = array();
			if( ISSET($_GET['features']) ){
				$f = strtok($_GET['features'], ";");
				while($f !== false){
					array_push($featureArr, $f);
					$f = strtok(";");
				}
			}
		
			for($i = 0; $i < count($featureArr); $i++){
				$key = strtok($featureArr[$i], "=");
				$value = strtok("=");
				$params[$key] = $value;
			}
		
			$newTask = array('params' => $params,
							 'in_queue' => 1,
							 'is_running' => False,
							 'experiment_id' => $experimentID,
							 'queue_index' => $i,
							 'queue_date' => new MongoDate());
							 
			$i = rand(0, 100);
			$db->selectCollection("Tasks-".$experimentID)->insert($newTask);
		}
		else if( $_GET['cmd'] == "remove_new_task" ){
			$runID = $_GET['run_id'];
			$db->selectCollection("Tasks-".$experimentID)->remove(array('_id' => new MongoId($runID)));
		}
		else if( $cmd == "delete_task_in_queue" ){
		
			$db->selectCollection("Tasks-".$experimentID)->remove(array('_id' => new MongoId($_GET['oid'])));
		}
		else
			return false;
	}
	else
		return false;
	return true;
}

?>