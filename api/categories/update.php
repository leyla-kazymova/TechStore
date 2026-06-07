<?php
require_once "../../config/db.php";

requireAdmin();

$data = getJsonInput();

$id = $data["id"] ?? null;
$name = trim($data["name"] ?? "");

if (!$id || $name === "") {
    response(false, "Передайте id и название категории");
}

$stmt = $pdo->prepare("UPDATE categories SET name = ? WHERE id = ?");
$stmt->execute([$name, $id]);

response(true, "Категория обновлена");