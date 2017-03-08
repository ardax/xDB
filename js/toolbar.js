var toolbarHeight = 70;
var selectedTabID = "";

var TAB_HOME = 0;
var TAB_EXPERIMENT = 1;
var TAB_TASK_QUEUE = 2;
var shownTab = TAB_HOME;

function loadToolbar()
{
	resizeToolbar();
	updateToolbar();
}

function resizeToolbar()
{
	var e = document.getElementById("tlbar");
	if( e ){
		e.style.top = 0;
		e.style.left = 0;
		e.style.width = document.body.clientWidth;
		e.style.height = toolbarHeight;
		e.style.display = '';
	}
}

function updateToolbar()
{
	var panel = "";
	panel += "<table width=100% height=70 cellpadding=0 cellspacing=0><tr>";
	
	panel += "<td id=AccountTab width=100 onmouseover='onArea(this)' onmouseout='offArea(this)' class=ToolbarTab onclick='javascript:showAccountMenu()' nowrap><table width=100%><tr><td align=center class=VeryBigTxt nowrap><i>x</i>DB</td></tr></table></td>";
	
	if( user.isAdmin() == false ){
		if( shownTab == TAB_HOME )
			panel += "<td id=HomeTab width=60 onmouseover='onArea(this)' onmouseout='offArea(this)' class=SelectedToolbarTab onclick='javascript:showHome()' nowrap><img src='imgs/dbhome.png' width=35></td>";
		else
			panel += "<td id=HomeTab width=60 onmouseover='onArea(this)' onmouseout='offArea(this)' class=ToolbarTab onclick='javascript:showHome()' nowrap><img src='imgs/dbhome.png' width=35></td>";
	}
	
	if( shownTab == TAB_EXPERIMENT || shownTab == TAB_TASK_QUEUE ){
		panel += "<td id=ExperimentTab width=200 onmouseover='onArea(this)' onmouseout='offArea(this)' class=ToolbarTab onclick='javascript:showExperimentMenu()' nowrap><table width=100%><tr><td width=10 nowrap></td><td width=100% class=TitleTxt>";
		if( focusedExperiment )
			panel += "<span class=VerySmallTxt>Experiment:</span><br><b>"+focusedExperiment.name+"</b>";
		
		panel += "</td>";
		if( shownTab == TAB_TASK_QUEUE || (focusedExperiment && focusedExperiment.selectedFile != "") )
			panel += "<td><img src='imgs/arrow.png' width=20></td>";
		panel += "</tr></table></td>";

		if( shownTab == TAB_TASK_QUEUE ){
			panel += "<td width=400 id=OrderTab onmouseover='onArea(this)' onmouseout='offArea(this)' class=ToolbarTab onclick='javascript:selectExperimentFile()' nowrap>";
			if( focusedExperiment ){
				panel += "<table cellpadding=0 cellspacing=0 height=100%><tr><td width=10 nowrap></td><td class=SmallTxt nowrap><span class=VerySmallTxt>Showing:</span><br><b>";
				panel += "Task Queue";
				panel += "</b></td></tr></table>";
			}
			panel += "</td>";
			panel += "<td class=ToolbarTab width=100%></td>";
		}
		else if( focusedExperiment && focusedExperiment.selectedFile != "" ){
			panel += "<td width=400 id=FileTab onmouseover='onArea(this)' onmouseout='offArea(this)' class=ToolbarTab onclick='javascript:selectExperimentFile()' nowrap>";
			if( focusedExperiment ){
				panel += "<table cellpadding=0 cellspacing=0 height=100% width=100%><tr><td width=10 nowrap></td><td width=100% class=SmallTxt nowrap><span class=VerySmallTxt>Results on:</span>";
				panel += "<br><b>"+focusedExperiment.selectedFile+"</b>";
				panel += "</td>";
				panel += "<td><img src='imgs/arrow.png' width=20></td>";
				panel += "</tr></table>";
			}
			panel += "</td>";
			
			panel += "<td width=200 id=OrderTab onmouseover='onArea(this)' onmouseout='offArea(this)' class=ToolbarTab onclick='javascript:selectOrder()' nowrap>";
			if( focusedExperiment ){
				panel += "<table cellpadding=0 cellspacing=0 height=100%><tr><td width=10 nowrap></td><td class=SmallTxt nowrap><span class=VerySmallTxt>Showing:</span><br><b>";
				if( focusedExperiment.showingLatest )
					panel += "Latest";
				else
					panel += "Best";
				panel += "</b></td></tr></table>";
			}
			panel += "</td>";
			panel += "<td style='border-bottom:2px solid #ffffff' width=100%></td>";
		}
		else
			panel += "<td width=100%></td>";
	}
	else
		panel += "<td width=100%></td>";

	panel += "</tr></table>";
	
	panel += "</td></tr></table>";

	var e = document.getElementById("tlbar");
	if( e ) e.innerHTML = panel;
}

function showHome()
{
	selectTab("HomeTab");
	user.showUserHome();
}

function showAccountMenu()
{
	selectTab("AccountTab");
	
	var menu = new Menu();
	if( user.isAdmin() == false ){
		menu.addOption("Create a new Experiment", "javascript:createNewExperiment()");
		menu.addOption("Change Password", "javascript:changePassword()", true);
	}
	else
		menu.addOption("Change Password", "javascript:changePassword()");
	menu.addOption("Log out <i style='font-size:10px;color:#ababab'>("+user.userName+")</i>", "javascript:logout()", true);
	menu.show(0, 200);
}

function showExperimentMenu()
{
	selectTab("ExperimentTab");
	
	var menu = new Menu();

	if( focusedExperiment.sharer != "" ){
		menu.addOption("Manage Parameters", "");
		menu.addOption("Delete All Results", "", true);
		menu.addOption("Delete This Experiment", "");
		menu.addOption("Hide Parameters in listing", "", true);
		menu.addOption("Fix a Parameter", "javascript:fixFeature()");
		menu.addOption("Show Task Queue", "", true);
		menu.addOption("Create a New Run", "");
		menu.addOption("Show Settings", "", true);
	}
	else{
		menu.addOption("Manage Parameters", "javascript:manageFeatures()");
		menu.addOption("Delete All Results", "javascript:showExperimentSettings()", true);
		menu.addOption("Delete This Experiment", "javascript:deleteExperiment()");
		menu.addOption("Hide Parameters in listing", "javascript:selectFeaturesToHide()", true);
		menu.addOption("Fix a Parameter", "javascript:fixFeature()");
		menu.addOption("Show Task Queue", "javascript:showTaskQueue()", true);
		menu.addOption("Create a New Run", "javascript:createRun()");
		menu.addOption("Show Settings", "javascript:showExperimentSettings()", true);
	}
	menu.show(160, 200);
}

function selectExperimentFile()
{
	selectTab("FileTab");

	var menu = new Menu();
	for(var i = 0; i < focusedExperiment.devFiles.length; i++){
		if( focusedExperiment.selectedFile == focusedExperiment.devFiles[i]['file'] && shownTab == TAB_EXPERIMENT )
			menu.addOption(focusedExperiment.devFiles[i]['file']+" (shown)", "");
		else
			menu.addOption(focusedExperiment.devFiles[i]['file'], "javascript:setExperimentFile('"+focusedExperiment.devFiles[i]['file']+"')");
	}

	if( shownTab == TAB_TASK_QUEUE ){
	}
	else if( focusedExperiment.sharer != "" ){
		menu.addOption("Add a New Baseline", "", true);
		menu.addOption("Share Results of This File", "");
		menu.addOption("Delete All Results of This File", "");
		menu.addOption("Delete Bad Results of This File", "");
	}
	else{
		menu.addOption("Add a New Baseline", "javascript:addBaseline()", true);
		menu.addOption("Share Results of This File", "javascript:shareExperimentFile()");
		menu.addOption("Delete All Results of This File", "javascript:deleteAllResultsOfExperimentFile()");
		menu.addOption("Delete Bad Results of This File", "javascript:deleteBadResultsOfExperimentFile()");
	}
	menu.show(360, 400);
}

function selectOrder()
{
	selectTab("OrderTab");

	var menu = new Menu();
	if( focusedExperiment.showingLatest )
		menu.addOption("Show Latest (selected)", "");
	else
		menu.addOption("Show Latest", "javascript:showLatestResults()");
	if( focusedExperiment.showingLatest == false )
		menu.addOption("Show Best (selected)", "");
	else
		menu.addOption("Show Best", "javascript:showBestResults()");
		
	menu.show(760, 200);
}

function selectTab(tabID)
{
	if( selectedTabID != "" ){
		var e = document.getElementById(selectedTabID);
		if( e )
			e.className = "ToolbarTab";
	}
	
	selectedTabID = tabID;
	var e = document.getElementById(tabID);
	if( e )
		e.className = "SelectedToolbarTab";
}

function unselectTab()
{
	if( selectedTabID != "" ){
		var e = document.getElementById(selectedTabID);
		if( e )
			e.className = "ToolbarTab";
		selectedTabID = "";
	}
}