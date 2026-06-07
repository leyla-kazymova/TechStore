<?php
require_once "../../config/db.php";

requireAdmin();

$data = getJsonInput();

$id = $data["id"] ?? null;

if (!$id) {
    response(false, "Передайте id товара");
}

$stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
$stmt->execute([$id]);

response(true, "Товар удалён");