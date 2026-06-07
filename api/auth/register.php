<?php
require_once "../../config/db.php";

$data = getJsonInput();

$name = trim($data["name"] ?? "");
$email = trim($data["email"] ?? "");
$password = trim($data["password"] ?? "");

if ($name === "" || $email === "" || $password === "") {
    response(false, "Заполните все поля");
}

$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);

if ($stmt->fetch()) {
    response(false, "Пользователь с таким email уже существует");
}

$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $pdo->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')");
$stmt->execute([$name, $email, $hash]);

response(true, "Регистрация успешна");