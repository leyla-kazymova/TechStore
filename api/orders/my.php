<?php
require_once "../../config/db.php";

requireAuth();

$userId = $_SESSION["user"]["id"];

$stmt = $pdo->prepare("
    SELECT *
    FROM orders
    WHERE user_id = ?
    ORDER BY id DESC
");

$stmt->execute([$userId]);
$orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($orders as &$order) {
    $stmt = $pdo->prepare("SELECT * FROM order_items WHERE order_id = ?");
    $stmt->execute([$order["id"]]);
    $order["items"] = $stmt->fetchAll(PDO::FETCH_ASSOC);
}

response(true, "Мои заказы", $orders);