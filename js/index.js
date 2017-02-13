
var groupFeature = "";
var startAt = 0;
var fixedFeatures = Array();
var shownResults = new Array();

function loadPage(userName)
{	
	if( userName == "admin" )
		user = new Admin();
	else
		user = new User();
	
	window.onkeydown = function(event) { onKeyDown(event); }
	window.onresize = function(event) { onResize(event); }
	window.addEventListener('popstate', function(event) { onGoBack(event); });

	shownTab = TAB_HOME;
	var exID = "";
	var url = parseURL(document.location);
	for(var key in url.searchObject){
		if( key ){
			if( key == "experiment_id" ){
				if( shownTab != TAB_TASK_QUEUE )
					shownTab = TAB_EXPERIMENT;
				exID = url.searchObject[key];
			}
			else if( key == "showing"  ){
				if( url.searchObject[key] == "task_queue" )
					shownTab = TAB_TASK_QUEUE;
			}
			else if( key == "start_at" )
				startAt = parseInt(url.searchObject[key]);
			else if( key != "experiment_id" && key != "dev_file" )
				fixedFeatures.push({'feature': key, 'value': url.searchObject[key]});
			else if( key == "group_by" ){
				groupFeature = url.searchObject[key];
				
				var e = document.getElementById("group_by_box");
				if( e ) e.innerHTML = "<a class=SilentLink href='javascript:groupResultsBy()'>Group By:"+groupFeature+"</a> [ <a class=SilentLink href='javascript:resolveGroups()'>rmv</a> ]";
			}
		}
	}
	
	loadToolbar();
	user.load(userName, function(){

		if( shownTab == TAB_HOME )
			user.showUserHome();
		else if( shownTab == TAB_TASK_QUEUE ){
			user.setFocusedExperiment(exID);
			showTaskQueue();
		}
		else if( exID != "" )
			user.setFocusedExperiment(exID);
	});
}

function onShowLatestResults(req)
{
	if( req.readyState == 4 ){
		var json = JSON.parse(req.responseText);
	}
}

function updateSelectedTestFile(elm)
{
	for(var i = 0; i < focusedExperiment.devFiles.length; i++){
		if( focusedExperiment.devFiles[i] == elm.value ){
			focusedExperiment.selectedFile = elm.value;
			break;
		}
	}
	refresh();
}

function fixFeature()
{
	var panel = "";

	panel += "<table width=500 height=280 style='background:#ffffff'><tr><td align=center>";
	panel += "<table width=400>";
	panel += "<tr><td><h2>Fix feature</h2></td></tr>";
	panel += "<tr height=20><form id=FixFeatureForm><td class=SmallTxt>Select from features list:</td></tr>";
	panel += "<tr><td><select id=selectedFeatureToFix style='height:35px;width:400px;background:#fafafa;border:1px solid #cacaca;font-size:16' onchange=\"updateSelectedFeatureValues(this);\">";
	var firstVisibleFeature = "";
	for(var i = 0; i < focusedExperiment.features.length; i++){
		if( isFeatureFixed(focusedExperiment.features[i]) == false ){
			var visibleFeature = focusedExperiment.features[i].replace("@", "/");
			panel += "<option value='"+focusedExperiment.features[i]+"'>"+visibleFeature+"</option>";
			if( firstVisibleFeature == "" )
				firstVisibleFeature = visibleFeature;
		}
	}
	panel += "</select></td></tr>";
	panel += "<tr height=20><td class=SmallTxt>Select specific feature value:</td></tr>";
	panel += "<tr><td id=featurevalues><select id=selectedFixedFeatureValue style='height:35px;width:400px;background:#fafafa;border:1px solid #cacaca;font-size:16'";
	if( firstVisibleFeature in focusedExperiment.featureValues ){
		panel += ">";
		for(var key in focusedExperiment.featureValues[firstVisibleFeature]){
			panel += "<option value='"+key+"'>"+key+"</option>";
		}
	}
	else{
		panel += " disabled>";
		panel += "<option>NA</option>";
	}
	panel += "</select></td></tr>";
	panel += "<tr height=50><td align=right>";
	panel += "<input type=button class='blue button' style='width:80;height:30' value='Fix' onclick='javascript:fixFeatureNow(document.FixFeatureForm)'>&nbsp;";
	panel += "<input type=button class='gray button' style='width:80;height:30' value='Cancel' onclick='javascript:hideMsgPanel()'/>";
	panel += "</td></tr>";
	panel += "</table></form>";
	panel += "</td></tr></table>";

	showMsgPanel(panel, 500, 280);
}

function fixAnotherFeatureValue(selectedFeature, selectedFeatureValue)
{
	var panel = "";

	panel += "<table width=500 height=280 style='background:#ffffff'><tr><td align=center>";
	panel += "<table width=400>";
	panel += "<tr><td><h2>Fix feature</h2></td></tr>";
	panel += "<tr height=20><form id=FixFeatureForm><td class=SmallTxt>Select from features list:</td></tr>";
	panel += "<tr><td><select id=selectedFeatureToFix style='height:35px;width:400px;background:#fafafa;border:1px solid #cacaca;font-size:16' onchange=\"updateSelectedFeatureValues(this);\">";
	for(var i = 0; i < focusedExperiment.features.length; i++){
		var visibleFeature = focusedExperiment.features[i].replace("@", "/");
		panel += "<option value='"+focusedExperiment.features[i]+"'";
		if( focusedExperiment.features[i] == selectedFeature )
			panel += " selected";
		panel += ">"+visibleFeature+"</option>";
	}
	panel += "</select></td></tr>";
	panel += "<tr height=20><td class=SmallTxt>Select specific feature value:</td></tr>";
	panel += "<tr><td id=featurevalues><select id=selectedFixedFeatureValue style='height:35px;width:400px;background:#fafafa;border:1px solid #cacaca;font-size:16'";
	if( selectedFeature in focusedExperiment.featureValues ){
		panel += ">";
		for(var key in focusedExperiment.featureValues[selectedFeature]){
			panel += "<option value='"+key+"'";
			if( key == selectedFeatureValue )
				panel += " selected";
			panel += ">"+key+"</option>";
		}
	}
	else{
		panel += " disabled>";
		panel += "<option>NA</option>";
	}
	panel += "</select></td></tr>";
	panel += "<tr height=50><td align=right>";
	panel += "<input type=button class='blue button' style='width:80;height:30' value='Fix' onclick='javascript:fixFeatureNow(document.FixFeatureForm)'>&nbsp;";
	panel += "<input type=button class='gray button' style='width:80;height:30' value='Cancel' onclick='javascript:hideMsgPanel()'/>";
	panel += "</td></tr>";
	panel += "</table></form>";
	panel += "</td></tr></table>";

	showMsgPanel(panel, 500, 280);
}

function updateSelectedFeatureValues(elm)
{
	var panel = "";
	panel += "<select id=selectedFixedFeatureValue style='height:35px;width:400px;background:#fafafa;border:1px solid #cacaca;font-size:16'";
	var values = Array();
	if( elm.value in focusedExperiment.featureValues ){
		for(var value in focusedExperiment.featureValues[elm.value])
			values.push(value);
	}
	if( values.length > 0 ){
		panel += ">";
		for(var i = 0; i < values.length; i++){
			var visibleFeatureValue = values[i].replace("@", "/");
			panel += "<option value='"+values[i]+"'>"+visibleFeatureValue+"</option>";
		}
	}
	else{
		panel += " disabled>";
		panel += "<option>NA</option>";
	}
	panel += "</select>";

	var e = document.getElementById("featurevalues");
	if( e ) e.innerHTML = panel;
}

function onUpdateSelectedFeatureValues(req)
{
	if( req.readyState == 4 ){
		var featureValues = Array();
		if( req.responseText != "" ){
			var line = strtok(req.responseText, "\n");
			while(line){
				featureValues.push(line)
				line = strtok("\n");
			}
		}

		var panel = "";
		panel += "<select id=selectedFixedFeatureValue style='height:35px;width:400px;background:#fafafa;border:1px solid #cacaca;font-size:16'";
		if( featureValues.length > 0 ){
			panel += ">";
			for(var i = 0; i < featureValues.length; i++){
				var visibleFeatureValue = featureValues[i].replace("@", "/");
				panel += "<option value='"+featureValues[i]+"'>"+visibleFeatureValue+"</option>";
			}
		}
		else{
			panel += " disabled>";
			panel += "<option>NA</option>";
		}
		panel += "</select>";

		var e = document.getElementById("featurevalues");
		if( e ) e.innerHTML = panel;
	}
}

function fixFeatureNow(form)
{
	var feature = document.getElementById("selectedFeatureToFix").value;
	var featureValue = "";

	if( document.getElementById("selectedFixedFeatureValue") ){
		featureValue = document.getElementById("selectedFixedFeatureValue").value;
		if( featureValue == "NA" )
			featureValue = "";
	}
	
	var updated = false;
	for(var i = 0; i < fixedFeatures.length; i++){
		if( fixedFeatures[i]['feature'] == feature ){
			fixedFeatures[i]['value'] = featureValue;
			updated = true;
		}
	}

	if( updated == false )
		fixedFeatures.push({'feature': feature, 'value': featureValue});

	hideCurtain();
	var e = document.getElementById("panel");
	if( e ) e.style.display = 'none';

	refresh();
}

function resolveGroups()
{
	groupFeature = "";
	refresh();

	var e = document.getElementById("group_by_box");
	if( e ) e.innerHTML = "<a class=SilentLink href='javascript:groupResultsBy()'>Group By</a>";
}

function groupResultsBy()
{
	var panel = "";

	panel += "<table width=500 height=280 style='background:#ffffff'><tr><td align=center>";
	panel += "<table width=400>";
	panel += "<tr><td><h2>Group By</h2></td></tr>";
	panel += "<tr height=20><form id=FixFeatureForm><td class=SmallTxt>Select from features list:</td></tr>";
	panel += "<tr><td><select id=selectedFeatureToGroup style='height:35px;width:400px;background:#fafafa;border:1px solid #cacaca;font-size:16' onchange=\"updateSelectedFeatureValues(this);\">";
	for(var i = 0; i < focusedExperiment.features.length; i++){
		if( isFeatureFixed(focusedExperiment.features[i]) == false ){
			var visibleFeature = focusedExperiment.features[i].replace("@", "/");
			panel += "<option value='"+focusedExperiment.features[i]+"'>"+visibleFeature+"</option>";
		}
	}
	panel += "</select></td></tr>";
	panel += "<tr height=50><td align=right>";
	panel += "<input type=button class='blue button' style='width:80;height:30' value='Group' onclick='javascript:groupResultsByNow()'>&nbsp;";
	panel += "<input type=button class='gray button' style='width:80;height:30' value='Cancel' onclick='javascript:hideMsgPanel()'></td></tr>";
	panel += "</table></form>";
	panel += "</td></tr></table>";

	showMsgPanel(panel, 500, 280);
}

function groupResultsByNow()
{
	var e = document.getElementById("selectedFeatureToGroup");
	if( e ){
		groupFeature = e.value;
		refresh();
		hideMsgPanel();

		var e = document.getElementById("group_by_box");
		if( e ) e.innerHTML = "<a class=SilentLink href='javascript:groupResultsBy()'>Group By:"+groupFeature+"</a> [ <a class=SilentLink href='javascript:resolveGroups()'>rmv</a> ]";
	}
}

function removeAllFixedFeatures()
{
	fixedFeatures.length = 0;
	refresh();
}

function removeFixedFeature(feature, value)
{
	for(var i = 0; i < fixedFeatures.length; i++){
		if( fixedFeatures[i]['feature'] == feature && fixedFeatures[i]['value'] == value ){
			fixedFeatures.splice(i, 1);
			break;
		}
	}

	refresh();
}

function updateResults()
{
	updatePageLink();
	
	var e = document.getElementById("Results");
	if( e ) e.innerHTML = "<center><i class=SmallTxt>Loading ...</i></center>";

	var fixedFeaturesList = "";
	for(var i = 0; i < fixedFeatures.length; i++){
		var fixedFeature = fixedFeatures[i];
		if( fixedFeaturesList != "" ) fixedFeaturesList += ";";
		if( fixedFeature['value'] != "" )
			fixedFeaturesList += fixedFeature['feature']+"="+fixedFeature['value'];
		else
			fixedFeaturesList += fixedFeature['feature'];
	}
	
	var selectedFile = "";
	if( focusedExperiment.selectedFile != "" )
		selectedFile = "dev_file="+focusedExperiment.selectedFile;
	
	var req = createRequest();
	if( groupFeature != "" )
		makeRequest(req, "experiment_id="+focusedExperiment.id+"&cmd=get_grouped_results&"+selectedFile+"&group_feature="+groupFeature+"&fixed_features="+fixedFeaturesList, function(){ onLoadResults(req, "get_grouped_results"); });
	else
		makeRequest(req, "experiment_id="+focusedExperiment.id+"&cmd=get_results&"+selectedFile+"&fixed_features="+fixedFeaturesList+"&start_at"+startAt, function(){ onLoadResults(req, "get_results"); });
}

function updatePageLink()
{
	if( document.location ){
		var newLink = getCurrentAddressWOParams();
		
		if( shownTab == TAB_EXPERIMENT ){
			newLink += "?experiment_id="+focusedExperiment.id.replace("XDB-", "");
			if( focusedExperiment.selectedFile != "" )
				newLink += "&dev_file="+focusedExperiment.selectedFile;
			if( fixedFeatures.length > 0 ){
				for(var i = 0; i < fixedFeatures.length; i++){
					var fixedFeature = fixedFeatures[i];
					if( fixedFeature['value'] != "" )
						newLink += "&"+fixedFeature['feature']+"="+fixedFeature['value'];
					else
						newLink += "&"+fixedFeature['feature']+"=";
				}
			}
			if( groupFeature != "" )
				newLink += "&group_by="+groupFeature;
			if( startAt > 0 )
				newLink += "&start_at="+startAt;
			if( focusedExperiment.showingLatest )
				newLink += "&showing=latest";
		}
		else if( shownTab == TAB_TASK_QUEUE ){
			newLink += "?experiment_id="+focusedExperiment.id.replace("XDB-", "");
			newLink += "&showing=task_queue";
		}
		
		if( history.pushState && document.location != newLink )
			window.history.pushState({path:newLink}, '', newLink);
	}
}

function onArea(elm)
{
	if( elm.className == "ToolbarTab" )
		elm.className = "FocusedToolbarTab";
	else if( elm.className == "MenuItem" )
		elm.className = "FocusedMenuItem";
	else if( elm.className == "NavButton" )
		elm.className = "FocusedNavButton";
}

function offArea(elm)
{
	if( elm.className == "FocusedToolbarTab" )
		elm.className = "ToolbarTab";
	else if( elm.className == "FocusedMenuItem" )
		elm.className = "MenuItem";
	else if( elm.className == "FocusedNavButton" )
		elm.className = "NavButton";
}

function fixRunParameters(runid)
{
	for(var i = 0; i < shownResults.length; i++){
		var result = shownResults[i].getResultWID(runid);
		
		fixedFeatures.length = 0;
		for(var j = 0; j < result.params.length; j++){
			var feature = result.params[j];
			if( feature.search("=") != -1 ){
				var lhs = strtok(feature, "=");
				var rhs = strtok("=");
			
				fixedFeatures.push({'feature': lhs, 'value': rhs});
			}
			else{
				feature = feature.replace(/^\+/, "");
				fixedFeatures.push({'feature': feature, 'value': ""});
			}
		}
		
		refresh();
		return;
	}
}

function onLoadResults(req, cmd)
{
	if( req.readyState == 4 ){
		if( req.responseText != "" ){
			shownResults.length = 0;

			if( cmd == "get_latest_results" )
				focusedExperiment.showingLatest = true;
			else
				focusedExperiment.showingLatest = false;
			
			var currentGroupValue = "";
			var rawResults = Array();
			var json = JSON.parse(req.responseText);
			if( 'results' in json ){
				var results = new Results(currentGroupValue);
				results.set(json['results']);
				
				if( 'numof_results' in json )
					results.numOfResults = parseInt(json['numof_results']);
				if( 'page_size' in json )
					results.pageSize = parseInt(json['page_size']);
				if( 'start_at' in json )
					results.startAt = parseInt(json['start_at']);
				
				shownResults.push(results);
			}
			else if( 'grouped_results' in json ){
				for( var key in json['grouped_results']){
					var groupedResults = json['grouped_results'][key];
					
					var results = new Results(key);
					results.set(groupedResults['results']);
					shownResults.push(results);
				}
			}

			for(var i = 0; i < shownResults.length; i++){
				shownResults[i].load();
				if( cmd != "get_latest_results" )
					shownResults[i].sort();
			}

			shownResults.sort(function(a,b) { return (b.topResult-a.topResult); });
			
			updateResultsListing();

			updatePageLink();
			updateToolbar();
		}
		else{
			var e = document.getElementById("Results");
			if( e ) e.innerHTML = "<center><i class=SmallTxt><a class=SilentLink href='javascript:refresh()'>No results to list</a></i></center>";
		}
	}
}

function updateResultsListing()
{
	var panel = "<br><br>";

	if( groupFeature != "" )
		panel += "<h4 style='margin-top:10px;margin-bottom:0px'>Listing grouped results by feature <u>"+groupFeature+"</u> on file '"+focusedExperiment.selectedFile+"'</h4>";
	
	for(var i = 0; i < shownResults.length; i++)
		panel += shownResults[i].print((groupFeature==""));

	var e = document.getElementById("Results");
	if( e ) e.innerHTML = panel;
}

function isParamFixed(param)
{
	for(var i = 0; i < fixedFeatures.length; i++){
		var fixedFeature = fixedFeatures[i];
		if( fixedFeature['feature'] == param )
			return true;
		var p = "+"+fixedFeature['feature'];
		if( p == param )
			return true;
		p = fixedFeature['feature']+"="+fixedFeature['value'];
		if( p == param )
			return true;
	}
	return false;
}

function showResultsPage(newStartAt)
{
	startAt = newStartAt;
	refresh();
}

function fixThisFeature(feature)
{
	if( feature.search("=") != -1 ){
		var lhs = strtok(feature, "=");
		var rhs = strtok("=");
	
		fixedFeatures.push({'feature': lhs, 'value': rhs});
	}
	else{
		feature = feature.replace(/^\+/, "");
		fixedFeatures.push({'feature': feature, 'value': ""});
	}
	
	groupFeature = "";
	var e = document.getElementById("group_by_box");
	if( e ) e.innerHTML = "<a class=SilentLink href='javascript:groupResultsBy()'>Group By</a>";

	hideCurtain();
	var e = document.getElementById("panel");
	if( e ) e.style.display = 'none';

	refresh();
}

function refresh()
{
	if( shownTab == TAB_HOME )
		user.showUserHome();
	else if( shownTab == TAB_TASK_QUEUE )
		showTaskQueue();
	else if( shownTab == TAB_EXPERIMENT ){
		if( focusedExperiment.selectedFile != "" ){
			if( focusedExperiment.showingLatest )
				showLatestResults();
			else
				showBestResults();
		}
		else
			focusedExperiment.showSummary();
	}

	updateToolbar();
	updatePageLink();
}

function isFeatureFixed(feature)
{
	for(var i = 0; i < fixedFeatures.length; i++){
		if( fixedFeatures[i]['feature'] == feature )
			return true;
	}
	return false;
}

function loadWLink(link)
{
	var exID = "";
	
	groupFeature = "";
	focusedExperiment.selectedFile = "";
	shownTab = TAB_HOME;
	fixedFeatures.length = 0;
	
	var url = parseURL(link);
	for(var key in url.searchObject){
		if( key ){
			if( key == "experiment_id" )
				exID = url.searchObject[key];
			else if( key == "showing" && url.searchObject[key] == "task_queue" )
				shownTab = TAB_TASK_QUEUE;
			else if( key == "dev_file" )
				focusedExperiment.selectedFile = url.searchObject[key];
			else
				fixedFeatures.push({'feature': key, 'value': url.searchObject[key]});
		}
	}
	
	if( exID != "" && shownTab == TAB_HOME )
		shownTab = TAB_EXPERIMENT;

	if( shownTab == TAB_HOME )
		user.showUserHome();
	else if( shownTab == TAB_TASK_QUEUE ){
		user.setFocusedExperiment(exID);
		showTaskQueue();
	}
	else if( shownTab == TAB_EXPERIMENT ){
		if( exID != "" )
			user.setFocusedExperiment(exID);
	}
}

function hideAllMsgPanels()
{
	hideToolbarMenu();
	hideMsgPanel();
	hideCurtain();
}

function onRefresh(req)
{
	if( req.readyState == 4 ){
		if( req.responseText != "" ){
			var json = JSON.parse(req.responseText);
			if( 'msg' in json && json['msg'] != "OK" )
				alert(json['msg']);
			else
				refresh();
		}
		else
			refresh();
	}
}

function onKeyDown(e)
{
	e = e || window.event;
	var keycode = e.charCode || e.keyCode;

	if( keycode == 27 ){
		hideAllMsgPanels();
	}
}

function onResize(e)
{
	resizeToolbar();
}

function onGoBack(e)
{
	hideAllMsgPanels();
	loadWLink(document.location);
	return true;
}