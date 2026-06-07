<?php
require_once "../../config/db.php";

requireAdmin();

$stmt = $pdo->query("
    SELECT 
        orders.*,
        users.name AS user_name,
        users.email AS user_email
    FROM orders
    JOIN users ON orders.user_id = users.id
    ORDER BY orders.id DESC
");

$orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($orders as &$order) {
    $stmt = $pdo->prepare("SELECT * FROM order_items WHERE order_id = ?");
    $stmt->execute([$order["id"]]);
    $order["items"] = $stmt->fetchAll(PDO::FETCH_ASSOC);
}

response(true, "Список заказов для администратора", $orders);