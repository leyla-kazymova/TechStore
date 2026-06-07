<?php
require_once "../../config/db.php";

$data = getJsonInput();

$email = trim($data["email"] ?? "");
$password = trim($data["password"] ?? "");

if ($email === "" || $password === "") {
    response(false, "Введите email и пароль");
}

$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);

$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($password, $user["password"])) {
    response(false, "Неверный email или пароль");
}

$_SESSION["user"] = [
    "id" => $user["id"],
    "name" => $user["name"],
    "email" => $user["email"],
    "role" => $user["role"]
];

response(true, "Вход выполнен", $_SESSION["user"]);