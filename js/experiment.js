var focusedExperiment = null;

function Experiment()
{
	this.id = "";
	this.name = "";
	this.token = "";
	this.sharer = "";
	this.shownResults = null;
	this.lastUpdateDate = null;
	this.shared = null;
	this.hiddenFeatures = null;
	this.loaded = false;
	this.showingLatest = false;
	this.features = Array();
	this.devFiles = Array();
	this.featureValues = {};
	this.selectedFile = "";
	
	this.set = function(data){
		this.id = data['id'].replace("XDB-", "");
		this.name = data['name'];
		this.shownResults = data['shown_results'];
		this.token = data['token'];
		
		if( 'shared' in data )
			this.shared = data['shared'];
		if( 'sharer' in data )
			this.sharer = data['sharer'];
		
		if( 'dev_files' in data ){
			for(var i = 0; i < data['dev_files'].length; i++){
				var devFile = data['dev_files'][i];
				this.devFiles.push(devFile);
			}

			this.devFiles.sort(function(a,b) { return a['file']-b['file']; });
		}
	}
	this.showExperimentSettings = function(){		
		
		var panel = "";
		panel += "<form name='SetExperimentSettingsForm'><table style='background:#ffffff' width=100%><tr><td style='padding-top:20px;padding-left:20px'><h3>Experiment Settings</h3></td></tr>";
		panel += "<tr><td style='padding-left:20px;padding-bottom:10px;padding-right:10px'>";
		
		panel += "<table>";
		panel += "<tr><td class=SmallTxt><b>Experiment ID:</b></td></tr>";
		panel += "<tr height=35><td valign=top class=SmallTxt style='color:#ababab'>"+this.id+"</td></tr>";
		panel += "<tr><td class=SmallTxt><b>Token:</b></td></tr>";
		panel += "<tr height=35><td valign=top class=SmallTxt style='color:#ababab'>"+this.token+"</td></tr>";
		panel += "<tr><td class=SmallTxt><b>Edit experiment name:</b></td></tr>";
		panel += "<tr height=35><td valign=top><input autocomplete=off id=experiment_name class=InputEditField value='"+this.name+"'></td></tr>";
		panel += "<tr height=10><td></td></tr>";
		panel += "<tr><td class=SmallTxt><b>Select the metrics you like to see in the result listing page:</b></td></tr>";
		panel += "<tr><td style='padding-left:15px;padding-top:5px'><table>";
		panel += "<tr><td width=20 nowrap><input id='"+this.id+"_show_accuracy' type=checkbox value='accuracy' "+this.isResultVisible("accuracy")+"/></td><td class=SmallTxt width=200 nowrap>Accuracy</td></tr>";
		panel += "<tr><td width=20 nowrap><input id='"+this.id+"_show_precision' type=checkbox value='precision' "+this.isResultVisible("precision")+"/></td><td class=SmallTxt width=200 nowrap>Precision</td></tr>";
		panel += "<tr><td width=20 nowrap><input id='"+this.id+"_show_recall' type=checkbox value='recall' "+this.isResultVisible("recall")+"/></td><td class=SmallTxt width=200 nowrap>Recall</td></tr>";
		panel += "<tr><td width=20 nowrap><input id='"+this.id+"_show_fscore' type=checkbox value='fscore' "+this.isResultVisible("fscore")+"/></td><td class=SmallTxt width=200 nowrap>F-score</td></tr>";
		panel += "</table></td></tr></table>";
		
		panel += "</td></tr>";
		panel += "<tr height=50><td align=right style='padding-right:30px'>";
		panel += "<input type=button class='blue button' style='width:80;height:30' value='Update' onclick=\"javascript:setExperimentSettings()\"/> ";
		panel += "<input type=button class='gray button' style='width:80;height:30' value='Cancel' onclick='javascript:hideMsgPanel()'/>";
		panel += "</td></tr>";
		panel += "</table></form>";

		showMsgPanel(panel, 550);
	}
	this.isResultVisible = function(resultCode){
		if( this.isResultsShown(resultCode) )
			return "checked";
		return "";
	}
	this.isResultsShown = function(resultCode){
		if( this.shownResults  ){
			if( resultCode in this.shownResults && this.shownResults[resultCode] == 1 )
				return true;
		}
		return false;
	}
	this.setFocused = function(file){
		focusedExperiment = this;
		this.selectedFile = file;
		this.load();
	}
	this.load = function(){
		var pointer = this;
		var loadReq = createRequest();
		makeRequest(loadReq, "experiment_id="+this.id+"&cmd=onload", function(){ pointer.onLoad(loadReq); });
	}
	this.onLoad = function(req){
		if( req.readyState == 4 ){
			if( req.responseText != "" ){
				var json = JSON.parse(req.responseText);
				
				this.featureValues = {};
				this.features = Array();

				if( 'experiment_info' in json && 'hidden_features' in json['experiment_info'] )
					this.hiddenFeatures = json['experiment_info']['hidden_features'];
				
				if( 'params' in json ){
					for(var i = 0; i < json['params'].length; i++){
						var param = json['params'][i];
						
						var key = strtok(param, "=");
						var value = strtok("=");
						
						if( key != "dev" && key != "test" ){
							var exists = false;
							for(var j = 0; j < this.features.length; j++){
								if( this.features[j] == key )
									exists = true;
							}
							if( exists == false )
								this.features.push(key);
							
							if( !(key in this.featureValues) )
								this.featureValues[key] = {};
							this.featureValues[key][value] = true;
						}
					}
				}
				
				this.features.sort(function(a,b) {
					if( a > b ) return 1;
					else if( a < b ) return -1;
					return 0;
				});

				this.showingLatest = false;
				
				var url = parseURL(document.location);
				for(var key in url.searchObject){
					if( key ){
						if( key == "showing" ){
							if( url.searchObject[key] == "latest" )
								this.showingLatest = true;
						}
						else if( key == "dev_file" ){
							if( this.selectedFile == "" )
								this.selectedFile = url.searchObject[key];
						}
					}
				}

				this.loaded = true;
				refresh();
			}
		}
	}
	this.showSummary = function(){

		hideCurtain();
		hideToolbarMenu();
		
		var panel = "";
		
		panel += "<br><br><br><br><center><h3>Experiment Summary</h3>";		
		panel += this.printSummary();
		panel += "</center>";
		
		var e = document.getElementById("Results");
		if( e ) e.innerHTML = panel;
	}
	this.printSummary = function(){
		var panel = "";

		panel += "<table class=ExperimentSummaryBox style='padding:10px'>";
		panel += "<tr height=30><td class=SmallTxt><b><a class=SilentLink href=\"javascript:setFocusedExperiment('"+this.id+"', '')\">"+this.name+"</a></b> <small>";
		if( this.sharer != "" )
			panel += "<i class=HighlightedText style='background:#D5E3F8'>Shared by <b>"+this.sharer+"</b></i> ";
		panel += "<span style='color:#ababab'>(ID:"+this.id+")</span></small></td></tr>";
		if( this.devFiles.length > 0 ){
			panel += "<tr><td class=SmallTxt style='padding-left:10px;'>";
			panel += "<table width=100%>";
			panel += "<tr><td><table width=100%>";
			panel += "<tr height=20><td class=VerySmallTxt style='color:#ababab'>Dev Files:</td><td class=VerySmallTxt align=center><b>Latest<br>";
			if( this.isResultsShown("accuracy") ) panel += "Accuracy";
			else if( this.isResultsShown("fscore") ) panel += "FScore";
			else if( this.isResultsShown("precision") ) panel += "Precision";
			else if( this.isResultsShown("recall") ) panel += "Recall";
			panel += "</b></td><td class=VerySmallTxt align=center><b>Best<br>";
			if( this.isResultsShown("accuracy") ) panel += "Accuracy";
			else if( this.isResultsShown("fscore") ) panel += "FScore";
			else if( this.isResultsShown("precision") ) panel += "Precision";
			else if( this.isResultsShown("recall") ) panel += "Recall";
			panel += "</b></td></tr>";
			for(var i = 0; i < this.devFiles.length; i++){
				panel += "<tr height=28 style='cursor:hand;cursor:pointer' onmouseover='onRow(this)' onmouseout='offRow(this)' onclick=\"javascript:setFocusedExperiment('"+this.id+"', '"+this.devFiles[i]['file']+"')\">";
				panel += "<td width=100% style='border-bottom:1px dashed #dadada;padding-left:5px' class=SmallTxt>"+this.devFiles[i]['file'];
				if( this.isFileShared(this.devFiles[i]['file']) ) panel += " <small><b><i>(shared)</i></b></small>";
				panel += "</td>";
				panel += "<td style='border-bottom:1px dashed #dadada' class=VerySmallTxt align=center width=80 nowrap>"+this.showResult(this.devFiles[i]['latest_result'])+"</td>";
				panel += "<td style='border-bottom:1px dashed #dadada' class=VerySmallTxt align=center width=80 nowrap>"+this.showResult(this.devFiles[i]['best_result'])+"</td>";
				panel += "</tr>";
			}
			panel += "</table></td></tr>";
			panel += "</table>";
			panel += "</td></tr>";
		}
		panel += "</table><br>";
		
		return panel;
	}
	this.isFileShared = function(file){
		if( this.shared ){
			for(var i = 0; i < this.shared.length; i++){
				if( this.shared[i]['shared_file'] == file )
					return true;
			}
		}
		return false;
	}
	this.getShownMetric = function(){
		if( this.isResultsShown("accuracy") )
			return "Accuracy";
		else if( this.isResultsShown("fscore") )
			return "FScore";
		else if( this.isResultsShown("precision") )
			return "Precision";
		else if( this.isResultsShown("recall") )
			return "Recall";
		return "UNK";
	}
	this.showResult = function(result){
		if( this.isResultsShown("accuracy") ){
			if( result && 'acc' in result )
				return roundFloat(result['acc']);
		}
		else if( this.isResultsShown("fscore") ){
			if( result && 'fscore' in result )
				return roundFloat(result['fscore']);
		}
		else if( this.isResultsShown("precision") ){
			if( result && 'p' in result )
				return roundFloat(result['p']);
		}
		else if( this.isResultsShown("recall") ){
			if( result && 'r' in result )
				return roundFloat(result['r']);
		}
		return "-";
	}
	this.unShareExperimentFile = function(sharedFile, sharedUserName){
		if( this.shared ){
			for(var i = 0; i < this.shared.length; i++){
				if( this.shared[i]['shared_file'] == sharedFile && this.shared[i]['user'] == sharedUserName ){
					this.shared.splice(i, 1);
					break;
				}
			}
		}
	}
	this.shareExperimentFile = function(sharedFile, sharedUserName){
		if( this.shared == null )
			this.shared = Array();
		this.shared.push({'shared_file': sharedFile, 'user': sharedUserName});
	}
	this.getSelectedFile = function(){
		return this.getFile(this.selectedFile);
	}
	this.getFile = function(file){
		for(var i = 0; i < this.devFiles.length; i++){
			if( this.devFiles[i]['file'] == file )
				return this.devFiles[i];
		}
		return null;
	}
	this.getMostRecentRunDate = function(){
		var mostRecentDate = null;
		for(var i = 0; i < this.devFiles.length; i++){
			if( 'latest_result' in this.devFiles[i] && 'finish_date' in this.devFiles[i]['latest_result'] ){
				var date = new Date(this.devFiles[i]['latest_result']['finish_date']);
				if( mostRecentDate == null || date > mostRecentDate )
					mostRecentDate = date;
			}
		}
		return mostRecentDate;
	}
	this.isFeatureHidden = function(feature){
		if( this.hiddenFeatures ){
			for(var i = 0; i < this.hiddenFeatures.length; i++){
				if( this.hiddenFeatures[i] == feature )
					return true;
			}
		}
		return false;
	}
	this.addBaseline = function(baselineName, baselineAcc, baselineFScore, baselinePrecision, baselineRecall){
		var file = this.getSelectedFile();
		if( !('baselines' in file) )
			file['baselines'] = []
		file['baselines'].push({'name': baselineName, 'accuracy': baselineAcc, 'fscore': baselineFScore, 'precision': baselinePrecision, 'recall': baselineRecall})
	}
	this.removeBaseline = function(baselineName){
		var file = this.getSelectedFile();
		if( file && 'baselines' in file ){
			for(var i = 0; i < file['baselines'].length; i++){
				if( file['baselines'][i]['name'] == baselineName ){
					file['baselines'].splice(i, 1);
					return true;
				}
			}
		}
		return false;
	}
}

function setExperimentFile(file)
{
	shownTab = TAB_EXPERIMENT;
	focusedExperiment.setFocused(file);
	
}

function setExperimentSettings()
{
	if( focusedExperiment ){
		var query = "experiment_id="+focusedExperiment.id+"&cmd=update_shown_results";
		var e = document.getElementById(focusedExperiment.id+"_show_accuracy");
		if( e ){
			if( e.checked == true ){
				query += "&accuracy=yes";
				focusedExperiment.shownResults['accuracy'] = 1;
			}
			else{
				query += "&accuracy=no";
				focusedExperiment.shownResults['accuracy'] = 0;
			}
		}

		e = document.getElementById(focusedExperiment.id+"_show_precision");
		if( e ){
			if( e.checked == true ){
				query += "&precision=yes";
				focusedExperiment.shownResults['precision'] = 1;
			}
			else{
				query += "&precision=no";
				focusedExperiment.shownResults['precision'] = 0;
			}
		}

		e = document.getElementById(focusedExperiment.id+"_show_recall");
		if( e ){
			if( e.checked == true ){
				focusedExperiment.shownResults['recall'] = 1;
				query += "&recall=yes";
			}
			else{
				query += "&recall=no";
				focusedExperiment.shownResults['recall'] = 0;
			}
		}

		e = document.getElementById(focusedExperiment.id+"_show_fscore");
		if( e ){
			if( e.checked == true ){
				query += "&fscore=yes";
				focusedExperiment.shownResults['fscore'] = 1;
			}
			else{
				query += "&fscore=no";
				focusedExperiment.shownResults['fscore'] = 0;
			}
		}

		var req = createRequest();
		makeRequest(req, query, function(){ onSetExperimentSettings(req); });
	}
	
	hideMsgPanel();
}

function onSetExperimentSettings(req)
{
	if( req.readyState == 4 ){
		refresh();
	}
}

function showExperimentSettings()
{
	if( focusedExperiment )
		focusedExperiment.showExperimentSettings();
}

function deleteExperiment()
{
	if( confirm('Are you sure you want to delete this experiment completely? It is irreversable!') ){
		var query = "cmd=delete_experiment&experiment_id="+focusedExperiment.id;
		var req = createRequest();
		makeRequest(req, query, function(){ onDeleteExperiment(req, focusedExperiment.id); });
	}
}

function onDeleteExperiment(req, experimentID)
{
	if( req.readyState == 4 ){
		user.removeExperiment(experimentID);
		user.showUserHome();
	}
}

function showBestResults()
{
	updatePageLink();
	
	var e = document.getElementById("Results");
	if( e ) e.innerHTML = "<center><i class=SmallTxt>Loading ...</i></center>";
	
	var query = "experiment_id="+focusedExperiment.id+"&cmd=get_best_results";
	query += "&dev_file="+focusedExperiment.selectedFile;
	
	if( startAt > 0 )
		query += "&start_at="+startAt;

	var fixedFeaturesList = "";
	for(var i = 0; i < fixedFeatures.length; i++){
		var fixedFeature = fixedFeatures[i];
		if( fixedFeaturesList != "" ) fixedFeaturesList += ";";
		if( fixedFeature['value'] != "" )
			fixedFeaturesList += fixedFeature['feature']+"="+fixedFeature['value'];
		else
			fixedFeaturesList += fixedFeature['feature'];
	}
	if( fixedFeaturesList != "" )
		query += "&fixed_features="+fixedFeaturesList;
	
	var req = createRequest();
	makeRequest(req, query, function(){ onLoadResults(req, "get_best_results"); });
}

function showLatestResults()
{
	var query = "experiment_id="+focusedExperiment.id+"&cmd=get_latest_results";
	query += "&dev_file="+focusedExperiment.selectedFile;

	if( startAt > 0 )
		query += "&start_at="+startAt;

	var fixedFeaturesList = "";
	for(var i = 0; i < fixedFeatures.length; i++){
		var fixedFeature = fixedFeatures[i];
		if( fixedFeaturesList != "" ) fixedFeaturesList += ";";
		if( fixedFeature['value'] != "" )
			fixedFeaturesList += fixedFeature['feature']+"="+fixedFeature['value'];
		else
			fixedFeaturesList += fixedFeature['feature'];
	}
	if( fixedFeaturesList != "" )
		query += "&fixed_features="+fixedFeaturesList;
	
	var req = createRequest();
	makeRequest(req, query, function(){ onLoadResults(req, "get_latest_results"); });
}

function addBaseline()
{
	var panel = "";
	panel += "<form name='SetExperimentSettingsForm'><table style='background:#ffffff' width=100%><tr><td style='padding-top:20px;padding-left:20px'><h3>Add a new Baseline</h3></td></tr>";
	panel += "<tr><td style='padding-left:20px;padding-bottom:10px;padding-right:10px'>";
	
	panel += "<table>";
	panel += "<tr height=30><td class=SmallTxt valign=bottom>Enter Baseline Name:</td></tr>";
	panel += "<tr height=30><td valign=top><input autocomplete=off id=new_baseline_name class=InputEditField value=''></td></tr>";
	panel += "<tr height=30><td class=SmallTxt valign=bottom>Set Accuracy:</td></tr>";
	panel += "<tr height=30><td valign=top><input autocomplete=off id=new_baseline_accuracy class=InputEditField value='0.0'></td></tr>";
	panel += "<tr height=30><td class=SmallTxt valign=bottom>Set FScore:</td></tr>";
	panel += "<tr height=30><td valign=top><input autocomplete=off id=new_baseline_fscore class=InputEditField value='0.0'></td></tr>";
	panel += "<tr height=30><td class=SmallTxt valign=bottom>Set Precision:</td></tr>";
	panel += "<tr height=30><td valign=top><input autocomplete=off id=new_baseline_precision class=InputEditField value='0.0'></td></tr>";
	panel += "<tr height=30><td class=SmallTxt valign=bottom>Set Recall:</td></tr>";
	panel += "<tr height=30><td valign=top><input autocomplete=off id=new_baseline_recall class=InputEditField value='0.0'></td></tr>";
	panel += "</table>";
	
	panel += "</td></tr>";
	panel += "<tr height=50><td align=right style='padding-right:30px'>";
	panel += "<input type=button class='blue button' style='width:80;height:30' value='Add' onclick=\"javascript:addBaselineNow()\"/> ";
	panel += "<input type=button class='gray button' style='width:80;height:30' value='Cancel' onclick='javascript:hideMsgPanel()'/>";
	panel += "</td></tr>";
	panel += "</table></form>";

	showMsgPanel(panel, 550);
}

function addBaselineNow()
{
	if( focusedExperiment ){
		var query = "experiment_id="+focusedExperiment.id+"&cmd=add_baseline";

		query += "&dev_file="+focusedExperiment.selectedFile;
		
		var e = document.getElementById("new_baseline_name");
		if( e.value == "" ){
			alert('Enter valid baseline name');
			return;
		}
		
		var baselineName = e.value;
		query += "&baseline_name="+escape(baselineName);
		
		e = document.getElementById("new_baseline_accuracy");
		var baselineAcc = e.value;
		query += "&baseline_accuracy="+escape(e.value); 
		
		e = document.getElementById("new_baseline_fscore");
		var baselineFScore = e.value;
		query += "&baseline_fscore="+escape(e.value); 
		
		e = document.getElementById("new_baseline_precision");
		var baselinePrecision = e.value;
		query += "&baseline_precision="+escape(e.value); 
		
		e = document.getElementById("new_baseline_recall");
		var baselineRecall = e.value;
		query += "&baseline_recall="+escape(e.value); 

		var req = createRequest();
		makeRequest(req, query, function(){ onAddBaseline(req, baselineName, baselineAcc, baselineFScore, baselinePrecision, baselineRecall); });
	}
	
	hideMsgPanel();
}

function onAddBaseline(req, baselineName, baselineAcc, baselineFScore, baselinePrecision, baselineRecall)
{
	if( req.readyState == 4 ){
		focusedExperiment.addBaseline(baselineName, baselineAcc, baselineFScore, baselinePrecision, baselineRecall);
		refresh();
	}
}

function deleteBaseline(baselineName)
{
	if( confirm('Are you sure you want to delete the baseline named '+baselineName+'?') ){
		var query = "cmd=delete_baseline&experiment_id="+focusedExperiment.id+"&baseline_name="+baselineName;
		query += "&dev_file="+focusedExperiment.selectedFile;
		
		var req = createRequest();
		makeRequest(req, query, function(){ onDeleteBaseline(req, baselineName); });
	}
}

function onDeleteBaseline(req, baselineName)
{
	if( req.readyState == 4 ){
		focusedExperiment.removeBaseline(baselineName);
		refresh();
	}
}

function shareExperimentFile()
{
	var panel = "";
	panel += "<form name='SetExperimentSettingsForm'><table style='background:#ffffff' width=100%><tr><td style='padding-top:20px;padding-left:20px'><h3>Share Results of this Experiment File</h3></td></tr>";
	panel += "<tr><td style='padding-left:20px;padding-bottom:10px;padding-right:10px'>";
	
	panel += "<table>";
	panel += "<tr height=30><td class=SmallTxt valign=bottom>Enter user name to share with</td></tr>";
	panel += "<tr height=30><td valign=top><input autocomplete=off id=shared_user_name class=InputEditField value=''></td></tr>";
	panel += "</table>";
	
	panel += "</td></tr>";
	panel += "<tr height=50><td align=right style='padding-right:30px'>";
	panel += "<input type=button class='blue button' style='width:80;height:30' value='Share' onclick=\"javascript:shareExperimentFileNow()\"/> ";
	panel += "<input type=button class='gray button' style='width:80;height:30' value='Cancel' onclick='javascript:hideMsgPanel()'/>";
	panel += "</td></tr>";
	panel += "</table></form>";

	showMsgPanel(panel, 550);
}

function shareExperimentFileNow()
{
	if( focusedExperiment ){
		var query = "experiment_id="+focusedExperiment.id+"&cmd=share_experiment_file";
		query += "&shared_file="+focusedExperiment.selectedFile;
		
		var e = document.getElementById("shared_user_name");
		if( e.value == "" ){
			alert('Enter valid user name');
			return;
		}
		query += "&shared_user_name="+escape(e.value);
		
		var req = createRequest();
		makeRequest(req, query, function(){ onShareExperimentFileNow(req, focusedExperiment.selectedFile, e.value); });
	}
	
	hideMsgPanel();
}

function onShareExperimentFileNow(req, sharedFile, sharedUserName)
{
	if( req.readyState == 4 ){
		focusedExperiment.shareExperimentFile(sharedFile, sharedUserName);
		refresh();
	}
}

function unshareExperimentFile(sharedUserName)
{
	if( focusedExperiment ){
		var query = "experiment_id="+focusedExperiment.id+"&cmd=unshare_experiment_file";
		query += "&shared_file="+focusedExperiment.selectedFile;
		query += "&shared_user_name="+escape(sharedUserName);
		
		var req = createRequest();
		makeRequest(req, query, function(){ onUnshareExperimentFile(req, focusedExperiment.selectedFile, sharedUserName); });
	}
}

function onUnshareExperimentFile(req, sharedFile, sharedUserName)
{
	if( req.readyState == 4 ){
		focusedExperiment.unShareExperimentFile(sharedFile, sharedUserName);
		refresh();
	}
}

function deleteAllResultsOfExperimentFile()
{
	if( confirm('Are you sure you want to delete the results taken on this experiment file? It is irreversable!') ){
		var query = "cmd=delete_experiment_file_results&experiment_id="+focusedExperiment.id;
		query += "&dev_file="+focusedExperiment.selectedFile;
		
		var req = createRequest();
		makeRequest(req, query, function(){ onRefresh(req); });
	}
}

function deleteBadResultsOfExperimentFile()
{
	var panel = "";
	panel += "<form name='SetExperimentSettingsForm'><table style='background:#ffffff' width=100%><tr><td style='padding-top:20px;padding-left:20px'><h3>Delete Bad Results of this Experiment File</h3></td></tr>";
	panel += "<tr><td style='padding-left:20px;padding-bottom:10px;padding-right:10px'>";
	
	panel += "<table>";
	panel += "<tr height=30><td class=SmallTxt valign=bottom>Select the metric:</td></tr>";
	panel += "<tr height=30><td valign=top><select id=threshold_metric style='width:400px;height:40px;font-size:15px'><option value='Accuracy'>Accuracy</option><option value='FScore'>FScore</option><option value='Precision'>Precision</option><option value='Recall'>Recall</option></select></td></tr>";
	panel += "<tr height=30><td class=SmallTxt valign=bottom>Delete results under following value:</td></tr>";
	panel += "<tr height=30><td valign=top><input id=threshold_value class=SmallTxt style='border:1px solid #dfdfdf;padding:3px;width:400px;height:35px' value=''></td></tr>";
	panel += "</table>";
	
	panel += "</td></tr>";
	panel += "<tr height=50><td align=right style='padding-right:30px'>";
	panel += "<input type=button class='blue button' style='width:80;height:30' value='Delete' onclick=\"javascript:deleteBadResultsOfExperimentFileNow()\"/> ";
	panel += "<input type=button class='gray button' style='width:80;height:30' value='Cancel' onclick='javascript:hideMsgPanel()'/>";
	panel += "</td></tr>";
	panel += "</table></form>";

	showMsgPanel(panel, 450);
}

function deleteBadResultsOfExperimentFileNow()
{
	var query = "experiment_id="+focusedExperiment.id+"&cmd=delete_experiment_file_bad_results";
	query += "&dev_file="+focusedExperiment.selectedFile;
	
	var e = document.getElementById("threshold_value");
	if( e.value == "" ){
		alert('Enter valid threshold value');
		return;
	}
	query += "&value="+(parseFloat(e.value)/100);

	e = document.getElementById("threshold_metric");
	if( e )
		query += "&metric="+e.value;
	
	var req = createRequest();
	makeRequest(req, query, function(){ onRefresh(req); });

	hideMsgPanel();
}