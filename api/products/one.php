<?php
require_once "../../config/db.php";

$id = $_GET["id"] ?? null;

if (!$id) {
    response(false, "Передайте id товара");
}

$stmt = $pdo->prepare("
    SELECT products.*, categories.name AS category_name
    FROM products
    JOIN categories ON products.category_id = categories.id
    WHERE products.id = ?
");

$stmt->execute([$id]);
$product = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$product) {
    response(false, "Товар не найден");
}

response(true, "Карточка товара", $product);