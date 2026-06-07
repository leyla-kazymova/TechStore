<?php
require_once "../../config/db.php";

if (!isset($_SESSION["user"])) {
    response(false, "Пользователь не авторизован");
}

response(true, "Текущий пользователь", $_SESSION["user"]);