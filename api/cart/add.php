<?php
require_once "../../config/db.php";

requireAuth();

$data = getJsonInput();

$userId = $_SESSION["user"]["id"];
$productId = $data["product_id"] ?? null;
$quantity = $data["quantity"] ?? 1;

if (!$productId) {
    response(false, "Передайте id товара");
}

$stmt = $pdo->prepare("SELECT id FROM cart_items WHERE user_id = ? AND product_id = ?");
$stmt->execute([$userId, $productId]);

$item = $stmt->fetch(PDO::FETCH_ASSOC);

if ($item) {
    $stmt = $pdo->prepare("UPDATE cart_items SET quantity = quantity + ? WHERE id = ?");
    $stmt->execute([$quantity, $item["id"]]);
} else {
    $stmt = $pdo->prepare("INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)");
    $stmt->execute([$userId, $productId, $quantity]);
}

response(true, "Товар добавлен в корзину");