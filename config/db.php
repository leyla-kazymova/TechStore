<?php
session_start();

header("Content-Type: application/json; charset=utf-8");

$host = "localhost";
$dbname = "techstore_db";
$username = "root";
$password = "";

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Ошибка подключения к базе данных"
    ]);
    exit;
}

function getJsonInput() {
    return json_decode(file_get_contents("php://input"), true);
}

function response($success, $message, $data = null) {
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function requireAuth() {
    if (!isset($_SESSION["user"])) {
        response(false, "Нужно войти в аккаунт");
    }
}

function requireAdmin() {
    requireAuth();

    if ($_SESSION["user"]["role"] !== "admin") {
        response(false, "Доступ только для администратора");
    }
}