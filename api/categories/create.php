<?php
require_once "../../config/db.php";

requireAdmin();

$data = getJsonInput();

$name = trim($data["name"] ?? "");

if ($name === "") {
    response(false, "Введите название категории");
}

$stmt = $pdo->prepare("INSERT INTO categories (name) VALUES (?)");
$stmt->execute([$name]);

response(true, "Категория добавлена");