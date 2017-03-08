
function Results(groupByValue)
{
	this.groupByValue = groupByValue;
	this.pageIndex = 0;
	this.startAt = 0;
	this.pageSize = 50;
	this.rawResults = new Array();
	this.results = new Array();
	this.numOfResults = 0;
	this.topResult = 0;
	
	this.set = function(rawResults){
		for(var i = 0; i < rawResults.length; i++)
			this.rawResults.push(rawResults[i]);
	}
	this.load = function(){
		for(var i = 0; i < this.rawResults.length; i++){
			var result = new Result();
			result.load(this.rawResults[i]);
			this.results.push(result);
		}
		
		var file = focusedExperiment.getSelectedFile();
		if( file && 'baselines' in file ){
			for(var i = 0; i < file['baselines'].length; i++){
				var baseline = file['baselines'][i];
				var result = new Result();
				result.loadBaseline(baseline);
				this.results.push(result);
			}
		}
	}
	this.sort = function(){
		if( focusedExperiment.isResultsShown("accuracy") ){
			this.results.sort(function(a,b) {
				if( a.acc == b.acc )
					return (b.fscore-a.fscore);
				return (b.acc-a.acc); });
		}
		else{
			this.results.sort(function(a,b) {
				if( a.fscore == b.fscore )
					return (b.acc-a.acc);
				return (b.fscore-a.fscore); });
		}
		
		if( this.results.length > 0 )
			this.topResult = this.results[0].acc;
	}
	this.deleteRun = function(runid){
		for(var i = 0; i < this.results.length; i++){
			if( this.results[i].runid == runid ){
				this.results.splice(i, 1);
				break;
			}
		}
	}
	this.getResultWID = function(runid){
		for(var i = 0; i < this.results.length; i++){
			if( this.results[i].runid == runid )
				return this.results[i];
		}
		return null;
	}
	this.getNumOfBaselines = function(){
		var count = 0;
		for(var i = 0; i < this.results.length; i++){
			if( this.results[i].baseline )
				count++;
		}
		return count;
	}
	this.print = function(printTitle){
		var panel = "";

		panel += "<br><br><div style='padding:5px'>";
		
		var numOfListedResults = this.results.length-this.getNumOfBaselines();
		if( numOfListedResults > 0 ){
			var end = this.startAt+numOfListedResults;
			if( printTitle ){
				panel += "<h4 style='padding:0px;margin-bottom:4px'>";
				panel += "Listing "
				if( this.startAt == 0 && numOfListedResults < this.pageSize ){
					if( fixedFeatures.length ==  0 ){
						if( focusedExperiment.showingLatest )
							panel += numOfListedResults+" most recent results";
						else
							panel += numOfListedResults+" best results";
					}
					else
						panel += numOfListedResults+" results";
				}
				else{
					if( fixedFeatures.length ==  0 ){
						if( focusedExperiment.showingLatest )
							panel += (this.startAt+1)+"-"+end+" most recent results out of "+this.numOfResults;
						else
							panel += (this.startAt+1)+"-"+end+" best results out of "+this.numOfResults;
					}
					else
						panel += (this.startAt+1)+"-"+end+" results out of "+this.numOfResults;
				}
				panel += "</h4>";
			}
		}
		else
			panel += "<h4>Listing no result</h4>";
		
		var allParams = {}, sharedParams = {};
		var k = 0;
		for(var i = this.pageIndex*this.pageSize; i < this.results.length && i < (this.pageIndex+1)*this.pageSize; i++){
			if( this.results[i].baseline == false ){
				k++;
				for(var j = 0; j < this.results[i].params.length; j++){
					if( this.results[i].params[j] in allParams )
						allParams[this.results[i].params[j]] += 1;
					else
						allParams[this.results[i].params[j]] = 1;
				}
			}
		}
		
		if( k > 1 ){
			for(var param in allParams){
				if( allParams[param] == k )
					sharedParams[param] = true;
			}
		}

		if( Object.keys(sharedParams).length > 0 || this.groupByValue != "" || fixedFeatures.length > 0 ){
			panel += "<table width=98%>";
			if( this.groupByValue != "" )
				panel += "<tr height=25><td class=SmallTxt><span style='background:#ffffff;padding:3px;margin:1px'><b>"+groupFeature+"=<a class=SilentLink href=\"javascript:fixThisFeature('"+groupFeature+"="+escape(this.groupByValue)+"')\"><span style='color:red'>"+this.groupByValue+"</span></a></b></span></td></tr>";
			
			if( Object.keys(sharedParams).length > 0 ){
				var i = 0;
				for(var param in sharedParams){
					if( (groupFeature != "" && param.search(groupFeature) == 0) || isParamFixed(param) ){
						// pass
					}
					else{
						if( i == 0 ){
							panel += "<tr height=25><td class=SmallTxt style='line-height:160%'><small>";
							panel += "All listed runs below share these parameters:";
						}
						panel += "<span class=SharedFeature>";
						panel += "<a class=SilentLink href=\"javascript:fixThisFeature('"+escape(param)+"')\">"+param+"</a>";
						panel += "</span> ";
						i += 1;
					}
				}
				if( i > 0 )
					panel += "</small></td></tr>";
			}

			if( fixedFeatures.length > 0 ){
				panel += "<tr height=25><td class=VerySmallTxt style='line-height:160%' nowrap>Fixed Parameters [ ";
				panel += "<a class=SilentLink href='javascript:removeAllFixedFeatures()'>Unfix All</a> ]:";
				for(var i = 0; i < fixedFeatures.length; i++){
					var fixedFeature = fixedFeatures[i];
					panel += "<span class=FixedFeature>";
					if( fixedFeature['value'] != "" )
						panel += "<a class=SilentLink href=\"javascript:fixAnotherFeatureValue('"+fixedFeature['feature']+"', '"+fixedFeature['value']+"')\">"+fixedFeature['feature']+"="+fixedFeature['value']+"</a>";
					else
						panel += fixedFeature['feature'];
					panel += " (<a class=SilentLink href=\"javascript:removeFixedFeature('"+fixedFeature['feature']+"', '"+fixedFeature['value']+"')\">x</a>)</span>";
					panel += "</span> ";
				}
				panel += "</td></tr>";
			}
			
			panel += "</table>";
		}

		if( numOfListedResults == 0 ){
			if( fixedFeatures.length ==  0 )
				panel += "<br><br><center><i class=SmallTxt>There is no result to list</i></center><br>";
			else
				panel += "<br><br><center><i class=SmallTxt>There is no result to list based on given fixed parameter values</i></center><br>";
		}
		else{
			panel += "<table width=100%><tr style='background:#dfdfdf' height=35>";
			panel += "<td class=SmallTxt style='padding-left:10px' width=100%><small><b>Parameters</b></small></td>";
			if( focusedExperiment.isResultsShown("accuracy") )
				panel += "<td class=SmallTxt width=60 align=center nowrap><b><small>Acc.</small></b></td>";
			if( focusedExperiment.isResultsShown("fscore") )
				panel += "<td class=SmallTxt width=60 align=center nowrap><b><small>FScore</small></b></td>";
			if( focusedExperiment.isResultsShown("precision") )
				panel += "<td class=SmallTxt width=60 align=center nowrap><b><small>Prec.</small></b></td>";
			if( focusedExperiment.isResultsShown("recall") )
				panel += "<td class=SmallTxt width=60 align=center nowrap><b><small>Recall</small></b></td>";
			panel += "<td class=SmallTxt width=100 align=center nowrap><b><small>RunDate</small></b></td>";
			if( focusedExperiment.sharer == "" )
				panel += "<td class=SmallTxt width=80 align=center nowrap><b><small>Cmd</small></b></td>";
			panel += "</tr></table>";
			
			for(var i = this.pageIndex*this.pageSize; i < this.results.length && i < (this.pageIndex+1)*this.pageSize; i++){
				var result = this.results[i];
				panel += result.print(sharedParams);
			}
	
			panel += "<br><br>";
			if( this.numOfResults > this.startAt+this.pageSize || this.startAt > 0 )
				panel += this.printNavBar();

			if( focusedExperiment.sharer == "" && focusedExperiment.isFileShared(focusedExperiment.selectedFile) ){
				if( this.numOfResults > this.startAt+this.pageSize || this.startAt > 0 )
					panel += "<br><br>";
				panel += "<table><tr height=28>";
				panel += "<td class=VerySmallTxt><i>Results of this experiment file is shared with following users:</i></td>";
				for(var i = 0; i < focusedExperiment.shared.length; i++){
					if( focusedExperiment.shared[i]['shared_file'] == focusedExperiment.selectedFile ){
						panel += "<td style='padding-left:20px' class=VerySmallTxt><b>"+focusedExperiment.shared[i]['user']+"</b></td>";
						panel += "<td class=VerySmallTxt>[ <a class=SilentLink href=\"javascript:unshareExperimentFile('"+focusedExperiment.shared[i]['user']+"')\">Unshare</a> ]</td>";
					}
				}
				panel += "</tr></table><br><br>";
			}
		}
		
		panel += "</div>";

		return panel;
	}
	this.printNavBar = function(){
		
		var pageCount = parseInt(this.numOfResults/this.pageSize);
		if( this.numOfResults%this.pageSize != 0 )
			pageCount += 1;
		var pageIndex = parseInt(this.startAt/this.pageSize);
		
		var panel = "<center><table><tr height=30>";
		for(var i = 0; i < pageIndex; i++){
			panel += "<td width=30 class=NavButton onmouseover='onArea(this)' onmouseout='offArea(this)' onclick=\"javascript:showResultsPage('"+(i*this.pageSize)+"')\" nowrap>"+(i+1)+"</td>";
		}
		panel += "<td width=30 class=SelectedNavButton nowrap>"+(i+1)+"</td>";
		for(var i = pageIndex+1; i < pageCount; i++){
			panel += "<td width=30 class=NavButton onmouseover='onArea(this)' onmouseout='offArea(this)' onclick=\"javascript:showResultsPage('"+(i*this.pageSize)+"')\" nowrap>"+(i+1)+"</td>";
		}
		panel += "</tr></table></center><br><br>";
		
		return panel;
	}
}
