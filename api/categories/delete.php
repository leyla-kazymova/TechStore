<?php
require_once "../../config/db.php";

requireAdmin();

$data = getJsonInput();

$id = $data["id"] ?? null;

if (!$id) {
    response(false, "Передайте id категории");
}

$stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
$stmt->execute([$id]);

response(true, "Категория удалена");