var requestPerformed = false;

function Admin()
{
	this.requests = Array();
	
	this.load = function(userName, callback){
		
		var req = createRequest();
		makeRequest(req, "cmd=get_new_user_requests", function(){ user.onLoadNewRequests(req, callback); });
	}
	this.onLoadNewRequests = function(req, callback){
		if( req.readyState == 4 ){
			if( req.responseText != "" ){
				var json = JSON.parse(req.responseText);
				if( 'results' in json ){
					for(var i = 0; i < json['results'].length; i++){
						var request = new Request();
						request.set(json['results'][i]);
						this.requests.push(request);
					}}}
			
				this.requests.sort(function(a,b) { return b.getRequestDate()-a.getRequestDate(); });
			}
		
			if( callback )
				callback();
	}
	this.removeRequest = function(id){
		for(var i = 0; i < this.requests.length; i++){
			if( this.requests[i].data['id'] == id ){
				this.requests.splice(i, 1);
				return;
			}
		}
	}
	this.showUserHome = function(){

		hideCurtain();
		hideToolbarMenu();
		
		var panel = "";
		
		panel += "<br><br><br><br><center><h3>All New User Requests</h3>";
		
		if( requestPerformed ){
			panel += "<small><i style='color:green'>Request performed successfully!</i></small><br><br>";
			requestPerformed = false;
		}
		
		panel += "<table width=800>";
		panel += "<tr style='background:#dfdfdf' height=30>";
		panel += "<td class=SmallTxt style='padding-left:10px' width=100%><small><b>Selected User Name</b></small></td>";
		panel += "<td class=SmallTxt width=150 align=center nowrap><b><small>Request IP</small></b></td>";
		panel += "<td class=SmallTxt width=150 align=center nowrap><b><small>Request Date</small></b></td>";
		panel += "<td class=SmallTxt width=150 align=center nowrap><b><small>Action</small></b></td>";
		panel += "</tr>";
		
		for(var i = 0; i < this.requests.length; i++)
			panel += this.requests[i].print();
		panel += "</table>";
		panel += "</center>";
		
		shownTab = TAB_HOME;
		updatePageLink();
		updateToolbar();

		var e = document.getElementById("Results");
		if( e ) e.innerHTML = panel;
	}
	this.isAdmin = function(){
		return true;
	}
}

function Request()
{
	this.data = null;
	this.set = function(data){
		this.data = data;
	}
	this.getRequestDate = function(){
		return new Date(this.data['request_date']);
	}
	this.print = function(){
		var panel = "";

		panel += "<tr height=50 style='background:#fafafa'>";
		panel += "<td class=SmallTxt style='padding-left:10px' width=100%>"+this.data['user']+"</td>";
		panel += "<td class=SmallTxt width=150 align=center nowrap>"+this.data['request_ip']+"</td>";
		panel += "<td class=SmallTxt width=150 align=center nowrap>"+printDate(parseInt(this.data['request_date']))+"</td>";
		panel += "<td class=SmallTxt width=150 align=center nowrap>";
		panel += "<input type=button class='blue button' value='approve' onclick=\"javascript:approveRequest('"+this.data['id']+"')\"> or ";
		panel += "<input type=button class='red button' value='decline' onclick=\"javascript:declineRequest('"+this.data['id']+"')\"></td>";
		panel += "</tr>";
		
		return panel;
	}
}

function approveRequest(id)
{
	var req = createRequest();
	makeRequest(req, "cmd=approve_new_user_request&request_id="+id, function(){ onRequest(req, id); });
}

function declineRequest(id)
{
	var req = createRequest();
	makeRequest(req, "cmd=remove_new_user_request&request_id="+id, function(){ onRequest(req, id); });
}

function onRequest(req, id)
{
	if( req.readyState == 4 ){
		if( req.responseText == "OK" ){
			requestPerformed = true;
			user.removeRequest(id);
			refresh();
		}
	}
}
