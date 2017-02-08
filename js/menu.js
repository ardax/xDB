var shownMenu = null;

function Menu()
{
	this.options = Array();
	this.width = 0;
	
	this.addOption = function(option, link, separate){
		separate = typeof separate !== 'undefined' ? separate : false;
		this.options.push({'title': option, 'link': link, 'separate': separate});
	}
	this.show = function(left, width){
		
		this.width = width;
		
		var e = document.getElementById("menu");
		if( e ){
			e.style.top = document.body.scrollTop+toolbarHeight+2;
			e.style.left = left;
			e.style.width = width;
			e.style.display = '';
			e.innerHTML = this.print();
		}

		e = document.getElementById("curtain");
		if( e ){
			e.style.top = toolbarHeight+2;
			e.style.left = 0;
			e.style.width = document.body.clientWidth;
			e.style.height = document.body.clientHeight-(toolbarHeight+2);
			e.style.display = '';
		}
		
		shownMenu = this;
	}
	this.hide = function(){
		shownMenu = null;
		
		this.width = 0;
		this.options.length = 0;
		
		var e = document.getElementById("menu");
		if( e )
			e.style.display = 'none';
	}
	this.print = function(){
		var code = "";
		
		code += "<table style='background:#ffffff' width='"+this.width+"'><tr><td>";
		
		code += "<table width=100%>";
		for(var i = 0; i < this.options.length; i++){
			var option = this.options[i];
			
			if( option['separate'] )
				code += "<tr height=2><td style='border-bottom:1px solid #efefef'></td></tr>";

			if( option['link'] != "" )
				code += "<tr height=30><td onmouseover='onArea(this)' onmouseout='offArea(this)' class=MenuItem style='color:#666666' onclick=\"hideCurtain();hideToolbarMenu();"+option['link']+"\">"+option['title']+"</td>";
			else
				code += "<tr height=30><td class=MenuItem style='color:#bbbbbb'>"+option['title']+"</td>";
		}
		code += "</table>";
		code += "</td></tr></table>";
		
		return code;
	}
}

function hideToolbarMenu()
{	
	if( shownMenu )
		shownMenu.hide();
	unselectTab();
}