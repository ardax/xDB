var user = null;

function User()
{
	this.userName = ";"
	this.experiments = Array();
	
	this.load = function(userName, callback){
		this.userName = userName;
		
		var req = createRequest();
		makeRequest(req, "cmd=get_experiments_list", function(){ user.onLoadExperiments(req, callback); });
	}
	this.onLoadExperiments = function(req, callback){
		if( req.readyState == 4 ){
			if( req.responseText != "" ){
				var json = JSON.parse(req.responseText);
				if( 'results' in json ){
					for(var i = 0; i < json['results'].length; i++){
						var experiment = new Experiment();
						experiment.set(json['results'][i]);
						this.experiments.push(experiment);
					}}}
			
				this.experiments.sort(function(a,b) { return b.getMostRecentRunDate()-a.getMostRecentRunDate(); });
			}
		
			if( callback )
				callback();
	}
	this.setFocusedExperiment = function(experimentID, file){
		file = typeof file !== 'undefined' ? file : "";
		var ex = this.getExperimentWID(experimentID);
		if( ex ){
			shownTab = TAB_EXPERIMENT;
			ex.setFocused(file);
			return true;
		}
		return false;
	}
	this.removeExperiment = function(experimentID){

		for(var i = 0; i < this.experiments.length; i++){
			if( this.experiments[i].id == experimentID ){
				this.experiments.splice(i, 1);
				
				if( this.experiments[i] == focusedExperiment )
					focusedExperiment = null;
				return;
			}
		}	
	}
	this.getExperimentWID = function(ID){
		for(var i = 0; i < this.experiments.length; i++){
			if( this.experiments[i].id == ID )
				return this.experiments[i];
		}
		return null;
	}
	this.isAdmin = function(){
		return false;
	}
	this.showUserHome = function(){
		hideCurtain();
		hideToolbarMenu();
		
		// reset
		groupFeature = "";
		fixedFeatures.length = 0;
		
		var panel = "";
		
		panel += "<br><br><br><br><center><h3>All Experiments</h3>";
		panel += printNewExperimentBox();
		
		for(var i = 0; i < this.experiments.length; i++)
			panel += this.experiments[i].printSummary();
		
		panel += "</center>";
		
		shownTab = TAB_HOME;
		updatePageLink();
		updateToolbar();

		var e = document.getElementById("Results");
		if( e ) e.innerHTML = panel;
	}
}

function setFocusedExperiment(experimentID, file)
{
	file = typeof file !== 'undefined' ? file : "";
	user.setFocusedExperiment(experimentID, file);
}

function createNewExperiment()
{
	var panel = "";
	panel += "<form name='SetExperimentSettingsForm'><table style='background:#ffffff' width=100%><tr height=30><td style='padding:10px'><h3>Create a new experiment</h3></td></tr>";
	panel += "<tr><td style='padding-left:20px;padding-bottom:10px;padding-right:20px'>";
	
	panel += "<table>";
	panel += "<tr><td class=SmallTxt>Enter the name of the experiment:</td></tr>";
	panel += "<tr><td><input autocomplete=off id=new_experiment_name class=InputEditField></td></tr>";
	panel += "</table>";
	
	panel += "</td></tr>";
	panel += "<tr height=50><td align=right style='padding-right:30px'>";
	panel += "<input type=button class='blue button' style='width:80;height:30' value='Create' onclick=\"javascript:createNewExperimentNow()\"/> ";
	panel += "<input type=button class='gray button' style='width:80;height:30' value='Cancel' onclick='javascript:hideMsgPanel()'/>";
	panel += "</td></tr>";
	panel += "</table></form>";

	showMsgPanel(panel);
}

function createNewExperimentNow()
{	
	var e = document.getElementById("new_experiment_name");
	if( e ){
		if( e.value == "" )
			alert('Please enter valid name');
		else{
			hideMsgPanel();
			var query = "cmd=create_new_experiment&name="+escape(e.value);
			
			var req = createRequest();
			makeRequest(req, query, function(){ onCreateNewExperiment(req); });
		}
	}
}

function onCreateNewExperiment(req)
{
	if( req.readyState == 4 ){
		if( req.responseText != "" ){
			var json = JSON.parse(req.responseText);
			if( 'msg' in json ){
				alert(json['msg']);
			}
			else if( 'new_experiment' in json ){
				var experiment = new Experiment();
				experiment.set(json['new_experiment']);
				user.experiments.push(experiment);
				user.setFocusedExperiment(experiment.id);
				
				refresh();
			}
		}
	}
}

function printNewExperimentBox()
{
	var panel = "";
	panel += "<table class=ExperimentSummaryBox>";
	panel += "<tr height=50><td class=SmallTxt align=center><a class=SilentLink href=\"javascript:createNewExperiment()\">Create a new Experiment</a></td></tr>";
	panel += "</table><br>";
	return panel;
}

function changePassword()
{
	var panel = "";
	panel += "<form name='SetExperimentSettingsForm'><table style='background:#ffffff' width=100%><tr height=30><td style='padding:10px'><h3>Change Your Password</h3></td></tr>";
	panel += "<tr><td style='padding-left:20px;padding-bottom:10px;padding-right:20px'>";
	
	panel += "<table>";
	panel += "<tr><td class=SmallTxt>Enter your current password:</td></tr>";
	panel += "<tr><td><input autocomplete=off type=password id=current_password class=InputEditField></td></tr>";
	panel += "<tr><td class=SmallTxt>Enter your new password:</td></tr>";
	panel += "<tr><td><input autocomplete=off type=password id=new_password class=InputEditField></td></tr>";
	panel += "</table>";
	
	panel += "</td></tr>";
	panel += "<tr height=50><td align=right style='padding-right:30px'>";
	panel += "<input type=button class='blue button' style='width:80;height:30' value='Change' onclick=\"javascript:changePasswordNow()\"/> ";
	panel += "<input type=button class='gray button' style='width:80;height:30' value='Cancel' onclick='javascript:hideMsgPanel()'/>";
	panel += "</td></tr>";
	panel += "</table></form>";

	showMsgPanel(panel);
}

function changePasswordNow()
{
	var eCurr = document.getElementById("current_password");
	var eNew = document.getElementById("new_password");
	if( eCurr && eNew ){
		if( eCurr.value == "" || eNew.value == "" )
			alert('Please enter valid password');
		else{
			hideMsgPanel();
			var query = "cmd=change_password&curr="+escape(eCurr.value)+"&new="+escape(eNew.value);
			
			var req = createRequest();
			makeRequest(req, query, function(){ onChangePasswordNow(req); });
		}
	}	
}

function onChangePasswordNow(req)
{
	if( req.readyState == 4 ){
		if( req.responseText != "" ){
			var json = JSON.parse(req.responseText);
			if( 'msg' in json ){
				alert(json['msg']);
			}
		}
	}
}

function logout()
{
	var req = createRequest();
	makeRequest(req, "cmd=logout", function(){ onLogout(req); });
}

function onLogout(req)
{
	if( req.readyState == 4 ){
		document.location.href = "?"
	}
}
