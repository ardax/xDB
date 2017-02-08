var methods = ["maxent", "crf"];
var fileSets = ["TwBOUN", "Hashtags", "TwSTAN"];
var trainingFiles = ["10K.Opiniyon.Tweets", "20K.Opiniyon.Tweets", "50K.Opiniyon.Tweets", "100K.Opiniyon.Tweets", "49K.SNAP.Segmented.Hashtags.v4", "98K.SNAP.Segmented.Hashtags.v4", "246K.SNAP.Segmented.Hashtags.v4", "489K.SNAP.Segmented.Hashtags.v4", "10K.Stanford.Tweets", "20K.Stanford.Tweets", "50K.Stanford.Tweets", "100K.Stanford.Tweets"];
var matrixResults = {"O.dev": {}, "T.dev": {}};
var matrixLoaded = false;

function showResultsMatrix()
{
	if( matrixLoaded == false ){
		var t = 0;
		for(var i = 0; i < trainingFiles.length; i++){
			matrixResults["O.dev"][trainingFiles[i]] = {};
			matrixResults["T.dev"][trainingFiles[i]] = {};
			
			for(var j = 0; j < methods.length; j++){
				matrixResults["O.dev"][trainingFiles[i]][methods[j]] = {};
				matrixResults["T.dev"][trainingFiles[i]][methods[j]] = {};
				 
				requestResult("O.dev", trainingFiles[i], methods[j], t);
				requestResult("T.dev", trainingFiles[i], methods[j], t);
				
				t += 0;
			}
		}
		matrixLoaded = true;
	}
	
	var e = document.getElementById("Results");
	if( e ) e.innerHTML = printMatrixTable();
}

function updateMatrix()
{
	var e = document.getElementById("Results");
	if( e ) e.innerHTML = printMatrixTable(); 
}

function printMatrixTable()
{
	var panel = "";
	panel += "<center>";
	panel += "<span class=SmallTxt>[ <a class=SilentLink href='javascript:reloadMatrix()'>reload</a> ]</span>";
	panel += "<h3>O Test Set</h3>";
	panel += printTestTable("O", "O.dev");

	panel += "<h3>T Test Set</h3>";
	panel += printTestTable("T", "T.dev");
	panel += "</center>";
	return panel;
}

function reloadMatrix()
{
	matrixLoaded = false;
	showResultsMatrix();
}

function printTestTable(tableID, devSet)
{
	var panel = "";
	var numofTrainingFiles = parseInt(trainingFiles.length/fileSets.length);
	
	//panel += "[ <a class=SilentLink href='result_tables.php?latex_table="+tableID+"'>get in latex format</a> ]<br><br>";
	panel += "<table cellpadding=0 cellspacing=0>";

	panel += "<tr><td align=center style='background:#dfdfdf;border-right:1px solid #cacaca' class=SmallTxt><b>Test Set</b></td><td>";
	panel += "<table cellpadding=0 cellspacing=0><tr>";
	panel += "<td class=SmallTxt style='background:#dfdfdf;border-right:1px solid #cacaca' align=center width=100 nowrap><b>Methods</b></td><td>";
	panel += "<table cellpadding=0 cellspacing=0><tr><td>";

	panel += "<table cellpadding=0 cellspacing=0><tr height=25>";
	for(var k = 0; k < numofTrainingFiles; k++){
		var size = getSize(trainingFiles[k]);
		panel += "<td width=70 style='background:#dfdfdf;border-right:1px solid #cacaca' class=SmallTxt align=center nowrap><b>"+size+"</b></td>";
	}
	panel += "<td width=5></td>";
	for(var k = 0; k < numofTrainingFiles; k++){
		var size = getSize(trainingFiles[k]);
		panel += "<td width=70 style='background:#dfdfdf;border-right:1px solid #cacaca' class=SmallTxt align=center nowrap><b>"+size+"</b></td>";
	}
	panel += "</tr></table>";

	panel += "</td></tr>";
	panel += "<tr><td>";

	panel += "<table cellpadding=0 cellspacing=0><tr height=25>";
	panel += "<td width="+(71*numofTrainingFiles)+" style='background:#eaeaea;border-bottom:1px solid #cacaca' class=SmallTxt align=center nowrap><b>F-Scores</b></td>";
	panel += "<td width=5></td>";
	panel += "<td width="+(71*numofTrainingFiles)+" style='background:#eaeaea;border-bottom:1px solid #cacaca' class=SmallTxt align=center nowrap><b>Accuracy</b></td>";
	panel += "</tr></table>";

	panel += "</td></tr></table>";
	panel += "</td></tr></table>";
	panel += "</td></tr>";
	
	var maxFScore = 0, maxAcc = 0;
	for( var t in matrixResults[devSet]){
		for( var m in matrixResults[devSet][t] ){
			if( 'fscore' in matrixResults[devSet][t][m] && matrixResults[devSet][t][m]['fscore'] > maxFScore )
				maxFScore = matrixResults[devSet][t][m]['fscore'];
			if( 'acc' in matrixResults[devSet][t][m] && matrixResults[devSet][t][m]['acc'] > maxAcc )
				maxAcc = matrixResults[devSet][t][m]['acc'];
		}
	}

	for(var i = 0; i < fileSets.length; i++){
		panel += "<tr height=5><td></td><td></td></tr>";
		panel += "<tr height=26><td width=100 style='background:#eaeaea' align=center class=TitleTxt>";
		panel += fileSets[i];
		panel += "</td><td>";

		for(var j = 0; j < methods.length; j++){
			panel += "<table cellpadding=0 cellspacing=0>";

			panel += "<tr height=36><td style='background:#eaeaea;border-right:1px solid #cacaca' width=100 class=SmallTxt nowrap>&nbsp;&nbsp;<b>";
			panel += methods[j].toUpperCase();
			panel += "</b></td>";
			for(var k = 0; k < numofTrainingFiles; k++){
				var l = k+i*numofTrainingFiles;
				var fscore = "-";
				if( "fscore" in matrixResults[devSet][trainingFiles[l]][methods[j]] )
					fscore = matrixResults[devSet][trainingFiles[l]][methods[j]]['fscore'];
					
				panel += "<td width=70 align=center style='background:#eaeaea;border-right:1px solid #cacaca' class=SmallTxt nowrap>";
				if( fscore > 0 ){
					panel += "<a class=SilentLink href=\"javascript:showCellResults('"+devSet+"', '"+methods[j]+"', '"+trainingFiles[l]+"')\">";
					if( fscore == maxFScore ) panel += "<b><u>";
					panel += fscore.toFixed(1);
					if( fscore == maxFScore ) panel += "</u></b>";
					panel += "</a>";
				}
				else
					panel += "-";
				panel += "</td>";
			}

			panel += "<td width=5 nowrap></td>";
			for(var k = 0; k < numofTrainingFiles; k++){
				var l = k+i*numofTrainingFiles;
				var acc = "-";
				if( "acc" in matrixResults[devSet][trainingFiles[l]][methods[j]] )
					acc = matrixResults[devSet][trainingFiles[l]][methods[j]]['acc'];
					
				panel += "<td width=70 align=center style='background:#eaeaea;border-right:1px solid #cacaca' class=SmallTxt nowrap>";
				if( acc > 0 ){
					panel += "<a class=SilentLink href=\"javascript:showCellResults('"+devSet+"', '"+methods[j]+"', '"+trainingFiles[l]+"')\">";
					if( acc == maxAcc ) panel += "<b><u>";
					panel += acc.toFixed(1);
					if( acc == maxAcc ) panel += "</u></b>";
					panel += "</a>";
				}
				else
					panel += "-";
				panel += "</td>";
			}
			panel += "</td></tr></table>";
		}
		panel += "</td></tr>";
	}
	panel += "</table>";
	
	return panel;
}

function showCellResults(devSet, method, trainingFile)
{
	fixedFeatures.length = 0;
	fixedFeatures.push({'feature': 'method', 'value': method});
	fixedFeatures.push({'feature': 'training_file', 'value': trainingFile});
	
	selectedTestFile = devSet;

	updateSideBar();
	updateResults();
}

function requestResult(testFile, trainingFile, method, timeToWait)
{
	setTimeout(function(){
		var fixedFeaturesList = "training_file="+trainingFile+"|method="+method;
		var req = createRequest();
		makeRequest(req, errAddress+"/gettoptestresult/"+testFile+"/"+fixedFeaturesList, "", function(){ onResultRequest(req, testFile, trainingFile, method); });
	}, timeToWait);
}

function onResultRequest(req, testFile, trainingFile, method)
{
	if( req.readyState == 4 ){
		var i = 0;
		var field = strtok(req.responseText, "\t");
		while(field){
			if( i == 0 ) matrixResults[testFile][trainingFile][method]['fscore'] = parseFloat(field);
			else if( i == 1 ) matrixResults[testFile][trainingFile][method]['acc'] = parseFloat(field);
			else if( i == 2 ) matrixResults[testFile][trainingFile][method]['runid'] = field;
			else if( i == 3 ) matrixResults[testFile][trainingFile][method]['params'] = field;
			else if( i == 4 ) matrixResults[testFile][trainingFile][method]['date'] = field;
			i++;
			field = strtok("\t");
		}

		updateMatrix();
	}
}

function getSize(file)
{
	if( file == "49K.SNAP.Segmented.Hashtags.v4" )
		return "10K";
	else if( file == "98K.SNAP.Segmented.Hashtags.v4" )
		return "20K";
	else if( file == "246K.SNAP.Segmented.Hashtags.v4" )
		return "50K";
	else if( file == "489K.SNAP.Segmented.Hashtags.v4" )
		return "100K";
	file = file.replace(".Opiniyon.Tweets", "");
	file = file.replace(".Stanford.Tweets", "");
	return file;
}