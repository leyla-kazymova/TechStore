<?php
require_once "../../config/db.php";

$categoryId = $_GET["category_id"] ?? null;

if ($categoryId) {
    $stmt = $pdo->prepare("
        SELECT products.*, categories.name AS category_name
        FROM products
        JOIN categories ON products.category_id = categories.id
        WHERE products.category_id = ?
        ORDER BY products.id DESC
    ");
    $stmt->execute([$categoryId]);
} else {
    $stmt = $pdo->query("
        SELECT products.*, categories.name AS category_name
        FROM products
        JOIN categories ON products.category_id = categories.id
        ORDER BY products.id DESC
    ");
}

$products = $stmt->fetchAll(PDO::FETCH_ASSOC);

response(true, "Список товаров", $products);