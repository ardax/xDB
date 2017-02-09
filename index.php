<?php
ini_set('session.gc_maxlifetime', 3600*3);
session_set_cookie_params(3600*3);
session_start();

include 'vendor/autoload.php';
include 'php/utils.php';

$rand = rand(1, 99999999);
$loginErrMsg = "";
$newUserMsg = "";

if( ISSET($_SESSION['user']) == FALSE ){
	if( ISSET($_POST['login_user']) && ISSET($_POST['login_pass']) ){
		$login_user = htmlspecialchars($_POST['login_user']);
		$login_pass = htmlspecialchars($_POST['login_pass']);
		
		$hashed_password = crypt($login_pass, $salt);
		
		$db = connect2DB($xdbMongoDBName);
		$user = $db->Users->findOne(array('user' => $login_user, 'pass' => $hashed_password));
		if( $user ){
			$_SESSION['user'] = $login_user;
			$_SESSION['start_time'] = time();
	
			$db->Users->update(array('_id' => $user), array('$set' => array('last_login_date' => new MongoDate(), 'last_login_ip' => $_SERVER['REMOTE_ADDR'])));
			
			header("Location: index.php");
			exit();
		}
		else{
			$loginErrMsg = 'Unknown user name or password mismatch';
		}
	}
	else if( ISSET($_POST['new_user']) && ISSET($_POST['new_pass']) ){
		$new_user = htmlspecialchars($_POST['new_user']);
		$new_pass = htmlspecialchars($_POST['new_pass']);
		
		if( $new_user == "" ){
			$loginErrMsg = 'Not valid user name given';
		}
		else if( $new_pass == "" ){
			$loginErrMsg = 'Not valid password given';
		}
		else{
			$db = connect2DB($xdbMongoDBName);
			$user = $db->Users->findOne(array('user' => $new_user));
			if( $user ){
				$loginErrMsg = 'There is already a user with given name';
			}
			else{
				$user = $db->UserRequests->findOne(array('user' => $new_user));
				if( $user ){
					$loginErrMsg = 'There is already a user with requested name';
				}
				else{
					$hashed_password = crypt($new_pass, $salt);
					$userRequestEntry = array('user' => $new_user,
											  'pass' => $hashed_password,
										  	  'request_date' => new MongoDate(),
											  'request_ip' => $_SERVER['REMOTE_ADDR']);
					$db->UserRequests->insert($userRequestEntry);
		
					$newUserMsg = "Your new user request is recorded.<br>Please wait for admin approval.";
				}
			}
		}
	}
	else if( ISSET($_POST['new_admin_pass']) ){
		if( doesAdminAccountExist() == false ){
			if( $_POST['new_admin_pass'] != $_POST['new_admin_pass_again'] ){
				$loginErrMsg = "Given two passwords do not match";
			}
			else if( $_POST['new_admin_pass'] != "" ){
				$new_admin_pass = htmlspecialchars($_POST['new_admin_pass']);
	
				$db = connect2DB($xdbMongoDBName);

				$hashed_password = crypt($new_admin_pass, $salt);
				$adminEntry = array('user' => 'admin',
									'pass' => $hashed_password);
				$db->Users->insert($adminEntry);
				
				$newUserMsg = "Admin password set.<br>Please continue with creating a new account.";
			}
			else{
				$loginErrMsg = "Please enter non-empty password";
			}
		}
	}
}
?>
<html>
<title>xDB</title>
<link rel=stylesheet href="index.css?<?php print $rand; ?>" />

<?php
	if( ISSET($_SESSION['user']) ){
?>

<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>

<script type="text/javascript" src="https://www.google.com/jsapi"></script>
<script type="text/javascript">
      google.load('visualization', '1', {'packages':['corechart']});
</script>

<script language="JavaScript" src="js/features.js?<?php print $rand; ?>"></script>
<script language="JavaScript" src="js/admin.js?<?php print $rand; ?>"></script>
<script language="JavaScript" src="js/account.js?<?php print $rand; ?>"></script>
<script language="JavaScript" src="js/index.js?<?php print $rand; ?>"></script>
<script language="JavaScript" src="js/utils.js?<?php print $rand; ?>"></script>
<script language="JavaScript" src="js/menu.js?<?php print $rand; ?>"></script>
<script language="JavaScript" src="js/taskQueue.js?<?php print $rand; ?>"></script>
<script language="JavaScript" src="js/resultListing.js?<?php print $rand; ?>"></script>
<script language="JavaScript" src="js/result.js?<?php print $rand; ?>"></script>
<script language="JavaScript" src="js/experiment.js?<?php print $rand; ?>"></script>
<script language="JavaScript" src="js/toolbar.js?<?php print $rand; ?>"></script>
<script language="JavaScript" src="js/matrix.js?<?php print $rand; ?>"></script>

<?php 
		$userName = $_SESSION['user'];
		print "<body onload=\"loadPage('$userName')\">";
		
?>

<div id='tlbar' class=Toolbar></div>
<div id=curtain class=Curtain width=100% style='display:none' onclick='hideAllMsgPanels()'></div>
<div id='panel' style='position: fixed; z-index: 10000'></div>
<div id='menu' class=ToolbarMenu></div>

<center>
<table cellpadding=0 cellspacing=0 height=100% width=100%><tr>
<td width=100% valign=top style='padding-left:30px;padding-right:30px'>
<table width=100%><tr><td id=Results></td></tr></table>
</td></tr></table>
</center>

<?php
	}
	else{
?>

<script language="JavaScript" src="js/account.js?<?php print $rand; ?>"></script>
<body style='background:#ffffff'>

<center>
<table height=100%><tr><td align=center valign=center>

<?php 
		if( $mongoDBAddr == "" ){
?>
<i><h1>ERRRRR!</h1><br>MongoDB Address is not set in 'php/utils.php' file.<br>You need to enter valid address before using xDB.</i>
<?php	
		}
		else if( doesAdminAccountExist() == false ){
?>
<form id='login_form' method="post" action="index.php">
<table class=LoginBox>
<tr height=180><td align=center valign=top><table width=100% style='border-bottom:1px solid #dfdfdf'><tr><td align=center style='font-family: Verdana,Arial,Helvetica,sans-serif;font-size:80'><i>x</i>DB</td></tr><tr><td class=SmallTxt style='line-height:150%' align=center><i>Keep, Manage, Explore<br>Your Experiment Results</i><br><br></td></tr></table></td></tr>
<tr><td class=BigTxt style='padding-bottom:20px'><b>Set Admin Password</b></td></tr>
<tr><td class=SmallTxt>Enter Password:</td></tr>
<tr><td><input name=new_admin_pass type=password style='padding:4px;border:1px solid #dfdfdf;width:300px;height:40px;font-size:20px;'></td></tr>
<tr><td class=SmallTxt>Enter Password Again:</td></tr>
<tr><td><input name=new_admin_pass_again type=password style='padding:4px;border:1px solid #dfdfdf;width:300px;height:40px;font-size:20px;'></td></tr>
<tr><td align=right><input type=submit class='blue button' onclick="location.href='?';" value='Set'></td></tr>
<?php
			if( $loginErrMsg != "" ){
?>
<tr><td class=SmallTxt align=center style='color:red;padding-top:10px'><i><?php print $loginErrMsg; ?></i></td></tr>
<?php 
			}
			else if( $newUserMsg != "" ){
?>
<tr><td class=SmallTxt align=center style='color:green;padding-top:10px'><i><?php print $newUserMsg; ?></i></td></tr>
<?php 
			}
		}
		else{
			
			if( ISSET($_GET['show']) && $_GET['show'] == "new_user_form" ){
?>
<form id='login_form' method="post" action="index.php?show=new_user_form">
<table class=LoginBox>
<tr height=180><td align=center valign=top><table width=100% style='border-bottom:1px solid #dfdfdf'><tr><td align=center style='font-family: Verdana,Arial,Helvetica,sans-serif;font-size:80'><i>x</i>DB</td></tr><tr><td class=SmallTxt style='line-height:150%' align=center><i>Keep, Manage, Explore<br>Your Experiment Results</i><br><br></td></tr></table></td></tr>
<tr><td class=BigTxt style='padding-bottom:20px'><b>Request New User Account</b></td></tr>
<tr><td class=SmallTxt>Select Username:</td></tr>
<tr><td><input name=new_user style='padding:4px;border:1px solid #dfdfdf;width:300px;height:40px;font-size:20px;'></td></tr>
<tr><td class=SmallTxt>Enter Password:</td></tr>
<tr><td><input name=new_pass type=password style='padding:4px;border:1px solid #dfdfdf;width:300px;height:40px;font-size:20px;'></td></tr>
<tr><td align=right><input type=submit class='blue button' value='Request'>&nbsp;<input type=button class='gray button' onclick="location.href='?';" value='Login'></td></tr>
<?php
			}else{
?>
<form id='login_form' method="post" action="index.php">
<table class=LoginBox>
<tr height=180><td align=center valign=top><table width=100% style='border-bottom:1px solid #dfdfdf'><tr><td align=center style='font-family: Verdana,Arial,Helvetica,sans-serif;font-size:80'><i>x</i>DB</td></tr><tr><td class=SmallTxt style='line-height:150%' align=center><i>Keep, Manage, Explore<br>Your Experiment Results</i><br><br></td></tr></table></td></tr>
<tr><td class=BigTxt style='padding-bottom:20px'><b>Login</b></td></tr>
<tr><td class=SmallTxt>Username:</td></tr>
<tr><td><input name=login_user style='padding:4px;border:1px solid #dfdfdf;width:300px;height:40px;font-size:20px;'></td></tr>
<tr><td class=SmallTxt>Password:</td></tr>
<tr><td><input name=login_pass type=password style='padding:4px;border:1px solid #dfdfdf;width:300px;height:40px;font-size:20px;'></td></tr>
<tr><td align=right><input type=button class='gray button' value='New User' onclick="location.href='?show=new_user_form';">&nbsp;<input type=submit class='blue button' value='Login'></td></tr>
<?php
			}
			if( $loginErrMsg != "" ){
?>
<tr><td class=SmallTxt align=center style='color:red;padding-top:10px'><i><?php print $loginErrMsg; ?></i></td></tr>
<?php 
			}
			else if( $newUserMsg != "" ){
?>
<tr><td class=SmallTxt align=center style='color:green;padding-top:10px'><i><?php print $newUserMsg; ?></i></td></tr>
<?php 
			}
		}
?>
</table>
</form>

</td></tr></table>
</center>

<?php
	}
?>
</body>
</html>
<?php

function doesAdminAccountExist()
{
	global $xdbMongoDBName;
	
	$db = connect2DB($xdbMongoDBName);
	if( $db->Users->findOne(array('user' => 'admin')) )
		return true;
	return false;
}

?>