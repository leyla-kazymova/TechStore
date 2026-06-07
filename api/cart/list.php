<?php
require_once "../../config/db.php";

requireAuth();

$userId = $_SESSION["user"]["id"];

$stmt = $pdo->prepare("
    SELECT 
        cart_items.id AS cart_item_id,
        products.id AS product_id,
        products.name,
        products.price,
        products.image,
        cart_items.quantity,
        products.price * cart_items.quantity AS total
    FROM cart_items
    JOIN products ON cart_items.product_id = products.id
    WHERE cart_items.user_id = ?
");

$stmt->execute([$userId]);

$items = $stmt->fetchAll(PDO::FETCH_ASSOC);

$totalPrice = 0;

foreach ($items as $item) {
    $totalPrice += $item["total"];
}

response(true, "Корзина пользователя", [
    "items" => $items,
    "total_price" => $totalPrice
]);