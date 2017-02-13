
var xdbEngineAddress = "php/xdbEngine.php";

function createRequest()
{
	var req;

	// Mozilla, Safari,...
	if( window.XMLHttpRequest ){
		req = new XMLHttpRequest();
		if (req.overrideMimeType)
			req.overrideMimeType('text/xml');
	}
	// IE
	else if( window.ActiveXObject ){
		try {
			req = new ActiveXObject("Msxml2.XMLHTTP");
		}
		catch (e){
			try{
				req = new ActiveXObject("Microsoft.XMLHTTP");
			}
			catch (e) {}
		}
	}

	if( !req ){
		alert('Cannot create XMLHTTP instance');
		return false;
	}

	return req;
}

function makeRequest(req, parameters, callback)
{
	req.onreadystatechange = callback;
	req.open('GET', xdbEngineAddress+'?'+parameters, true);
	req.send(null);
}

function strtok (str, tokens) 
{
	this.js_strtok = this.js_strtok || {};

	if( str == undefined )
		return false;
	if (tokens === undefined) {
		tokens = str;
		str = this.js_strtok.strtokleftOver;
	}

	if (str.length === 0) {
		return false;
	}
	if (tokens && str && tokens.indexOf(str.charAt(0)) !== -1) {
		return this.strtok(str.substr(1), tokens);
	}
	for (var i = 0; i < str.length; i++) {
		if (tokens.indexOf(str.charAt(i)) !== -1) {
			break;
		}
	}
	this.js_strtok.strtokleftOver = str.substr(i + 1);
	return str.substring(0, i);
}

function parseURL(url)
{
	var parser = document.createElement('a'), searchObject = {}, queries, split, i;
	// Let the browser do the work
	parser.href = url;
	// Convert query string to object
	queries = parser.search.replace(/^\?/, '').split('&');
	for( i = 0; i < queries.length; i++ ) {
		split = queries[i].split('=');
		searchObject[split[0]] = split[1];
	}
	return {
		protocol: parser.protocol,
		host: parser.host,
		hostname: parser.hostname,
		port: parser.port,
		pathname: parser.pathname,
		search: parser.search,
		searchObject: searchObject,
		hash: parser.hash
	};
}

function getCurrentAddressWOParams()
{
	var url = parseURL(document.location);
	var address = url.protocol+"//"+url.hostname;
	if( url.port != "" )
		address += ":"+url.port;
	address += url.pathname;
	return address;
}

function dateToString(date) {
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var dateOfString = (("" + day).length < 2 ? "0" : "") + day + "/";
    dateOfString += (("" + month).length < 2 ? "0" : "") + month + "/";
    dateOfString += date.getFullYear();
    return dateOfString;
}

function printDate(dt)
{
	var now = parseInt((new Date()).getTime()/1000);
	var time = dt+1*60*60;
	var strDate = "";

	if( now-time < 5 )
		strDate = "just now";
	else if( now-time < 60 )
		strDate = parseInt(now-time)+" secs ago";
	else if( now-time < 120 )
		strDate = " a min ago";
	else if( (now-time)/60 < 60 )
		strDate = parseInt(((now-time)/60))+" mins ago";
	else if( (now-time)/(60*60) < 24 )
		strDate = parseInt(((now-time)/(60*60)))+" hrs ago";
	else{
		var d = new Date(dt*1000);
		strDate = dateToString(d)+" ";
		if( d.getHours() < 10 )
			strDate += "0"+d.getHours();
		else
			strDate += d.getHours();
		strDate += ":";
		if( d.getMinutes() < 10 )
			strDate += "0"+d.getMinutes();
		else
			strDate += d.getMinutes();
	}
	
	if( strDate == "NaN/NaN/NaN NaN:NaN" )
		strDate = dt;
	else if( now-time < 60*60 ){
		var color = "";
		if( now-time < 5*60 )
			color = "red";
		else if( now-time < 10*60 )
			color = "#FF6828";
		else if( now-time < 30*60 )
			color = "#FF7F28";
		else
			color = "#FFB128";
		
		strDate = "<span style='color:"+color+"'>"+strDate+"</span>";
	}
	return strDate;
}

function showMsgPanel(content, width, height)
{
	width = typeof width !== 'undefined' ? width : 550;
	height = typeof height !== 'undefined' ? height : 0;
	
	var e = document.getElementById("panel");
	if( e ){
		showCurtain();
		
		e.style.display = '';
		e.style.top = 100;
		e.style.left = (document.body.clientWidth-width)/2;
		e.style.width = width;
		if( height != 0 )
			e.style.height = height;
		e.innerHTML = "<table class=MsgPanelTable width='"+width+"'><tr><td>"+content+"</td></tr></table>";
	}
}

function hideMsgPanel()
{	
	document.getElementById("panel").style.display = 'none';
	document.body.style["overflow-y"] = '';

	document.getElementById("curtain").style.display = 'none';
	document.body.style['overflow-y'] = '';
}

function showCurtain()
{
	document.body.style['overflow-y'] = 'hidden';
	
	hideToolbarMenu();
	
	var elmCurtain = document.getElementById("curtain");
	elmCurtain.style.top = 0
	elmCurtain.style.left = 0;
	elmCurtain.style.width = document.body.clientWidth;
	elmCurtain.style.height = document.body.clientHeight;
	elmCurtain.style.display = '';
}

function hideCurtain()
{	
	document.getElementById("curtain").style.display = 'none';
	document.body.style['overflow-y'] = '';
}

function roundFloat(value, numOfDigitsAfterDot)
{
	numOfDigitsAfterDot = typeof numOfDigitsAfterDot !== 'undefined' ? numOfDigitsAfterDot : 2;
	return parseFloat(value).toFixed(numOfDigitsAfterDot);
}