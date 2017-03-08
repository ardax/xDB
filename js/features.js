
function selectFeaturesToHide()
{
	var panel = "";
	panel += "<form name='SelectFeaturesToHideTable'><table style='background:#ffffff'><tr height=30><td style='padding:10px'><h3>Select Parameters to Hide</h3></td></tr>";
	panel += "<tr><td style='padding-left:30px;padding-bottom:10px;padding-right:10px'>";
	panel += "<div class=ScrollablePanel style='height:500;width:540'>";
	panel += "<table width=100%>";
	for(var i = 0; i < focusedExperiment.features.length; i++){
		var feature = focusedExperiment.features[i];
		for(var value in focusedExperiment.featureValues[feature]){
			var featureValue = feature+"="+value;
			panel += "<tr><td width=20 nowrap><input type=checkbox value='"+featureValue+"'";
			
			if( focusedExperiment.isFeatureHidden(featureValue) )
				panel += " checked";
			panel += "/></td><td class=SmallTxt width=200 nowrap>"+featureValue+"</td></tr>";
		}
	}
	panel += "</table></div></td></tr>";
	panel += "<tr height=50><td align=right style='padding-right:30px'>";
	panel += "<input type=button class='blue button' style='width:80;height:30' value='Hide' onclick=\"javascript:selectFeaturesToHideNow()\"/> ";
	panel += "<input type=button class='gray button' style='width:80;height:30' value='Cancel' onclick='javascript:hideMsgPanel()'/>";
	panel += "</td></tr>";
	panel += "</table></form>";

	showMsgPanel(panel, 550, 280);
}

function selectFeaturesToHideNow()
{
    var featureList = "";
    var trainingFile = "", vocabFile = "", bigramFile = "";
    var frm = document.forms["SelectFeaturesToHideTable"];
    var params = "experiment_id="+focusedExperiment.id+"&cmd=set_hidden_features";
    
    var newHiddenFeaures = Array();
    for(var i = 0; i < frm.elements.length; i++ ){
        if( frm.elements[i].type == 'checkbox' && frm.elements[i].checked == true ){
        	featureList += ";"+frm.elements[i].value;
        	newHiddenFeaures.push(frm.elements[i].value);
        }
    }

    params += "&features="+encodeURIComponent(featureList);
    
    var req = createRequest();
    makeRequest(req, params, function(){ onSelectFeaturesToHideNow(req, newHiddenFeaures);  });

    hideMsgPanel();
}

function onSelectFeaturesToHideNow(req, newHiddenFeaures)
{
	if( req.readyState == 4 ){
		focusedExperiment.hiddenFeatures = newHiddenFeaures;
		refresh();
	}
}

function manageFeatures()
{
	var width = 490;
	var panel = "";
	panel += "<table width=490 style='background:#ffffff'>";
	panel += "<tr><td style='padding:10px' class=SmallTxt><h2>Manage Parameters</h2></td></tr>";
	panel += "<tr><td align=center>";
	panel += "<textarea id=managed_feature_list spellcheck=false class=SmallTxt style='border:1px solid #ababab;width:450px;height:500px;line-height:130%'>";
	for(var i = 0; i < focusedExperiment.features.length; i++){
		var feature = focusedExperiment.features[i];
		for(var value in focusedExperiment.featureValues[focusedExperiment.features[i]]){
			var featureValue = feature+"="+value;
			panel += featureValue+"\n";
		}
	}
	panel += "</textarea>";
	panel += "</td></tr>";
	panel += "<tr height=40><td align=right style='padding-right:20px'>";
	panel += "<input type=button class='blue button' style='width:80;height:30' value='Save' onclick='javascript:manageFeaturesNow()'> ";
	panel += "<input type=button class='gray button' style='width:80;height:30' value='Cancel' onclick='javascript:hideMsgPanel()'>";
	panel += "</td></tr>";
	panel += "</table>";

	showMsgPanel(panel, width, 550);
}

function manageFeaturesNow()
{
	var e = document.getElementById("managed_feature_list");
	if( e ){
		var featureArr = Array();
		var feature = strtok(e.value, "\n");
		while(feature){
			featureArr.push(feature);
			feature = strtok("\n");
		}
		
		for(var i = 0; i < featureArr.length; i++){
			var feature = featureArr[i];
			var key = strtok(feature, "=");
			var value = strtok("=");
			if( !(key in focusedExperiment.featureValues) || !(value in focusedExperiment.featureValues[key]) ){
				// new feature
				feature = feature.replace(/=/g, "::");
				var req = createRequest();
				makeRequest(req, "cmd=add_feature&experiment_id="+focusedExperiment.id+"&feature="+feature, "", function(){ });
				
				if( !(key in focusedExperiment.featureValues) )
					focusedExperiment.featureValues[key] = {};
				focusedExperiment.featureValues[key][value] = true;
			}
		}

		// check for deleted features
		for(var i = 0; i < focusedExperiment.features.length; i++){
			var feature = focusedExperiment.features[i];
			for(var value in focusedExperiment.featureValues[feature]){
				var featureValue = feature+"="+value;

				var exists = false;
				for(var j = 0; j < featureArr.length; j++){
					if( featureArr[j] == featureValue )
						exists = true;
				}
				if( exists == false ){
					featureValue = featureValue.replace(/=/g, "::");
					var req = createRequest();
					makeRequest(req, "cmd=remove_feature&experiment_id="+focusedExperiment.id+"&feature="+featureValue, function(){ });

					delete focusedExperiment.featureValues[feature][value];
				}
			}
		}
	}
	
	hideMsgPanel();
}
