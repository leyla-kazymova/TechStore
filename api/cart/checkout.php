<?php
require_once "../../config/db.php";

requireAuth();

$userId = $_SESSION["user"]["id"];

$stmt = $pdo->prepare("
    SELECT 
        cart_items.product_id,
        products.name,
        products.price,
        cart_items.quantity,
        products.price * cart_items.quantity AS total
    FROM cart_items
    JOIN products ON cart_items.product_id = products.id
    WHERE cart_items.user_id = ?
");

$stmt->execute([$userId]);
$items = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (count($items) === 0) {
    response(false, "Корзина пуста");
}

$totalPrice = 0;

foreach ($items as $item) {
    $totalPrice += $item["total"];
}

$pdo->beginTransaction();

$stmt = $pdo->prepare("INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, 'Новый')");
$stmt->execute([$userId, $totalPrice]);

$orderId = $pdo->lastInsertId();

foreach ($items as $item) {
    $stmt = $pdo->prepare("
        INSERT INTO order_items (order_id, product_id, product_name, price, quantity)
        VALUES (?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $orderId,
        $item["product_id"],
        $item["name"],
        $item["price"],
        $item["quantity"]
    ]);
}

$stmt = $pdo->prepare("DELETE FROM cart_items WHERE user_id = ?");
$stmt->execute([$userId]);

$pdo->commit();

response(true, "Заказ оформлен", [
    "order_id" => $orderId,
    "total_price" => $totalPrice,
    "status" => "Новый"
]);