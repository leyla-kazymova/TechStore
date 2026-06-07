<?php
require_once "../../config/db.php";

session_destroy();

response(true, "Вы вышли из аккаунта");