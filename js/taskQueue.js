
function showTaskQueue()
{	
	if( focusedExperiment ){
		var req = createRequest();
		makeRequest(req, "cmd=get_task_queue&experiment_id="+focusedExperiment.id, function(){ onShowTaskQueue(req); });
	}
}

function onShowTaskQueue(req)
{
	if( req.readyState == 4 ){
		var json = JSON.parse(req.responseText);

		json['tasks'].sort(function(a,b) { return (parseInt(b['queue_date'])-parseInt(a['queue_date']) ); });
		
		var panel = "<br><br><br><br><br>";
		
		if( json['tasks'].length == 0 ){
			panel += "<center class=SmallTxt>";
			panel += "<i>There is no task to show in the queue</i>";
			panel += "</center>";
		}
		else{
			panel += "<h4 style='padding:0px;margin-bottom:10px'>Listing "+json['tasks'].length+" tasks in the queue</h4>";
			panel += "<table width=100%>";
			for(var i = 0; i < json['tasks'].length; i++){
				var task = json['tasks'][i];
				panel += "<tr height=35 style='background:#efefef'>";
				panel += "<td width=30 align=center class=SmallTxt nowrap>";
				if( task['running'] == "1" )
					panel += "R";
				else
					panel += "W";
				panel += "</td>";
				panel += "<td width=100% class=VerySmallTxt style='padding:4px'>";
				for(var key in task['params']){
					panel += key+"="+task['params'][key]+" ";
				}
				panel += "</td><td width=120 align=center class=VerySmallTxt nowrap>";
				panel += printDate(parseInt(task['queue_date']));
				panel += "</td><td width=40 align=center class=SmallTxt nowrap>";
				panel += task['queue_index'];
				panel += "</td><td width=60 align=center class=SmallTxt nowrap>";
				panel += "<a class=SilentLink href=\"javascript:deleteTaskInQueue('"+task['oid']+"')\">del</a>";
				panel += "</td></tr>";
			}
			panel += "</table>";
		}

		shownTab = TAB_TASK_QUEUE;
		updatePageLink();
		updateToolbar();

		var e = document.getElementById("Results");
		if( e ) e.innerHTML = panel;
	}
}

function deleteTaskInQueue(taskOID)
{
	if( focusedExperiment ){
		var req = createRequest();
		makeRequest(req, "cmd=delete_task_in_queue&experiment_id="+focusedExperiment.id+"&oid="+taskOID, function(){ onRefresh(req); });
	}
}

function getRunPanel(runid)
{
	for(var i = 0; i < shownResults.length; i++){
		for(var j = 0; j < shownResults[i].results.length; j++){
			if( shownResults[i].results[j].runid == runid ){
				createRun(shownResults[i].results[j]);
				return;
			}
		}
	}
}

function createRun(result)
{
	var panel = "";
	panel += "<form name='CreateRunTable'><table style='background:#ffffff'><tr height=30><td style='padding:10px'><h3>Select Parameters to Create a New Run</h3></td></tr>";
	panel += "<tr><td style='padding-left:30px' class=SmallTxt>";
	panel += "Select the experiment to execute this new run:<br>";
	panel += "</td></tr>";
	panel += "<tr><td style='padding-left:30px;padding-bottom:5px;padding-right:10px' class=SmallTxt>";
	panel += "<select id=selected_experiment_for_new_run style='width:530px;height:30px;font-size:15px;background:#ffffff;border:1px solid #cdcdcd'>";
	for(var i = 0; i < user.experiments.length; i++){
		var experiment = user.experiments[i];
		panel += "<option value='"+experiment.id+"'";
		if( experiment == focusedExperiment )
			panel += " selected";
		panel += ">"+experiment.name+"</option>";
	}
	panel += "</select>";
	panel += "</td></tr>";
	panel += "<tr><td style='padding-left:30px;padding-bottom:10px;padding-right:10px'>";
	panel += "<div class=ScrollablePanel style='height:500;width:540'>";
	panel += "<table width=100%>";
	for(var i = 0; i < focusedExperiment.features.length; i++){
		var feature = focusedExperiment.features[i];
		for(var value in focusedExperiment.featureValues[feature]){
			var featureValue = feature+"="+value;
			panel += "<tr><td width=20 nowrap><input type=checkbox value='"+featureValue+"'";
			if( result && result.hasParam(featureValue) )
				panel += " checked";
			panel += "/></td><td class=SmallTxt width=200 nowrap>"+featureValue+"</td></tr>";
		}
	}
	
	if( result ){
		panel += "<tr><td width=20 nowrap><input type=checkbox value='dev="+result.dev+"' checked/></td><td class=SmallTxt width=200 nowrap>dev="+result.dev+"</td></tr>";
		if( result.test != "" )
			panel += "<tr><td width=20 nowrap><input type=checkbox value='test="+result.test+"' checked/></td><td class=SmallTxt width=200 nowrap>test="+result.test+"</td></tr>";
	}
	else if( focusedExperiment.selectedFile != "" ){
		panel += "<tr><td width=20 nowrap><input type=checkbox value='dev="+focusedExperiment.selectedFile+"' checked/></td><td class=SmallTxt width=200 nowrap>dev="+focusedExperiment.selectedFile+"</td></tr>";
	}
	
	for(var i = 0; i < focusedExperiment.devFiles.length; i++){
		if( focusedExperiment.devFiles[i]['file'] != focusedExperiment.selectedFile )
			panel += "<tr><td width=20 nowrap><input type=checkbox value='dev="+focusedExperiment.devFiles[i]['file']+"'/></td><td class=SmallTxt width=200 nowrap>dev="+focusedExperiment.devFiles[i]['file']+"</td></tr>";
	}
	
	for(var i = 0; i < focusedExperiment.testFiles.length; i++){
		if( (result == null || focusedExperiment.testFiles[i]['file'] != result.test) && focusedExperiment.testFiles[i]['file'] != "" ){
			panel += "<tr><td width=20 nowrap><input type=checkbox value='test="+focusedExperiment.testFiles[i]['file']+"'/></td><td class=SmallTxt width=200 nowrap>dev="+focusedExperiment.testFiles[i]['file']+"</td></tr>";
		}
	}
	
	panel += "</table></div></td></tr>";
	panel += "<tr height=30><td align=right style='padding-right:30px'>";
	var featureValue = "";
	if( result )
		featureValue = result.getParam("method");
	panel += "<input type=button class='blue button' style='width:120;height:30' value='Create Run & Cont.' onclick=\"javascript:createRunNow('"+featureValue+"', '1')\"/> ";
	panel += "<input type=button class='blue button' style='width:80;height:30' value='Create Run' onclick=\"javascript:createRunNow('"+featureValue+"', '0')\"/> ";
	panel += "<input type=button class='gray button' style='width:80;height:30' value='Cancel' onclick='javascript:hideMsgPanel()'/>";
	panel += "</td></tr>";
	panel += "</table></form>";

	showMsgPanel(panel, 550, 280);
}

function createRunNow(method, wait)
{
	var selectedExperiment = focusedExperiment;
	var e = document.getElementById("selected_experiment_for_new_run");
	if( e ){
		var experiment = user.getExperimentWID(e.value);
		if( experiment )
			selectedExperiment = experiment;
	}
	
    var featureList = "";
    var trainingFile = "", vocabFile = "", bigramFile = "";
    var frm = document.forms["CreateRunTable"];
    var params = "experiment_id="+selectedExperiment.id+"&cmd=create_new_task";
    
    if( method != "" )
    	params += "&method="+method;
    
    for(var i = 0; i < frm.elements.length; i++ ){
        if( frm.elements[i].type == 'checkbox' && frm.elements[i].checked == true ){
        	if( frm.elements[i].value.search("=") != -1 ){
        		var key = strtok(frm.elements[i].value, "=");
        		var value = strtok("=");
        		params += "&"+key+"="+encodeURIComponent(value);
        	}
        	else
        		featureList += ";"+frm.elements[i].value;
        }
    }
    
    params += "&token="+selectedExperiment.token

    if( featureList != "" )
    	params += "&features="+encodeURIComponent(featureList);
    
    var req = createRequest();
    makeRequest(req, params, function(){ onRefresh(req);  });

    if( wait == "0" )
    	hideMsgPanel();
}
