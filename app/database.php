<?php
$servername = "auth-db1724.hstgr.io";
$username = "u711845530_gestao";
$password = "*Desenvolvimento2023";
$database = "u711845530_gestao";

$conn = new mysqli($servername,$username,$password,$database);

if($conn->connect_error){
    die("A conexão falhou: ".$conn->connect_error);
}



?>