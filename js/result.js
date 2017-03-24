
var featureIndexes = {};

function Result()
{
	this.fscore = 0;
	this.acc = 0;
	this.precision = 0;
	this.recall = 0;
	this.loss = 0;
	this.runid = "";
	this.params = new Array();
	this.finishDate = "";
	this.startDate = "";
	this.dev = "";
	this.test = "";
	this.baseline = false;

	this.load = function(json){
		this.fscore = json['fscore'];
		if( 'acc' in json )
			this.acc = json['acc'];
		if( 'p' in json )
			this.precision = json['p'];
		if('r' in json )
			this.recall = json['r'];
		if('l' in json )
			this.loss = json['l'];
		
		this.runid = json['runid'];
		this.startDate = parseInt(json['start_date']);
		if( 'finish_date' in json )
			this.finishDate = parseInt(json['finish_date']);
		if( 'last_report_date' in json )
			this.finishDate = parseInt(json['last_report_date']);
		this.setParams(json['params']);
		this.dev = json['dev'];
		this.test = json['test'];
		
		if( this.acc < 1 )
			this.acc *= 100;
	}
	this.loadBaseline = function(data){
		this.baseline = true;

		this.baselineName = data['name'];
		this.fscore = parseFloat(data['fscore']);
		this.acc = parseFloat(data['accuracy']);
		this.precision = parseFloat(data['precision']);
		this.recall = parseFloat(data['recall']);
		if( 'loss' in data )
			this.loss = parseFloat(data['loss']);
	}
	this.setParams = function(params){
		this.params.length = 0;
		var param = strtok(params, " ");
		while(param){
			if( param.indexOf("token=") == -1 )
				this.params.push(param);
			param = strtok(" ");
		}
	}
	this.print = function(hiddenParams){
		var panel = "";
		
		panel += "<table height=35 width=100% onmouseover='onRow(this)' onmouseout='offRow(this)'>";
		if( this.baseline ){
			panel += "<tr style='background:#FFF2F2'>";
			panel += "<td align=right>";
			panel += "<table><tr><td class=SmallTxt>";
			panel += this.baselineName;
			panel += "</td><td style='font-size:20px'>&rarrb;</td>";
			panel += "</tr></table>";
		}
		else{
			panel += "<tr style='background:#fafafa'>";
			panel += "<td class=SmallTxt style='padding-left:10px;line-height:140%'><small>";
			panel += this.printParams(hiddenParams);
		}
		panel += "</small></td>";
		//panel += "<td class=SmallTxt width=60 align=center nowrap><a class=SilentLink href=\"javascript:showResultsGraph('"+this.runid+"', 'PRF')\">"+parseFloat(this.fscore).toFixed(2)+"</a></td>";
		if( focusedExperiment.isResultsShown("accuracy") ){
			var acc = parseFloat(this.acc);
			panel += "<td class=SmallTxt width=60 align=center nowrap><a class=SilentLink href=\"javascript:showResultsGraph('"+this.runid+"', 'Accuracy')\">"+roundFloat(acc)+"</a></td>";
		}
		if( focusedExperiment.isResultsShown("fscore") ){
			panel += "<td class=SmallTxt width=60 align=center nowrap><a class=SilentLink href=\"javascript:showResultsGraph('"+this.runid+"', 'PRF')\">"+roundFloat(this.fscore)+"</a></td>";
		}
		if( focusedExperiment.isResultsShown("precision") ){
			panel += "<td class=SmallTxt width=60 align=center nowrap><a class=SilentLink href=\"javascript:showResultsGraph('"+this.runid+"', 'PRF')\">"+roundFloat(this.precision)+"</a></td>";
		}
		if( focusedExperiment.isResultsShown("recall") ){
			panel += "<td class=SmallTxt width=60 align=center nowrap><a class=SilentLink href=\"javascript:showResultsGraph('"+this.runid+"', 'PRF')\">"+roundFloat(this.recall)+"</a></td>";
		}
		if( focusedExperiment.isResultsShown("loss") ){
			panel += "<td class=SmallTxt width=60 align=center nowrap><a class=SilentLink href=\"javascript:showResultsGraph('"+this.runid+"', 'Loss')\">"+roundFloat(this.loss, 4)+"</a></td>";
		}
		
		if( this.baseline == false ){
			panel += "<td class=SmallTxt width=100 align=center nowrap><small>";
			if( this.finishDate != "" )
				panel += printDate(this.finishDate);
			else
				panel += printDate(this.startDate);
			panel += "</small></td>";
		}
		else{
			panel += "<td  width=100 align=left style='font-size:20px' nowrap>";
			panel += "&larrb;";
			panel += "</td>";
		}

		if( focusedExperiment.sharer == "" ){
			panel += "<td class=SmallTxt width=80 align=center nowrap><small>";
			if( this.baseline ){
				panel += "<a class=SilentLink href=\"javascript:deleteBaseline('"+this.baselineName+"')\">del</a>";
			}
			else{
				panel += "<a class=SilentLink href=\"javascript:fixRunParameters('"+this.runid+"')\">fix</a> . ";
				panel += "<a class=SilentLink href=\"javascript:getRunPanel('"+this.runid+"')\">run</a> . ";
				panel += "<a class=SilentLink href=\"javascript:deleteRun('"+this.runid+"')\">del</a>";
			}
			panel += "</small></td>";
		}
		
		panel += "</tr></table>";
		return panel;
	}
	this.printParams = function(hiddenParams){
		var p = "";
		var numOfHiddenFeatures = 0;
		for(var i = 0; i < this.params.length; i++){
			if( focusedExperiment.isFeatureHidden(this.params[i]) ){
				numOfHiddenFeatures += 1;
			}
			else if( !(this.params[i] in hiddenParams) && isParamFixed(this.params[i]) == false ){
				var fi = 0;
				if( this.params[i] in featureIndexes )
					fi = featureIndexes[this.params[i]];
				p += "<span id='feature_"+this.params[i]+"_"+fi+"' onmouseover=\"highlightFeature('"+this.params[i]+"')\" onmouseout=\"unhighlightFeature('"+this.params[i]+"')\">";
				p += "<a class=SilentLink href=\"javascript:fixThisFeature('"+escape(this.params[i])+"')\">"+this.params[i]+"</a></span> ";
				featureIndexes[this.params[i]] = fi+1;
			}
		}
		
		if( numOfHiddenFeatures > 0 )
			p += " <small><span class=HighlightedText style='background:#FFEAEA;color:#999999'>+"+numOfHiddenFeatures+"</span></small>";
		
		return p;
	}
	this.hasParam = function(param){
		for(var i = 0; i < this.params.length; i++){
			var p = "+"+param;
			if( this.params[i] == param || this.params[i] == p )
				return true;
		}
		return false;
	}
	this.getParam = function(param){
		for(var i = 0; i < this.params.length; i++){
			var p = "+"+param;
			if( this.params[i] == param || this.params[i] == p )
				return this.params[i];
			else if( this.params[i].search(param+"=") != -1 )
				return this.params[i].replace(param+"=", "");
		}
		return "";
	}
}

function highlightFeature(f)
{
	if( f in featureIndexes ){
		for(var i = 0; i < featureIndexes[f]; i++){
			var id = "feature_"+f+"_"+i;
			var e = document.getElementById(id);
			if( e ) e.style.background = "#FFF296";
		}
	}
}

function unhighlightFeature(f)
{
	if( f in featureIndexes ){
		for(var i = 0; i < featureIndexes[f]; i++){
			var id = "feature_"+f+"_"+i;
			var e = document.getElementById(id);
			if( e ) e.style.background = "";
		}
	}
}

function deleteRun(runid)
{
	var req = createRequest();
	makeRequest(req, "cmd=delete_run&experiment_id="+focusedExperiment.id+"&id="+runid, function(){ onDeleteRun(req, runid) });
}

function onDeleteRun(req, runid)
{
	if( req.readyState == 4 ){
		if( req.responseText == "ok" ){
			for(var i = 0; i < shownResults.length; i++){
				var shownResult = shownResults[i];
				shownResult.deleteRun(runid);
			}
			updateResultsListing();
		}

		refresh();
	}
}

function onRow(elm)
{
	elm.style.background = "#dfdfdf";
}

function offRow(elm)
{
	elm.style.background = "";
}

var shownGraph = null;

function showResultsGraph(runID, type)
{
	shownGraph = new RunGraph();
	shownGraph.load(runID, type);
}

function RunGraph()
{
	this.runID = "";
	this.resultType = "";
	this.width = 0;
	this.height = 0;
	this.results = null;
	
	this.load = function(runID, resultType){
		resultType = typeof resultType !== 'undefined' ? resultType : "acc";
		
		this.runID = runID;
		this.resultType = resultType;
		
		var pointer = this;
		var req = createRequest();
		makeRequest(req, "experiment_id="+focusedExperiment.id+"&cmd=get_run_results&run_id="+this.runID, function(){ pointer.onShowResultsGraph(req) });
		
		shownGraph = this;
	}
	this.onShowResultsGraph = function(req){

		if( req.readyState == 4 ){
			var json = JSON.parse(req.responseText);

			this.results = json['results'];
			this.results.sort(function(a,b) { return (parseFloat(a['i'])-parseFloat(b['i'])); });
			
			if( this.hasPRF() == false && this.resultType == "PRF" )
				this.results = "acc";

	        var max = 0;
	        var maxAt = "";
	        var maxTest = -1;
	        for(var i = 0; i < this.results.length; i++){
	        	var result = this.results[i];
	        	if( result['t'] == 0 ){
		            if( this.resultType == "PRF" ){
		            	if( result['f'] > max ){
		            		max = result['f'];
		            		maxAt = result['i'];
		            	}
		            }
		            else if( this.resultType == "Loss" ){
		            	if( result['l'] > max ){
		            		max = result['l'];
		            		maxAt = result['i'];
		            	}
		            }
		            else{
		            	if( result['a']*100 > max ){
		            		max = result['a']*100;
		            		maxAt = result['i'];
		            	}
		            }
	        	}
	        }

	        for(var i = 0; i < this.results.length; i++){
	        	var result = this.results[i];
	        	if( result['t'] == 1 ){
	        		if( result['i'] == maxAt ){
			            if( this.resultType == "PRF" )
			            	maxTest = result['f'];
			            else if( this.resultType == "Loss" )
			            	maxTest = result['l'];
			            else
			            	maxTest = result['a']*100;
			            break;
	        		}
	        	}
	        }

            if( maxAt && maxAt.indexOf('.') == -1 )
            	maxAt = parseInt(maxAt)+1

			this.width = document.body.clientWidth-200;
			this.height = document.body.clientHeight-200;
			
			var panel = "";
			panel += "<table cellpadding=0 cellspacing=0 width=100%>";
			panel += "<tr><td valign=top width=250>";
			panel += "<table cellpadding=0 cellspacing=0 width=100%>";
			panel += "<tr height=50><td class=SmallTxt style='padding-left:10px'>Run<br><small style='color:#ababab'>#"+this.runID+"</small></td></tr>";
			if( this.hasAccuracy() )
				panel += this.printTab("Accuracy", "Accuracy");
			if( this.hasPRF() )
				panel += this.printTab("FScore/Precision/Recall", "PRF");
			if( this.hasLoss() )
				panel += this.printTab("Loss", "Loss");
			panel += "<tr height=30><td style='border-bottom:1px solid #dfdfdf'></td></tr>";
			panel += "<tr height=20><td></td></tr>";
			panel += "<tr height=26><td class=SmallTxt style='padding-left:10px'> Maximum "+this.resultType+" on Dev = "+roundFloat(max)+"</td></tr>";
			panel += "<tr height=26><td class=SmallTxt style='padding-left:10px'> achieved at Epoch "+maxAt+"</td></tr>";
			if( maxTest != -1 )
				panel += "<tr height=26><td class=SmallTxt style='padding-left:10px'> "+this.resultType+" on Test = "+roundFloat(maxTest)+"</td></tr>";
			else
				panel += "<tr height=26><td class=SmallTxt style='padding-left:10px'> no test score available</td></tr>";
			panel += "</table>";
			panel += "</td><td align=center id='ResultsPanel'></td></tr>";
			panel += "<tr height=50><td></td><td align=right style='padding-right:5px'><input type=button class='gray button' style='width:80;height:30' value='Close' onclick='javascript:hideShownGraph()'/></td></tr>";
			panel += "</table>";

			showMsgPanel(panel, this.width, this.height);
			
			this.drawGraph(json);
		}
	}
	this.printTab = function(title, type){
		var panel = "";
		panel += "<tr height=40>";
		panel += "<td";
		if( this.resultType == type )
			panel += " class=SelectedResultGraphTab";
		else
			panel += " class=ResultGraphTab";
		panel += " onclick=\"javascript:showResultsGraph('"+this.runID+"', '"+type+"')\" onmouseover='onFocus(this)' onmouseout='offFocus(this)'>";
		if( this.resultType == type )
			panel += "&#10148; ";
		panel += title+"</td></tr>";
		return panel;
	}
	this.drawGraph= function(json){
		var e = document.getElementById("ResultsPanel");
		
		var title = "";
        var mstats = new Array();
        if( this.resultType == "PRF" )
        	mstats.push(["Time", "Prec", "Rec", "FScore"]);
        else if( this.resultType == "Loss" )
        	mstats.push(["Time", "Loss"]);
        else
        	mstats.push(["Time", "Accuracy"]);

        var arr = new Array();
        arr.push(0);
        if( this.resultType == "PRF" ){
            arr.push(0);
            arr.push(0);
            arr.push(0);
        }
        else
            arr.push(0);

        mstats.push(arr);
        
        var j = 1;
        for(var i = 0; i < this.results.length; i++){
        	var result = this.results[i];
        	if( result['t'] == 0 ){
	            var arr = new Array();
	            if( result['i'].indexOf('.') == -1 )
	            	arr.push(parseInt(result['i'])+1);
	            else
	            	arr.push(result['i']);
	            
	            if( this.resultType == "PRF" ){
	                arr.push(roundFloat(result['p']));
	                arr.push(roundFloat(result['r']));
	                arr.push(roundFloat(result['f']));
	            }
	            else if( this.resultType == "Loss" )
	            	arr.push(result['l']);
	            else
	                arr.push(roundFloat(result['a']*100));
	
	            mstats.push(arr);
	            j++;
        	}
        }

        var memory_stats = google.visualization.arrayToDataTable(mstats);
        var memory_stats_options = {'backgroundColor': '#f8f8f8', 'height': this.height-80, 'width': this.width-250};
        var chart2 = new google.visualization.LineChart(e);
        chart2.draw(memory_stats, memory_stats_options);
	}
	this.hasPRF = function(){
		for(var i = 0; i < this.results.length; i++){
			if( this.results[i]['t'] == 0 && (this.results[i]['p'] > 0 || this.results[i]['r'] > 0 || this.results[i]['f'] > 0) )
				return true;
		}
		return false;
	}
	this.hasLoss = function(){
		for(var i = 0; i < this.results.length; i++){
			if( this.results[i]['t'] == 0 && this.results[i]['l'] > 0 )
				return true;
		}
		return false;
	}
	this.hasAccuracy = function(){
		for(var i = 0; i < this.results.length; i++){
			if( this.results[i]['t'] == 0 && this.results[i]['a'] > 0 )
				return true;
		}
		return false;
	}
}

function hideShownGraph()
{
	shownGraph = null;
	hideMsgPanel();
}

function onFocus(elm)
{
	if( elm.className == "ResultGraphTab" )
		elm.className = "FocusedResultGraphTab";
}

function offFocus(elm)
{
	if( elm.className == "FocusedResultGraphTab" )
		elm.className = "ResultGraphTab";
}
